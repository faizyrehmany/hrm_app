import * as Battery from "expo-battery";
import * as Location from "expo-location";
import { Alert, AppState, AppStateStatus, Linking } from "react-native";
import { SessionManager } from "../services/SessionManager";
import { sendLocation } from "../services/location";

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let hasSentGpsOff = false;
let subscription: Location.LocationSubscription | null = null;
let watchdogTimer: ReturnType<typeof setInterval> | null = null;
let gpsCheckTimer: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: any = null;
let sendInterval: ReturnType<typeof setInterval> | null = null;

let lastReceivedTime = Date.now();
let isBlockingAlertVisible = false;

// 🔥 last sent location
let lastSentLocation: { latitude: number; longitude: number } | null = null;

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const WATCHDOG_TIMEOUT_MS = 120_000;
const WATCHDOG_CHECK_INTERVAL_MS = 30_000;
const GPS_CHECK_INTERVAL_MS = 3000;
const LOCATION_SEND_INTERVAL = 60_000; // 1 minute

// ─────────────────────────────────────────────
// FORCE LOCATION
// ─────────────────────────────────────────────
const forceEnableLocation = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    const isOn = await Location.hasServicesEnabledAsync();

    if (status === "granted" && isOn) {
        isBlockingAlertVisible = false;
        return;
    }

    if (isBlockingAlertVisible) return;
    isBlockingAlertVisible = true;

    Alert.alert(
        "Location Required",
        "Please enable GPS to continue",
        [
            {
                text: "Open Settings",
                onPress: async () => {
                    await Linking.openSettings();
                    setTimeout(() => {
                        isBlockingAlertVisible = false;
                        forceEnableLocation();
                    }, 1500);
                },
            },
        ],
        { cancelable: false }
    );
};

// ─────────────────────────────────────────────
// LIGHTWEIGHT SAME LOCATION CHECK
// ─────────────────────────────────────────────
const isSameLocation = (a: any, b: any) => {
    if (!a || !b) return false;

    // rounding removes GPS noise (~5–10 meters)
    return (
        Math.round(a.latitude * 100000) === Math.round(b.latitude * 100000) &&
        Math.round(a.longitude * 100000) === Math.round(b.longitude * 100000)
    );
};

// ─────────────────────────────────────────────
// SEND LOCATION (1 MIN RULE)
// ─────────────────────────────────────────────
const sendCurrentLocation = async () => {
    try {
        const session = await SessionManager.getUser();
        const token = await SessionManager.getToken();

        if (!session || !token) return;

        const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        const newLoc = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
        };

        // 🚫 prevent duplicate same location spam
        if (isSameLocation(lastSentLocation, newLoc)) return;

        const battery = await Battery.getBatteryLevelAsync();

        const payload = {
            employeeId: session.employeeId,
            ...newLoc,
            accuracy: loc.coords.accuracy ?? 0,
            location: true,
            battery: Math.round(battery * 100),
            timestamp: new Date().toISOString(),
        };

        await sendLocation(payload, token);

        lastSentLocation = newLoc;
        lastReceivedTime = Date.now();
    } catch (e) {
        console.error(e);
    }
};

// ─────────────────────────────────────────────
// GPS WATCHER
// ─────────────────────────────────────────────
const startGpsWatcher = () => {
    stopGpsWatcher();

    gpsCheckTimer = setInterval(async () => {
        const isOn = await Location.hasServicesEnabledAsync();

        if (!isOn) {
            if (!hasSentGpsOff) {
                hasSentGpsOff = true;

                try {
                    const session = await SessionManager.getUser();
                    const token = await SessionManager.getToken();
                    const battery = await Battery.getBatteryLevelAsync();

                    if (session && token) {
                        await sendLocation(
                            {
                                employeeId: session.employeeId,
                                latitude: lastSentLocation?.latitude ?? 0, // ✅ use last
                                longitude: lastSentLocation?.longitude ?? 0, // ✅ use last
                                accuracy: 0,
                                location: false,
                                battery: Math.round(battery * 100),
                                timestamp: new Date().toISOString(),
                            },
                            token
                        );
                    }

                    // ✅ prevent watchdog trigger
                    lastReceivedTime = Date.now();

                } catch (e) {
                    console.error(e);
                }
            }

            setTimeout(() => forceEnableLocation(), 3000);
        } else {
            // ✅ GPS turned back ON → reset flag
            hasSentGpsOff = false;
        }
    }, GPS_CHECK_INTERVAL_MS);
};

const stopGpsWatcher = () => {
    if (gpsCheckTimer) {
        clearInterval(gpsCheckTimer);
        gpsCheckTimer = null;
    }
};

// ─────────────────────────────────────────────
// WATCHDOG
// ─────────────────────────────────────────────
const startWatchdog = () => {
    stopWatchdog();

    watchdogTimer = setInterval(() => {
        const elapsed = Date.now() - lastReceivedTime;

        if (elapsed > WATCHDOG_TIMEOUT_MS) {
            stopTracking();
            forceEnableLocation();
        }
    }, WATCHDOG_CHECK_INTERVAL_MS);
};

const stopWatchdog = () => {
    if (watchdogTimer) {
        clearInterval(watchdogTimer);
        watchdogTimer = null;
    }
};

// ─────────────────────────────────────────────
// APP STATE
// ─────────────────────────────────────────────
const startAppStateListener = () => {
    stopAppStateListener();

    appStateSubscription = AppState.addEventListener(
        "change",
        async (state: AppStateStatus) => {
            if (state === "active") {
                const { status } =
                    await Location.getForegroundPermissionsAsync();

                if (status !== "granted") {
                    stopTracking();
                    forceEnableLocation();
                } else if (!sendInterval) {
                    await startTracking();
                }
            }
        }
    );
};

const stopAppStateListener = () => {
    appStateSubscription?.remove();
    appStateSubscription = null;
};

// ─────────────────────────────────────────────
// START TRACKING
// ─────────────────────────────────────────────
export const startTracking = async () => {
    if (sendInterval) return;

    const { status } =
        await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
        forceEnableLocation();
        return;
    }

    startGpsWatcher();

    try {
        await sendCurrentLocation(); // initial send
    } catch (e) {
        console.error(e);
    }

    // 🔥 MAIN: send every 1 minute
    sendInterval = setInterval(() => {
        sendCurrentLocation();
    }, LOCATION_SEND_INTERVAL);

    startWatchdog();
    startAppStateListener();
};

// ─────────────────────────────────────────────
// STOP
// ─────────────────────────────────────────────
export const stopTracking = () => {
    subscription?.remove();
    subscription = null;

    if (sendInterval) {
        clearInterval(sendInterval);
        sendInterval = null;
    }

    stopWatchdog();
    stopAppStateListener();
    stopGpsWatcher();

    lastSentLocation = null;
    lastReceivedTime = Date.now();
};