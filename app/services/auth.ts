import { SessionManager, User } from './SessionManager';

import { API_BASE_URL } from './Config';

export const loginUser = async (email: string, password: string) => {
    try {
        console.log('Attempting login with:', email);
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                identifier: email,
                password: password,
            }),
        });

        console.log('Response Status:', response.status);
        const data = await response.json();
        console.log('Response Data:', data);

        if (response.ok) {
            // Robust token extraction
            const token = data.jwt ||
                data.token ||
                data.accessToken ||
                data.access_token ||
                data?.data?.token ||
                data?.data?.accessToken;

            // Robust user extraction
            const user = data.user ||
                data.userData ||
                data.data?.user ||
                // If data itself has username/email but no explicit 'user' key
                (data.username ? data : null);

            if (token) {
                // Determine saveable user object
                const userToSave = user || { username: email, email: email, id: 'guest' };

                // Extract roles from response
                const roles = data.roles || data.user?.roles || [];
                if (roles.length > 0) {
                    userToSave.roles = roles;
                }

                await SessionManager.saveSession(userToSave, token);
                console.log('Session saved. Token found:', token.substring(0, 10) + '...');
                console.log('User roles:', roles);
            } else {
                console.warn('CRITICAL: No token found. Response Keys:', Object.keys(data));
            }
        }

        return { success: response.ok, data, roles: data.roles || [] };
    } catch (error) {
        console.error('Login Error:', error);
        return { success: false, error };
    }
};

interface RegisterData {
    userName: string;
    email: string;
    password: string;
    fullName: string;
}

export const registerUser = async (userData: RegisterData) => {
    try {
        console.log('Attempting register with:', userData.email);
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        console.log('Register Response Status:', response.status);
        const data = await response.json();
        console.log('Register Response Data:', data);

        return { success: response.ok, data };
    } catch (error) {
        console.error('Register Error:', error);
        return { success: false, error };
    }
};





export const EmployeeApi = {
    // Fetch employee details dynamically using employeeId from session
    getEmployeeDetails: async (): Promise<User | null> => {
      try {
        const user = await SessionManager.getUser();
        const token = await SessionManager.getToken();
  
        if (!user || !user.employeeId) {
          console.log('No employeeId in session');
          return null;
        }
  
        const response = await fetch(`${API_BASE_URL}/employees/${user.employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          const text = await response.text();
          console.error('API Error:', text);
          return null;
        }
  
        const data: User = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to fetch employee details:', error);
        return null;
      }
    },
  
    // Create or update employee details
    postEmployeeDetails: async (employeeData: any): Promise<boolean> => {
        try {
          const user = await SessionManager.getUser();
          const token = await SessionManager.getToken();
      
          const response = await fetch(`${API_BASE_URL}/employees/${user?.employeeId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(employeeData),
          });
      
          const text = await response.text();
      
          if (!response.ok) {
            console.error('API Status:', response.status);
            console.error('API Response:', text);
            return false;
          }
      
          return true;
        } catch (error) {
          console.error('Update Employee Error:', error);
          return false;
        }
      }
  };
