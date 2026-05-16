import { API_BASE_URL } from "./Config";

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