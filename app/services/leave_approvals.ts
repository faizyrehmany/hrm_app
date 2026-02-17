import { API_BASE_URL } from './Config';
import { SessionManager } from './SessionManager';

export const getLeaveApprovals = async (status: string) => {
    try {
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/leave-approvals?status=${status}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        const json = await response.json();
        return { success: response.ok, data: json };
    } catch (error) {
        return { success: false, error };
    }
};

export const approveLeaveRequest = async (id: string) => {
    try {
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/leave-approvals/${id}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        return { success: response.ok };
    } catch (error) {
        return { success: false, error };
    }
};

export const rejectLeaveRequest = async (id: string, reason: string) => {
    try {
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/leave-approvals/${id}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ reason }),
        });
        return { success: response.ok };
    } catch (error) {
        return { success: false, error };
    }
};
