import * as Battery from "expo-battery";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { SessionManager } from "../services/SessionManager";
import {
    sendLocation,
    getLastSentLocation,
    setLastSentLocation,
    getLastSentTime,
    setLastSentTime,
    isSameLocation,
} from "../services/location";

const LOCATION_TASK = "background-location-task";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const MIN_SEND_INTERVAL = 60_000; // 1 minute

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
// BACKGROUND TASK
// ─────────────────────────────────────────────
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
    if (error || !data) return;

    const location = data.locations?.[0];
    if (!location) return;

    try {
        const session = await SessionManager.getUser();
        const token = await SessionManager.getToken();

        if (!session || !token) return;

        // ─────────────────────────────
        // GPS STATE CHECK
        // ─────────────────────────────
        const isGpsOn = await Location.hasServicesEnabledAsync();

        const newLoc = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };

        // ─────────────────────────────
        // GPS OFF → send FALSE status
        // ─────────────────────────────
        if (!isGpsOn) {
            await sendLocation(
                {
                    employeeId: session.employeeId,
                    latitude: 0,
                    longitude: 0,
                    accuracy: 0,
                    location: false,
                    battery: 0,
                    timestamp: getLocalTimestamp(),
                },
                token
            );
            await SessionManager.clearSession(); // Clear session to force logout on open
            return;
        }

        const battery = await Battery.getBatteryLevelAsync();

        const payload = {
            employeeId: session.employeeId,
            ...newLoc,
            location: true,
            accuracy: location.coords.accuracy ?? 0,
            battery: Math.round(battery * 100),
            timestamp: getLocalTimestamp(),
        };

        // ─────────────────────────────
        // SAME RULES AS FOREGROUND
        // ─────────────────────────────
        const now = Date.now();
        const lastSentLoc = await getLastSentLocation();
        const lastSentT = await getLastSentTime();

        const tooSoon = now - lastSentT < MIN_SEND_INTERVAL;
        const sameLocation = isSameLocation(lastSentLoc, newLoc);

        if (tooSoon || sameLocation) {
            if (sameLocation) {
                console.log("📍 Background: Location unchanged (within 15m), skipping update");
            }
            return;
        }

        console.log("📤 Background Location Sent:", payload);

        await sendLocation(payload, token);

        await setLastSentLocation(newLoc);
        await setLastSentTime(now);
    } catch (e) {
        console.error("❌ Background error:", e);
    }
});

// ─────────────────────────────────────────────
// START BACKGROUND TRACKING
// ─────────────────────────────────────────────
export const startBackgroundTracking = async () => {
    // ❌ Background tracking unsupported on web
    if (Platform.OS === "web") {
        console.log("Background tracking not supported on web");
        return;
    }

    const { status } =
        await Location.requestBackgroundPermissionsAsync();

    if (status !== "granted") return;

    // safer check
    const started =
        typeof Location.hasStartedLocationUpdatesAsync === "function"
            ? await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
            : false;

    if (started) return;

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,

        distanceInterval: 20,
        timeInterval: 10000,

        foregroundService: {
            notificationTitle: "Tracking Active",
            notificationBody: "Location tracking running",
        },

        showsBackgroundLocationIndicator: true,
    });
};

// ─────────────────────────────────────────────
// STOP BACKGROUND TRACKING
// ─────────────────────────────────────────────
export const stopBackgroundTracking = async () => {
    const started = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TASK
    );

    if (started) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
};