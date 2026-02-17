import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { SessionManager, User } from '../services/SessionManager';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.85, 320);

interface SideMenuProps {
    visible: boolean;
    onClose: () => void;
}

export default function SideMenu({ visible, onClose }: SideMenuProps) {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [slideAnim] = useState(new Animated.Value(-DRAWER_WIDTH));
    const [overlayOpacity] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            loadUser();
            // Slide in animation
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Slide out animation
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const loadUser = async () => {
        const userData = await SessionManager.getUser();
        setUser(userData);

        // Check if user is admin
        const roles = userData?.roles || [];
        const admin = roles.some((role: string) => role.toLowerCase() === 'admin');
        setIsAdmin(admin);
    };

    const handleLogout = async () => {
        await SessionManager.clearSession();
        onClose();
        router.replace('/');
    };

    const navigateTo = (route: string) => {
        onClose();
        setTimeout(() => {
            if (route === '/screens/dashboard') {
                router.replace('/screens/dashboard');
            } else {
                router.push(route as any);
            }
        }, 300);
    };

    const MenuItem = ({ icon, label, route, isActive = false }: { icon: any, label: string, route?: string, isActive?: boolean }) => {
        return (
            <TouchableOpacity
                style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                    isActive && { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }
                ]}
                onPress={() => route && navigateTo(route)}
            >
                <MaterialIcons
                    name={icon}
                    size={24}
                    color={isActive ? '#137fec' : (isDark ? '#94a3b8' : '#64748b')}
                />
                <Text style={[
                    styles.menuText,
                    { color: isActive ? '#137fec' : (isDark ? '#e2e8f0' : '#475569') },
                    isActive && styles.menuTextActive
                ]}>
                    {label}
                </Text>
                {isActive && (
                    <View style={[styles.activeIndicator, { backgroundColor: '#137fec' }]} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            animationType="none"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                    <TouchableWithoutFeedback onPress={onClose}>
                        <View style={styles.backdropClickArea} />
                    </TouchableWithoutFeedback>
                </Animated.View>

                {/* Drawer Content */}
                <Animated.View
                    style={[
                        styles.drawer,
                        {
                            transform: [{ translateX: slideAnim }],
                            backgroundColor: isDark ? '#1A2633' : '#FFFFFF',
                            paddingTop: 0, // Reset default padding
                        },
                    ]}>

                    {/* Header with Gradient */}
                    <LinearGradient
                        colors={['#0f172a', '#1e293b', '#137fec']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
                    >
                        {/* Abstract Background Decoration */}
                        <View style={styles.headerDecoration} />

                        <View style={styles.userInfoContainer}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfnbxNEp0oPDMGFdVxryRSrtzfXr9L3AMmhmIKdwW8mfebQ06Nniv-LBpz-6WyL85rq41rteu9qzx1liZ735YiFnoqsYKIvOCkfwlvuvGMi4gzkl-wm65P_7JyFC5PYAeF6PmqkqReSAWZxYjQpyKhk0lpdBcnIztYIv_KZcq9Gz0kLy2YId5LfFT_qnRQJVnD4PcyrlpmdFJ0XvBfI8oCo1-WzIvLZzHUsNyoJC02zKRTN_A2ZLollzB3Z-2c6xGhiuJRG2juuhn-' }}
                                    style={styles.avatarImage}
                                />
                                <View style={styles.onlineStatus} />
                            </View>
                            <View style={styles.userDetails}>
                                <Text style={styles.userNameText} numberOfLines={1}>
                                    {user?.username || 'Guest User'}
                                </Text>
                                <Text style={styles.userRoleText}>
                                    {isAdmin ? 'Super Admin' : 'Employee'}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Menu Items List */}
                    <View style={styles.scrollContainer}>
                        <View style={styles.menuGroup}>
                            {isAdmin ? (
                                <>
                                    <MenuItem icon="grid-view" label="Dashboard" route="/screens/dashboard" />
                                    <MenuItem icon="work" label="Jobs" route="/screens/jobs" />
                                    <MenuItem icon="schedule" label="Attendance" route="/screens/attendance" />
                                    <MenuItem icon="payments" label="Payroll" route="/screens/payroll" />

                                    <View style={[styles.divider, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} />

                                    <MenuItem icon="fact-check" label="Leave Types" route="/screens/leave_types" />
                                    <MenuItem icon="badge" label="Designations" route="/screens/designations" />
                                    <MenuItem icon="event" label="Holidays" route="/screens/holidays" />
                                    <MenuItem icon="settings" label="Settings" route="/screens/admin_settings" />
                                </>
                            ) : (
                                <>
                                    <MenuItem icon="home" label="Home" route="/screens/employee_dashboard" isActive />
                                    <MenuItem icon="payments" label="My Payroll" route="/screens/employee_payroll" />
                                    <MenuItem icon="calendar-today" label="Calendar" />
                                    <MenuItem icon="description" label="My Requests" />
                                    <MenuItem icon="person" label="Profile" route="/screens/employee_profile" />

                                    <View style={[styles.divider, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} />

                                    <MenuItem icon="settings" label="Settings" />
                                </>
                            )}
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: isDark ? '#334155' : '#f1f5f9' }]}>
                        <TouchableOpacity
                            style={[
                                styles.logoutBtn,
                                {
                                    backgroundColor: isDark ? 'rgba(127, 29, 29, 0.2)' : '#fef2f2',
                                    borderColor: isDark ? 'rgba(127, 29, 29, 0.4)' : '#fee2e2'
                                }
                            ]}
                            onPress={handleLogout}
                        >
                            <MaterialIcons name="logout" size={20} color="#dc2626" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                        <Text style={[styles.versionText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                            v2.4.0 • HRM System
                        </Text>
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(20, 20, 20, 0.4)',
        zIndex: 0,
    },
    backdropClickArea: {
        flex: 1,
    },
    drawer: {
        width: DRAWER_WIDTH,
        height: '100%',
        backgroundColor: '#fff',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 1,
    },
    headerGradient: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        justifyContent: 'flex-end',
        minHeight: 180,
    },
    headerDecoration: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.05)',
        transform: [{ translateX: 50 }, { translateY: -50 }],
    },
    userInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: '#1e293b',
    },
    userDetails: {
        flex: 1,
    },
    userNameText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    userRoleText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
    },
    scrollContainer: {
        flex: 1,
        paddingVertical: 16,
    },
    menuGroup: {
        paddingHorizontal: 12,
        gap: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    menuItemActive: {
        // Background color handled in dynamic style
    },
    menuText: {
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 16,
    },
    menuTextActive: {
        fontWeight: '700',
    },
    activeIndicator: {
        position: 'absolute',
        left: 0,
        top: '25%',
        bottom: '25%',
        width: 4,
        height: '50%',
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    divider: {
        height: 1,
        marginVertical: 12,
        marginHorizontal: 16,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
    },
    logoutText: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 11,
        marginTop: 16,
    },
});


