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