// services/loan.ts
import { API_BASE_URL } from './Config';
import { SessionManager } from './SessionManager';

export interface Loan {
    employeeId: number;
    totalAmount: number;
    monthlyInstallment: number;
    remainingAmount: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    status: 'pending' | 'approved';
    id?: string; // optional for new loans
}




// GET: fetch loans
export const getLoans = async (): Promise<Loan[]> => {
    const token = await SessionManager.getToken();
    if (!token) throw new Error('No token found');

    const res = await fetch(`${API_BASE_URL}/EmployeeLoans`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    // handle empty response
    const text = await res.text();
    console.log("Loan API status:", res.status);
    console.log("Loan API raw response:", text);

    if (!res.ok) {
        throw new Error(text || 'Failed to fetch loans');
    }

    // if API returns empty body
    if (!text) {
        return [];
    }

    const data = JSON.parse(text);
    return data.data || [];
};
// POST: create a new loan
// POST: create a new loan
export const createLoan = async (loan: Loan): Promise<Loan | null> => {
    const token = await SessionManager.getToken();
    if (!token) throw new Error('No token found');

    const res = await fetch(`${API_BASE_URL}/EmployeeLoans`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(loan),
    });

    if (!res.ok) {
        // Try parsing error safely
        const text = await res.text();
        let errorMessage = 'Failed to create loan';
        try {
            const errorJson = JSON.parse(text);
            errorMessage = errorJson.message || errorMessage;
        } catch {
            // text might not be JSON, ignore
            if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
    }

    // Parse response safely
    const text = await res.text();
    if (!text) return null; // handle empty response

    try {
        const data = JSON.parse(text);
        return data.data || null;
    } catch {
        return null; // fallback if response is not JSON
    }
};