// components/EmployeeHeader.tsx
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { User } from '../services/SessionManager';

interface EmployeeHeaderProps {
    user: User | null;
    onMenuPress: () => void;
    onNotificationPress?: () => void;
    title?: string; // ✅ ADD THIS

}

const STATIC_COLORS = {
    red: '#ef4444',
};

const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({ user, onMenuPress, onNotificationPress, title }) => {
    const { isDark, colors } = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
                <TouchableOpacity
                    onPress={onMenuPress}
                    style={[styles.menuButton, { backgroundColor: isDark ? colors.border : '#f3f4f6' }]}
                >
                    <MaterialIcons name="menu" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    {title ? (
                        <Text style={[styles.userName, { color: colors.textMain }]}>
                            {title}
                        </Text>
                    ) : (
                        <>
                            <Text style={[styles.welcomeText, { color: colors.textSub }]}>
                                Welcome back,
                            </Text>
                            <Text style={[styles.userName, { color: colors.textMain }]}>
                                {user?.fullName || user?.username || 'Employee'}
                            </Text>
                        </>
                    )}
                </View>
            </View>
            {/* <TouchableOpacity
                style={[styles.notificationButton, { backgroundColor: isDark ? colors.border : '#f3f4f6' }]}
                onPress={onNotificationPress}
            >
                <MaterialIcons name="notifications" size={24} color={colors.textMain} />
                <View style={styles.notificationBadge} />
            </TouchableOpacity> */}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: STATIC_COLORS.red,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
});

export default EmployeeHeader;