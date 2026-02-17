import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
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

export default function OvertimeRequestScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startTime, setStartTime] = useState('18:00');
    const [endTime, setEndTime] = useState('20:30');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('2 hrs 30 mins');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        calculateDuration();
    }, [startTime, endTime]);

    const calculateDuration = () => {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60; // Handle next day
        }
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        setDuration(`${hours} hrs ${minutes} mins`);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
        if (!description.trim()) {
            Alert.alert('Error', 'Please provide a task/project description.');
            return;
        }

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            Alert.alert('Success', 'Overtime request submitted successfully', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }, 1000);
    };

    const dynamicStyles = createDynamicStyles(colors, isDark);

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Overtime Request</Text>
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
                    {/* Section Header */}
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Schedule Details</Text>

                    {/* Date Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Overtime Date</Text>
                        <TouchableOpacity
                            style={[styles.dateInputContainer, dynamicStyles.dateInputContainer]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <TextInput
                                style={[styles.dateInput, dynamicStyles.dateInput]}
                                value={formatDate(selectedDate)}
                                editable={false}
                                placeholder="Select date"
                                placeholderTextColor={colors.textSub}
                            />
                            <MaterialIcons name="calendar-month" size={24} color={colors.textSub} style={styles.inputIcon} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                    </View>

                    {/* Time Inputs */}
                    <View style={styles.timeInputsRow}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, dynamicStyles.label]}>Start Time</Text>
                            <TextInput
                                style={[styles.timeInput, dynamicStyles.timeInput]}
                                value={startTime}
                                onChangeText={(text) => {
                                    // Validate time format HH:MM
                                    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                                    if (text.length <= 5 && (text === '' || timeRegex.test(text) || text.match(/^\d{1,2}:?\d{0,2}$/))) {
                                        setStartTime(text);
                                    }
                                }}
                                placeholder="HH:MM"
                                placeholderTextColor={colors.textSub}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, dynamicStyles.label]}>End Time</Text>
                            <TextInput
                                style={[styles.timeInput, dynamicStyles.timeInput]}
                                value={endTime}
                                onChangeText={(text) => {
                                    // Validate time format HH:MM
                                    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                                    if (text.length <= 5 && (text === '' || timeRegex.test(text) || text.match(/^\d{1,2}:?\d{0,2}$/))) {
                                        setEndTime(text);
                                    }
                                }}
                                placeholder="HH:MM"
                                placeholderTextColor={colors.textSub}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Duration Calculation Card */}
                    <View style={[styles.durationCard, dynamicStyles.durationCard]}>
                        <View style={styles.durationContent}>
                            <Text style={[styles.durationTitle, dynamicStyles.durationTitle]}>Expected Duration</Text>
                            <Text style={[styles.durationSubtitle, dynamicStyles.durationSubtitle]}>
                                Calculated from start and end time
                            </Text>
                            <Text style={[styles.durationValue, { color: colors.primary }]}>{duration}</Text>
                        </View>
                        <View style={[styles.durationIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                            <MaterialIcons name="schedule" size={32} color={colors.primary} />
                        </View>
                    </View>

                    <View style={[styles.divider, dynamicStyles.divider]} />

                    {/* Section Header: Context */}
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Request Context</Text>

                    {/* Text Area */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, dynamicStyles.label]}>Task/Project Description</Text>
                            <Text style={[styles.charCount, dynamicStyles.charCount]}>{description.length}/500</Text>
                        </View>
                        <TextInput
                            style={[styles.textArea, dynamicStyles.textArea]}
                            placeholder="Please describe the task or project requiring overtime..."
                            placeholderTextColor={colors.textSub}
                            value={description}
                            onChangeText={(text) => {
                                if (text.length <= 500) {
                                    setDescription(text);
                                }
                            }}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Footer */}
            <View style={[styles.footer, dynamicStyles.footer]}>
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit OT Request</Text>
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
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginTop: 8,
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
    timeInputsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    timeInput: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 15,
        fontSize: 16,
        height: 56,
    },
    inputIcon: {
        marginLeft: 8,
    },
    durationCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    durationContent: {
        flex: 2,
        gap: 4,
    },
    durationTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    durationSubtitle: {
        fontSize: 14,
    },
    durationValue: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 4,
    },
    durationIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 15,
        fontSize: 16,
        minHeight: 140,
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
    submitButton: {
        width: '100%',
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        color: '#ffffff',
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
        sectionTitle: {
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
        timeInput: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textMain,
        },
        durationCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        durationTitle: {
            color: colors.textMain,
        },
        durationSubtitle: {
            color: colors.textSub,
        },
        divider: {
            backgroundColor: colors.border,
        },
        textArea: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textMain,
        },
        footer: {
            backgroundColor: isDark ? `${colors.background}95` : `${colors.background}95`,
            borderTopColor: colors.border,
        },
    });



