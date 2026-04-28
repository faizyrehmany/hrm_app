import * as Battery from "expo-battery";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { SessionManager } from "../services/SessionManager";
import { sendLocation } from "../services/location";

const LOCATION_TASK = "background-location-task";

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let lastSentLocation: { latitude: number; longitude: number } | null = null;
let lastSentTime = 0;

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const MIN_SEND_INTERVAL = 60_000; // 1 minute

// ─────────────────────────────────────────────
// SAME LOCATION CHECK (anti spam)
// ─────────────────────────────────────────────
const isSameLocation = (a: any, b: any) => {
    if (!a || !b) return false;

    return (
        Math.round(a.latitude * 100000) === Math.round(b.latitude * 100000) &&
        Math.round(a.longitude * 100000) === Math.round(b.longitude * 100000)
    );
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
                    timestamp: new Date().toISOString(),
                },
                token
            );
            return;
        }

        const battery = await Battery.getBatteryLevelAsync();

        const payload = {
            employeeId: session.employeeId,
            ...newLoc,
            location: true,
            accuracy: location.coords.accuracy ?? 0,
            battery: Math.round(battery * 100),
            timestamp: new Date().toISOString(),
        };

        // ─────────────────────────────
        // SAME RULES AS FOREGROUND
        // ─────────────────────────────
        const now = Date.now();
        const tooSoon = now - lastSentTime < MIN_SEND_INTERVAL;
        const sameLocation = isSameLocation(lastSentLocation, newLoc);

        if (tooSoon || sameLocation) return;

        console.log("📤 Background Location Sent:", payload);

        await sendLocation(payload, token);

        lastSentLocation = newLoc;
        lastSentTime = now;
    } catch (e) {
        console.error("❌ Background error:", e);
    }
});

// ─────────────────────────────────────────────
// START BACKGROUND TRACKING
// ─────────────────────────────────────────────
export const startBackgroundTracking = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();

    if (status !== "granted") return;

    const started = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TASK
    );

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

    lastSentLocation = null;
    lastSentTime = 0;
};