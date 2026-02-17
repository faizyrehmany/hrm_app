import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
    id: number | string;
    username: string;
    email: string;
    // Add other user fields as needed based on your API response
    fullName?: string;
    roles?: string[];
}

export interface Session {
    user: User | null;
    token: string | null;
}

const TOKEN_KEY = 'userToken';
const USER_KEY = 'userData';

export const SessionManager = {
    // Save session data (user and token)
    saveSession: async (user: User, token: string) => {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    },

    // Get token
    getToken: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    // Get user data
    getUser: async (): Promise<User | null> => {
        try {
            const userJson = await AsyncStorage.getItem(USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    // Clear session (Logout)
    clearSession: async () => {
        try {
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    },

    // Check if user is logged in
    isLoggedIn: async (): Promise<boolean> => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        return !!token;
    }
};

// Attendance Manager
const ATTENDANCE_KEY = 'attendance_data';
const CHECK_IN_KEY = 'check_in_time';
const TODAY_ATTENDANCE_KEY = 'today_attendance';

export interface AttendanceRecord {
    checkInTime: string;
    checkOutTime?: string;
    date: string;
    status: 'Present' | 'Late In' | 'On Time' | 'Absent';
}

export const AttendanceManager = {
    // Save check-in time
    saveCheckIn: async (checkInTime: Date) => {
        try {
            const timeString = checkInTime.toISOString();
            await AsyncStorage.setItem(CHECK_IN_KEY, timeString);
            const today = new Date().toDateString();
            await AsyncStorage.setItem(TODAY_ATTENDANCE_KEY, JSON.stringify({
                date: today,
                checkInTime: timeString,
                isCheckedIn: true,
            }));
        } catch (error) {
            console.error('Error saving check-in:', error);
        }
    },

    // Save check-out time
    saveCheckOut: async (checkOutTime: Date) => {
        try {
            const today = new Date().toDateString();
            const todayData = await AsyncStorage.getItem(TODAY_ATTENDANCE_KEY);
            if (todayData) {
                const data = JSON.parse(todayData);
                data.checkOutTime = checkOutTime.toISOString();
                data.isCheckedIn = false;
                await AsyncStorage.setItem(TODAY_ATTENDANCE_KEY, JSON.stringify(data));
            }
            await AsyncStorage.removeItem(CHECK_IN_KEY);
        } catch (error) {
            console.error('Error saving check-out:', error);
        }
    },

    // Get today's attendance status
    getTodayAttendance: async (): Promise<{ checkInTime?: Date; checkOutTime?: Date; isCheckedIn: boolean } | null> => {
        try {
            const today = new Date().toDateString();
            const todayData = await AsyncStorage.getItem(TODAY_ATTENDANCE_KEY);
            if (todayData) {
                const data = JSON.parse(todayData);
                if (data.date === today) {
                    return {
                        checkInTime: data.checkInTime ? new Date(data.checkInTime) : undefined,
                        checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : undefined,
                        isCheckedIn: data.isCheckedIn || false,
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting today attendance:', error);
            return null;
        }
    },

    // Check if currently checked in
    isCheckedIn: async (): Promise<boolean> => {
        try {
            const today = await AttendanceManager.getTodayAttendance();
            return today?.isCheckedIn || false;
        } catch (error) {
            return false;
        }
    },

    // Get check-in time
    getCheckInTime: async (): Promise<Date | null> => {
        try {
            const timeString = await AsyncStorage.getItem(CHECK_IN_KEY);
            if (timeString) {
                return new Date(timeString);
            }
            const today = await AttendanceManager.getTodayAttendance();
            return today?.checkInTime || null;
        } catch (error) {
            return null;
        }
    },
};
