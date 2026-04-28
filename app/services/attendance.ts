// services/attendance.ts
import { API_BASE_URL } from "./Config";
import { SessionManager } from "./SessionManager";

export interface AttendanceLog {
    id: number;
    enrollNo: string;
    logTime: string;      // UTC ISO string
    verifyMode: number;
    inOutMode: number;    // 0 = check-in, 1 = check-ou
    deviceId: number;
}

// Fetch attendance logs for logged-in employee
export const getAttendanceLogs = async (
    enrollNo: string
): Promise<AttendanceLog[]> => {
    if (!enrollNo) throw new Error("Enroll number missing");

    const token = await SessionManager.getToken();

    if (!token) throw new Error("No token found");

    const url = `http://103.134.238.50:85/api/zk/logs?enrollNo=${enrollNo}`;

    // console.log("🔵 Calling:", url);
    // console.log("🔵 EnrollNo:", enrollNo);
    // console.log("🔵 Token exists:", !!token);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("🟢 Response status:", response.status);

        if (!response.ok) {
            const text = await response.text();
            console.log("🔴 Error response:", text);
            throw new Error(text || `HTTP ${response.status}`);
        }

        const json = await response.json();
        // console.log("🟢 Response data:", json);

        // REPLACE with this:
        const rawItems: AttendanceLog[] = Array.isArray(json.items) ? json.items : [];

        const seen = new Set<string>();
        const dedupedItems = rawItems.filter((log) => {
            const key = `${log.logTime}-${log.inOutMode}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // console.log(`🟡 Raw: ${rawItems.length}, After dedup: ${dedupedItems.length}`);
        return dedupedItems;

    } catch (error: any) {
        console.log("🔴 Fetch error:", error);
        throw new Error(error.message || "Network request failed");
    }
};
// Attendance correction type
export interface AttendanceCorrection {
    employeeId: string;
    date: string;   // "DD/MM/YYYY"
    time: string;   // "HH:mm"
    reason: string;
    status?: string; // optional, returned by server
}

// POST request payload type
export interface AttendanceCorrectionRequest {
    employeeId: string;
    mode: number;       // 1 = check-in, 2 = check-out (as per backend)
    date: string;       // "DD/MM/YYYY"
    time: string;       // "HH:mm"
    reason: string;
    verifyMode: number; // as required by backend, e.g., 15
}

// POST response type
export interface AttendanceCorrectionResponse {
    message: string;
    id: number;
    status: string;
}

// 🔹 GET all attendance corrections
export const getAttendanceCorrections = async (): Promise<AttendanceCorrection[]> => {
    const token = await SessionManager.getToken();
    if (!token) throw new Error('User not logged in');

    const response = await fetch(`${API_BASE_URL}/attendance/attendance-corrections`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch attendance corrections');
    }

    return response.json();
};

// 🔹 POST a new attendance correction
export const postAttendanceCorrection = async (
    payload: AttendanceCorrectionRequest
): Promise<AttendanceCorrectionResponse> => {
    const token = await SessionManager.getToken();
    if (!token) throw new Error('User not logged in');

    const response = await fetch(`${API_BASE_URL}/attendance/attendance-corrections/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to submit attendance correction');
    }

    return response.json();
};