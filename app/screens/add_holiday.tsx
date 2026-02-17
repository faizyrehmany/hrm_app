import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    StatusBar as NativeStatusBar,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

import { CustomToast } from '../components/CustomToast';
import { addHoliday } from '../services/holidays';

// Static colors that don't change with theme
const STATIC_COLORS = {
    emerald: '#10b981',
};

const HOLIDAY_TYPES = ['Religious', 'National Holiday', 'Regional Holiday', 'International Holiday', 'Religious Observance'];

export default function AddHolidayScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const params = useLocalSearchParams();
    const isEditMode = !!params.id;

    // Form States
    const [name, setName] = useState(params.name ? String(params.name) : '');
    const [date, setDate] = useState<Date>(params.date ? new Date(String(params.date)) : new Date());
    const [type, setType] = useState(params.type ? String(params.type) : 'Religious');
    const [description, setDescription] = useState(params.description ? String(params.description) : '');
    const [isRecurring, setIsRecurring] = useState(params.isRecurring ? params.isRecurring === 'true' : false);
    const [isPaid, setIsPaid] = useState(params.isPaid ? params.isPaid === 'true' : true);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
        params.departments ? String(params.departments).split(',') : ['All']
    );
    const [isActive, setIsActive] = useState(params.isActive ? params.isActive === 'true' : true);
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Toast State
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const triggerToast = (msg: string, type: 'success' | 'error') => {
        setToastMessage(msg);
        setToastType(type);
        setToastVisible(true);
    };

    const DEPARTMENTS = ['All', 'IT', 'HR', 'Finance', 'Sales'];

    const dynamicStyles = createDynamicStyles(colors, isDark);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleDateChange = (event: any, selectedDate: Date | undefined) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleSave = async () => {
        if (!name || !type) {
            triggerToast('Please fill in Holiday Name and Type.', 'error');
            return;
        }

        setIsLoading(true);

        const payload = {
            date: date.toISOString(),
            title: name,
            type: Math.max(0, HOLIDAY_TYPES.indexOf(type)), // Map type string to index, default 0
            description: description,
            isPaid: isPaid,
            isRecurring: isRecurring,
            isActive: isActive,
            appliesToAllDepartments: selectedDepartments.includes('All'),
            departmentMask: 0,
        };

        try {
            const result = await addHoliday(payload);

            if (result.success) {
                triggerToast(`Holiday ${isEditMode ? 'Updated' : 'Created'} Successfully`, 'success');
                setTimeout(() => {
                    router.back();
                }, 1500);
            } else {
                triggerToast('Failed to save holiday', 'error');
            }
        } catch (error) {
            triggerToast('An error occurred', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CustomToast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />

            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>
                    {isEditMode ? 'Edit Holiday' : 'Add Holiday'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Context Hint */}
                    <View style={styles.contextContainer}>
                        <Text style={[styles.contextLabel, dynamicStyles.contextLabel]}>
                            {isEditMode ? 'Update Entry' : 'New Entry'}
                        </Text>
                        <Text style={[styles.contextTitle, dynamicStyles.contextTitle]}>
                            {isEditMode ? 'Edit existing holiday' : 'Create a new holiday'}
                        </Text>
                        <Text style={[styles.contextSub, dynamicStyles.contextSub]}>
                            {isEditMode
                                ? 'Update the details for this holiday.'
                                : 'Define the details for the new holiday below.'}
                        </Text>
                    </View>

                    {/* Holiday Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>
                            Holiday Name <Text style={{ color: colors.primary }}>*</Text>
                        </Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, dynamicStyles.input]}
                                placeholder="e.g. Eid-ul-Fitr"
                                placeholderTextColor={colors.textSub}
                                value={name}
                                onChangeText={setName}
                            />
                            <MaterialIcons name="event" size={20} color={colors.textSub} style={styles.inputIcon} />
                        </View>
                    </View>

                    {/* Date */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>
                            Date <Text style={{ color: colors.primary }}>*</Text>
                        </Text>
                        <TouchableOpacity
                            style={[styles.inputContainer, styles.dateInputContainer]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <TextInput
                                style={[styles.input, dynamicStyles.input, styles.dateInput]}
                                placeholder="Select date"
                                placeholderTextColor={colors.textSub}
                                value={formatDate(date)}
                                editable={false}
                            />
                            <MaterialIcons name="calendar-today" size={20} color={colors.textSub} style={styles.inputIcon} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                            />
                        )}
                        {Platform.OS === 'ios' && showDatePicker && (
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(false)}
                                style={styles.iosDatePickerDone}
                            >
                                <Text style={{ color: colors.primary }}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Holiday Type */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>
                            Holiday Type <Text style={{ color: colors.primary }}>*</Text>
                        </Text>
                        <View style={styles.typeContainer}>
                            {HOLIDAY_TYPES.map((holidayType) => (
                                <TouchableOpacity
                                    key={holidayType}
                                    style={[
                                        styles.typeChip,
                                        dynamicStyles.typeChip,
                                        type === holidayType && [
                                            styles.typeChipActive,
                                            { backgroundColor: colors.primary + '1A', borderColor: colors.primary },
                                        ],
                                    ]}
                                    onPress={() => setType(holidayType)}
                                >
                                    <Text
                                        style={[
                                            styles.typeChipText,
                                            dynamicStyles.typeChipText,
                                            type === holidayType && { color: colors.primary },
                                        ]}
                                    >
                                        {holidayType}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Description</Text>
                        <TextInput
                            style={[styles.textArea, dynamicStyles.textArea]}
                            placeholder="Enter holiday description..."
                            placeholderTextColor={colors.textSub}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Affected Departments */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Affected Departments</Text>
                        <View style={styles.departmentContainer}>
                            {DEPARTMENTS.map((dept) => {
                                const isSelected = selectedDepartments.includes(dept);
                                return (
                                    <TouchableOpacity
                                        key={dept}
                                        style={[
                                            styles.departmentChip,
                                            dynamicStyles.departmentChip,
                                            isSelected && [
                                                styles.departmentChipActive,
                                                { backgroundColor: colors.primary, borderColor: colors.primary },
                                            ],
                                        ]}
                                        onPress={() => {
                                            if (dept === 'All') {
                                                setSelectedDepartments(['All']);
                                            } else {
                                                const newSelection = selectedDepartments.includes('All')
                                                    ? [dept]
                                                    : isSelected
                                                        ? selectedDepartments.filter((d) => d !== dept)
                                                        : [...selectedDepartments.filter((d) => d !== 'All'), dept];
                                                setSelectedDepartments(newSelection.length > 0 ? newSelection : ['All']);
                                            }
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.departmentChipText,
                                                dynamicStyles.departmentChipText,
                                                isSelected && { color: '#FFFFFF' },
                                            ]}
                                        >
                                            {dept}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Recurring Holiday */}
                    <View style={[styles.toggleCard, dynamicStyles.toggleCard]}>
                        <View style={styles.toggleInfo}>
                            <View style={styles.toggleTextContainer}>
                                <Text style={[styles.toggleTitle, dynamicStyles.toggleTitle]}>Recurring Holiday</Text>
                                <Text style={[styles.toggleSub, dynamicStyles.toggleSub]}>Repeats year-to-year</Text>
                            </View>
                        </View>
                        <Switch
                            trackColor={{ false: isDark ? colors.border : '#cbd5e1', true: colors.primary }}
                            thumbColor={'#ffffff'}
                            ios_backgroundColor={isDark ? colors.border : '#cbd5e1'}
                            onValueChange={setIsRecurring}
                            value={isRecurring}
                        />
                    </View>

                    {/* Paid Holiday Toggle */}
                    <View style={[styles.toggleCard, dynamicStyles.toggleCard]}>
                        <View style={styles.toggleInfo}>
                            <View style={styles.toggleTextContainer}>
                                <Text style={[styles.toggleTitle, dynamicStyles.toggleTitle]}>Paid Holiday</Text>
                                <Text style={[styles.toggleSub, dynamicStyles.toggleSub]}>Employees get paid for this day off</Text>
                            </View>
                        </View>
                        <Switch
                            trackColor={{ false: isDark ? colors.border : '#cbd5e1', true: colors.primary }}
                            thumbColor={'#ffffff'}
                            ios_backgroundColor={isDark ? colors.border : '#cbd5e1'}
                            onValueChange={setIsPaid}
                            value={isPaid}
                        />
                    </View>

                    <View style={[styles.divider, dynamicStyles.divider]} />

                    {/* Active Status Toggle */}
                    <View style={[styles.toggleCard, dynamicStyles.toggleCard]}>
                        <View style={styles.toggleInfo}>
                            <View
                                style={[
                                    styles.iconBox,
                                    { backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9') },
                                ]}
                            >
                                <MaterialIcons
                                    name={isActive ? 'check-circle' : 'cancel'}
                                    size={24}
                                    color={isActive ? STATIC_COLORS.emerald : colors.textSub}
                                />
                            </View>
                            <View>
                                <Text style={[styles.toggleTitle, dynamicStyles.toggleTitle]}>Active Status</Text>
                                <Text style={[styles.toggleSub, dynamicStyles.toggleSub]}>
                                    {isActive ? 'Holiday is active' : 'Holiday is inactive'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            trackColor={{ false: isDark ? colors.border : '#cbd5e1', true: STATIC_COLORS.emerald }}
                            thumbColor={'#ffffff'}
                            ios_backgroundColor={isDark ? colors.border : '#cbd5e1'}
                            onValueChange={setIsActive}
                            value={isActive}
                        />
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Footer */}
            <View style={[styles.footer, dynamicStyles.footer]}>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.saveButtonText}>
                            {isEditMode ? 'Update Holiday' : 'Save Holiday'}
                        </Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isLoading}>
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
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 20,
        gap: 24,
    },
    contextContainer: {
        marginBottom: 8,
    },
    contextLabel: {
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 4,
    },
    contextTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    contextSub: {
        fontSize: 14,
        lineHeight: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingRight: 40,
        fontSize: 15,
        height: 56,
    },
    dateInputContainer: {
        padding: 0,
    },
    dateInput: {
        paddingRight: 40,
    },
    inputIcon: {
        position: 'absolute',
        right: 16,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    typeChipActive: {
        borderWidth: 1,
    },
    typeChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        minHeight: 100,
    },
    divider: {
        height: 1,
        opacity: 0.5,
    },
    toggleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    toggleTextContainer: {
        flex: 1,
    },
    departmentContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    departmentChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    departmentChipActive: {
        borderWidth: 1,
    },
    departmentChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    toggleSub: {
        fontSize: 13,
    },
    iosDatePickerDone: {
        alignItems: 'flex-end',
        padding: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
        gap: 12,
    },
    saveButton: {
        height: 56,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButton: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    cancelButtonText: {
        fontSize: 15,
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
        contextLabel: {
            color: colors.primary,
        },
        contextTitle: {
            color: colors.textMain,
        },
        contextSub: {
            color: colors.textSub,
        },
        label: {
            color: colors.textMain,
        },
        input: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textMain,
        },
        typeChip: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        typeChipText: {
            color: colors.textMain,
        },
        textArea: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textMain,
        },
        divider: {
            backgroundColor: colors.border,
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
        departmentChip: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        departmentChipText: {
            color: colors.textMain,
        },
        footer: {
            backgroundColor: isDark ? 'rgba(28, 37, 46, 0.95)' : 'rgba(246, 247, 248, 0.95)',
            borderTopColor: colors.border,
        },
        cancelButtonText: {
            color: colors.textSub,
        },
    });



