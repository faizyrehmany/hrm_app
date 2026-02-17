import { API_BASE_URL } from './Config';
import { SessionManager } from './SessionManager';

const API_URL = `${API_BASE_URL}/admin/designations`;

export const getDesignations = async (includeInactive: boolean = false) => {
    try {
        const token = await SessionManager.getToken();
        if (!token) {
            console.error('No token found');
            return { success: false, error: 'No token found' };
        }

        const url = includeInactive
            ? `${API_URL}?includeInactive=true`
            : API_URL;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, data };
        } else {
            console.error('Failed to fetch designations:', response.status);
            return { success: false, error: `Status ${response.status}` };
        }
    } catch (error) {
        console.error('Error fetching designations:', error);
        return { success: false, error };
    }
};

export const addDesignation = async (designation: { name: string; department: string; isActive: boolean }) => {
    try {
        const token = await SessionManager.getToken();
        if (!token) {
            return { success: false, error: 'No token found' };
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(designation),
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, data };
        } else {
            console.error('Failed to add designation:', response.status);
            const errorText = await response.text();
            return { success: false, error: errorText || `Status ${response.status}` };
        }
    } catch (error) {
        console.error('Error adding designation:', error);
        return { success: false, error };
    }
};

export const updateDesignation = async (id: number | string, designation: { name: string; department: string; isActive: boolean }) => {
    try {
        const token = await SessionManager.getToken();
        if (!token) {
            return { success: false, error: 'No token found' };
        }

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(designation),
        });

        if (response.ok) {
            try {
                const data = await response.json();
                return { success: true, data };
            } catch (e) {
                return { success: true };
            }
        } else {
            console.error('Failed to update designation:', response.status);
            const errorText = await response.text();
            return { success: false, error: errorText || `Status ${response.status}` };
        }
    } catch (error) {
        console.error('Error updating designation:', error);
        return { success: false, error };
    }
};

export const deleteDesignation = async (id: number | string) => {
    try {
        const token = await SessionManager.getToken();
        if (!token) {
            return { success: false, error: 'No token found' };
        }

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            return { success: true };
        } else {
            console.error('Failed to delete designation:', response.status);
            const errorText = await response.text();
            return { success: false, error: errorText || `Status ${response.status}` };
        }
    } catch (error) {
        console.error('Error deleting designation:', error);
        return { success: false, error };
    }
};

export const reactivateDesignation = async (id: number | string) => {
    try {
        const token = await SessionManager.getToken();
        if (!token) {
            return { success: false, error: 'No token found' };
        }

        const response = await fetch(`${API_URL}/${id}/reactivate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            return { success: true };
        } else {
            console.error('Failed to reactivate designation:', response.status);
            const errorText = await response.text();
            return { success: false, error: errorText || `Status ${response.status}` };
        }
    } catch (error) {
        console.error('Error reactivating designation:', error);
        return { success: false, error };
    }
};
