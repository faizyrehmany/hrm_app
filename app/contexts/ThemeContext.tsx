import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeColors {
    primary: string;
    background: string;
    backgroundLight: string;
    backgroundDark: string;
    surface: string;
    surfaceLight: string;
    surfaceDark: string;
    textMain: string;
    textSub: string;
    border: string;
    borderLight: string;
    borderDark: string;
    card: string;
    emerald: string;
    orange: string;
    white: string;
}

interface Theme {
    isDark: boolean;
    colors: ThemeColors;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

const lightColors: ThemeColors = {
    primary: '#137fec',
    background: '#f6f7f8',
    backgroundLight: '#f6f7f8',
    backgroundDark: '#101922',
    surface: '#ffffff',
    surfaceLight: '#ffffff',
    surfaceDark: '#1c252e',
    textMain: '#0f172a',
    textSub: '#64748b',
    border: '#e2e8f0',
    borderLight: '#e2e8f0',
    borderDark: '#334155',
    card: '#ffffff',
    emerald: '#10b981',
    orange: '#f97316',
    white: '#ffffff',
};

const darkColors: ThemeColors = {
    primary: '#137fec',
    background: '#101922',
    backgroundLight: '#f6f7f8',
    backgroundDark: '#101922',
    surface: '#1c252e',
    surfaceLight: '#ffffff',
    surfaceDark: '#1c252e',
    textMain: '#ffffff',
    textSub: '#94a3b8',
    border: '#334155',
    borderLight: '#e2e8f0',
    borderDark: '#334155',
    card: '#1c252e',
    emerald: '#10b981',
    orange: '#f97316',
    white: '#ffffff',
};

const ThemeContext = createContext<Theme | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('auto');
    const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

    useEffect(() => {
        // Load saved theme preference
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedMode) => {
            if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
                setModeState(savedMode as ThemeMode);
            }
        });
    }, []);

    useEffect(() => {
        // Update isDark based on mode
        if (mode === 'auto') {
            setIsDark(systemColorScheme === 'dark');
        } else {
            setIsDark(mode === 'dark');
        }
    }, [mode, systemColorScheme]);

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    };

    const colors = isDark ? darkColors : lightColors;

    const value: Theme = {
        isDark,
        colors,
        mode,
        setMode,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}


