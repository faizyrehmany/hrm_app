import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    StatusBar as NativeStatusBar,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createLeaveRequest } from '../services/leave';
import { SessionManager } from '../services/SessionManager';

const LEAVE_TYPES = [
    { value: 'sick', label: 'Sick Leave' },
    { value: 'vacation', label: 'Vacation' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' },
];

export default function ApplyLeaveScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [selectedLeaveType, setSelectedLeaveType] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [reason, setReason] = useState('');
    const [totalDays, setTotalDays] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const dynamicStyles = createDynamicStyles(colors, isDark);

    useEffect(() => {
        if (startDate && endDate) {
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setTotalDays(isHalfDay ? 0.5 : diffDays);
        } else {
            setTotalDays(0);
        }
    }, [startDate, endDate, isHalfDay]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatDateInput = (date: Date) => {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const handleStartDateChange = (event: any, selectedDate: Date | undefined) => {
        if (Platform.OS === 'android') {
            setShowStartDatePicker(false);
        }
        if (selectedDate) {
            setStartDate(selectedDate);
            if (endDate && selectedDate > endDate) {
                setEndDate(selectedDate);
            }
        }
    };

    const handleEndDateChange = (event: any, selectedDate: Date | undefined) => {
        if (Platform.OS === 'android') {
            setShowEndDatePicker(false);
        }
        if (selectedDate && startDate && selectedDate >= startDate) {
            setEndDate(selectedDate);
        } else if (selectedDate && !startDate) {
            Alert.alert('Error', 'Please select start date first');
        }
    };

    const handleSubmit = async () => {
        if (!selectedLeaveType) {
            Alert.alert('Error', 'Please select a leave type');
            return;
        }
        if (!startDate || !endDate) {
            Alert.alert('Error', 'Please select both start and end dates');
            return;
        }
        if (!reason.trim()) {
            Alert.alert('Error', 'Please provide a reason for your leave');
            return;
        }

        setIsLoading(true);
        try {
            // Get logged-in user
            const user = await SessionManager
            .getUser(); // Must return { id: number, ... }
            if (!user || !user.id) {
                Alert.alert('Error', 'Unable to identify user. Please login again.');
                setIsLoading(false);
                return;
            }

            const payload = {
                employeeId: user.id,
                startDate: startDate!.toISOString(),
                endDate: endDate!.toISOString(),
                leaveType: LEAVE_TYPES.find((t) => t.value === selectedLeaveType)?.label || selectedLeaveType,
                reason: reason.trim(),
            };

            const result = await createLeaveRequest(payload);

            if (result) {
                Alert.alert('Success', 'Leave request submitted successfully', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Error', 'Failed to submit leave request. Please try again.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>New Request</Text>
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
                    {/* Leave Type Section */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Leave Type</Text>
                        <View style={[styles.selectContainer, dynamicStyles.selectContainer]}>
                            <TouchableOpacity
                                style={[styles.selectButton, dynamicStyles.selectButton]}
                                onPress={() => {
                                    // Show picker modal
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
                                        dynamicStyles.selectText,
                                        !selectedLeaveType && { color: colors.textSub },
                                    ]}
                                >
                                    {selectedLeaveType
                                        ? LEAVE_TYPES.find((t) => t.value === selectedLeaveType)?.label
                                        : 'Select category'}
                                </Text>
                                <MaterialIcons name="expand-more" size={24} color={colors.textSub} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Date Range Section */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Duration</Text>
                        <View style={styles.dateRow}>
                            <View style={styles.dateInputGroup}>
                                <Text style={[styles.dateLabel, dynamicStyles.dateLabel]}>From</Text>
                                <TouchableOpacity
                                    style={[styles.dateInput, dynamicStyles.dateInput]}
                                    onPress={() => setShowStartDatePicker(true)}
                                >
                                    <Text
                                        style={[
                                            styles.dateInputText,
                                            dynamicStyles.dateInputText,
                                            !startDate && { color: colors.textSub },
                                        ]}
                                    >
                                        {startDate ? formatDateInput(startDate) : 'Start Date'}
                                    </Text>
                                </TouchableOpacity>
                                {showStartDatePicker && (
                                    <DateTimePicker
                                        value={startDate || new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={handleStartDateChange}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </View>
                            <View style={styles.dateInputGroup}>
                                <Text style={[styles.dateLabel, dynamicStyles.dateLabel]}>To</Text>
                                <TouchableOpacity
                                    style={[styles.dateInput, dynamicStyles.dateInput]}
                                    onPress={() => {
                                        if (!startDate) {
                                            Alert.alert('Error', 'Please select start date first');
                                            return;
                                        }
                                        setShowEndDatePicker(true);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dateInputText,
                                            dynamicStyles.dateInputText,
                                            !endDate && { color: colors.textSub },
                                        ]}
                                    >
                                        {endDate ? formatDateInput(endDate) : 'End Date'}
                                    </Text>
                                </TouchableOpacity>
                                {showEndDatePicker && (
                                    <DateTimePicker
                                        value={endDate || startDate || new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={handleEndDateChange}
                                        minimumDate={startDate || new Date()}
                                    />
                                )}
                            </View>
                        </View>
                        <Text style={[styles.totalDaysText, { color: colors.primary }]}>
                            Total: {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
                        </Text>
                    </View>

                    {/* Half Day Toggle */}
                    {/* <View style={[styles.toggleCard, dynamicStyles.toggleCard]}>
                        <View style={styles.toggleInfo}>
                            <Text style={[styles.toggleTitle, dynamicStyles.toggleTitle]}>Half Day Leave</Text>
                            <Text style={[styles.toggleSub, dynamicStyles.toggleSub]}>Apply for a half day absence</Text>
                        </View>
                        <Switch
                            trackColor={{ false: isDark ? colors.border : '#d1d5db', true: colors.primary }}
                            thumbColor={'#ffffff'}
                            ios_backgroundColor={isDark ? colors.border : '#d1d5db'}
                            onValueChange={setIsHalfDay}
                            value={isHalfDay}
                        />
                    </View> */}

                    {/* Reason Section */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Reason</Text>
                        <TextInput
                            style={[styles.textArea, dynamicStyles.textArea]}
                            placeholder="Please describe the reason for your leave..."
                            placeholderTextColor={colors.textSub}
                            value={reason}
                            onChangeText={setReason}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Attachment Section */}
                    {/* <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Attachments (Optional)</Text>
                        <TouchableOpacity style={[styles.uploadArea, dynamicStyles.uploadArea]}>
                            <View style={styles.uploadContent}>
                                <View style={[styles.uploadIcon, { backgroundColor: `${colors.primary}20` }]}>
                                    <MaterialIcons name="upload-file" size={24} color={colors.primary} />
                                </View>
                                <Text style={[styles.uploadText, dynamicStyles.uploadText]}>
                                    <Text style={{ color: colors.primary }}>Click to upload</Text> or drag and drop
                                </Text>
                                <Text style={[styles.uploadSubtext, dynamicStyles.uploadSubtext]}>
                                    PDF, PNG, JPG (max. 5MB)
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View> */}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer Actions */}
            <View style={[styles.footer, dynamicStyles.footer]}>
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Request</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.cancelButton, dynamicStyles.cancelButton]}
                    onPress={() => router.back()}
                    disabled={isLoading}
                >
                    <Text style={[styles.cancelButtonText, dynamicStyles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
            </View>
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
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    selectContainer: {
        position: 'relative',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        height: 56,
    },
    selectText: {
        fontSize: 16,
        fontWeight: '400',
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateInputGroup: {
        flex: 1,
        gap: 6,
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    dateInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        height: 56,
        justifyContent: 'center',
    },
    dateInputText: {
        fontSize: 16,
        fontWeight: '400',
    },
    totalDaysText: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'right',
        marginTop: 4,
        marginRight: 4,
    },
    toggleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    toggleInfo: {
        flex: 1,
        gap: 4,
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    toggleSub: {
        fontSize: 12,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        minHeight: 120,
    },
    uploadArea: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadContent: {
        alignItems: 'center',
        gap: 12,
    },
    uploadIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    uploadSubtext: {
        fontSize: 12,
        marginTop: 4,
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        gap: 12,
        backgroundColor: 'transparent',
    },
    submitButton: {
        width: '100%',
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    cancelButton: {
        width: '100%',
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
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
        label: {
            color: colors.textMain,
        },
        selectContainer: {
            backgroundColor: colors.surface,
        },
        selectButton: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        selectText: {
            color: colors.textMain,
        },
        dateLabel: {
            color: colors.textSub,
        },
        dateInput: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        dateInputText: {
            color: colors.textMain,
        },
        toggleCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        toggleTitle: {
            color: colors.textMain,
        },
        toggleSub: {
            color: colors.textSub,
        },
        textArea: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textMain,
        },
        uploadArea: {
            backgroundColor: isDark ? `${colors.surface}80` : `${colors.surface}80`,
            borderColor: colors.border,
        },
        uploadText: {
            color: colors.textMain,
        },
        uploadSubtext: {
            color: colors.textSub,
        },
        footer: {
            backgroundColor: isDark ? `${colors.background}E6` : `${colors.background}E6`,
            borderTopColor: colors.border,
        },
        cancelButton: {
            backgroundColor: 'transparent',
        },
        cancelButtonText: {
            color: colors.textSub,
        },
    });



