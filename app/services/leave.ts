import { API_BASE_URL } from './Config';
import { SessionManager } from './SessionManager';

const BASE_URL = API_BASE_URL;

export interface LeaveTypeData {
    name: string;
    code: string;
    isPaid: boolean;
    defaultAnnualQuota: number;
    requiresApproval: boolean;
    isActive: boolean;
}

export const createLeaveType = async (leaveTypeData: LeaveTypeData) => {
    try {
        const token = await SessionManager.getToken();

        if (!token) {
            console.error('No auth token found. User likely not logged in.');
            return { success: false, error: 'Authentication required. Please login again.' };
        }

        console.log('Creating Leave Type:', leaveTypeData);
        const response = await fetch(`${BASE_URL}/admin/leave-types`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(leaveTypeData),
        });

        const responseText = await response.text();
        console.log('Response Status:', response.status);
        console.log('Response Text:', responseText);

        let data;
        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.warn('Response is not valid JSON:', responseText);
                data = { message: responseText };
            }
        } else {
            data = {};
        }

        if (!response.ok) {
            const errorMessage = data && data.message ? data.message : 'Failed to create leave type';
            return { success: false, error: errorMessage };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Create Leave Type Error:', error);
        return { success: false, error: 'Network request failed' };
    }
};

export interface LeaveTypeResponse {
    id: number;
    name: string;
    code: string;
    isPaid: boolean;
    defaultAnnualQuota: number;
    requiresApproval: boolean;
    isActive: boolean;
    createdAtUtc: string;
    createdByUserId: string | null;
    updatedAtUtc: string | null;
    updatedByUserId: string | null;
}

export const getLeaveTypes = async (includeInactive: boolean = false) => {
    try {
        const token = await SessionManager.getToken();

        if (!token) {
            console.error('No auth token found.');
            return { success: false, error: 'Authentication required.' };
        }

        const url = includeInactive
            ? `${BASE_URL}/admin/leave-types?includeInactive=true`
            : `${BASE_URL}/admin/leave-types`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        const responseText = await response.text();
        let data: LeaveTypeResponse[] = [];

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.warn('Response is not valid JSON:', responseText);
                return { success: false, error: 'Invalid server response' };
            }
        }

        if (!response.ok) {
            return { success: false, error: 'Failed to fetch leave types' };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Get Leave Types Error:', error);
        return { success: false, error: 'Network request failed' };
    }
};

export const updateLeaveType = async (id: number, leaveTypeData: LeaveTypeData) => {
    try {
        const token = await SessionManager.getToken();

        if (!token) {
            return { success: false, error: 'Authentication required.' };
        }

        const response = await fetch(`${BASE_URL}/admin/leave-types/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(leaveTypeData),
        });

        // Some APIs return 204 No Content for Updates
        if (response.status === 204) {
            return { success: true };
        }

        const responseText = await response.text();
        let data;
        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                // If text but not JSON, just return text as message if error, or ignore if success
            }
        }

        if (!response.ok) {
            const errorMessage = data && data.message ? data.message : 'Failed to update leave type';
            return { success: false, error: errorMessage };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Update Leave Type Error:', error);
        return { success: false, error: 'Network request failed' };
    }
};

export const removeLeaveType = async (id: number) => {
    try {
        const token = await SessionManager.getToken();

        if (!token) {
            return { success: false, error: 'Authentication required.' };
        }

        const response = await fetch(`${BASE_URL}/admin/leave-types/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (response.ok) {
            return { success: true };
        } else {
            console.error('Failed to delete leave type:', response.status);
            const errorText = await response.text();
            return { success: false, error: errorText || `Status ${response.status}` };
        }
    } catch (error) {
        console.error('Delete Leave Type Error:', error);
        return { success: false, error: 'Network request failed' };
    }
};

// services/leaveRequests.ts
export interface LeaveApplication {
    id: string;
    month: string;
    day: string;
    type: string;
    details: string;
    status: string;
    statusColor: string;
    bgColor: string;
    iconColor: string;
    startDate: string; // new
    endDate: string;   // new
}

/**
 * Fetch leave requests from API
 * @param token - Bearer token for authorization
 */
export const fetchLeaveRequests = async (): Promise<LeaveApplication[]> => {
    try {
        const token = await SessionManager.getToken();
        if (!token) {
            console.error('No auth token found. User likely not logged in.');
            return [];
        }

        const response = await fetch(
            'http://103.134.238.50:91/api/leave-approvals?status=all',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to fetch: ${response.status} - ${text}`);
        }

        const data = await response.json();

        return data.map((item: any) => {
            const statusColors: Record<string, string> = {
                Pending: '#f59e0b',
                Approved: '#10b981',
                Rejected: '#ef4444',
            };

            return {
                id: item.id,
                month: new Date(item.startDate).toLocaleString('en-US', { month: 'short' }),
                day: new Date(item.startDate).getDate().toString(),
                type: item.leaveType,
                details: `${Math.ceil(
                    (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) /
                    (1000 * 60 * 60 * 24) +
                    1
                )} Day(s) • ${item.reason}`,
                status: item.status || 'Pending',
                statusColor: statusColors[item.status || 'Pending'],
                bgColor: statusColors[item.status || 'Pending'] + '20',
                iconColor: statusColors[item.status || 'Pending'],
                startDate: new Date(item.startDate).toLocaleDateString(), // added
                endDate: new Date(item.endDate).toLocaleDateString(),     // added
            };
        });
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        return [];
    }
};

interface LeaveRequestPayload {
    employeeId: number;
    startDate: string; // ISO string
    endDate: string;   // ISO string
    leaveType: string;
    reason?: string;
}

export const createLeaveRequest = async (payload: LeaveRequestPayload) => {
    try {
        const token = await SessionManager.getToken();
        if (!token) {
            console.error('No auth token found. User likely not logged in.');
            return null;
        }

        const response = await fetch(`${API_BASE_URL}/leave-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to create leave request: ${response.status} - ${text}`);
        }

        const data = await response.json();
        console.log('Leave request created:', data);
        return data;
    } catch (error) {
        console.error('Error creating leave request:', error);
        return null;
    }
};