import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { createLeaveRequest } from '../services/leave';
import { SessionManager } from '../services/SessionManager';

interface LeaveModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({ visible, onClose, onSubmit }) => {

    const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [reason, setReason] = useState('');
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const LEAVE_TYPES = [
        { label: 'Casual Leave', value: 'CASUAL' },
        { label: 'Medical Leave', value: 'MEDICAL' },
    ];

    const handleSubmit = async () => {

        if (!selectedLeaveType || !fromDate || !toDate) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        try {

            setIsSubmitting(true);

            const user = await SessionManager.getUser();

            if (!user || !user.id) {
                Alert.alert('Error', 'Unable to identify user. Please login again.');
                setIsSubmitting(false);
                return;
            }

            const payload = {
                employeeId: user.id,
                startDate: fromDate.toISOString(),
                endDate: toDate.toISOString(),
                leaveType: selectedLeaveType,
                reason
            };

            const result = await createLeaveRequest(payload);

            if (result) {

                onSubmit({
                    leaveId: result.leaveId,
                    status: result.status,
                    leaveType: selectedLeaveType,
                    startDate: fromDate,
                    endDate: toDate,
                    reason: reason
                });

                setSelectedLeaveType(null);
                setFromDate(null);
                setToDate(null);
                setReason('');

                onClose();
            } else {
                Alert.alert('Error', 'Failed to submit leave request');
            }

        } catch (error: any) {

            console.error('Error submitting leave:', error);
            Alert.alert('Error', error.message || 'Something went wrong');

        } finally {
            setIsSubmitting(false);
        }
    };

    return (

        <Modal visible={visible} animationType="slide" transparent>

            <View style={styles.overlay}>

                <View style={styles.modalContainer}>

                    {/* Header */}

                    <View style={styles.header}>
                        <Text style={styles.headerText}>New Leave Request</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color="#111" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>

                        {/* Leave Type */}

                        <Text style={styles.label}>Leave Type *</Text>

                        <View style={styles.selectContainer}>
                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => {

                                    Alert.alert(
                                        'Select Leave Type',
                                        '',
                                        LEAVE_TYPES.map((type) => ({
                                            text: type.label,
                                            onPress: () => setSelectedLeaveType(type.value),
                                        })).concat([{ text: 'Cancel', style: 'cancel' }])
                                    );

                                }}
                            >

                                <Text
                                    style={[
                                        styles.selectText,
                                        !selectedLeaveType && { color: '#9ca3af' }
                                    ]}
                                >
                                    {selectedLeaveType
                                        ? LEAVE_TYPES.find((t) => t.value === selectedLeaveType)?.label
                                        : 'Select leave type'}
                                </Text>

                                <MaterialIcons name="expand-more" size={24} color="#9ca3af" />

                            </TouchableOpacity>
                        </View>

                        {/* Dates */}

                        <View style={styles.row}>

                            <View style={{ flex: 1, marginRight: 8 }}>

                                <Text style={styles.label}>From Date *</Text>

                                <TouchableOpacity
                                    onPress={() => setShowFromPicker(true)}
                                    style={styles.input}
                                >
                                    <Text style={{ color: fromDate ? '#fff' : '#64748b' }}>
                                        {fromDate ? fromDate.toDateString() : 'Select'}
                                    </Text>
                                </TouchableOpacity>

                                {showFromPicker && (

                                    <DateTimePicker
                                        value={fromDate || new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                        onChange={(e, date) => {
                                            setShowFromPicker(false);
                                            if (date) setFromDate(date);
                                        }}
                                    />

                                )}

                            </View>

                            <View style={{ flex: 1 }}>

                                <Text style={styles.label}>To Date *</Text>

                                <TouchableOpacity
                                    onPress={() => setShowToPicker(true)}
                                    style={styles.input}
                                >
                                    <Text style={{ color: toDate ? '#fff' : '#64748b' }}>
                                        {toDate ? toDate.toDateString() : 'Select'}
                                    </Text>
                                </TouchableOpacity>

                                {showToPicker && (

                                    <DateTimePicker
                                        value={toDate || new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                        onChange={(e, date) => {
                                            setShowToPicker(false);
                                            if (date) setToDate(date);
                                        }}
                                    />

                                )}

                            </View>

                        </View>

                        {/* Reason */}

                        <Text style={styles.label}>Reason</Text>

                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Optional details regarding your leave..."
                            placeholderTextColor="#64748b"
                            value={reason}
                            onChangeText={setReason}
                            multiline
                        />

                        {/* Buttons */}

                        <View style={styles.buttonsRow}>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >

                                {isSubmitting
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.submitText}>Submit Request</Text>
                                }

                            </TouchableOpacity>

                        </View>

                    </ScrollView>

                </View>

            </View>

        </Modal>

    );
};

const styles = StyleSheet.create({

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 16
    },

    modalContainer: {
        backgroundColor: '#0b1120', // dark background
        borderRadius: 12,
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: '#1e293b', // subtle border like attendance modal
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },

    headerText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff'
    },

    content: {
        padding: 16,
        gap: 12
    },

    label: {
        fontWeight: '600',
        marginBottom: 4,
        color: '#f1f5f9' // light text
    },

    input: {
        borderWidth: 1,
        borderColor: '#1e293b',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#020617',
        color: '#fff' // text inside input
    },

    row: {
        flexDirection: 'row',
        marginBottom: 8
    },

    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 12
    },

    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        backgroundColor: '#020617'
    },

    cancelText: {
        fontWeight: '700',
        color: '#fff'
    },

    submitButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#2563eb'
    },

    submitText: {
        fontWeight: '700',
        color: '#fff'
    },

    selectContainer: {
        position: 'relative'
    },

    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#1e293b',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        height: 56,
        backgroundColor: '#020617'
    },

    selectText: {
        fontSize: 16,
        fontWeight: '400',
        color: '#fff'
    }

});