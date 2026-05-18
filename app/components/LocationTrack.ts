import * as Battery from "expo-battery";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Alert, AppState, AppStateStatus, Linking } from "react-native";
import { SessionManager } from "../services/SessionManager";
import {
    sendLocation,
    getLastSentLocation,
    setLastSentLocation,
    setLastSentTime,
    isSameLocation,
} from "../services/location";
import { stopBackgroundTracking } from "./backgroundLocation";

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

// ─────────────────────────────────────────────
// FORCE LOGOUT SECURITY RULE
// ─────────────────────────────────────────────
const performLogout = async () => {
    try {
        console.log("🔒 Security Enforcement: Logging out due to disabled location/permissions...");
        
        // 1. Stop all tracking services
        stopTracking();
        try {
            await stopBackgroundTracking();
        } catch (err) {
            console.error("Error stopping background tracking on logout:", err);
        }

        // 2. Clear user session
        await SessionManager.clearSession();

        // 3. Show Popup Alert and redirect on OK
        Alert.alert(
            "Location Required",
            "You have been logged out because location services are required to use this application. Please enable GPS and grant location permissions to sign back in.",
            [
                {
                    text: "OK",
                    onPress: () => {
                        router.replace("/");
                    }
                }
            ],
            { cancelable: false }
        );
    } catch (e) {
        console.error("Error executing force logout:", e);
    }
};

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const WATCHDOG_TIMEOUT_MS = 120_000;
const WATCHDOG_CHECK_INTERVAL_MS = 30_000;
const GPS_CHECK_INTERVAL_MS = 3000;
const LOCATION_SEND_INTERVAL = 60_000; // 1 minute

// ─────────────────────────────────────────────
// LOCAL TIMESTAMP HELPER
// ─────────────────────────────────────────────
/**
 * Generates an ISO-like string representing the current local date and time.
 * For example: "2026-05-18T13:49:04.552" (without the UTC 'Z' timezone suffix).
 * This forces standard datetime parsers to save the exact local clock numbers in the database.
 */
const getLocalTimestamp = (): string => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
    const localDate = new Date(Date.now() - tzoffset);
    return localDate.toISOString().slice(0, -1); // remove trailing 'Z'
};

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

        const lastSentLoc = await getLastSentLocation();

        // 🚫 prevent redundant updates if user hasn't moved > 15 meters
        if (isSameLocation(lastSentLoc, newLoc)) {
            console.log("📍 Location unchanged (within 15m), skipping API update");

            // ✅ CRITICAL: Update lastReceivedTime even when skipping
            // This prevents the watchdog from thinking GPS is dead and restarting tracking
            lastReceivedTime = Date.now();
            return;
        }

        const battery = await Battery.getBatteryLevelAsync();

        const payload = {
            employeeId: session.employeeId,
            ...newLoc,
            accuracy: loc.coords.accuracy ?? 0,
            location: true,
            battery: Math.round(battery * 100),
            timestamp: getLocalTimestamp(),
        };

        await sendLocation(payload, token);

        await setLastSentLocation(newLoc);
        await setLastSentTime(Date.now());
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
                    const lastSentLoc = await getLastSentLocation();

                    if (session && token) {
                        await sendLocation(
                            {
                                employeeId: session.employeeId,
                                latitude: lastSentLoc?.latitude ?? 0, // ✅ use last
                                longitude: lastSentLoc?.longitude ?? 0, // ✅ use last
                                accuracy: 0,
                                location: false,
                                battery: Math.round(battery * 100),
                                timestamp: getLocalTimestamp(),
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

            await performLogout();
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
                    await performLogout();
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
        await performLogout();
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

    lastReceivedTime = Date.now();
};