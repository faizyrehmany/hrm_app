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
import { createSalaryAdvance, SalaryAdvance } from '../services/advanceSalary';

interface AdvanceSalaryModalProps {
    isVisible: boolean;
    onClose: () => void;
    employeeId: number; // Pass employeeId dynamically
    onSubmit?: () => void; // optional callback

}

export const AdvanceSalaryModal = ({ isVisible, onClose, employeeId, onSubmit }: AdvanceSalaryModalProps) => {
    const [amount, setAmount] = useState('');
    const [deductionDate, setDeductionDate] = useState<Date | undefined>();
    const [showDeductionPicker, setShowDeductionPicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const formatDate = (date?: Date) =>
        date ? date.toLocaleString('default', { month: 'long' }) : '';

    const handleSubmit = async () => {
        console.log("handleSubmit called", { employeeId, amount, deductionDate });

        if (!employeeId) {
            Alert.alert("Error", "Employee ID is not set. Please reload the screen.");
            return;
        }

        if (!amount.trim()) {
            Alert.alert('Validation Error', 'Please enter an amount.');
            return;
        }

        if (!deductionDate) {
            Alert.alert('Validation Error', 'Please select a deduction month.');
            return;
        }

        const parsedAmount = Number(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid amount.');
            return;
        }

        const payload: SalaryAdvance = {
            employeeId: employeeId, // now guaranteed
            amount: parsedAmount,
            deductFromMonth: deductionDate.getMonth() + 1,
            isRecovered: true,
            status: "pending"
        };

        console.log("Sending Salary Advance:", payload); // log before API call

        try {
            setSubmitting(true);
            await createSalaryAdvance(payload);
            Alert.alert("Success", "Advance salary request submitted successfully.");

            // reset form
            setAmount('');
            setDeductionDate(undefined);

            onClose(); // close modal

            // ✅ notify parent to reload table
            if (onSubmit) onSubmit();
        } catch (error: any) {
            console.log("Salary Advance Error:", error);
            Alert.alert("Error", error?.message || "Failed to submit advance salary request.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Request Advance Salary</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 15000"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <Text style={styles.label}>Deduction Month</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                            onPress={() => setShowDeductionPicker(true)}
                        >
                            <Text style={{ color: '#fff' }}>
                                {deductionDate ? formatDate(deductionDate) : 'Select Month'}
                            </Text>
                            <Text style={{ color: '#94a3b8' }}>📅</Text>
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

            {showDeductionPicker && (
                <DateTimePicker
                    value={deductionDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') {
                            setShowDeductionPicker(false);
                        }

                        if (selectedDate) {
                            setDeductionDate(selectedDate);
                        }
                    }}
                />
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', maxWidth: 400, backgroundColor: '#0b1120', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
    title: { color: '#fff', fontSize: 18, fontWeight: '700' },
    closeIcon: { color: '#94a3b8', fontSize: 18 },
    body: { padding: 20, maxHeight: 300 },
    label: { color: '#f1f5f9', marginBottom: 8 },
    input: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, padding: 12, color: '#fff', marginBottom: 16 },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, gap: 12 },
    cancelButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    cancelText: { color: '#fff' },
    submitButton: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    submitText: { color: '#fff' },
});