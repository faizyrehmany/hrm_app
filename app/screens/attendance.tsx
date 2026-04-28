import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    StatusBar as NativeStatusBar,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import AttendanceTable from '../components/AttendanceTable';
import EmployeeBottomTabBar from '../components/EmployeeBottomTabBar';
import EmployeeHeader from '../components/EmployeeHeader';
import SideMenu from '../components/SideMenu';
import { useTheme } from '../contexts/ThemeContext';
import { AttendanceManager, SessionManager, User } from '../services/SessionManager';

const { width } = Dimensions.get('window');



// Office hours: 9 AM - 6 PM
const OFFICE_START_HOUR = 9;
const OFFICE_END_HOUR = 18;

export default function AttendanceScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [user, setUser] = useState<User | null>(null);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [clockIn, setClockIn] = useState<string>('--:--');
    const [estimatedOut, setEstimatedOut] = useState<string>('06:00 PM');
    const [logs, setLogs] = useState<any[]>([]);
    const [isMenuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        loadUser();
        loadAttendanceStatus();
    }, []);

    useEffect(() => {
        if (isCheckedIn && checkInTime) {
            // Timer update based on actual check-in time
            const interval = setInterval(() => {
                const now = new Date();
                const diff = now.getTime() - checkInTime.getTime();
                const totalSeconds = Math.floor(diff / 1000);
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;
                setHours(h);
                setMinutes(m);
                setSeconds(s);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isCheckedIn, checkInTime]);

    const loadUser = async () => {
        const userData = await SessionManager.getUser();
        setUser(userData);
    };


    const loadAttendanceStatus = async () => {
        const todayAttendance = await AttendanceManager.getTodayAttendance();
        if (todayAttendance) {
            setIsCheckedIn(todayAttendance.isCheckedIn || false);
            if (todayAttendance.checkInTime) {
                setCheckInTime(todayAttendance.checkInTime);
                const checkInDate = todayAttendance.checkInTime;
                const checkInHour = checkInDate.getHours();
                const checkInMin = checkInDate.getMinutes();
                const ampm = checkInHour >= 12 ? 'PM' : 'AM';
                const displayHour = checkInHour > 12 ? checkInHour - 12 : checkInHour === 0 ? 12 : checkInHour;
                setClockIn(`${String(displayHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')} ${ampm}`);

                // Calculate estimated checkout (9 hours from check-in)
                const estimatedCheckOut = new Date(checkInDate);
                estimatedCheckOut.setHours(estimatedCheckOut.getHours() + 9);
                const outHour = estimatedCheckOut.getHours();
                const outMin = estimatedCheckOut.getMinutes();
                const outAmpm = outHour >= 12 ? 'PM' : 'AM';
                const outDisplayHour = outHour > 12 ? outHour - 12 : outHour === 0 ? 12 : outHour;
                setEstimatedOut(`${String(outDisplayHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')} ${outAmpm}`);
            }
        } else {
            // Set default office hours
            setClockIn('09:00 AM');
            setEstimatedOut('06:00 PM');
        }
    };

    const handleCheckIn = async () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        // Check if late (after 9:30 AM)
        const isLate = currentHour > OFFICE_START_HOUR || (currentHour === OFFICE_START_HOUR && currentMin > 30);

        await AttendanceManager.saveCheckIn(now);
        setCheckInTime(now);
        setIsCheckedIn(true);

        // Format check-in time
        const ampm = currentHour >= 12 ? 'PM' : 'AM';
        const displayHour = currentHour > 12 ? currentHour - 12 : currentHour === 0 ? 12 : currentHour;
        setClockIn(`${String(displayHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')} ${ampm}`);

        // Calculate estimated checkout (9 hours from check-in)
        const estimatedCheckOut = new Date(now);
        estimatedCheckOut.setHours(estimatedCheckOut.getHours() + 9);
        const outHour = estimatedCheckOut.getHours();
        const outMin = estimatedCheckOut.getMinutes();
        const outAmpm = outHour >= 12 ? 'PM' : 'AM';
        const outDisplayHour = outHour > 12 ? outHour - 12 : outHour === 0 ? 12 : outHour;
        setEstimatedOut(`${String(outDisplayHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')} ${outAmpm}`);

        // Reset timer
        setHours(0);
        setMinutes(0);
        setSeconds(0);
    };

    const handleCheckOut = async () => {
        const now = new Date();
        await AttendanceManager.saveCheckOut(now);
        setIsCheckedIn(false);
        setCheckInTime(null);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
    };

    const handleRegularize = () => {
        router.push('/screens/regularize_request');
    };

    const handleOvertimeRequest = () => {
        router.push('/screens/overtime_request');
    };

    const dynamicStyles = createDynamicStyles(colors, isDark);

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <EmployeeHeader
                    user={user}
                    title="Attendance & Time"
                    onMenuPress={() => setMenuVisible(true)}
                    onNotificationPress={() => console.log("Notifications pressed")}
                />
                <SideMenu visible={isMenuVisible} onClose={() => setMenuVisible(false)} />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Section: Timer & Check In */}
                    <View style={styles.heroSection}>
                        {/* Date & Shift Info */}
                        {/* <View style={styles.dateShiftInfo}>
                            <Text style={[styles.dateLabel, dynamicStyles.dateLabel]}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </Text>
                            <Text style={[styles.shiftText, dynamicStyles.shiftText]}>Shift: 09:00 AM - 06:00 PM</Text>
                        </View> */}

                        {/* Timer Circle Visual */}
                        {/* {isCheckedIn && (
                            <View style={styles.timerContainer}>
                                <View style={[styles.timerRing, dynamicStyles.timerRing]} />
                                <View style={[styles.timerCircle, dynamicStyles.timerCircle]}> */}
                        {/* Timer Digits */}
                        {/* <View style={styles.timerDigits}>
                                        <View style={styles.timerUnit}>
                                            <Text style={[styles.timerValue, dynamicStyles.timerValue]}>{String(hours).padStart(2, '0')}</Text>
                                            <Text style={[styles.timerLabel, dynamicStyles.timerLabel]}>Hrs</Text>
                                        </View>
                                        <Text style={[styles.timerSeparator, dynamicStyles.timerSeparator]}>:</Text>
                                        <View style={styles.timerUnit}>
                                            <Text style={[styles.timerValue, dynamicStyles.timerValue]}>{String(minutes).padStart(2, '0')}</Text>
                                            <Text style={[styles.timerLabel, dynamicStyles.timerLabel]}>Min</Text>
                                        </View>
                                        <Text style={[styles.timerSeparator, dynamicStyles.timerSeparator]}>:</Text>
                                        <View style={styles.timerUnit}>
                                            <Text style={[styles.timerValue, { color: colors.primary }]}>{String(seconds).padStart(2, '0')}</Text>
                                            <Text style={[styles.timerLabel, { color: colors.primary }]}>Sec</Text>
                                        </View>
                                    </View> */}

                        {/* Status Text */}
                        {/* <View style={[styles.statusBadge, { backgroundColor: `${STATIC_COLORS.emerald}20` }]}>
                                        <View style={[styles.statusDot, { backgroundColor: STATIC_COLORS.emerald }]} />
                                        <Text style={[styles.statusText, { color: STATIC_COLORS.emerald }]}>ON SHIFT</Text>
                                    </View>
                                </View>
                            </View> */}
                        {/* )} */}

                        {/* Verification Chips */}
                        {/* <View style={styles.verificationChips}>
                            <View style={[styles.verificationChip, dynamicStyles.verificationChip]}>
                                <MaterialIcons name="verified-user" size={18} color={STATIC_COLORS.emerald} />
                                <Text style={[styles.verificationText, dynamicStyles.verificationText]}>Selfie Verified</Text>
                            </View>
                            <View style={[styles.verificationChip, dynamicStyles.verificationChip]}>
                                <MaterialIcons name="location-on" size={18} color={colors.primary} />
                                <Text style={[styles.verificationText, dynamicStyles.verificationText]}>Location Active</Text>
                            </View>
                        </View> */}

                        {/* Main Action Button */}
                        {/* {isCheckedIn ? (
                            <TouchableOpacity
                                style={[styles.checkOutButton, { shadowColor: colors.primary }]}
                                onPress={handleCheckOut}
                            >
                                <LinearGradient
                                    colors={[colors.primary, '#2563eb']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.checkOutGradient}
                                >
                                    <MaterialIcons name="logout" size={24} color="#ffffff" />
                                    <Text style={styles.checkOutButtonText}>CHECK OUT</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.checkInButton, { shadowColor: STATIC_COLORS.emerald }]}
                                onPress={handleCheckIn}
                            >
                                <LinearGradient
                                    colors={[STATIC_COLORS.emerald, '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.checkOutGradient}
                                >
                                    <MaterialIcons name="login" size={24} color="#ffffff" />
                                    <Text style={styles.checkOutButtonText}>CHECK IN</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )} */}
                    </View>

                    {/* Quick Actions Grid */}
                    {/* <View style={styles.quickActionsGrid}>
                        <TouchableOpacity
                            style={[styles.quickActionCard, dynamicStyles.quickActionCard]}
                            onPress={handleRegularize}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: `${STATIC_COLORS.orange}20` }]}>
                                <MaterialIcons name="edit-calendar" size={24} color={STATIC_COLORS.orange} />
                            </View>
                            <Text style={[styles.quickActionText, dynamicStyles.quickActionText]}>Regularize</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionCard, dynamicStyles.quickActionCard]}
                            onPress={handleOvertimeRequest}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: `${STATIC_COLORS.purple}20` }]}>
                                <MaterialIcons name="av-timer" size={24} color={STATIC_COLORS.purple} />
                            </View>
                            <Text style={[styles.quickActionText, dynamicStyles.quickActionText]}>Request Overtime</Text>
                        </TouchableOpacity>
                    </View> */}

                    <View style={styles.pageWrapper}>
                        <AttendanceTable
                            colors={colors}
                            isDark={isDark}
                        />
                    </View>

                    {/* Attendance History */}
                    {/* <View style={styles.historySection}>
                        <View style={styles.historyHeader}>
                            <Text style={[styles.historyTitle, dynamicStyles.historyTitle]}>Recent Activity</Text>
                            <TouchableOpacity>
                                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                            </TouchableOpacity>
                        </View> */}

                    {/* <View style={styles.historyList}>
                            {ATTENDANCE_HISTORY.map((item) => (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.historyItem,
                                        dynamicStyles.historyItem,
                                        { borderLeftColor: item.borderColor, opacity: item.opacity || 1 },
                                    ]}
                                >
                                    <View style={styles.historyItemLeft}>
                                        <View style={[styles.historyDateBox, dynamicStyles.historyDateBox]}>
                                            <Text style={[styles.historyMonth, dynamicStyles.historyMonth]}>{item.month}</Text>
                                            <Text style={[styles.historyDate, dynamicStyles.historyDate]}>{item.date}</Text>
                                        </View>
                                        <View style={styles.historyItemInfo}>
                                            {item.checkIn ? (
                                                <>
                                                    <View style={styles.historyTimeRow}>
                                                        <MaterialIcons name="login" size={16} color={colors.textSub} />
                                                        <Text style={[styles.historyTime, dynamicStyles.historyTime]}>{item.checkIn}</Text>
                                                    </View>
                                                    <View style={styles.historyTimeRow}>
                                                        <MaterialIcons
                                                            name={item.checkOut ? 'logout' : 'logout'}
                                                            size={16}
                                                            color={item.checkOut ? colors.textSub : 'transparent'}
                                                        />
                                                        <Text
                                                            style={[
                                                                styles.historyTime,
                                                                dynamicStyles.historyTime,
                                                                !item.checkOut && { color: colors.textSub },
                                                            ]}
                                                        >
                                                            {item.checkOut || '--:-- PM'}
                                                        </Text>
                                                    </View>
                                                </>
                                            ) : (
                                                <Text style={[styles.noPunchText, dynamicStyles.noPunchText]}>No punch recorded</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.historyItemRight}>
                                        <View style={[styles.statusChip, { backgroundColor: `${item.statusColor}20` }]}>
                                            <Text style={[styles.statusChipText, { color: item.statusColor }]}>{item.status}</Text>
                                        </View>
                                        <Text style={[styles.durationText, dynamicStyles.durationText]}>{item.duration}</Text>
                                    </View>
                                </View>
                            ))}
                        </View> */}
                    {/* </View> */}

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Employee Bottom Tab Bar */}
                <EmployeeBottomTabBar activeTab="attendance" />
            </SafeAreaView>
            <SideMenu
                visible={isMenuVisible}
                onClose={() => setMenuVisible(false)}
            />
        </View>
    );
}

const STATIC_COLORS = {
    emerald: '#10b981',
    orange: '#f59e0b',
    purple: '#8b5cf6',
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
        flex: 1,
        textAlign: 'center',
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
        paddingBottom: 20,
    },
    heroSection: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 8,
        paddingHorizontal: 16,
    },
    dateShiftInfo: {
        alignItems: 'center',
        marginBottom: 24,
        gap: 4,
    },
    dateLabel: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    shiftText: {
        fontSize: 16,
        fontWeight: '600',
    },

    pageWrapper: {
        flex: 1,
        paddingHorizontal: 16,   // 👈 mobile spacing
        width: '100%',
        maxWidth: 1400,          // 👈 desktop centered layout
        alignSelf: 'center',
        marginBottom: 24,     // 👈 prevents wall sticking on large screens
    },

    timerContainer: {
        position: 'relative',
        marginBottom: 32,
    },
    timerRing: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        opacity: 0.1,
    },
    timerCircle: {
        width: 256,
        height: 256,
        borderRadius: 128,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    timerDigits: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        marginBottom: 8,
    },
    timerUnit: {
        width: 64,
        alignItems: 'center',
    },
    timerValue: {
        fontSize: 36,
        fontWeight: '700',
        letterSpacing: -1,
    },
    timerLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    timerSeparator: {
        fontSize: 24,
        fontWeight: '700',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginTop: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    verificationChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
        width: '100%',
    },
    verificationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    verificationText: {
        fontSize: 12,
        fontWeight: '500',
    },
    checkOutButton: {
        width: '100%',
        maxWidth: 320,
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    checkInButton: {
        width: '100%',
        maxWidth: 320,
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    checkOutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
    },
    checkOutButtonText: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
        color: '#ffffff',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    quickActionCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    historySection: {
        paddingHorizontal: 16,
        gap: 16,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '500',
    },
    historyList: {
        gap: 12,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    historyItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    historyDateBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyMonth: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    historyDate: {
        fontSize: 14,
        fontWeight: '700',
    },
    historyItemInfo: {
        flex: 1,
        gap: 4,
    },
    historyTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    historyTime: {
        fontSize: 14,
        fontWeight: '500',
    },
    noPunchText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    historyItemRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    statusChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusChipText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    durationText: {
        fontSize: 12,
        fontWeight: '500',
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.background,
        },
        header: {
            backgroundColor: isDark ? 'rgba(26, 38, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderBottomColor: colors.border,
        },
        avatarContainer: {
            borderColor: `${colors.primary}33`,
        },
        headerTitle: {
            color: colors.textMain,
        },
        notificationButton: {
            backgroundColor: isDark ? colors.border : '#f3f4f6',
        },
        dateLabel: {
            color: colors.textSub,
        },
        shiftText: {
            color: colors.textMain,
        },
        timerRing: {
            backgroundColor: colors.primary,
        },
        timerCircle: {
            backgroundColor: colors.surface,
            borderColor: colors.surface,
        },
        timerValue: {
            color: colors.textMain,
        },
        timerLabel: {
            color: colors.textSub,
        },
        timerSeparator: {
            color: isDark ? colors.borderDark : '#cbd5e1',
        },
        verificationChip: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        verificationText: {
            color: colors.textMain,
        },
        quickActionCard: {
            backgroundColor: colors.surface,
            borderColor: 'transparent',
        },
        quickActionText: {
            color: colors.textMain,
        },
        historyTitle: {
            color: colors.textMain,
        },
        historyItem: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        historyDateBox: {
            backgroundColor: isDark ? colors.border : '#f9fafb',
        },
        historyMonth: {
            color: colors.textSub,
        },
        historyDate: {
            color: colors.textMain,
        },
        historyTime: {
            color: colors.textMain,
        },
        noPunchText: {
            color: colors.textSub,
        },
        durationText: {
            color: colors.textSub,
        },
    });



