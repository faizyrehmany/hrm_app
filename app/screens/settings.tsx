import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { SessionManager } from '../services/SessionManager';

export default function SettingsScreen() {
    const { colors, isDark } = useTheme();

    const [twoFactor, setTwoFactor] = useState(false);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [language, setLanguage] = useState('English (US)');
    const [showLanguageOptions, setShowLanguageOptions] = useState(false);

    const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
    const [showDateOptions, setShowDateOptions] = useState(false);

    const dynamicStyles = createDynamicStyles(colors, isDark);

    const insets = useSafeAreaInsets();

    const router = useRouter();

    useEffect(() => {
        const checkRole = async () => {
            const user = await SessionManager.getUser();
            const roles = user?.roles || [];
            const isAdmin = roles.some(
                (role: string) => String(role).toLowerCase() === 'admin'
            );

            if (isAdmin) {
                router.replace('/screens/dashboard');
            }
        };

        checkRole();
    }, []);

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 20 } // <-- add top inset
                ]}
            >
                {/* Header */}
                <Text style={[styles.title, dynamicStyles.title]}>
                    System Settings
                </Text>
                <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
                    Configure your account preferences and security
                </Text>

                {/* SECURITY CARD */}
                <View style={[styles.card, dynamicStyles.card]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
                            <Feather name="shield" size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>
                            Security
                        </Text>
                    </View>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>
                                Two-Factor Auth
                            </Text>
                            <Text style={[styles.settingSub, dynamicStyles.settingSub]}>
                                Verify login with your phone
                            </Text>
                        </View>
                        <Switch
                            value={twoFactor}
                            onValueChange={setTwoFactor}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>

                </View>

                {/* NOTIFICATIONS CARD */}
                <View style={[styles.card, dynamicStyles.card]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
                            <Ionicons name="notifications-outline" size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>
                            Notifications
                        </Text>
                    </View>

                    <View style={styles.settingRow}>
                        <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>
                            Email Alerts
                        </Text>
                        <Switch
                            value={emailAlerts}
                            onValueChange={setEmailAlerts}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>
                            Push Notifications
                        </Text>
                        <Switch
                            value={pushNotifications}
                            onValueChange={setPushNotifications}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* PREFERENCES CARD */}
                <View style={[styles.card, dynamicStyles.card]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
                            <MaterialCommunityIcons
                                name="palette-outline"
                                size={18}
                                color={colors.primary}
                            />
                        </View>
                        <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>
                            Preferences
                        </Text>
                    </View>

                    {/* Language Dropdown */}
                    <View style={styles.dropdownRow}>
                        <Text style={[styles.dropdownLabel, dynamicStyles.dropdownLabel]}>
                            Interface Language
                        </Text>

                        <TouchableOpacity
                            style={[styles.dropdown, dynamicStyles.dropdown]}
                            onPress={() => setShowLanguageOptions(!showLanguageOptions)}
                        >
                            <Text style={[styles.dropdownText, dynamicStyles.dropdownText]}>
                                {language}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={colors.textSub} />
                        </TouchableOpacity>

                        {showLanguageOptions && (
                            <View style={[styles.optionBox, dynamicStyles.optionBox]}>
                                {['English (US)', 'English (UK)', 'Urdu'].map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.optionItem}
                                        onPress={() => {
                                            setLanguage(item);
                                            setShowLanguageOptions(false);
                                        }}
                                    >
                                        <Text style={[styles.optionText, dynamicStyles.optionText]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Date Format Dropdown */}
                    <View style={styles.dropdownRow}>
                        <Text style={[styles.dropdownLabel, dynamicStyles.dropdownLabel]}>
                            Date Format
                        </Text>

                        <TouchableOpacity
                            style={[styles.dropdown, dynamicStyles.dropdown]}
                            onPress={() => setShowDateOptions(!showDateOptions)}
                        >
                            <Text style={[styles.dropdownText, dynamicStyles.dropdownText]}>
                                {dateFormat}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={colors.textSub} />
                        </TouchableOpacity>

                        {showDateOptions && (
                            <View style={[styles.optionBox, dynamicStyles.optionBox]}>
                                {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.optionItem}
                                        onPress={() => {
                                            setDateFormat(item);
                                            setShowDateOptions(false);
                                        }}
                                    >
                                        <Text style={[styles.optionText, dynamicStyles.optionText]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20 },
    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 14, marginBottom: 24 },

    card: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },

    iconBox: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    cardTitle: { fontSize: 16, fontWeight: '600' },

    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },

    settingTitle: { fontSize: 14, fontWeight: '500' },
    settingSub: { fontSize: 12, marginTop: 4 },

    dropdownRow: { marginBottom: 16 },
    dropdownLabel: { fontSize: 12, marginBottom: 6 },

    dropdown: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    dropdownText: { fontSize: 14 },

    optionBox: {
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },

    optionItem: {
        paddingVertical: 12,
        paddingHorizontal: 14,
    },

    optionText: { fontSize: 14 },
});

const createDynamicStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.background,
        },
        title: { color: colors.textMain },
        subtitle: { color: colors.textSub },
        card: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        cardTitle: { color: colors.textMain },
        settingTitle: { color: colors.textMain },
        settingSub: { color: colors.textSub },
        dropdownLabel: { color: colors.textSub },
        dropdown: {
            backgroundColor: isDark ? colors.border : '#f9fafb',
            borderColor: colors.border,
        },
        dropdownText: { color: colors.textMain },
        optionBox: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        optionText: { color: colors.textMain },
    });