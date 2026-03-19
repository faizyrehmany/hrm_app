import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface MissingTimeModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    colors: any;
    employeeName: string;
    initialDate: string;
    submitting?: boolean; // 🔹 new prop for loading
    initialCheckIn?: string;   // new prop
    initialCheckOut?: string;  // support prefilled check out

} 

export default function MissingTimeModal({
    isVisible,
    onClose,
    onSubmit,
    colors,
    employeeName,
    initialDate,
    initialCheckIn = "",
    initialCheckOut = "",
    submitting = false, // 🔹 include here with default

}: MissingTimeModalProps) {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        onSubmit({ checkIn, checkOut, reason });
        onClose();
    };


    useEffect(() => {
        setCheckIn(initialCheckIn);
        setCheckOut(initialCheckOut);
        setReason("");
    }, [initialCheckIn, initialCheckOut, isVisible]);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.centeredView}
                >
                    <Pressable style={[styles.modalView, { backgroundColor: '#111827', borderColor: '#1f2937' }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Request Missing Time</Text>
                            <TouchableOpacity onPress={onClose}>
                                <MaterialIcons name="close" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.form}>
                            <Label text="Employee" />
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={employeeName}
                                editable={false}
                            />

                            <Label text="Date" />
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={initialDate}
                                editable={false}
                            />


                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Label text="Check In" />
                                    <TextInput
                                        style={styles.input}
                                        value={checkIn}
                                        onChangeText={setCheckIn}
                                        placeholder="HH:MM"
                                        placeholderTextColor="#4b5563"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Label text="Check Out" />
                                    <TextInput
                                        style={styles.input}
                                        value={checkOut}
                                        onChangeText={setCheckOut}
                                        placeholder="HH:MM"
                                        placeholderTextColor="#4b5563"
                                    />
                                </View>
                            </View>

                            <Label text="Reason for Correction" />
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={reason}
                                onChangeText={setReason}
                                placeholder="e.g. Forgot to checkout"
                                placeholderTextColor="#4b5563"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Actions */}
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSubmit}
                                style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Submit Request</Text>}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
}

const Label = ({ text }: { text: string }) => (
    <Text style={styles.labelText}>{text}</Text>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredView: {
        width: '90%',
        maxWidth: 400,
    },
    modalView: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f3f4f6',
    },
    form: {
        gap: 12,
    },
    labelText: {
        color: '#f3f4f6',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#030712',
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 14,
    },
    disabledInput: {
        color: '#6b7280',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 24,
        gap: 20,
    },
    cancelBtn: {
        paddingVertical: 10,
    },
    cancelText: {
        color: '#9ca3af',
        fontWeight: '600',
    },
    submitBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    submitText: {
        color: '#fff',
        fontWeight: '700',
    },
});