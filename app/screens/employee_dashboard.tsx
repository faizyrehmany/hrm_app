import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    StatusBar as NativeStatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import EmployeeBottomTabBar from '../components/EmployeeBottomTabBar';
import SideMenu from '../components/SideMenu';
import { useTheme } from '../contexts/ThemeContext';
import { SessionManager, User } from '../services/SessionManager';

const { width } = Dimensions.get('window');

// Mock data
const LEAVE_BALANCE = [
    { type: 'Annual', days: 12, icon: 'beach-access', color: '#3B82F6' },
    { type: 'Sick', days: 5, icon: 'sick', color: '#EF4444' },
    { type: 'Casual', days: 2, icon: 'event-available', color: '#8B5CF6' },
];

const ANNOUNCEMENTS = [
    {
        id: 1,
        title: 'Office Renovation Update',
        message: 'The 2nd floor pantry will be closed for renovation until next Friday. Please use the 3rd floor pantry.',
        time: '2h ago',
        isNew: true,
        icon: 'campaign',
    },
    {
        id: 2,
        title: 'New Health Policy',
        message: 'We have updated our health insurance terms for the upcoming fiscal year. Please review the attached document.',
        time: 'Yesterday',
        isNew: false,
        icon: 'policy',
    },
];

export default function EmployeeDashboardScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [user, setUser] = useState<User | null>(null);
    const [isCheckedIn, setIsCheckedIn] = useState(true);
    const [workingTime, setWorkingTime] = useState('04:23:12');
    const [clockIn, setClockIn] = useState('09:00 AM');
    const [estimatedOut, setEstimatedOut] = useState('06:00 PM');
    const [isMenuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        loadUser();
        checkRole();
        // Simulate working time update
        const interval = setInterval(() => {
            // This would normally calculate from actual clock in time
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const checkRole = async () => {
        const userData = await SessionManager.getUser();
        const roles = userData?.roles || [];
        const isAdmin = roles.some((role: string) => role.toLowerCase() === 'admin');
        
        // Redirect admins to admin dashboard
        if (isAdmin) {
            router.replace('/screens/dashboard');
        }
    };

    const loadUser = async () => {
        const userData = await SessionManager.getUser();
        setUser(userData);
    };

    const handleCheckOut = () => {
        setIsCheckedIn(false);
        // Handle check out logic
    };

    const dynamicStyles = createDynamicStyles(colors, isDark);

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={[styles.header, dynamicStyles.header]}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            onPress={() => setMenuVisible(true)}
                            style={[styles.menuButton, dynamicStyles.menuButton]}
                        >
                            <MaterialIcons name="menu" size={24} color={colors.textMain} />
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <Text style={[styles.welcomeText, dynamicStyles.welcomeText]}>Welcome back,</Text>
                            <Text style={[styles.userName, dynamicStyles.userName]}>
                                {user?.fullName || user?.username || 'Employee'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.notificationButton, dynamicStyles.notificationButton]}>
                        <MaterialIcons name="notifications" size={24} color={colors.textMain} />
                        <View style={styles.notificationBadge} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Quick Attendance Card */}
                    <View style={[styles.attendanceCard, dynamicStyles.attendanceCard]}>
                        <View style={styles.attendanceHeader}>
                            <View>
                                <Text style={[styles.attendanceTitle, dynamicStyles.attendanceTitle]}>
                                    Quick Attendance
                                </Text>
                                <Text style={[styles.attendanceSubtitle, dynamicStyles.attendanceSubtitle]}>
                                    Make sure to check in daily.
                                </Text>
                            </View>
                            {isCheckedIn && (
                                <View style={[styles.statusBadge, { backgroundColor: `${STATIC_COLORS.emerald}20` }]}>
                                    <View style={[styles.statusDot, { backgroundColor: STATIC_COLORS.emerald }]} />
                                    <Text style={[styles.statusText, { color: STATIC_COLORS.emerald }]}>
                                        Checked In
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.workingDuration}>
                            <View style={[styles.durationIcon, { backgroundColor: `${colors.primary}20` }]}>
                                <MaterialIcons name="timer" size={32} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.durationLabel, dynamicStyles.durationLabel]}>
                                    WORKING DURATION
                                </Text>
                                <Text style={[styles.durationValue, dynamicStyles.durationValue]}>{workingTime}</Text>
                            </View>
                        </View>

                        <View style={styles.timeGrid}>
                            <View style={[styles.timeCard, dynamicStyles.timeCard]}>
                                <Text style={[styles.timeLabel, dynamicStyles.timeLabel]}>Clock In</Text>
                                <Text style={[styles.timeValue, dynamicStyles.timeValue]}>{clockIn}</Text>
                            </View>
                            <View style={[styles.timeCard, dynamicStyles.timeCard]}>
                                <Text style={[styles.timeLabel, dynamicStyles.timeLabel]}>Est. Out</Text>
                                <Text style={[styles.timeValue, dynamicStyles.timeValue]}>{estimatedOut}</Text>
                            </View>
                        </View>

                        {isCheckedIn && (
                            <TouchableOpacity
                                style={[styles.checkOutButton, { backgroundColor: colors.primary }]}
                                onPress={handleCheckOut}
                            >
                                <MaterialIcons name="logout" size={20} color="#ffffff" />
                                <Text style={styles.checkOutButtonText}>Check Out</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Leave Balance */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Leave Balance</Text>
                            <TouchableOpacity>
                                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.leaveBalanceScroll}
                        >
                            {LEAVE_BALANCE.map((leave, index) => (
                                <View
                                    key={index}
                                    style={[styles.leaveCard, dynamicStyles.leaveCard]}
                                >
                                    <View
                                        style={[
                                            styles.leaveIconContainer,
                                            { backgroundColor: `${leave.color}20` },
                                        ]}
                                    >
                                        <MaterialIcons name={leave.icon as any} size={20} color={leave.color} />
                                    </View>
                                    <Text style={[styles.leaveType, dynamicStyles.leaveType]}>{leave.type}</Text>
                                    <Text style={[styles.leaveDays, dynamicStyles.leaveDays]}>{leave.days} Days</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Payroll Preview */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Payroll Preview</Text>
                        <View style={[styles.payrollCard, dynamicStyles.payrollCard]}>
                            <LinearGradient
                                colors={[`${colors.primary}10`, 'transparent']}
                                start={{ x: 1, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.payrollGradient}
                            />
                            <View style={styles.payrollContent}>
                                <View style={styles.payrollHeader}>
                                    <View>
                                        <Text style={[styles.payrollLabel, dynamicStyles.payrollLabel]}>
                                            Estimated Salary
                                        </Text>
                                        <Text style={[styles.payrollAmount, dynamicStyles.payrollAmount]}>
                                            $4,250.00
                                        </Text>
                                    </View>
                                    <View style={styles.payDateContainer}>
                                        <Text style={[styles.payDateLabel, dynamicStyles.payDateLabel]}>PAY DATE</Text>
                                        <Text style={[styles.payDateValue, { color: colors.primary }]}>Oct 30</Text>
                                    </View>
                                </View>
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressHeader}>
                                        <Text style={[styles.progressLabel, dynamicStyles.progressLabel]}>
                                            Monthly Cycle
                                        </Text>
                                        <Text style={[styles.progressDays, { color: colors.primary }]}>5 days left</Text>
                                    </View>
                                    <View style={[styles.progressBar, dynamicStyles.progressBar]}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { backgroundColor: colors.primary, width: '83%' },
                                            ]}
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.payslipLink}>
                                    <Text style={[styles.payslipLinkText, dynamicStyles.payslipLinkText]}>
                                        View Payslip History
                                    </Text>
                                    <MaterialIcons name="chevron-right" size={16} color={colors.textSub} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Announcements */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Announcements</Text>
                            <View style={[styles.newBadge, { backgroundColor: `${STATIC_COLORS.red}20` }]}>
                                <Text style={[styles.newBadgeText, { color: STATIC_COLORS.red }]}>2 New</Text>
                            </View>
                        </View>
                        <View style={styles.announcementsList}>
                            {ANNOUNCEMENTS.map((announcement) => (
                                <View
                                    key={announcement.id}
                                    style={[
                                        styles.announcementCard,
                                        dynamicStyles.announcementCard,
                                        announcement.isNew && { borderLeftColor: colors.primary },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.announcementIcon,
                                            {
                                                backgroundColor: announcement.isNew
                                                    ? `${colors.primary}20`
                                                    : isDark
                                                    ? colors.border
                                                    : '#f3f4f6',
                                            },
                                        ]}
                                    >
                                        <MaterialIcons
                                            name={announcement.icon as any}
                                            size={20}
                                            color={announcement.isNew ? colors.primary : colors.textSub}
                                        />
                                    </View>
                                    <View style={styles.announcementContent}>
                                        <View style={styles.announcementHeader}>
                                            <Text
                                                style={[styles.announcementTitle, dynamicStyles.announcementTitle]}
                                                numberOfLines={1}
                                            >
                                                {announcement.title}
                                            </Text>
                                            <Text style={[styles.announcementTime, dynamicStyles.announcementTime]}>
                                                {announcement.time}
                                            </Text>
                                        </View>
                                        <Text
                                            style={[styles.announcementMessage, dynamicStyles.announcementMessage]}
                                            numberOfLines={2}
                                        >
                                            {announcement.message}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Employee Bottom Tab Bar */}
                <EmployeeBottomTabBar activeTab="home" />

                {/* Side Menu */}
                <SideMenu
                    visible={isMenuVisible}
                    onClose={() => setMenuVisible(false)}
                />
            </SafeAreaView>
        </View>
    );
}

const STATIC_COLORS = {
    emerald: '#10b981',
    red: '#ef4444',
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0,
    },
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
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        overflow: 'hidden',
        borderWidth: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    attendanceCard: {
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    attendanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    attendanceTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    attendanceSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    workingDuration: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 8,
        marginBottom: 16,
    },
    durationIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    durationValue: {
        fontSize: 32,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        letterSpacing: -1,
    },
    timeGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    timeCard: {
        flex: 1,
        padding: 8,
        borderRadius: 8,
    },
    timeLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    checkOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    checkOutButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    section: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '500',
    },
    leaveBalanceScroll: {
        gap: 12,
        paddingHorizontal: 4,
    },
    leaveCard: {
        width: 144,
        height: 128,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    leaveIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    leaveType: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    leaveDays: {
        fontSize: 20,
        fontWeight: '700',
    },
    payrollCard: {
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    payrollGradient: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 128,
        height: 128,
        borderRadius: 64,
    },
    payrollContent: {
        position: 'relative',
        zIndex: 10,
    },
    payrollHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    payrollLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    payrollAmount: {
        fontSize: 24,
        fontWeight: '700',
    },
    payDateContainer: {
        alignItems: 'flex-end',
    },
    payDateLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    payDateValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    progressContainer: {
        marginTop: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    progressDays: {
        fontSize: 12,
        fontWeight: '500',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    payslipLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        gap: 4,
    },
    payslipLinkText: {
        fontSize: 14,
        fontWeight: '500',
    },
    newBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    announcementsList: {
        gap: 12,
    },
    announcementCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        gap: 12,
    },
    announcementIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    announcementContent: {
        flex: 1,
    },
    announcementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    announcementTitle: {
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    announcementTime: {
        fontSize: 10,
    },
    announcementMessage: {
        fontSize: 12,
        lineHeight: 18,
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.background,
        },
        header: {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
        },
        menuButton: {
            backgroundColor: isDark ? colors.border : '#f3f4f6',
        },
        avatarContainer: {
            borderColor: isDark ? colors.border : '#f0f0f0',
        },
        welcomeText: {
            color: colors.textSub,
        },
        userName: {
            color: colors.textMain,
        },
        notificationButton: {
            backgroundColor: isDark ? colors.border : '#f3f4f6',
        },
        attendanceCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        attendanceTitle: {
            color: colors.textMain,
        },
        attendanceSubtitle: {
            color: colors.textSub,
        },
        durationLabel: {
            color: colors.textSub,
        },
        durationValue: {
            color: colors.textMain,
        },
        timeCard: {
            backgroundColor: isDark ? colors.border : '#f9fafb',
        },
        timeLabel: {
            color: colors.textSub,
        },
        timeValue: {
            color: colors.textMain,
        },
        sectionTitle: {
            color: colors.textMain,
        },
        leaveCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        leaveType: {
            color: colors.textSub,
        },
        leaveDays: {
            color: colors.textMain,
        },
        payrollCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        payrollLabel: {
            color: colors.textSub,
        },
        payrollAmount: {
            color: colors.textMain,
        },
        payDateLabel: {
            color: colors.textSub,
        },
        progressBar: {
            backgroundColor: isDark ? colors.border : '#e5e7eb',
        },
        progressLabel: {
            color: colors.textSub,
        },
        payslipLink: {
            borderTopColor: colors.border,
        },
        payslipLinkText: {
            color: colors.textSub,
        },
        announcementCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        announcementTitle: {
            color: colors.textMain,
        },
        announcementTime: {
            color: colors.textSub,
        },
        announcementMessage: {
            color: colors.textSub,
        },
    });



