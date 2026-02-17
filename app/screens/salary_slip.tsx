import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';
import { formatMoney, formatMonthYear, getPayslipById, Payslip } from '../services/payroll';

const { width } = Dimensions.get('window');

export default function SalarySlipScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { isDark, colors } = useTheme();

    const payslipId = params.payslipId ? String(params.payslipId) : '';
    const [slip, setSlip] = useState<Payslip | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!payslipId) return;
            const s = await getPayslipById(payslipId);
            setSlip(s);
        };
        load();
    }, [payslipId]);

    // Fallback params (old navigation support)
    const monthFallback = params.month ? String(params.month) : 'October 2023';
    const paymentDateFallback = params.paymentDate ? String(params.paymentDate) : 'Oct 31, 2023';

    const month = slip ? formatMonthYear(slip.periodYear, slip.periodMonth) : monthFallback;
    const paymentDate = slip
        ? new Date(slip.payDateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : paymentDateFallback;

    const currencySymbol = slip?.currencySymbol || '₨';

    const earningsRows = useMemo(() => {
        if (!slip) {
            return [
                { label: 'Basic Pay', amount: `${currencySymbol}0.00` },
                { label: 'HRA', amount: `${currencySymbol}0.00` },
                { label: 'Allowance', amount: `${currencySymbol}0.00` },
            ];
        }
        return [
            { label: 'Basic Pay', amount: formatMoney(slip.earnings.basic, currencySymbol) },
            { label: 'HRA', amount: formatMoney(slip.earnings.hra, currencySymbol) },
            { label: 'Allowance', amount: formatMoney(slip.earnings.allowance, currencySymbol) },
            ...(slip.earnings.bonus ? [{ label: 'Bonus', amount: formatMoney(slip.earnings.bonus, currencySymbol) }] : []),
            ...(slip.earnings.overtime ? [{ label: 'Overtime', amount: formatMoney(slip.earnings.overtime, currencySymbol) }] : []),
            ...(slip.earnings.otherEarnings ? [{ label: 'Other Earnings', amount: formatMoney(slip.earnings.otherEarnings, currencySymbol) }] : []),
        ];
    }, [slip, currencySymbol]);

    const deductionRows = useMemo(() => {
        if (!slip) {
            return [
                { label: 'Tax', amount: `-${currencySymbol}0.00` },
                { label: 'Professional Tax', amount: `-${currencySymbol}0.00` },
            ];
        }
        const fmtDed = (n: number) => `-${formatMoney(n, currencySymbol).replace(currencySymbol, currencySymbol)}`;
        return [
            ...(slip.deductions.tax ? [{ label: 'Income Tax', amount: fmtDed(slip.deductions.tax) }] : []),
            ...(slip.deductions.providentFund ? [{ label: 'Provident Fund', amount: fmtDed(slip.deductions.providentFund) }] : []),
            ...(slip.deductions.professionalTax ? [{ label: 'Professional Tax', amount: fmtDed(slip.deductions.professionalTax) }] : []),
            ...(slip.deductions.loan ? [{ label: 'Loan', amount: fmtDed(slip.deductions.loan) }] : []),
            ...(slip.deductions.unpaidLeaveDeduction ? [{ label: 'Unpaid Leave Deduction', amount: fmtDed(slip.deductions.unpaidLeaveDeduction) }] : []),
            ...(slip.deductions.otherDeductions ? [{ label: 'Other Deductions', amount: fmtDed(slip.deductions.otherDeductions) }] : []),
        ];
    }, [slip, currencySymbol]);

    const totalEarnings = slip ? formatMoney(slip.totals.totalEarnings, currencySymbol) : `${currencySymbol}0.00`;
    const totalDeductions = slip ? `-${formatMoney(slip.totals.totalDeductions, currencySymbol)}` : `-${currencySymbol}0.00`;
    const netSalary = slip ? formatMoney(slip.totals.netPay, currencySymbol) : `${currencySymbol}0.00`;

    const dynamicStyles = createDynamicStyles(colors, isDark);

    const handleDownload = () => {
        // Handle PDF download
    };

    const handleShare = () => {
        // Handle share functionality
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Salary Slip</Text>
                <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                    <MaterialIcons name="share" size={24} color={colors.textMain} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Employee Header */}
                <View style={[styles.employeeHeader, dynamicStyles.employeeHeader]}>
                    <Image
                        source={{
                            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0YNpD-ChAXPm87tLTYmQXcoVc58O_igq-vTfe2JPnCN89M8JKW4V29TSCdfyZY_nNUZk6tAYo_YnbxDqRYrKtZ3XRv0XeGWQhYZMr5oO68cg9Jo_QSvvOxWx4SKwOrlaqe9e-Oz4Ct4HOKsmMzgCO9htwBzKF9as99p9toLs8eCkNFYEHZlIap_TcNok11IPGbx9hrWRqmTCHDEDq4O86syzmIVLjHqXpZIRA-bVlLRHbboUUw0WtiEeEpStPZr-NwBp8AdxF8hnY',
                        }}
                        style={styles.employeeAvatar}
                    />
                    <View style={styles.employeeInfo}>
                        <Text style={[styles.employeeName, dynamicStyles.employeeName]}>
                            {slip?.employeeName || 'Employee'}
                        </Text>
                        <Text style={[styles.employeeDesignation, dynamicStyles.employeeDesignation]}>
                            {slip?.designation || '—'}
                        </Text>
                        <Text style={[styles.employeeId, dynamicStyles.employeeId]}>
                            ID: #{slip?.employeeCode || '—'}
                        </Text>
                    </View>
                </View>

                {/* Pay Period */}
                <View style={styles.payPeriodContainer}>
                    <View style={[styles.payPeriodCard, dynamicStyles.payPeriodCard]}>
                        <View style={styles.payPeriodLeft}>
                            <MaterialIcons name="calendar-month" size={20} color={colors.primary} />
                            <Text style={[styles.payPeriodLabel, { color: colors.primary }]}>Pay Period</Text>
                        </View>
                        <Text style={[styles.payPeriodValue, dynamicStyles.payPeriodValue]}>{month}</Text>
                    </View>
                </View>

                {/* Payslip Card */}
                <View style={[styles.payslipCard, dynamicStyles.payslipCard]}>
                    {/* Earnings Section */}
                    <View style={[styles.section, dynamicStyles.section]}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="payments" size={20} color={STATIC_COLORS.emerald} />
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Earnings</Text>
                        </View>
                        <View style={styles.itemsList}>
                            {earningsRows.map((item, index) => (
                                <View key={index} style={styles.itemRow}>
                                    <Text style={[styles.itemLabel, dynamicStyles.itemLabel]}>{item.label}</Text>
                                    <Text style={[styles.itemAmount, dynamicStyles.itemAmount]}>{item.amount}</Text>
                                </View>
                            ))}
                            <View style={[styles.divider, dynamicStyles.divider]} />
                            <View style={styles.itemRow}>
                                <Text style={[styles.totalLabel, dynamicStyles.totalLabel]}>Total Earnings</Text>
                                <Text style={[styles.totalAmount, dynamicStyles.totalAmount]}>{totalEarnings}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Deductions Section */}
                    <View style={[styles.section, styles.deductionsSection, dynamicStyles.deductionsSection]}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="remove-circle" size={20} color={STATIC_COLORS.red} />
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Deductions</Text>
                        </View>
                        <View style={styles.itemsList}>
                            {deductionRows.map((item, index) => (
                                <View key={index} style={styles.itemRow}>
                                    <Text style={[styles.itemLabel, dynamicStyles.itemLabel]}>{item.label}</Text>
                                    <Text style={[styles.deductionAmount, { color: STATIC_COLORS.red }]}>
                                        {item.amount}
                                    </Text>
                                </View>
                            ))}
                            <View style={[styles.divider, dynamicStyles.divider]} />
                            <View style={styles.itemRow}>
                                <Text style={[styles.totalLabel, dynamicStyles.totalLabel]}>Total Deductions</Text>
                                <Text style={[styles.totalDeductionAmount, { color: STATIC_COLORS.red }]}>
                                    {totalDeductions}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Net Salary Summary */}
                    <View style={[styles.netSalarySection, { backgroundColor: colors.primary }]}>
                        <View style={styles.netSalaryContent}>
                            <Text style={styles.netSalaryLabel}>Net Salary</Text>
                            <Text style={styles.netSalaryAmount}>{netSalary}</Text>
                            <View style={styles.paidInfo}>
                                <MaterialIcons name="check-circle" size={16} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.paidText}>Paid on {paymentDate}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Legal Footer Text */}
                <Text style={[styles.legalText, dynamicStyles.legalText]}>
                    This is a computer-generated document and does not require a signature.
                </Text>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Bottom Action */}
            <View style={[styles.footer, dynamicStyles.footer]}>
                <TouchableOpacity
                    style={[styles.downloadButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={handleDownload}
                >
                    <MaterialIcons name="download" size={20} color="#ffffff" />
                    <Text style={styles.downloadButtonText}>Download PDF</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const STATIC_COLORS = {
    emerald: '#10b981',
    red: '#ef4444',
};

const styles = StyleSheet.create({
    container: {
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
    employeeHeader: {
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    employeeAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#137fec',
        marginBottom: 16,
    },
    employeeInfo: {
        gap: 4,
    },
    employeeName: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    employeeDesignation: {
        fontSize: 14,
        fontWeight: '400',
    },
    employeeId: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: 4,
    },
    payPeriodContainer: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    payPeriodCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    payPeriodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    payPeriodLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    payPeriodValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    payslipCard: {
        marginHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    itemsList: {
        gap: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 24,
    },
    itemLabel: {
        fontSize: 14,
        fontWeight: '400',
        flex: 1,
    },
    itemAmount: {
        fontSize: 14,
        fontWeight: '500',
    },
    deductionAmount: {
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 4,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    totalAmount: {
        fontSize: 14,
        fontWeight: '700',
    },
    totalDeductionAmount: {
        fontSize: 14,
        fontWeight: '700',
    },
    deductionsSection: {
        backgroundColor: 'transparent',
    },
    netSalarySection: {
        padding: 24,
    },
    netSalaryContent: {
        alignItems: 'center',
        gap: 4,
    },
    netSalaryLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    netSalaryAmount: {
        fontSize: 36,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: -1,
    },
    paidInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    paidText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    legalText: {
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 8,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        borderRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    downloadButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
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
        employeeHeader: {
            backgroundColor: colors.surface,
        },
        employeeName: {
            color: colors.textMain,
        },
        employeeDesignation: {
            color: colors.textSub,
        },
        employeeId: {
            color: colors.textSub,
        },
        payPeriodCard: {
            backgroundColor: `${colors.primary}20`,
            borderColor: `${colors.primary}20`,
        },
        payPeriodValue: {
            color: colors.textMain,
        },
        payslipCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        section: {
            borderBottomColor: colors.border,
        },
        sectionTitle: {
            color: colors.textMain,
        },
        itemLabel: {
            color: colors.textSub,
        },
        itemAmount: {
            color: colors.textMain,
        },
        divider: {
            backgroundColor: colors.border,
        },
        totalLabel: {
            color: colors.textMain,
        },
        totalAmount: {
            color: colors.textMain,
        },
        deductionsSection: {
            backgroundColor: isDark ? `${colors.border}80` : '#f9fafb',
        },
        legalText: {
            color: colors.textSub,
        },
        footer: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
        },
    });



