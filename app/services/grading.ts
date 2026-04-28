import { API_BASE_URL } from "./Config";
import { SessionManager } from './SessionManager';

export const getEmployeeGrading = async ({
    year,
    month,
}: {
    year: number;
    month: number;
}) => {
    try {
        const token = await SessionManager.getToken();

        const response = await fetch(
            `${API_BASE_URL}/EmployeeGrading?year=${year}&month=${month}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.log("API ERROR RESPONSE:", errorText);
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching employee grading:", error);
        throw error;
    }
};


export const getGradePolicies = async () => {
    try {
        const token = await SessionManager.getToken();
        const response = await fetch(
            `${API_BASE_URL}/GradePolicies`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`,

                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching grade policies:', error);
        throw error;
    }
};