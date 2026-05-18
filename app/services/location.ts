import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./Config";

const LAST_SENT_LOCATION_KEY = "last_sent_location";
const LAST_SENT_TIME_KEY = "last_sent_time";

export interface LocationCoords {
    latitude: number;
    longitude: number;
}

let memLastSentLocation: LocationCoords | null = null;
let memLastSentTime = 0;

export const getLastSentLocation = async (): Promise<LocationCoords | null> => {
    if (memLastSentLocation) return memLastSentLocation;
    try {
        const value = await AsyncStorage.getItem(LAST_SENT_LOCATION_KEY);
        if (value) {
            memLastSentLocation = JSON.parse(value);
            return memLastSentLocation;
        }
    } catch (e) {
        console.error("Error reading last sent location:", e);
    }
    return null;
};

export const setLastSentLocation = async (loc: LocationCoords | null): Promise<void> => {
    memLastSentLocation = loc;
    try {
        if (loc) {
            await AsyncStorage.setItem(LAST_SENT_LOCATION_KEY, JSON.stringify(loc));
        } else {
            await AsyncStorage.removeItem(LAST_SENT_LOCATION_KEY);
        }
    } catch (e) {
        console.error("Error setting last sent location:", e);
    }
};

export const getLastSentTime = async (): Promise<number> => {
    if (memLastSentTime > 0) return memLastSentTime;
    try {
        const value = await AsyncStorage.getItem(LAST_SENT_TIME_KEY);
        if (value) {
            memLastSentTime = parseInt(value, 10);
            return memLastSentTime;
        }
    } catch (e) {
        console.error("Error reading last sent time:", e);
    }
    return 0;
};

export const setLastSentTime = async (time: number): Promise<void> => {
    memLastSentTime = time;
    try {
        if (time > 0) {
            await AsyncStorage.setItem(LAST_SENT_TIME_KEY, time.toString());
        } else {
            await AsyncStorage.removeItem(LAST_SENT_TIME_KEY);
        }
    } catch (e) {
        console.error("Error setting last sent time:", e);
    }
};

export const sendLocation = async (payload: any, token: string) => {
  try {
    const url = `${API_BASE_URL}/EmployeeLocations`;
    console.log("📤 Sending to:", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("📊 Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ Location sent successfully:", data?.data?.id || data?.message);
  } catch (error: any) {
    console.error("❌ Location API error:", error?.message || error);
  }
};

/**
 * Calculates distance between two points in meters using Haversine formula
 */
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const isSameLocation = (a: LocationCoords | null, b: LocationCoords | null): boolean => {
  if (!a || !b) return false;
  const distance = getDistance(a.latitude, a.longitude, b.latitude, b.longitude);
  return distance < 15;
};

export const clearLocationCache = async (): Promise<void> => {
    memLastSentLocation = null;
    memLastSentTime = 0;
    try {
        await AsyncStorage.removeItem(LAST_SENT_LOCATION_KEY);
        await AsyncStorage.removeItem(LAST_SENT_TIME_KEY);
        console.log("🧹 Location cache cleared successfully!");
    } catch (e) {
        console.error("Error clearing location cache:", e);
    }
};