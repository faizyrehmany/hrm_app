import { API_BASE_URL } from "./Config";
import { SessionManager } from "./SessionManager";

export const getIncrementPolicies = async () => {

    const token = await SessionManager.getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/IncrementPolicies`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.log("Get Increment Policies Error:", error);
        return [];
    }
};

export const getEmployeeIncrements = async () => {

    const token = await SessionManager.getToken();

    try {
        const response = await fetch(
            `${API_BASE_URL}/EmployeeIncrements`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }

        );

        if (!response.ok) {
            throw new Error("Failed to fetch employee increments");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.log("Employee Increments API Error:", error);
        return [];
    }
};