import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface EmployeeBottomTabBarProps {
    activeTab: 'home' | 'attendance' | 'leaves' | 'profile';
}

export default function EmployeeBottomTabBar({ activeTab }: EmployeeBottomTabBarProps) {
    const router = useRouter();
    const { isDark, colors } = useTheme();

    const getTabColor = (tabName: string) => {
        return activeTab === tabName ? colors.primary : colors.textSub;
    };

    const styles = createStyles(colors, isDark);

    return (
        <View style={styles.tabBar}>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => router.push('/screens/employee_dashboard')}
            >
                <MaterialIcons
                    name={activeTab === 'home' ? 'dashboard' : 'dashboard'}
                    size={24}
                    color={getTabColor('home')}
                />
                <Text style={[styles.tabLabel, { color: getTabColor('home') }]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => router.push('/screens/attendance')}
            >
                <MaterialIcons name="schedule" size={24} color={getTabColor('attendance')} />
                <Text style={[styles.tabLabel, { color: getTabColor('attendance') }]}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => router.push('/screens/employee_leaves')}
            >
                <MaterialIcons name="calendar-month" size={24} color={getTabColor('leaves')} />
                <Text style={[styles.tabLabel, { color: getTabColor('leaves') }]}>Leaves</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => router.push('/screens/employee_profile')}
            >
                <MaterialIcons name="person" size={24} color={getTabColor('profile')} />
                <Text style={[styles.tabLabel, { color: getTabColor('profile') }]}>Profile</Text>
            </TouchableOpacity>
        </View>
    );
}

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        tabBar: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            height: 70,
            paddingBottom: Platform.OS === 'ios' ? 20 : 12,
            paddingHorizontal: 8,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 8,
        },
        tabItem: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingVertical: 8,
            width: 64,
        },
        tabLabel: {
            fontSize: 10,
            fontWeight: '500',
        },
        fabContainer: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 40 : 32,
            alignSelf: 'center',
            zIndex: 10,
        },
        fab: {
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
    });


