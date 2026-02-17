import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface BottomTabBarProps {
    activeTab: 'dashboard' | 'employees' | 'leaves' | 'profile' | 'jobs';
}

export default function BottomTabBar({ activeTab }: BottomTabBarProps) {
    const router = useRouter();
    const { isDark, colors } = useTheme();

    const getTabColor = (tabName: string) => {
        return activeTab === tabName ? colors.primary : colors.textSub;
    };

    const styles = createStyles(colors, isDark);

    return (
        <View style={styles.tabContainer}>
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.push('/screens/dashboard')}
                >
                    <MaterialIcons name="dashboard" size={24} color={getTabColor('dashboard')} />
                    <Text style={[styles.tabLabel, { color: getTabColor('dashboard') }]}>Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.push('/screens/employees')}
                >
                    <MaterialIcons name="people" size={24} color={getTabColor('employees')} />
                    <Text style={[styles.tabLabel, { color: getTabColor('employees') }]}>Employees</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.push('/screens/leave_approvals')}
                >
                    <MaterialIcons name="event-note" size={24} color={getTabColor('leaves')} />
                    <Text style={[styles.tabLabel, { color: getTabColor('leaves') }]}>Leaves</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.push('/screens/admin_profile')}
                >
                    <MaterialIcons name="person" size={24} color={getTabColor('profile')} />
                    <Text style={[styles.tabLabel, { color: getTabColor('profile') }]}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    tabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingVertical: 8,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
    },
});


