import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { useTheme } from '../contexts/ThemeContext';
import { SessionManager } from '../services/SessionManager';
import { formatMoney, formatMonthYear, listPayslipsForEmployee, Payslip } from '../services/payroll';

export default function EmployeePayrollScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();

    const dynamicStyles = createDynamicStyles(colors, isDark);

    const [slips, setSlips] = useState<Payslip[]>([]);

    useEffect(() => {
        const init = async () => {
            const user = await SessionManager.getUser();
            const employeeId = user?.id != null ? String(user.id) : '';
            if (!employeeId) {
                setSlips([]);
                return;
            }
            const list = await listPayslipsForEmployee(employeeId);
            setSlips(list);
        };
        init();
    }, []);

    const latestSlip = slips[0];
    const currencySymbol = latestSlip?.currencySymbol || '₨';
    const lastSalaryText = latestSlip ? formatMoney(latestSlip.totals.netPay, currencySymbol) : `${currencySymbol}0.00`;
    const lastPaymentDateText = latestSlip
        ? new Date(latestSlip.payDateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

    const handleViewSlip = (slip: Payslip) => {
        router.push({
            pathname: '/screens/salary_slip',
            params: {
                payslipId: slip.id,
            },
        } as any);
    };

    const handleBreakdown = () => {
        // Navigate to breakdown or show modal
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
                    <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>My Payroll</Text>
                    <TouchableOpacity style={styles.iconButton}>
                        <MaterialIcons name="settings" size={24} color={colors.textMain} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Summary Card */}
                    <View style={styles.summaryCard}>
                        <LinearGradient
                            colors={[colors.primary, '#2563eb']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.summaryGradient}
                        >
                            {/* Decorative Circles */}
                            <View style={styles.decorativeCircle1} />
                            <View style={styles.decorativeCircle2} />

                            <View style={styles.summaryContent}>
                                <View style={styles.summaryTop}>
                                    <View style={styles.summaryLeft}>
                                        <Text style={styles.summaryLabel}>Last Salary</Text>
                                        <View style={styles.summaryAmountRow}>
                                            <Text style={styles.summaryAmount}>{lastSalaryText}</Text>
                                            <TouchableOpacity style={styles.visibilityButton}>
                                                <MaterialIcons name="visibility" size={20} color="rgba(255,255,255,0.7)" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.statusBadge}>
                                        <Text style={styles.statusBadgeText}>{latestSlip ? 'Transferred' : 'No Data'}</Text>
                                    </View>
                                </View>

                                <View style={styles.summaryDivider} />

                                <View style={styles.summaryBottom}>
                                    <View style={styles.paymentDateContainer}>
                                        <Text style={styles.paymentDateLabel}>Payment Date</Text>
                                        <Text style={styles.paymentDateValue}>{lastPaymentDateText}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.breakdownButton} onPress={handleBreakdown}>
                                        <Text style={styles.breakdownButtonText}>Breakdown</Text>
                                        <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* List Header */}
                    <View style={styles.listHeader}>
                        <Text style={[styles.listTitle, dynamicStyles.listTitle]}>Salary History</Text>
                        <TouchableOpacity style={styles.filterButton}>
                            <MaterialIcons name="filter-list" size={20} color={colors.primary} />
                            <Text style={[styles.filterText, { color: colors.primary }]}>Filter</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Salary History List */}
                    <View style={styles.historyList}>
                        {slips.map((slip) => {
                            const month = formatMonthYear(slip.periodYear, slip.periodMonth);
                            const amount = formatMoney(slip.totals.netPay, slip.currencySymbol || '₨');
                            const paymentDate = new Date(slip.payDateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            return (
                            <View key={slip.id} style={[styles.historyItem, dynamicStyles.historyItem]}>
                                <View style={styles.historyItemLeft}>
                                    <View
                                        style={[
                                            styles.historyIcon,
                                            {
                                                backgroundColor: isDark ? `${colors.primary}33` : '#eaf4fe',
                                            },
                                        ]}
                                    >
                                        <MaterialIcons
                                            name={'receipt-long' as any}
                                            size={24}
                                            color={colors.primary}
                                        />
                                    </View>
                                    <View style={styles.historyItemInfo}>
                                        <View style={styles.historyItemTop}>
                                            <Text style={[styles.historyMonth, dynamicStyles.historyMonth]}>{month}</Text>
                                            <Text style={[styles.historyAmount, dynamicStyles.historyAmount]}>{amount}</Text>
                                        </View>
                                        <View style={styles.historyItemBottom}>
                                            <View style={styles.historyStatusRow}>
                                                <View
                                                    style={[
                                                        styles.statusChip,
                                                        {
                                                            backgroundColor: `${STATIC_COLORS.emerald}20`,
                                                            borderColor: `${STATIC_COLORS.emerald}40`,
                                                        },
                                                    ]}
                                                >
                                                    <View
                                                        style={[
                                                            styles.statusDot,
                                                            {
                                                                backgroundColor: STATIC_COLORS.emerald,
                                                            },
                                                        ]}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.statusChipText,
                                                            {
                                                                color: STATIC_COLORS.emerald,
                                                            },
                                                        ]}
                                                    >
                                                        Paid
                                                    </Text>
                                                </View>
                                                <Text style={[styles.paymentDateText, dynamicStyles.paymentDateText]}>
                                                    {paymentDate}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.viewSlipButton}
                                                onPress={() => handleViewSlip(slip)}
                                            >
                                                <MaterialIcons name="visibility" size={18} color={colors.primary} />
                                                <Text style={[styles.viewSlipText, { color: colors.primary }]}>
                                                    View Slip
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )})}

                        {slips.length === 0 && (
                            <View style={[styles.emptyState, dynamicStyles.historyItem]}>
                                <Text style={[styles.emptyTitle, dynamicStyles.historyMonth]}>No payroll yet</Text>
                                <Text style={[styles.emptySub, dynamicStyles.paymentDateText]}>
                                    Once admin processes payroll for a month, your payslips will appear here.
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Employee Bottom Tab Bar */}
                <EmployeeBottomTabBar activeTab="home" />
            </SafeAreaView>
        </View>
    );
}

const STATIC_COLORS = {
    emerald: '#10b981',
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
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    summaryCard: {
        margin: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    summaryGradient: {
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        right: -24,
        top: -24,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -24,
        left: -24,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    summaryContent: {
        position: 'relative',
        zIndex: 10,
        gap: 16,
    },
    summaryTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    summaryLeft: {
        flex: 1,
        gap: 4,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    summaryAmountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    summaryAmount: {
        fontSize: 36,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: -1,
    },
    visibilityButton: {
        padding: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    summaryBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentDateContainer: {
        gap: 4,
    },
    paymentDateLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    paymentDateValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ffffff',
    },
    breakdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    breakdownButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    listTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
    },
    historyList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    historyItem: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    historyItemLeft: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
    },
    historyIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyItemInfo: {
        flex: 1,
        gap: 8,
    },
    historyItemTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyMonth: {
        fontSize: 16,
        fontWeight: '700',
    },
    historyAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    historyItemBottom: {
        gap: 8,
    },
    historyStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusChipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    paymentDateText: {
        fontSize: 12,
    },
    viewSlipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-end',
    },
    viewSlipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyState: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        gap: 6,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    emptySub: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.background,
        },
        header: {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
        },
        headerTitle: {
            color: colors.textMain,
        },
        listTitle: {
            color: colors.textMain,
        },
        historyItem: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        historyMonth: {
            color: colors.textMain,
        },
        historyAmount: {
            color: colors.textMain,
        },
        paymentDateText: {
            color: colors.textSub,
        },
    });



