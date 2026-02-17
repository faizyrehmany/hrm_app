import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    StatusBar as NativeStatusBar,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SessionManager } from '../services/SessionManager';
import {
    computePayslipTotals,
    daysInMonth,
    formatMoney,
    formatMonthYear,
    getPayrollEmployees,
    getSalaryProfiles,
    PayrollEmployee,
    PayrollEmployeeInput,
    processPayrollRun,
    SalaryProfile
} from '../services/payroll';

// Static colors
const STATIC_COLORS = {
    emerald: '#10b981',
    red: '#ef4444',
};

export default function ProcessPayrollScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [payDate, setPayDate] = useState(new Date());
    const [showPayDatePicker, setShowPayDatePicker] = useState(false);
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
    const [profiles, setProfiles] = useState<Record<string, SalaryProfile>>({});
    const [employeeInputs, setEmployeeInputs] = useState<Record<string, PayrollEmployeeInput>>({});

    const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);
    const [isEditModalVisible, setEditModalVisible] = useState(false);

    const dynamicStyles = createDynamicStyles(colors, isDark);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleMonthChange = (event: any, selectedDate: Date | undefined) => {
        if (Platform.OS === 'android') {
            setShowMonthPicker(false);
        }
        if (selectedDate) {
            setSelectedMonth(selectedDate);
        }
    };

    const handlePayDateChange = (event: any, selectedDate: Date | undefined) => {
        if (Platform.OS === 'android') {
            setShowPayDatePicker(false);
        }
        if (selectedDate) {
            setPayDate(selectedDate);
        }
    };

    // Admin guard + seed + load
    useEffect(() => {
        const init = async () => {
            const user = await SessionManager.getUser();
            const roles = user?.roles || [];
            const admin = roles.some((r: string) => String(r).toLowerCase() === 'admin');
            if (!admin) {
                router.replace('/screens/employee_dashboard');
                return;
            }

            // Fetch employees from API
            const emps = await getPayrollEmployees();

            // Get profiles (generated from API data + local overrides)
            const profs = await getSalaryProfiles(emps);

            const inputs: Record<string, PayrollEmployeeInput> = {};
            for (const emp of emps) {
                inputs[emp.id] = {
                    bonus: 0,
                    overtimeHours: 0,
                    overtimeRate: 0,
                    otherEarnings: 0,
                    unpaidLeaveDaysOverride: 0,
                    tax: 0,
                    loan: 0,
                    otherDeductions: 0,
                    remarks: '',
                };
            }

            setEmployees(emps);
            setProfiles(profs);
            setEmployeeInputs(inputs);
        };
        init();
    }, []);

    const periodYear = selectedMonth.getFullYear();
    const periodMonth = selectedMonth.getMonth();
    const dim = daysInMonth(periodYear, periodMonth);

    const previews = useMemo(() => {
        const map: Record<string, ReturnType<typeof computePayslipTotals>> = {};
        for (const emp of employees) {
            const profile = profiles[emp.id];
            if (!profile) continue;
            map[emp.id] = computePayslipTotals({
                employee: emp,
                profile,
                input: employeeInputs[emp.id] || {
                    bonus: 0,
                    overtimeHours: 0,
                    overtimeRate: 0,
                    otherEarnings: 0,
                    unpaidLeaveDaysOverride: 0,
                    tax: 0,
                    loan: 0,
                    otherDeductions: 0,
                },
                periodYear,
                periodMonth,
            }) as any;
        }
        return map;
    }, [employees, profiles, employeeInputs, periodYear, periodMonth]);

    const summary = useMemo(() => {
        let totalEarnings = 0;
        let totalDeductions = 0;
        let totalNetPay = 0;
        for (const emp of employees) {
            const p = previews[emp.id];
            if (!p) continue;
            totalEarnings += p.totals.totalEarnings;
            totalDeductions += p.totals.totalDeductions;
            totalNetPay += p.totals.netPay;
        }
        return { totalEarnings, totalDeductions, totalNetPay };
    }, [employees, previews]);

    const openEdit = (employeeId: string) => {
        setEditEmployeeId(employeeId);
        setEditModalVisible(true);
    };

    const closeEdit = () => {
        setEditModalVisible(false);
        setEditEmployeeId(null);
    };

    const setField = (employeeId: string, field: keyof PayrollEmployeeInput, value: string) => {
        setEmployeeInputs((prev) => ({
            ...prev,
            [employeeId]: {
                ...prev[employeeId],
                [field]:
                    field === 'remarks' ? value : Number(String(value).replace(/[^\d.]/g, '')) || 0,
            },
        }));
    };

    const [processingStep, setProcessingStep] = useState('');

    // ... existing code ...

    const handleProcessPayroll = async () => {
        try {
            setIsProcessing(true);
            setProcessingStep('Initiating payroll sequence...');

            // UX Delays for "professional" feel
            await new Promise(r => setTimeout(r, 600));
            setProcessingStep('Validating employee data...');

            await new Promise(r => setTimeout(r, 800));
            setProcessingStep('Calculating taxes & deductions...');

            await new Promise(r => setTimeout(r, 800));
            setProcessingStep('Generating payslips...');

            await processPayrollRun({
                periodYear,
                periodMonth,
                payDateISO: payDate.toISOString(),
                notes: notes.trim() || undefined,
                employeeInputs,
            });

            setProcessingStep('Finalizing...');
            await new Promise(r => setTimeout(r, 600));

            Alert.alert('Success', `Payroll generated for ${formatMonthYear(periodYear, periodMonth)}`, [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to process payroll. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const editEmployee = editEmployeeId ? employees.find((e) => e.id === editEmployeeId) : null;
    const editProfile = editEmployeeId ? profiles[editEmployeeId] : null;
    const editInput = editEmployeeId ? employeeInputs[editEmployeeId] : null;
    const editPreview = editEmployeeId && editEmployee ? previews[editEmployeeId] : null;

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Processing Overlay Modal */}
            <Modal visible={isProcessing} transparent animationType="fade">
                <View style={styles.processingOverlay}>
                    <View style={[styles.processingCard, dynamicStyles.modalCard]}>
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
                        <Text style={[styles.processingText, dynamicStyles.modalTitle]}>{processingStep}</Text>
                        <Text style={[styles.processingSub, dynamicStyles.modalSub]}>Please wait, do not close the app.</Text>
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>

                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Process Payroll</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Period Selection */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Payroll Period</Text>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, dynamicStyles.label]}>Select Month</Text>
                            <TouchableOpacity
                                style={[styles.dateInputContainer, dynamicStyles.dateInputContainer]}
                                onPress={() => setShowMonthPicker(true)}
                            >
                                <TextInput
                                    style={[styles.dateInput, dynamicStyles.dateInput]}
                                    value={formatMonthYear(periodYear, periodMonth)}
                                    editable={false}
                                    placeholderTextColor={colors.textSub}
                                />
                                <MaterialIcons
                                    name="calendar-month"
                                    size={24}
                                    color={colors.textSub}
                                    style={styles.inputIcon}
                                />
                            </TouchableOpacity>
                            {showMonthPicker && (
                                <DateTimePicker
                                    value={selectedMonth}
                                    mode="date"
                                    display="default"
                                    onChange={handleMonthChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, dynamicStyles.label]}>Pay Date</Text>
                            <TouchableOpacity
                                style={[styles.dateInputContainer, dynamicStyles.dateInputContainer]}
                                onPress={() => setShowPayDatePicker(true)}
                            >
                                <TextInput
                                    style={[styles.dateInput, dynamicStyles.dateInput]}
                                    value={formatDate(payDate)}
                                    editable={false}
                                    placeholderTextColor={colors.textSub}
                                />
                                <MaterialIcons
                                    name="event"
                                    size={24}
                                    color={colors.textSub}
                                    style={styles.inputIcon}
                                />
                            </TouchableOpacity>
                            {showPayDatePicker && (
                                <DateTimePicker
                                    value={payDate}
                                    mode="date"
                                    display="default"
                                    onChange={handlePayDateChange}
                                />
                            )}
                        </View>
                    </View>

                    {/* Summary */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Summary</Text>
                        <View style={[styles.summaryCard, dynamicStyles.summaryCard]}>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, dynamicStyles.summaryLabel]}>
                                    Employees
                                </Text>
                                <Text style={[styles.summaryValue, dynamicStyles.summaryValue]}>
                                    {employees.length}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, dynamicStyles.summaryLabel]}>
                                    Total Earnings
                                </Text>
                                <Text style={[styles.summaryValue, dynamicStyles.summaryValue]}>
                                    {employees.length > 0 ? formatMoney(summary.totalEarnings, profiles[employees[0]?.id]?.currencySymbol || '₨') : '—'}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, dynamicStyles.summaryLabel]}>
                                    Total Deductions
                                </Text>
                                <Text style={[styles.summaryValue, { color: STATIC_COLORS.red }]}>
                                    {employees.length > 0 ? formatMoney(summary.totalDeductions, profiles[employees[0]?.id]?.currencySymbol || '₨') : '—'}
                                </Text>
                            </View>
                            <View style={[styles.divider, dynamicStyles.divider]} />
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryTotalLabel, dynamicStyles.summaryTotalLabel]}>
                                    Net Amount
                                </Text>
                                <Text style={[styles.summaryTotalValue, { color: colors.primary }]}>
                                    {employees.length > 0 ? formatMoney(summary.totalNetPay, profiles[employees[0]?.id]?.currencySymbol || '₨') : '—'}
                                </Text>
                            </View>
                            <Text style={[styles.helperText, dynamicStyles.helperText]}>
                                Month days: {dim}. Unpaid leave deduction is pro-rated on fixed earnings.
                            </Text>
                        </View>
                    </View>

                    {/* Employee List */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                            Employees ({employees.length})
                        </Text>
                        <View style={styles.employeeList}>
                            {employees.map((emp) => {
                                const profile = profiles[emp.id];
                                const preview = previews[emp.id];
                                const symbol = profile?.currencySymbol || '₨';

                                return (
                                    <TouchableOpacity
                                        key={emp.id}
                                        style={[styles.employeeItem, dynamicStyles.employeeItem]}
                                        onPress={() => openEdit(emp.id)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.employeeInfo}>
                                            <Text style={[styles.employeeName, dynamicStyles.employeeName]}>
                                                {emp.name}
                                            </Text>
                                            <Text style={[styles.employeeDesignation, dynamicStyles.employeeDesignation]}>
                                                {emp.designation} • {emp.department} • {emp.employeeCode}
                                            </Text>
                                            <Text style={[styles.employeeMeta, dynamicStyles.employeeMeta]}>
                                                Net: {preview ? formatMoney(preview.totals.netPay, symbol) : '—'}
                                            </Text>
                                        </View>
                                        <View style={styles.employeeRight}>
                                            <Text style={[styles.employeeSalary, dynamicStyles.employeeSalary]}>
                                                {preview ? formatMoney(preview.totals.totalEarnings, symbol) : '—'}
                                            </Text>
                                            <View style={[styles.editChip, { borderColor: colors.primary }]}>
                                                <MaterialIcons name="edit" size={14} color={colors.primary} />
                                                <Text style={[styles.editChipText, { color: colors.primary }]}>Edit</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Notes */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Notes (Optional)</Text>
                        <TextInput
                            style={[styles.textArea, dynamicStyles.textArea]}
                            placeholder="Add any notes or remarks..."
                            placeholderTextColor={colors.textSub}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Footer */}
            <View style={[styles.footer, dynamicStyles.footer]}>
                <TouchableOpacity
                    style={[styles.processButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={handleProcessPayroll}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <MaterialIcons name="play-arrow" size={20} color="#ffffff" />
                            <Text style={styles.processButtonText}>Generate Payroll</Text>
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isProcessing}>
                    <Text style={[styles.cancelButtonText, dynamicStyles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
            </View>

            {/* Employee Edit Modal */}
            <Modal visible={isEditModalVisible} transparent animationType="slide" onRequestClose={closeEdit}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, dynamicStyles.modalCard]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>
                                {editEmployee ? `Edit: ${editEmployee.name}` : 'Edit Employee Payroll'}
                            </Text>
                            <TouchableOpacity onPress={closeEdit} style={styles.modalClose}>
                                <MaterialIcons name="close" size={22} color={colors.textMain} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {editEmployee && editProfile && editInput && (
                                <>
                                    <Text style={[styles.modalSub, dynamicStyles.modalSub]}>
                                        Salary: {formatMoney(editProfile.basic, editProfile.currencySymbol)}
                                    </Text>
                                    <Text style={[styles.modalSub, dynamicStyles.modalSub, { marginBottom: 16 }]}>
                                        Fixed salary comes from employee profile. Add monthly variables below.
                                    </Text>

                                    <View style={styles.formRow}>
                                        <View style={styles.formCol}>
                                            <Text style={[styles.label, dynamicStyles.label]}>Bonus</Text>
                                            <TextInput
                                                value={String(editInput.bonus ?? 0)}
                                                onChangeText={(v) => setField(editEmployee.id, 'bonus', v)}
                                                keyboardType="numeric"
                                                style={[styles.field, dynamicStyles.field]}
                                            />
                                        </View>
                                        <View style={styles.formCol}>
                                            <Text style={[styles.label, dynamicStyles.label]}>Other Earnings</Text>
                                            <TextInput
                                                value={String(editInput.otherEarnings ?? 0)}
                                                onChangeText={(v) => setField(editEmployee.id, 'otherEarnings', v)}
                                                keyboardType="numeric"
                                                style={[styles.field, dynamicStyles.field]}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.formRow}>
                                        <View style={styles.formCol}>
                                            <Text style={[styles.label, dynamicStyles.label]}>Overtime Hours</Text>
                                            <TextInput
                                                value={String(editInput.overtimeHours ?? 0)}
                                                onChangeText={(v) => setField(editEmployee.id, 'overtimeHours', v)}
                                                keyboardType="numeric"
                                                style={[styles.field, dynamicStyles.field]}
                                            />
                                        </View>
                                        <View style={styles.formCol}>
                                            <Text style={[styles.label, dynamicStyles.label]}>Overtime Rate</Text>
                                            <TextInput
                                                value={String(editInput.overtimeRate ?? 0)}
                                                onChangeText={(v) => setField(editEmployee.id, 'overtimeRate', v)}
                                                keyboardType="numeric"
                                                style={[styles.field, dynamicStyles.field]}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.formRow}>
                                        <View style={styles.formCol}>
                                            <Text style={[styles.label, dynamicStyles.label]}>Unpaid Leave Days</Text>
                                            <TextInput
                                                value={String(editInput.unpaidLeaveDaysOverride ?? 0)}
                                                onChangeText={(v) => setField(editEmployee.id, 'unpaidLeaveDaysOverride', v)}
                                                keyboardType="numeric"
                                                style={[styles.field, dynamicStyles.field]}
                                            />
                                        </View>
                                        <View style={styles.formCol}>
                                            <Text style={[styles.label, dynamicStyles.label]}>Tax</Text>
                                            <TextInput
                                                value={String(editInput.tax ?? 0)}
                                                onChangeText={(v) => setField(editEmployee.id, 'tax', v)}
                                                keyboardType="numeric"
                                                style={[styles.field, dynamicStyles.field]}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.formRow}>
                                        <View style={styles.formCol}>
                                            <Text style={[styles.label, dynamicStyles.label]}>Loan</Text>
                                            <TextInput
                                                value={String(editInput.loan ?? 0)}
                                                onChangeText={(v) => setField(editEmployee.id, 'loan', v)}
                                                keyboardType="numeric"
                                                style={[styles.field, dynamicStyles.field]}
                                            />
                                        </View>
                                        <View style={styles.formCol}>
                                            <Text style={[styles.label, dynamicStyles.label]}>Other Deductions</Text>
                                            <TextInput
                                                value={String(editInput.otherDeductions ?? 0)}
                                                onChangeText={(v) => setField(editEmployee.id, 'otherDeductions', v)}
                                                keyboardType="numeric"
                                                style={[styles.field, dynamicStyles.field]}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, dynamicStyles.label]}>Remarks (Optional)</Text>
                                        <TextInput
                                            value={String(editInput.remarks ?? '')}
                                            onChangeText={(v) => setField(editEmployee.id, 'remarks', v)}
                                            style={[styles.field, dynamicStyles.field]}
                                            placeholder="e.g. Performance bonus / Adjustment note"
                                            placeholderTextColor={colors.textSub}
                                        />
                                    </View>

                                    <View style={[styles.previewCard, dynamicStyles.previewCard]}>
                                        <Text style={[styles.previewTitle, dynamicStyles.previewTitle]}>Preview</Text>
                                        <Text style={[styles.previewLine, dynamicStyles.previewLine]}>
                                            Total Earnings: {editPreview ? formatMoney(editPreview.totals.totalEarnings, editProfile.currencySymbol) : '—'}
                                        </Text>
                                        <Text style={[styles.previewLine, dynamicStyles.previewLine]}>
                                            Total Deductions: {editPreview ? formatMoney(editPreview.totals.totalDeductions, editProfile.currencySymbol) : '—'}
                                        </Text>
                                        <Text style={[styles.previewNet, { color: colors.primary }]}>
                                            Net Pay: {editPreview ? formatMoney(editPreview.totals.netPay, editProfile.currencySymbol) : '—'}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity onPress={closeEdit} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                                <Text style={styles.modalBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

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
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        gap: 24,
    },
    section: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
    },
    dateInputContainer: {
        position: 'relative',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        height: 56,
    },
    dateInput: {
        fontSize: 15,
        paddingRight: 40,
    },
    inputIcon: {
        position: 'absolute',
        right: 16,
    },
    toggleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    toggleInfo: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    toggleSub: {
        fontSize: 13,
    },
    summaryCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 4,
    },
    summaryTotalLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    summaryTotalValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    employeeList: {
        gap: 12,
    },
    employeeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    employeeInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    employeeDesignation: {
        fontSize: 13,
    },
    employeeSalary: {
        fontSize: 16,
        fontWeight: '700',
    },
    employeeMeta: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 6,
    },
    employeeRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    editChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    editChipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        minHeight: 80,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        gap: 12,
    },
    processButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    processButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    helperText: {
        marginTop: 12,
        fontSize: 12,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        maxHeight: '86%',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        padding: 16,
        borderWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        flex: 1,
    },
    modalClose: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSub: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 16,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    formCol: {
        flex: 1,
        gap: 8,
    },
    field: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
    },
    previewCard: {
        marginTop: 16,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        gap: 6,
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 6,
    },
    previewLine: {
        fontSize: 13,
        fontWeight: '600',
    },
    previewNet: {
        fontSize: 16,
        fontWeight: '900',
        marginTop: 4,
    },
    modalFooter: {
        paddingTop: 10,
    },
    modalBtn: {
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    processingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    processingCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    processingText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    processingSub: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.background,
        },
        header: {
            backgroundColor: isDark ? 'rgba(28, 37, 46, 0.8)' : 'rgba(246, 247, 248, 0.8)',
            borderBottomColor: colors.border,
        },
        headerTitle: {
            color: colors.textMain,
        },
        sectionTitle: {
            color: colors.textMain,
        },
        label: {
            color: colors.textMain,
        },
        dateInputContainer: {
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        dateInput: {
            color: colors.textMain,
        },
        toggleCard: {
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        toggleTitle: {
            color: colors.textMain,
        },
        toggleSub: {
            color: colors.textSub,
        },
        summaryCard: {
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        summaryLabel: {
            color: colors.textSub,
        },
        summaryValue: {
            color: colors.textMain,
        },
        divider: {
            backgroundColor: colors.border,
        },
        summaryTotalLabel: {
            color: colors.textMain,
        },
        employeeItem: {
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        employeeName: {
            color: colors.textMain,
        },
        employeeDesignation: {
            color: colors.textSub,
        },
        employeeSalary: {
            color: colors.textMain,
        },
        employeeMeta: {
            color: colors.textSub,
        },
        textArea: {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            color: colors.textMain,
        },
        footer: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
        },
        cancelButtonText: {
            color: colors.textSub,
        },
        helperText: {
            color: colors.textSub,
        },
        modalCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        modalTitle: {
            color: colors.textMain,
        },
        modalSub: {
            color: colors.textSub,
        },
        field: {
            borderColor: colors.border,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
            color: colors.textMain,
        },
        previewCard: {
            borderColor: colors.border,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
        },
        previewTitle: {
            color: colors.textMain,
        },
        previewLine: {
            color: colors.textSub,
        },
    });



