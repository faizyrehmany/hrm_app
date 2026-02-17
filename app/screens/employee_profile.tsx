import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SessionManager, User } from '../services/SessionManager';
import { useTheme } from '../contexts/ThemeContext';
import EmployeeBottomTabBar from '../components/EmployeeBottomTabBar';

export default function EmployeeProfileScreen() {
    const router = useRouter();
    const { isDark, colors, setMode } = useTheme();
    const [user, setUser] = useState<User | null>(null);
    const [darkModeEnabled, setDarkModeEnabled] = useState(isDark);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await SessionManager.getUser();
        setUser(userData);
    };

    const handleLogout = async () => {
        await SessionManager.clearSession();
        router.replace('/');
    };

    const toggleDarkMode = (value: boolean) => {
        setDarkModeEnabled(value);
        setMode(value ? 'dark' : 'light');
    };

    const dynamicStyles = createDynamicStyles(colors, isDark);

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>
                    Profile & Settings
                </Text>
                <View style={{ width: 48 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={{
                                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY3CMMFMkr-Mu2vkfjiIcAhVQq-hZwnsVcDSXeEsh7MIove4E4NVuoADytm2X9ryok9Bl8BkZh1qS-VKQtoa6CZ21EOXJnQ3iAaIiYaymffUKg5Vuy01wtuFuyRn-yD4_MS-0klPk_UoBDzbIiRhiwgzJm4-zOnRQj-2rcKUDSR6dqJqPHGfzWeyctABTJQhWt-uK6eL2NHXkiJEvfIz67TPn1a7qrO25WZaF15SXuDBJaSdI21lalxko5wmsmCOCD4FhZxGV5GEs1',
                            }}
                            style={styles.profileImage}
                        />
                        <TouchableOpacity style={styles.editBadge}>
                            <MaterialIcons name="edit" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.profileName, dynamicStyles.profileName]}>
                        {user?.username || 'Alex Johnson'}
                    </Text>
                    <Text style={[styles.profileRole, dynamicStyles.profileRole]}>
                        Senior Developer
                    </Text>
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                        Personal Information
                    </Text>
                    <View style={[styles.card, dynamicStyles.card]}>
                        <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '1A' }]}>
                                    <MaterialIcons name="person" size={20} color={colors.primary} />
                                </View>
                                <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>
                                    Personal Details
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={colors.textSub} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '1A' }]}>
                                    <MaterialIcons name="work" size={20} color={colors.primary} />
                                </View>
                                <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>
                                    Work Information
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={colors.textSub} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Security */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                        Security
                    </Text>
                    <View style={[styles.card, dynamicStyles.card]}>
                        <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '1A' }]}>
                                    <MaterialIcons name="lock" size={20} color={colors.primary} />
                                </View>
                                <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>
                                    Change Password
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={colors.textSub} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '1A' }]}>
                                    <MaterialIcons name="shield" size={20} color={colors.primary} />
                                </View>
                                <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>
                                    Two-Factor Authentication
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={colors.textSub} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* App Preferences */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                        App Preferences
                    </Text>
                    <View style={[styles.card, dynamicStyles.card]}>
                        <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '1A' }]}>
                                    <MaterialIcons name="notifications" size={20} color={colors.primary} />
                                </View>
                                <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>
                                    Notification Settings
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={colors.textSub} />
                        </TouchableOpacity>

                        <View style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '1A' }]}>
                                    <MaterialIcons name="dark-mode" size={20} color={colors.primary} />
                                </View>
                                <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>
                                    Dark Mode
                                </Text>
                            </View>
                            <Switch
                                value={darkModeEnabled}
                                onValueChange={toggleDarkMode}
                                trackColor={{ false: '#E5E7EB', true: colors.primary }}
                                thumbColor="#FFF"
                                ios_backgroundColor="#E5E7EB"
                            />
                        </View>
                    </View>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity
                        style={[styles.logoutButton, dynamicStyles.logoutButton]}
                        onPress={handleLogout}
                    >
                        <MaterialIcons name="logout" size={20} color="#DC2626" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                    <Text style={[styles.versionText, dynamicStyles.versionText]}>
                        Version 2.4.0 (Build 342)
                    </Text>
                </View>
            </ScrollView>

            <EmployeeBottomTabBar activeTab="profile" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 8,
    },
    backButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
        paddingRight: 48,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    profileHeader: {
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#137FEC',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    profileName: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
    },
    profileRole: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        paddingHorizontal: 24,
    },
    card: {
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    logoutSection: {
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#DC2626',
    },
    versionText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.background,
        },
        header: {
            backgroundColor: colors.surface,
        },
        headerTitle: {
            color: colors.textMain,
        },
        profileImage: {
            borderColor: isDark ? '#1F2937' : '#FFF',
        },
        profileName: {
            color: colors.textMain,
        },
        profileRole: {
            color: colors.textSub,
        },
        sectionTitle: {
            color: colors.textSub,
        },
        card: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        menuItem: {
            backgroundColor: 'transparent',
        },
        menuItemBorder: {
            borderBottomColor: colors.border,
        },
        menuItemText: {
            color: colors.textMain,
        },
        logoutButton: {
            backgroundColor: isDark ? '#DC262620' : '#FEE2E2',
        },
        versionText: {
            color: colors.textSub,
        },
    });



