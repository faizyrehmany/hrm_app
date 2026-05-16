import { API_BASE_URL } from './Config';
import { SessionManager } from './SessionManager';

export interface ComplaintData {
    complaintType: string;
    description: string;
    isAnonymous: boolean;
}

export interface ComplaintResponse extends ComplaintData {
    id: string;
    date: string;
    status: string;
}

export const ComplaintService = {
    getComplaints: async (): Promise<ComplaintResponse[]> => {
        console.log('GETTING COMPLAINTS...');
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/Complaints`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            console.error('GET COMPLAINTS ERROR:', response.status);
            throw new Error('Failed to fetch complaints');
        }
        const data = await response.json();
        console.log('GET COMPLAINTS SUCCESS:', data.length, 'items');
        return data;
    },

    createComplaint: async (data: ComplaintData): Promise<ComplaintResponse> => {
        console.log('CREATING COMPLAINT:', data);
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/Complaints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            console.error('CREATE COMPLAINT ERROR:', response.status);
            throw new Error('Failed to create complaint');
        }
        const result = await response.json();
        console.log('CREATE COMPLAINT SUCCESS:', result);
        return result;
    },

    updateComplaint: async (id: string, data: ComplaintData): Promise<void> => {
        console.log('UPDATING COMPLAINT:', id, data);
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/Complaints/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            console.error('UPDATE COMPLAINT ERROR:', response.status);
            throw new Error('Failed to update complaint');
        }
        console.log('UPDATE COMPLAINT SUCCESS');
    },

    deleteComplaint: async (id: string): Promise<void> => {
        console.log('DELETING COMPLAINT:', id);
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/Complaints/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            console.error('DELETE COMPLAINT ERROR:', response.status);
            throw new Error('Failed to delete complaint');
        }
        console.log('DELETE COMPLAINT SUCCESS');
    },

    resolveComplaint: async (id: string): Promise<void> => {
        console.log('RESOLVING COMPLAINT:', id);
        const token = await SessionManager.getToken();
        const response = await fetch(`${API_BASE_URL}/Complaints/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify("Resolved"),
        });
        if (!response.ok) {
            console.error('RESOLVE COMPLAINT ERROR:', response.status);
            throw new Error('Failed to resolve complaint');
        }
        console.log('RESOLVE COMPLAINT SUCCESS');
    },
};
