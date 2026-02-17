import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StatusBar as NativeStatusBar,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { formatMoney, formatMonthYear, getPayrollEmployees, getPayrollRunDetails, markEmployeePayrollAsPaid, markPayrollRunAsPaid, PayrollHistoryItem } from '../services/payroll';

export default function PayrollHistoryDetailsScreen() {
    const router = useRouter();
    const { year, month } = useLocalSearchParams(); // month is 0-based
    const { isDark, colors } = useTheme();

    const [isLoading, setIsLoading] = useState(true);
    const [historyItems, setHistoryItems] = useState<PayrollHistoryItem[]>([]);
    const [employeeMap, setEmployeeMap] = useState<Record<string, any>>({});

    const styles = createStyles(colors, isDark);

    useEffect(() => {
        fetchDetails();
    }, [year, month]);

    const fetchDetails = async () => {
        try {
            if (year && month) {
                setIsLoading(true);
                const [items, employees] = await Promise.all([
                    getPayrollRunDetails(Number(year), Number(month)),
                    getPayrollEmployees()
                ]);

                // Create map for fallback if API returns null employee object
                const map: Record<string, any> = {};
                employees.forEach(e => {
                    map[e.id] = e;
                });
                setEmployeeMap(map);
                setHistoryItems(items);
            }
        } catch (error) {
            console.error('Failed to load history details', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAllPaid = async () => {
        Alert.alert(
            'Mark Run as Paid',
            `Are you sure you want to mark the entire payroll for ${formatMonthYear(Number(year), Number(month))} as PAID?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark Paid',
                    style: 'default',
                    onPress: async () => {
                        setIsLoading(true);
                        const success = await markPayrollRunAsPaid(Number(year), Number(month), new Date().toISOString());
                        if (success) {
                            Alert.alert('Success', 'Payroll run marked as paid successfully.');
                            fetchDetails(); // Refresh
                        } else {
                            setIsLoading(false);
                            Alert.alert('Error', 'Failed to mark payroll run as paid.');
                        }
                    }
                }
            ]
        );
    };

    const handleMarkEmployeePaid = async (item: PayrollHistoryItem) => {
        // We use employeeId as per service definition, assuming backend uses employeeID to find current pending/unpaid payroll or the endpoint handles it.
        // User specified endpoint with what looked like an Employee ID.
        const name = getEmployeeName(item);
        Alert.alert(
            'Mark Employee Paid',
            `Mark payroll for ${name} as PAID?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setIsLoading(true); // Show global loading or local? Global is easiest for safety.
                        const success = await markEmployeePayrollAsPaid(item.employeeId, new Date().toISOString());
                        setIsLoading(false);
                        if (success) {
                            Alert.alert('Success', `Marked ${name} as paid.`);
                            // Optional: update local state to reflect paid status if we tracked it
                        } else {
                            Alert.alert('Error', `Failed to mark ${name} as paid.`);
                        }
                    }
                }
            ]
        );
    };

    const getEmployeeName = (item: PayrollHistoryItem) => {
        if (item.employee && (item.employee.fullName || item.employee.firstName)) {
            return item.employee.fullName || `${item.employee.firstName} ${item.employee.lastName || ''}`;
        }
        const local = employeeMap[item.employeeId];
        if (local) return local.name;
        return `Emp #${item.employeeId.substring(0, 6)}`;
    };

    const getEmployeeDesignation = (item: PayrollHistoryItem) => {
        if (item.employee && item.employee.designation) return item.employee.designation;
        const local = employeeMap[item.employeeId];
        return local ? local.designation : '—';
    };

    const periodLabel = year && month ? formatMonthYear(Number(year), Number(month)) : 'Payroll Details';
    const totalPaid = historyItems.reduce((sum, item) => sum + item.netSalary, 0);
    const employeeCount = historyItems.length;

    return (
        <View style={styles.container}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{periodLabel}</Text>
                        <Text style={styles.headerSubtitle}>{employeeCount} Employees processed</Text>
                    </View>
                    <TouchableOpacity style={styles.iconButton}>
                        <MaterialIcons name="share" size={24} color={colors.textMain} />
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ marginTop: 12, color: colors.textSub }}>Updating records...</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {/* Summary Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total Net Paid</Text>
                                <Text style={styles.summaryValue}>{formatMoney(totalPaid, '₨')}</Text>
                            </View>
                            <View style={[styles.divider, { marginVertical: 12 }]} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total Deductions</Text>
                                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                                    {formatMoney(historyItems.reduce((s, i) => s + i.deductions, 0), '₨')}
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.markPaidButton} onPress={handleMarkAllPaid}>
                                <MaterialIcons name="done-all" size={20} color="#fff" />
                                <Text style={styles.markPaidButtonText}>Mark All as Paid</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>Employee Breakdown</Text>

                        {/* Employee List */}
                        <View style={styles.list}>
                            {historyItems.map((item) => {
                                const name = getEmployeeName(item);
                                const designation = getEmployeeDesignation(item);

                                return (
                                    <View key={item.id} style={styles.card}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>
                                                    {name.charAt(0)}
                                                </Text>
                                            </View>
                                            <View style={styles.cardInfo}>
                                                <Text style={styles.employeeName}>{name}</Text>
                                                <Text style={styles.designation}>{designation}</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                                <Text style={styles.netAmount}>{formatMoney(item.netSalary, '₨')}</Text>
                                                {item.paidAtUtc ? (
                                                    <View style={styles.paidBadge}>
                                                        <MaterialIcons name="verified" size={14} color="#10b981" />
                                                        <Text style={styles.paidBadgeText}>PAID</Text>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity
                                                        style={styles.markItemPaidButton}
                                                        onPress={() => handleMarkEmployeePaid(item)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text style={styles.markItemPaidText}>Mark Paid</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.cardStats}>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>Basic</Text>
                                                <Text style={styles.statNumber}>{formatMoney(item.basicSalary, '₨')}</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>Deductions</Text>
                                                <Text style={[styles.statNumber, { color: '#ef4444' }]}>{formatMoney(item.deductions, '₨')}</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>Days</Text>
                                                <Text style={styles.statNumber}>
                                                    P:{item.presentDays} / A:{item.absentDays}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )
                            })}
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMain,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textSub,
        textAlign: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: colors.textSub,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMain,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    list: {
        gap: 12,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    cardInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMain,
    },
    designation: {
        fontSize: 12,
        color: colors.textSub,
    },
    netAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: 12,
    },
    cardStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'flex-start',
    },
    statLabel: {
        fontSize: 11,
        color: colors.textSub,
        marginBottom: 2,
    },
    statNumber: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMain,
    },
    markPaidButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981', // emerald
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    markPaidButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    markItemPaidButton: {
        marginTop: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#10b981',
        borderRadius: 6,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markItemPaidText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
    paidBadge: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#d1fae5',
    },
    paidBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10b981',
        letterSpacing: 0.5,
    },
});
