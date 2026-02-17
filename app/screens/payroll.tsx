import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StatusBar as NativeStatusBar,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomTabBar from '../components/BottomTabBar';
import { useTheme } from '../contexts/ThemeContext';
import { SessionManager } from '../services/SessionManager';
import { formatCompactMoney, formatMoney, formatMonthYear, getPayrollRunDetails, listPayrollRuns, markPayrollRunAsPaid, PayrollRun } from '../services/payroll';

export default function PayrollScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();

    const styles = createStyles(colors, isDark);

    const [runs, setRuns] = useState<PayrollRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
    const [runDetails, setRunDetails] = useState<{ deductions: number, loading: boolean }>({ deductions: 0, loading: false });
    const [markingPaid, setMarkingPaid] = useState(false);

    const fetchRuns = async () => {
        const user = await SessionManager.getUser();
        const roles = user?.roles || [];
        const admin = roles.some((r: string) => String(r).toLowerCase() === 'admin');
        if (!admin) {
            router.replace('/screens/employee_dashboard');
            return;
        }
        const list = await listPayrollRuns();
        const sorted = list.sort((a, b) => {
            if (a.periodYear !== b.periodYear) return b.periodYear - a.periodYear;
            return b.periodMonth - a.periodMonth;
        });
        setRuns(sorted);
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchRuns();
        }, [])
    );

    const handleRunPress = async (run: PayrollRun) => {
        setSelectedRun(run);
        setRunDetails({ deductions: 0, loading: true });

        try {
            const details = await getPayrollRunDetails(run.periodYear, run.periodMonth);
            const totalDeductions = details.reduce((sum, item) => sum + item.deductions, 0);
            setRunDetails({ deductions: totalDeductions, loading: false });
        } catch (e) {
            setRunDetails({ deductions: 0, loading: false });
        }
    };

    const handleMarkPaid = async () => {
        if (!selectedRun) return;
        setMarkingPaid(true);

        // Add a small delay for better UX perception
        await new Promise(resolve => setTimeout(resolve, 1500));

        const success = await markPayrollRunAsPaid(selectedRun.periodYear, selectedRun.periodMonth, new Date().toISOString());

        if (success) {
            await fetchRuns();
            setMarkingPaid(false);
            setSelectedRun(null);
        } else {
            setMarkingPaid(false);
            // Simple alert for error (can be replaced with custom modal/toast if needed)
            alert("Failed to mark payroll as paid. Please try again.");
        }
    };

    const currentPeriodLabel = useMemo(() => {
        const d = new Date();
        return formatMonthYear(d.getFullYear(), d.getMonth());
    }, []);

    const latestRun = runs[0];
    const currencySymbol = '₨';

    return (
        <View style={styles.container}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                            <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Payroll History</Text>
                    </View>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconButton}>
                            <MaterialIcons name="notifications" size={24} color={colors.textSub} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <MaterialIcons name="tune" size={24} color={colors.textSub} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Current Period Card */}
                    <View style={styles.currentPeriodCard}>
                        <View style={styles.cardGradient} />
                        <View style={styles.cardContent}>
                            <View style={styles.periodHeader}>
                                <View style={styles.periodInfo}>
                                    <Text style={styles.periodLabel}>CURRENT PERIOD</Text>
                                    <Text style={styles.periodMonth}>{currentPeriodLabel}</Text>
                                    <View style={styles.statusRow}>
                                        <View style={styles.statusDot} />
                                        <Text style={styles.statusText}>
                                            Status: {latestRun ? 'Last run processed' : 'Pending processing'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <TouchableOpacity
                                style={styles.processButton}
                                onPress={() => router.push('/screens/process_payroll' as any)}
                            >
                                <MaterialIcons name="play-arrow" size={20} color={colors.white} />
                                <Text style={styles.processButtonText}>Process Monthly Payroll</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Cards */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <MaterialIcons name="payments" size={20} color={colors.textSub} />
                                <Text style={styles.statLabel}>TOTAL PAID (THIS YEAR)</Text>
                            </View>
                            <Text style={styles.statValue}>
                                {formatCompactMoney(runs
                                    .filter(r => r.periodYear === new Date().getFullYear() && r.status === 'Paid')
                                    .reduce((sum, r) => sum + r.totalNetPay, 0), currencySymbol)}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <MaterialIcons name="event" size={20} color={colors.textSub} />
                                <Text style={styles.statLabel}>NEXT PAY DATE</Text>
                            </View>
                            <Text style={styles.statValue}>
                                {(() => {
                                    const now = new Date();
                                    let payDate = new Date(now.getFullYear(), now.getMonth(), 5);
                                    if (now > payDate) {
                                        payDate.setMonth(payDate.getMonth() + 1);
                                    }
                                    return payDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                })()}
                            </Text>
                        </View>
                    </View>

                    {/* Payroll History Header */}
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Payroll History</Text>
                        <TouchableOpacity style={styles.viewAllButton}>
                            <Text style={styles.viewAllText}>View All</Text>
                            <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Payroll History List */}
                    <View style={styles.historyList}>
                        {runs.map((item, index) => {
                            const prevItem = runs[index - 1];
                            const showYearHeader = !prevItem || prevItem.periodYear !== item.periodYear;
                            const monthLabel = formatMonthYear(item.periodYear, item.periodMonth);
                            const paidDate = new Date(item.payDateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const isPaid = item.status === 'Paid';

                            return (
                                <React.Fragment key={item.id}>
                                    {showYearHeader && (
                                        <View style={styles.yearDivider}>
                                            <Text style={styles.yearDividerText}>{item.periodYear}</Text>
                                            <View style={styles.yearDividerLine} />
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={styles.historyItem}
                                        onPress={() => handleRunPress(item)}
                                    >
                                        <View style={styles.historyItemLeft}>
                                            <View style={[styles.checkIcon, { backgroundColor: isPaid ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)') : (isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)') }]}>
                                                <MaterialIcons name={isPaid ? "check-circle" : "schedule"} size={24} color={isPaid ? colors.emerald : colors.orange} />
                                            </View>
                                            <View style={styles.historyItemInfo}>
                                                <Text style={styles.historyMonth}>{monthLabel}</Text>
                                                <View style={styles.historyMeta}>
                                                    <Text style={styles.historyMetaText}>{item.employeeCount} Employees</Text>
                                                    <View style={styles.metaDot} />
                                                    <Text style={styles.historyMetaText}>{isPaid ? 'Paid' : 'Processed'} {paidDate}</Text>
                                                </View>
                                                <Text style={styles.historyTotalText}>
                                                    Total: {formatMoney(item.totalNetPay, currencySymbol)}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.historyItemRight}>
                                            <MaterialIcons name="chevron-right" size={20} color={colors.textSub} />
                                        </View>
                                    </TouchableOpacity>
                                </React.Fragment>
                            )
                        })}
                    </View>

                    {/* Bottom Spacer for Tab Bar */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Mark Paid Modal */}
                <Modal
                    visible={!!selectedRun}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSelectedRun(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {selectedRun && (
                                <>
                                    <Text style={styles.modalTitle}>Payroll Summary</Text>
                                    <Text style={styles.modalSubtitle}>{formatMonthYear(selectedRun.periodYear, selectedRun.periodMonth)}</Text>

                                    <View style={styles.modalRow}>
                                        <Text style={styles.modalLabel}>Total Net Pay</Text>
                                        <Text style={[styles.modalValue, { color: colors.emerald }]}>{formatMoney(selectedRun.totalNetPay, currencySymbol)}</Text>
                                    </View>

                                    <View style={styles.modalRow}>
                                        <Text style={styles.modalLabel}>Total Deductions</Text>
                                        {runDetails.loading ? (
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        ) : (
                                            <Text style={[styles.modalValue, { color: '#ef4444' }]}>{formatMoney(runDetails.deductions, currencySymbol)}</Text>
                                        )}
                                    </View>

                                    <View style={[styles.modalRow, { marginTop: 8 }]}>
                                        <Text style={styles.modalLabel}>Status</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedRun.status === 'Paid' ? colors.emerald : colors.orange }} />
                                            <Text style={[styles.modalValue, { fontSize: 16 }]}>{selectedRun.status}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: colors.surface }]}
                                            onPress={() => setSelectedRun(null)}
                                        >
                                            <Text style={styles.modalButtonText}>Close</Text>
                                        </TouchableOpacity>

                                        {selectedRun.status !== 'Paid' && (
                                            <TouchableOpacity
                                                style={[styles.modalButton, styles.modalButtonPrimary, markingPaid && { opacity: 0.8 }]}
                                                onPress={handleMarkPaid}
                                                disabled={markingPaid}
                                            >
                                                {markingPaid ? (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <ActivityIndicator color="#fff" size="small" />
                                                        <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Processing...</Text>
                                                    </View>
                                                ) : (
                                                    <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Mark as Paid</Text>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Bottom Tab Bar */}
                <BottomTabBar activeTab="dashboard" />
            </SafeAreaView>
        </View>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
        backgroundColor: isDark
            ? 'rgba(28, 37, 46, 0.8)'
            : 'rgba(246, 247, 248, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textMain,
        letterSpacing: 0.5,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 20,
    },
    currentPeriodCard: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: isDark ? 'rgba(19, 127, 236, 0.05)' : 'rgba(19, 127, 236, 0.05)',
        opacity: 0.5,
    },
    cardContent: {
        padding: 20,
        position: 'relative',
    },
    periodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    periodInfo: {
        flex: 1,
    },
    periodLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        color: colors.primary,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    periodMonth: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.orange,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSub,
    },
    divider: {
        height: 1,
        backgroundColor: isDark ? colors.borderDark : '#f1f5f9',
        marginVertical: 16,
    },
    processButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    processButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.5,
        color: colors.textSub,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textMain,
        letterSpacing: -0.5,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMain,
        letterSpacing: 0.5,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.primary,
    },
    historyList: {
        gap: 12,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    historyItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    checkIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyItemInfo: {
        flex: 1,
    },
    historyMonth: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMain,
        marginBottom: 4,
    },
    historyMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    historyMetaText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.textSub,
    },
    historyTotalText: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMain,
    },
    metaDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: isDark ? colors.borderDark : '#cbd5e1',
    },
    historyItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historyAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textMain,
    },
    yearDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        gap: 12,
    },
    yearDividerText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textSub,
    },
    yearDividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 24,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: 4,
        textAlign: 'center'
    },
    modalSubtitle: {
        fontSize: 14,
        color: colors.textSub,
        marginBottom: 24,
        textAlign: 'center',
        fontWeight: '500',
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        alignItems: 'center'
    },
    modalLabel: {
        fontSize: 15,
        color: colors.textSub,
        fontWeight: '500'
    },
    modalValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textMain
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalButtonPrimary: {
        backgroundColor: colors.emerald,
        borderColor: colors.emerald,
        borderWidth: 0,
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textMain
    },
    modalButtonTextPrimary: {
        color: '#fff'
    },
});
