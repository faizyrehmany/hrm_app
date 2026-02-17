import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StatusBar as NativeStatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';

export default function RegularizeRequestScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [punchType, setPunchType] = useState<'check-in' | 'check-out'>('check-in');
    const [correctionTime, setCorrectionTime] = useState('09:30');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const dynamicStyles = createDynamicStyles(colors, isDark);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ');
    };

    const handleDateChange = (event: any, selectedDate: Date | undefined) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setSelectedDate(selectedDate);
        }
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Error', 'Please provide a reason for the request.');
            return;
        }

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            Alert.alert('Success', 'Regularization request submitted successfully', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }, 1000);
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Regularization Request</Text>
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
                    {/* Date Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Select Date</Text>
                        <TouchableOpacity
                            style={[styles.dateInputContainer, dynamicStyles.dateInputContainer]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <TextInput
                                style={[styles.dateInput, dynamicStyles.dateInput]}
                                value={formatDate(selectedDate)}
                                editable={false}
                                placeholder="DD / MM / YYYY"
                                placeholderTextColor={colors.textSub}
                            />
                            <MaterialIcons name="calendar-today" size={24} color={colors.textSub} style={styles.inputIcon} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                    </View>

                    {/* Punch Type (Segmented Buttons) */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Punch Type</Text>
                        <View style={[styles.segmentedContainer, dynamicStyles.segmentedContainer]}>
                            <TouchableOpacity
                                style={[
                                    styles.segmentedButton,
                                    punchType === 'check-in' && [styles.segmentedButtonActive, dynamicStyles.segmentedButtonActive],
                                ]}
                                onPress={() => setPunchType('check-in')}
                            >
                                <Text
                                    style={[
                                        styles.segmentedButtonText,
                                        dynamicStyles.segmentedButtonText,
                                        punchType === 'check-in' && { color: colors.primary },
                                    ]}
                                >
                                    Check-in
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.segmentedButton,
                                    punchType === 'check-out' && [styles.segmentedButtonActive, dynamicStyles.segmentedButtonActive],
                                ]}
                                onPress={() => setPunchType('check-out')}
                            >
                                <Text
                                    style={[
                                        styles.segmentedButtonText,
                                        dynamicStyles.segmentedButtonText,
                                        punchType === 'check-out' && { color: colors.primary },
                                    ]}
                                >
                                    Check-out
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Correction Time */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Correction Time</Text>
                        <View style={[styles.timeInputContainer, dynamicStyles.timeInputContainer]}>
                            <TextInput
                                style={[styles.timeInput, dynamicStyles.timeInput]}
                                value={correctionTime}
                                onChangeText={(text) => {
                                    // Validate time format HH:MM
                                    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                                    if (text.length <= 5 && (text === '' || timeRegex.test(text) || text.match(/^\d{1,2}:?\d{0,2}$/))) {
                                        setCorrectionTime(text);
                                    }
                                }}
                                placeholder="HH:MM"
                                placeholderTextColor={colors.textSub}
                                keyboardType="numeric"
                            />
                            <MaterialIcons name="schedule" size={24} color={colors.textSub} style={styles.inputIcon} />
                        </View>
                    </View>

                    {/* Reason Text Area */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, dynamicStyles.label]}>Reason for Request</Text>
                            <Text style={[styles.charCount, dynamicStyles.charCount]}>{reason.length}/250</Text>
                        </View>
                        <TextInput
                            style={[styles.textArea, dynamicStyles.textArea]}
                            placeholder="Please explain why the punch is missing or incorrect..."
                            placeholderTextColor={colors.textSub}
                            value={reason}
                            onChangeText={(text) => {
                                if (text.length <= 250) {
                                    setReason(text);
                                }
                            }}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            maxLength={250}
                        />
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Footer */}
            <View style={[styles.footer, dynamicStyles.footer]}>
                <TouchableOpacity
                    style={[styles.cancelButton, dynamicStyles.cancelButton]}
                    onPress={() => router.back()}
                    disabled={isLoading}
                >
                    <Text style={[styles.cancelButtonText, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
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
        padding: 16,
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    charCount: {
        fontSize: 12,
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 15,
        height: 56,
    },
    dateInput: {
        flex: 1,
        fontSize: 16,
        paddingRight: 12,
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 15,
        height: 56,
    },
    timeInput: {
        flex: 1,
        fontSize: 16,
        paddingRight: 12,
    },
    inputIcon: {
        marginLeft: 8,
    },
    segmentedContainer: {
        flexDirection: 'row',
        height: 48,
        padding: 4,
        borderRadius: 8,
    },
    segmentedButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    segmentedButtonActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentedButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 15,
        fontSize: 16,
        minHeight: 100,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 8,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    submitButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    submitButtonText: {
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
        label: {
            color: colors.textMain,
        },
        charCount: {
            color: colors.textSub,
        },
        dateInputContainer: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        dateInput: {
            color: colors.textMain,
        },
        timeInputContainer: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        timeInput: {
            color: colors.textMain,
        },
        segmentedContainer: {
            backgroundColor: isDark ? colors.border : '#f3f4f6',
        },
        segmentedButtonActive: {
            backgroundColor: colors.surface,
        },
        segmentedButtonText: {
            color: colors.textSub,
        },
        textArea: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textMain,
        },
        footer: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
        },
        cancelButton: {
            borderColor: 'transparent',
            backgroundColor: 'transparent',
        },
    });



