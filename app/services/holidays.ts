import { API_BASE_URL } from './Config';
import { SessionManager } from './SessionManager';

export interface HolidayPayload {
    date: string;
    title: string;
    type: number;
    description: string;
    isPaid: boolean;
    isRecurring: boolean;
    isActive: boolean;
    appliesToAllDepartments: boolean;
    departmentMask: number;
}

export const addHoliday = async (payload: HolidayPayload) => {
    try {
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/holidays`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        return { success: response.ok, data };
    } catch (error) {
        console.error('Add Holiday Error:', error);
        return { success: false, error };
    }
};

export const getHolidays = async (year?: number) => {
    try {
        const token = await SessionManager.getToken();
        const url = year ? `${API_BASE_URL}/holidays?year=${year}` : `${API_BASE_URL}/holidays`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        const text = await response.text();
        // If response is empty or just whitespace, don't try to parse
        const data = text && text.trim().length > 0 ? JSON.parse(text) : [];

        return { success: response.ok, data };
    } catch (error) {
        console.error('Get Holidays Error:', error);
        return { success: false, error };
    }
};

export const getUpcomingHolidays = async () => {
    try {
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/holidays/upcoming`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        const text = await response.text();
        const data = text && text.trim().length > 0 ? JSON.parse(text) : [];
        return { success: response.ok, data };
    } catch (error) {
        console.error('Get Upcoming Holidays Error:', error);
        return { success: false, error };
    }
};

export const deleteHoliday = async (id: string) => {
    if (!id) {
        console.error('Delete Holiday Error: ID is missing');
        return { success: false, error: 'ID is missing' };
    }

    try {
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/holidays/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        const text = await response.text();
        // console.log(`[DeleteHoliday] Status: ${response.status}, Body: "${text}"`);

        let data;
        try {
            // Trim to handle whitespace-only responses
            data = text && text.trim() ? JSON.parse(text) : null;
        } catch (e) {
            console.warn('[DeleteHoliday] Failed to parse JSON response:', e);
            data = { message: text };
        }

        return { success: response.ok, data };
    } catch (error) {
        console.error('Delete Holiday Error:', error);
        return { success: false, error };
    }
};
