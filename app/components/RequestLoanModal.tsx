import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { createLoan } from '../services/loan';
import { SessionManager } from '../services/SessionManager';

interface LoanModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export const LoanModal = ({ isVisible, onClose, onSubmit }: LoanModalProps) => {
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [totalAmount, setTotalAmount] = useState('');
    const [monthlyInstallment, setMonthlyInstallment] = useState('');
    const [remainingAmount, setRemainingAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);


    const formatDate = (date?: Date) => (date ? date.toLocaleDateString() : '');

    const handleSubmit = async () => {
        try {
            // Get current user
            const user = await SessionManager.getUser();
            if (!user?.employeeId) {
                Alert.alert("Error", "Employee ID is not set. Please reload the screen.");
                return;
            }

            // Validation
            if (!totalAmount?.trim()) {
                Alert.alert('Validation Error', 'Please enter total amount.');
                return;
            }
            if (!monthlyInstallment?.trim()) {
                Alert.alert('Validation Error', 'Please enter monthly installment.');
                return;
            }
            if (!remainingAmount?.trim()) {
                Alert.alert('Validation Error', 'Please enter remaining amount.');
                return;
            }
            if (!startDate) {
                Alert.alert('Validation Error', 'Please select a start date.');
                return;
            }
            if (!endDate) {
                Alert.alert('Validation Error', 'Please select an end date.');
                return;
            }

            // Parse numbers
            const parsedTotal = Number(totalAmount);
            const parsedInstallment = Number(monthlyInstallment);
            const parsedRemaining = Number(remainingAmount);

            if (isNaN(parsedTotal) || parsedTotal <= 0) {
                Alert.alert('Validation Error', 'Please enter a valid total amount.');
                return;
            }
            if (isNaN(parsedInstallment) || parsedInstallment < 0) {
                Alert.alert('Validation Error', 'Please enter a valid monthly installment.');
                return;
            }
            if (isNaN(parsedRemaining) || parsedRemaining < 0) {
                Alert.alert('Validation Error', 'Please enter a valid remaining amount.');
                return;
            }

            // Prepare payload
            const payload = {
                employeeId: user.employeeId,
                totalAmount: parsedTotal,
                monthlyInstallment: parsedInstallment,
                remainingAmount: parsedRemaining,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                status: 'pending',
            };

            console.log("Submitting Loan:", payload);

            // Call API
            setSubmitting(true);
            await createLoan(payload);

            Alert.alert("Success", "Loan request submitted successfully.");

            // Reset form if needed
            setTotalAmount('');
            setMonthlyInstallment('');
            setRemainingAmount('');
            setStartDate(undefined);
            setEndDate(undefined);

            onClose();
            if (onSubmit) onSubmit(); // refresh parent table
        } catch (error: any) {
            console.error("Loan creation failed:", error);
            Alert.alert("Error", error?.message || "Failed to submit loan request.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Request Loan</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Total Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="50000"
                            placeholderTextColor="#64748b"

                            keyboardType="numeric"
                            value={totalAmount}
                            onChangeText={setTotalAmount}
                        />
                        <Text style={styles.label}>Monthly Installment</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="5000"
                            placeholderTextColor="#64748b"

                            keyboardType="numeric"
                            value={monthlyInstallment}
                            onChangeText={setMonthlyInstallment}
                        />
                        <Text style={styles.label}>Remaining Amount</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="50000"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            value={remainingAmount}
                            onChangeText={setRemainingAmount}
                        />

                        <Text style={styles.label}>Start Date</Text>
                        <TouchableOpacity style={styles.input} onPress={() => setShowStartPicker(true)}>
                            <Text style={styles.inputText}>
                                {startDate ? formatDate(startDate) : 'Select Start Date'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.input} onPress={() => setShowEndPicker(true)}>
                            <Text style={styles.inputText}>
                                {endDate ? formatDate(endDate) : 'Select End Date'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, { opacity: submitting ? 0.6 : 1 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <Text style={styles.submitText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>

            {showStartPicker && (
                <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(e, d) => {
                        setShowStartPicker(Platform.OS === 'ios');
                        if (d) setStartDate(d);
                    }}
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(e, d) => {
                        setShowEndPicker(Platform.OS === 'ios');
                        if (d) setEndDate(d);
                    }}
                />
            )}
        </Modal>
    );
};

// Styles can be reused or slightly tweaked
const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', maxWidth: 400, backgroundColor: '#0b1120', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
    title: { color: '#fff', fontSize: 18, fontWeight: '700' },
    closeIcon: { color: '#94a3b8', fontSize: 18 },
    body: { padding: 20, maxHeight: 450 },
    label: { color: '#f1f5f9', marginBottom: 8 },
    input: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, padding: 12, color: '#fff', marginBottom: 16 },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, gap: 12 },
    cancelButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    cancelText: { color: '#fff' },
    submitButton: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    submitText: { color: '#fff' },
    inputText: {
        color: '#64748b',
    },
});