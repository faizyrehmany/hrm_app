import { MaterialIcons } from '@expo/vector-icons';
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
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import EmployeeBottomTabBar from '../components/EmployeeBottomTabBar';
import { LeaveModal } from '../components/LeaveModal';
import { useTheme } from '../contexts/ThemeContext';
import { fetchLeaveRequests } from '../services/leave';

const { width } = Dimensions.get('window');

// Mock leave balance data
const LEAVE_BALANCE = [
    { type: 'Annual Leave', icon: 'sunny', color: '#137fec', total: 20, left: 12, percentage: 60 },
    { type: 'Sick Leave', icon: 'medication', color: '#ef4444', total: 7, left: 5, percentage: 71 },
    { type: 'Casual Leave', icon: 'event-seat', color: '#8b5cf6', total: 5, left: 2, percentage: 40 },
];

// Mock recent applications


// Mock leave data - in real app, this would come from API
// Format: 'YYYY-MM-DD': 'status'
const getMockLeaveData = (year: number, month: number): { [key: string]: string } => {
    const monthStr = String(month + 1).padStart(2, '0');
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();


    // Only add mock data for current month for demo purposes
    if (year === currentYear && month === currentMonth) {
        return {
            [`${year}-${monthStr}-${String(Math.min(currentDate + 2, 28)).padStart(2, '0')}`]: 'approved',
            [`${year}-${monthStr}-${String(Math.min(currentDate + 3, 28)).padStart(2, '0')}`]: 'approved',
            [`${year}-${monthStr}-${String(Math.min(currentDate + 5, 28)).padStart(2, '0')}`]: 'pending',
            [`${year}-${monthStr}-${String(Math.min(currentDate + 8, 28)).padStart(2, '0')}`]: 'holiday',
        };
    }

    // For other months, you can add sample data
    // For example, for January 2024:
    if (year === 2024 && month === 0) {
        return {
            '2024-01-04': 'approved',
            '2024-01-05': 'approved',
            '2024-01-12': 'pending',
            '2024-01-15': 'holiday',
        };
    }

    return {};
};

// Get current date for comparison
const getTodayDate = () => {
    const today = new Date();
    return {
        year: today.getFullYear(),
        month: today.getMonth(),
        date: today.getDate(),
    };
};

export default function EmployeeLeavesScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const today = getTodayDate();

    const [recentApplications, setRecentApplications] = useState<any[]>([]);
    const [isLeaveModalVisible, setLeaveModalVisible] = useState(false);
    const [showAllApplications, setShowAllApplications] = useState(false);

    useEffect(() => {
        fetchLeaveRequests().then((applications) => {
            setRecentApplications(applications);
        });
    }, []);

    const dynamicStyles = createDynamicStyles(colors, isDark);

    const formatMonthYear = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const handlePreviousMonth = () => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentMonth(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentMonth(newDate);
    };

    // Generate calendar days dynamically for the current month
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // Get first day of the month
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Get number of days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get mock leave data for this month
        const mockLeaveData = getMockLeaveData(year, month);

        // Create array for calendar
        const calendarDays: Array<{ day: number | null; status: string }> = [];

        // Add empty slots for days before the first day of the month
        // If first day is Sunday (0), no empty slots needed
        // If first day is Monday (1), add 1 empty slot for Sunday, etc.
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarDays.push({ day: null, status: 'empty' });
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Check if it's today
            const isToday =
                year === today.year &&
                month === today.month &&
                day === today.date;

            // Get status from mock data or default to 'normal'
            let status = mockLeaveData[dateKey] || 'normal';

            // Override with 'today' if it's today
            if (isToday) {
                status = 'today';
            }

            calendarDays.push({ day, status });
        }

        // Ensure we have a complete grid (multiple of 7 for proper alignment)
        // Add empty slots at the end if needed to complete the last row
        const totalSlots = calendarDays.length;
        const remainingSlots = totalSlots % 7;
        if (remainingSlots !== 0) {
            const slotsToAdd = 7 - remainingSlots;
            for (let i = 0; i < slotsToAdd; i++) {
                calendarDays.push({ day: null, status: 'empty' });
            }
        }

        return calendarDays;
    };

    const calendarDays = generateCalendarDays();

    const getDayStatusStyle = (status: string) => {
        switch (status) {
            case 'approved':
                return {
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    borderRadius: 20,
                };
            case 'pending':
                return {
                    backgroundColor: '#fbbf24',
                    color: '#000000',
                    borderRadius: 20,
                };
            case 'holiday':
                return {
                    backgroundColor: isDark ? '#374151' : '#e5e7eb',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    borderRadius: 20,
                };
            case 'today':
                return {
                    backgroundColor: 'transparent',
                    color: colors.primary,
                    borderWidth: 2,
                    borderColor: colors.primary,
                    borderRadius: 20,
                };
            default:
                return {
                    backgroundColor: 'transparent',
                    color: isDark ? '#e5e7eb' : '#111827',
                    borderRadius: 20,
                };
        }
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={[styles.header, dynamicStyles.header]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>My Leaves</Text>
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
                    {/* Leave Balance Section */}
                    {/* <View style={styles.balanceSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Leave Balance</Text>
                            <TouchableOpacity>
                                <Text style={[styles.viewPolicyText, { color: colors.primary }]}>View Policy</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.balanceScroll}
                        >
                            {LEAVE_BALANCE.map((leave, index) => (
                                <View key={index} style={[styles.balanceCard, dynamicStyles.balanceCard]}>
                                    <View style={styles.balanceCardHeader}>
                                        <View style={styles.balanceCardLeft}>
                                            <View style={[styles.balanceIcon, { backgroundColor: `${leave.color}20` }]}>
                                                <MaterialIcons name={leave.icon as any} size={24} color={leave.color} />
                                            </View>
                                            <Text style={[styles.balanceType, dynamicStyles.balanceType]}>{leave.type}</Text>
                                        </View>
                                        <Text style={[styles.balanceTotal, dynamicStyles.balanceTotal]}>
                                            {leave.total} days total
                                        </Text>
                                    </View>
                                    <View style={styles.balanceCardContent}>
                                        <View style={styles.balanceDaysRow}>
                                            <Text style={[styles.balanceDays, dynamicStyles.balanceDays]}>{leave.left}</Text>
                                            <Text style={[styles.balanceDaysLabel, dynamicStyles.balanceDaysLabel]}>days left</Text>
                                        </View>
                                        <View style={[styles.progressBar, dynamicStyles.progressBar]}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    { backgroundColor: leave.color, width: `${leave.percentage}%` },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))}

                        </ScrollView>
                    </View> */}

                    {/* Calendar Section */}
                    {/* <View style={styles.calendarSection}>
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Leave Calendar</Text>
                        <View style={[styles.calendarCard, dynamicStyles.calendarCard]}> */}
                    {/* Month Navigator */}
                    {/* <View style={styles.monthNavigator}>
                                <TouchableOpacity
                                    style={[styles.navButton, dynamicStyles.navButton]}
                                    onPress={handlePreviousMonth}
                                >
                                    <MaterialIcons name="chevron-left" size={20} color={colors.textSub} />
                                </TouchableOpacity>
                                <Text style={[styles.monthText, dynamicStyles.monthText]}>{formatMonthYear(currentMonth)}</Text>
                                <TouchableOpacity
                                    style={[styles.navButton, dynamicStyles.navButton]}
                                    onPress={handleNextMonth}
                                >
                                    <MaterialIcons name="chevron-right" size={20} color={colors.textSub} />
                                </TouchableOpacity>
                            </View> */}

                    {/* Days Header */}
                    {/* <View style={styles.daysHeader}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                    <Text key={index} style={[styles.dayHeader, dynamicStyles.dayHeader]}>
                                        {day}
                                    </Text>
                                ))}
                            </View> */}

                    {/* Calendar Grid */}
                    {/* <View style={styles.calendarGrid}> */}
                    {/* Days */}
                    {/* {calendarDays.map((item, index) => {
                                    // Render empty slot
                                    if (item.day === null) {
                                        return (
                                            <View
                                                key={`empty-${index}`}
                                                style={styles.calendarDayEmpty}
                                            />
                                        );
                                    } */}

                    {/* const dayStyle = getDayStatusStyle(item.status);
                                    const isHighlighted = item.status === 'approved' || item.status === 'pending' || item.status === 'holiday' || item.status === 'today';
                                    return (
                                        <TouchableOpacity
                                            key={`day-${item.day}-${index}`}
                                            style={[
                                                styles.calendarDay,
                                                {
                                                    backgroundColor: dayStyle.backgroundColor || 'transparent',
                                                    borderWidth: item.status === 'today' ? 2 : 0,
                                                    borderColor: item.status === 'today' ? dayStyle.borderColor : 'transparent',
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.calendarDayText,
                                                    {
                                                        color: dayStyle.color || (isDark ? '#e5e7eb' : '#111827'),
                                                        fontWeight: isHighlighted ? '700' : '500',
                                                    },
                                                ]}
                                            >
                                                {item.day}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View> */}

                    {/* Legend */}
                    {/* <View style={styles.legend}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: STATIC_COLORS.emerald }]} />
                                    <Text style={[styles.legendText, dynamicStyles.legendText]}>Approved</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: STATIC_COLORS.amber }]} />
                                    <Text style={[styles.legendText, dynamicStyles.legendText]}>Pending</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: isDark ? '#374151' : '#cbd5e1' }]} />
                                    <Text style={[styles.legendText, dynamicStyles.legendText]}>Holiday</Text>
                                </View>
                            </View> */}
                    {/* </View>
                    </View> */}

                    {/* Recent Applications */}
                    <View style={styles.applicationsSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Recent Applications</Text>
                            {recentApplications.length > 3 && (
                                <TouchableOpacity onPress={() => setShowAllApplications(!showAllApplications)}>
                                    <Text style={{ color: colors.primary, fontWeight: '700' }}>
                                        {showAllApplications ? 'Show Less' : 'View All'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.applicationsList}>
                            {(showAllApplications ? recentApplications : recentApplications.slice(0, 3)).map((app) => (
                                <View
                                    key={app.leaveId}
                                    style={[
                                        styles.applicationCard,
                                        dynamicStyles.applicationCard,
                                        app.opacity && { opacity: app.opacity },
                                    ]}
                                >
                                    <View style={styles.applicationLeft}>
                                        <View
                                            style={[
                                                styles.applicationDateBox,
                                                { backgroundColor: `${app.iconColor}20`, borderColor: `${app.iconColor}40` },
                                            ]}
                                        >
                                            <Text style={[styles.applicationMonth, { color: app.iconColor }]}>{app.month}</Text>
                                            <Text style={[styles.applicationDay, { color: app.iconColor }]}>{app.day}</Text>
                                        </View>
                                        <View style={styles.applicationInfo}>
                                            <Text style={[styles.applicationType, dynamicStyles.applicationType]}>{app.type}</Text>
                                            <Text style={[styles.applicationDetails, dynamicStyles.applicationDetails]}>{app.details}</Text>
                                            <Text style={[styles.applicationDates, dynamicStyles.applicationDetails]}>
                                                {app.startDate} - {app.endDate}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: `${app.statusColor}20` }]}>
                                        <Text style={[styles.statusBadgeText, { color: app.statusColor }]}>{app.status}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>


                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={() => setLeaveModalVisible(true)}
                >
                    <MaterialIcons name="add" size={32} color="#ffffff" />
                </TouchableOpacity>

                {/* Employee Bottom Tab Bar */}
                <EmployeeBottomTabBar activeTab="leaves" />
                <LeaveModal
                    visible={isLeaveModalVisible}
                    onClose={() => setLeaveModalVisible(false)}
                    onSubmit={(newLeave) => {
                        const start = newLeave.startDate ? new Date(newLeave.startDate) : new Date();
                        const end = newLeave.endDate ? new Date(newLeave.endDate) : start;

                        // Calculate total days (inclusive)
                        const timeDiff = end.getTime() - start.getTime();
                        const dayCount = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;

                        const formattedLeave = {
                            leaveId: newLeave.leaveId,
                            month: start.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
                            day: start.getDate(),
                            type: newLeave.leaveType || 'Leave',
                            details: `${dayCount} Day${dayCount > 1 ? 's' : ''} • ${newLeave.reason || ''}`,
                            status: newLeave.status,
                            statusColor: '#fbbf24',
                            iconColor: '#fbbf24',
                        };

                        setRecentApplications((prev) => [formattedLeave, ...prev]);
                    }}
                />
            </SafeAreaView>
        </View>
    );
}

const STATIC_COLORS = {
    emerald: '#10b981',
    amber: '#fbbf24',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
    balanceSection: {
        marginTop: 24,
        gap: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    viewPolicyText: {
        fontSize: 14,
        fontWeight: '500',
    },
    balanceScroll: {
        paddingHorizontal: 20,
        gap: 16,
    },
    balanceCard: {
        width: width - 80,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        gap: 16,
    },
    balanceCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    balanceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceType: {
        fontSize: 16,
        fontWeight: '600',
    },
    balanceTotal: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'right',
        flexShrink: 0,
    },
    balanceCardContent: {
        gap: 8,
    },
    balanceDaysRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
    },
    balanceDays: {
        fontSize: 32,
        fontWeight: '700',
    },
    balanceDaysLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    calendarSection: {
        marginTop: 32,
        paddingHorizontal: 16,
        gap: 16,
    },
    calendarCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    monthNavigator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    navButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthText: {
        fontSize: 16,
        fontWeight: '700',
    },
    daysHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    dayHeader: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
    },
    calendarDay: {
        width: '14.28%', // 100 / 7 = 14.2857...
        minHeight: 40,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    calendarDayEmpty: {
        width: '14.28%', // 100 / 7 = 14.2857...
        minHeight: 40,
        paddingVertical: 8,
    },
    calendarDayText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
        lineHeight: 20,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '500',
    },
    applicationsSection: {
        marginTop: 32,
        paddingHorizontal: 20,
        gap: 16,
    },
    applicationsList: {
        gap: 12,
    },
    applicationCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    applicationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    applicationDateBox: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    applicationMonth: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    applicationDay: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 2,
    },
    applicationInfo: {
        flex: 1,
        gap: 4,
    },
    applicationType: {
        fontSize: 16,
        fontWeight: '700',
    },
    applicationDetails: {
        fontSize: 12,
    },

    applicationDates: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },

    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 40,
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
        headerTitle: {
            color: colors.textMain,
        },
        notificationButton: {
            backgroundColor: isDark ? colors.border : '#f3f4f6',
        },
        sectionTitle: {
            color: colors.textMain,
        },
        balanceCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        balanceType: {
            color: colors.textMain,
        },
        balanceTotal: {
            color: colors.textSub,
        },
        balanceDays: {
            color: colors.textMain,
        },
        balanceDaysLabel: {
            color: colors.textSub,
        },
        progressBar: {
            backgroundColor: isDark ? colors.border : '#f1f5f9',
        },
        calendarCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        navButton: {
            backgroundColor: isDark ? colors.border : '#f3f4f6',
        },
        monthText: {
            color: colors.textMain,
        },
        dayHeader: {
            color: colors.textSub,
        },
        legend: {
            borderTopColor: colors.border,
        },
        legendText: {
            color: colors.textSub,
        },
        applicationCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        applicationType: {
            color: colors.textMain,
        },
        applicationDetails: {
            color: colors.textSub,
        },
    });



