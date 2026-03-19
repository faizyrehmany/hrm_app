import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

interface EmployeeBottomTabBarProps {
    activeTab: 'home' | 'attendance' | 'leaves' | 'profile';
}

export default function EmployeeBottomTabBar({ activeTab }: EmployeeBottomTabBarProps) {
    const router = useRouter();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const getTabColor = (tabName: string) =>
        activeTab === tabName ? colors.primary : colors.textSub;

    return (
        <View
            style={[
                styles.tabContainer,
                {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    paddingBottom: insets.bottom,
                },
            ]}
        >
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.push('/screens/employee_dashboard')}
                >
                    <MaterialIcons name="dashboard" size={24} color={getTabColor('home')} />
                    <Text style={[styles.tabLabel, { color: getTabColor('home') }]}>
                        Home
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.push('/screens/attendance')}
                >
                    <MaterialIcons name="schedule" size={24} color={getTabColor('attendance')} />
                    <Text style={[styles.tabLabel, { color: getTabColor('attendance') }]}>
                        Attendance
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.push('/screens/employee_leaves')}
                >
                    <MaterialIcons name="calendar-month" size={24} color={getTabColor('leaves')} />
                    <Text style={[styles.tabLabel, { color: getTabColor('leaves') }]}>
                        Leaves
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.push('/screens/employee_profile')}
                >
                    <MaterialIcons name="person" size={24} color={getTabColor('profile')} />
                    <Text style={[styles.tabLabel, { color: getTabColor('profile') }]}>
                        Profile
                    </Text>
                </TouchableOpacity>
                </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 4,
    },
});