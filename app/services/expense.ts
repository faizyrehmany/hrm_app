import { API_BASE_URL } from "./Config";
import { SessionManager } from "./SessionManager";

export const getExpenseCategories = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/ExpenseCategories`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};


export const getExpenses = async () => {

    const token = await SessionManager.getToken();

    try {
        const response = await fetch(`${API_BASE_URL}/Expenses`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.log("Error fetching expenses:", error);
        throw error;
    }
};

export const createExpense = async (payload: any) => {
    try {
        const token = await SessionManager.getToken(); // ✅ ADD THIS

        const formData = new FormData();

        formData.append("title", payload.title);
        formData.append("amount", payload.amount);
        formData.append("categoryId", String(payload.categoryId));
        formData.append("employeeId", String(payload.employeeId));
        formData.append("date", payload.date);
        formData.append("description", payload.description);
        formData.append("vendor", payload.vendor);
        formData.append("paymentMethod", payload.paymentMethod);

        if (payload.attachmentUrl) {
            formData.append("attachmentUrl", {
                uri: payload.attachmentUrl.uri,
                name: payload.attachmentUrl.name,
                type: payload.attachmentUrl.type,
            } as any);
        }

        const response = await fetch(`${API_BASE_URL}/Expenses`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`, // ✅ THIS FIXES 401
            },
            body: formData,
        });

        console.log("STATUS:", response.status);

        const text = await response.text();
        console.log("RAW:", text);

        const data = text ? JSON.parse(text) : { success: true };

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }

        return data;
    } catch (error: any) {
        console.log("CREATE EXPENSE ERROR:", error.message);
        throw error;
    }
};

export const updateExpense = async (id: number, payload: any) => {
    try {
        const token = await SessionManager.getToken();

        const formData = new FormData();

        formData.append("title", payload.title);
        formData.append("amount", payload.amount);
        formData.append("categoryId", String(payload.categoryId));
        formData.append("employeeId", String(payload.employeeId));
        formData.append("date", payload.date);
        formData.append("description", payload.description);
        formData.append("vendor", payload.vendor);
        formData.append("paymentMethod", payload.paymentMethod);

        if (payload.attachmentUrl) {
            formData.append("attachmentUrl", {
                uri: payload.attachmentUrl.uri,
                name: payload.attachmentUrl.name,
                type: payload.attachmentUrl.type,
            } as any);
        }

        const response = await fetch(`${API_BASE_URL}/Expenses/${id}`, {
            method: "PUT", // 👈 update method
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }

        return data;
    } catch (error) {
        console.log("UPDATE EXPENSE ERROR:", error);
        throw error;
    }
};

export const deleteExpense = async (id: number) => {
    try {
        const token = await SessionManager.getToken();

        const response = await fetch(`${API_BASE_URL}/Expenses/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Delete failed: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.log("DELETE ERROR:", error);
        throw error;
    }
};