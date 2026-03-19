import { API_BASE_URL } from "./Config";
import { SessionManager } from "./SessionManager";


export interface SalaryAdvance {
  employeeId: number;
  amount: number;
  deductFromMonth: number;
  isRecovered: boolean;
  status: string;
}

// GET all salary advances
export const getSalaryAdvances = async (): Promise<SalaryAdvance[]> => {
  try {
    const token = await SessionManager.getToken();
    const response = await fetch(`${API_BASE_URL}/SalaryAdvances`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch salary advances');
    }

    const result = await response.json();

    // Extract the array
    return Array.isArray(result.data) ? result.data : [];
  } catch (error: any) {
    console.error('Error fetching salary advances:', error.message);
    return [];
  }
};

// POST a new salary advance
export const createSalaryAdvance = async (data: SalaryAdvance): Promise<SalaryAdvance> => {
  try {
    const token = await SessionManager.getToken(); // get saved accessToken
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/SalaryAdvances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // add auth header
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create salary advance');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error creating salary advance:', error.message);
    throw error;
  }
};