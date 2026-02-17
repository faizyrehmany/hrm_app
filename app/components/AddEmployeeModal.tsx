import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Static colors that don't change with theme
const STATIC_COLORS = {
    danger: '#ef4444', // red-500
};

interface AddEmployeeModalProps {
    visible: boolean;
    onClose: () => void;
}

// Reusable Picker Modal Component
const SelectionModal = ({ visible, onClose, options, onSelect, title, colors, isDark }: any) => {
    const pickerStyles = createPickerStyles(colors, isDark);
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.pickerContainer, pickerStyles.pickerContainer]}>
                    <View style={[styles.pickerHeader, pickerStyles.pickerHeader]}>
                        <Text style={[styles.pickerTitle, pickerStyles.pickerTitle]}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color={colors.textMain} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.pickerItem, pickerStyles.pickerItem]}
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                <Text style={[styles.pickerItemText, pickerStyles.pickerItemText]}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default function AddEmployeeModal({ visible, onClose }: AddEmployeeModalProps) {
    const { isDark, colors } = useTheme();
    
    // Account Info
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Employee');
    const [showRolePicker, setShowRolePicker] = useState(false);
    const [empCode, setEmpCode] = useState('');

    // Personal Info
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');

    // Date Picker States
    const [dob, setDob] = useState<Date | null>(null);
    const [showDobPicker, setShowDobPicker] = useState(false);

    // Options
    const roleOptions = ['Employee', 'Manager', 'Admin'];
    
    const dynamicStyles = createDynamicStyles(colors, isDark);

    const handleDateChange = (event: any, selectedDate: Date | undefined, setter: any, pickerSetter: any) => {
        if (Platform.OS === 'android') {
            pickerSetter(false);
        }
        if (selectedDate) {
            setter(selectedDate);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={[styles.container, dynamicStyles.container]}>
                {/* Header */}
                <View style={[styles.header, dynamicStyles.header]}>
                    <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Add New Employee</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <MaterialIcons name="close" size={24} color={colors.textSub} />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Account Information Section */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Account Information</Text>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, dynamicStyles.label]}>Username <Text style={[styles.required, dynamicStyles.required]}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, dynamicStyles.input]}
                                    placeholder="e.g., hr30"
                                    placeholderTextColor={colors.textSub + '90'}
                                    value={username}
                                    onChangeText={setUsername}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, dynamicStyles.label]}>Email <Text style={[styles.required, dynamicStyles.required]}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, dynamicStyles.input]}
                                    placeholder="email@company.com"
                                    placeholderTextColor={colors.textSub + '90'}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, dynamicStyles.label]}>Role <Text style={[styles.required, dynamicStyles.required]}>*</Text></Text>
                                <Pressable onPress={() => setShowRolePicker(true)} style={[styles.pressableInput, dynamicStyles.pressableInput]}>
                                    <Text style={[styles.inputText, dynamicStyles.inputText]}>{role}</Text>
                                    <MaterialIcons name="expand-more" size={24} color={colors.textSub} />
                                </Pressable>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, dynamicStyles.label]}>Employee Code <Text style={[styles.required, dynamicStyles.required]}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, dynamicStyles.input]}
                                    placeholder="e.g., EMP-001"
                                    placeholderTextColor={colors.textSub + '90'}
                                    value={empCode}
                                    onChangeText={setEmpCode}
                                />
                            </View>
                        </View>

                        {/* Personal Information Section */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Personal Information</Text>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, dynamicStyles.label]}>First Name <Text style={[styles.required, dynamicStyles.required]}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, dynamicStyles.input]}
                                    placeholder="First Name"
                                    placeholderTextColor={colors.textSub + '90'}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, dynamicStyles.label]}>Last Name <Text style={[styles.required, dynamicStyles.required]}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, dynamicStyles.input]}
                                    placeholder="Last Name"
                                    placeholderTextColor={colors.textSub + '90'}
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, dynamicStyles.label]}>Phone <Text style={[styles.required, dynamicStyles.required]}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, dynamicStyles.input]}
                                    placeholder="03001234567"
                                    placeholderTextColor={colors.textSub + '90'}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, dynamicStyles.label]}>Date of Birth <Text style={[styles.required, dynamicStyles.required]}>*</Text></Text>
                                <Pressable onPress={() => setShowDobPicker(true)} style={[styles.pressableInput, dynamicStyles.pressableInput]}>
                                    <Text style={[styles.inputText, dynamicStyles.inputText, !dob && dynamicStyles.inputTextPlaceholder]}>
                                        {formatDate(dob) || 'dd/mm/yyyy'}
                                    </Text>
                                    <MaterialIcons name="calendar-today" size={20} color={colors.textSub} />
                                </Pressable>
                                {showDobPicker && (
                                    <DateTimePicker
                                        value={dob || new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(e, d) => handleDateChange(e, d, setDob, setShowDobPicker)}
                                        maximumDate={new Date()}
                                    />
                                )}
                                {Platform.OS === 'ios' && showDobPicker && (
                                    <TouchableOpacity onPress={() => setShowDobPicker(false)} style={styles.iosDatePickerDone}>
                                        <Text style={{ color: colors.primary }}>Done</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={{ height: 40 }} />

                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                            <Text style={styles.saveButtonText}>Save Employee</Text>
                        </TouchableOpacity>

                        <View style={{ height: 20 }} />

                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Role Picker */}
                <SelectionModal
                    visible={showRolePicker}
                    onClose={() => setShowRolePicker(false)}
                    options={roleOptions}
                    onSelect={setRole}
                    title="Select Role"
                    colors={colors}
                    isDark={isDark}
                />

            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        padding: 4,
    },
    scrollContent: {
        padding: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    required: {
        color: STATIC_COLORS.danger,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    pressableInput: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
    },
    inputText: {
        fontSize: 15,
    },
    iosDatePickerDone: {
        alignItems: 'flex-end',
        padding: 10,
    },
    saveButton: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pickerContainer: {
        width: '100%',
        maxHeight: '60%',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    pickerItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    pickerItemText: {
        fontSize: 16,
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
    },
    header: {
        backgroundColor: colors.surface,
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
    input: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.textMain,
    },
    pressableInput: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    inputText: {
        color: colors.textMain,
    },
    inputTextPlaceholder: {
        color: colors.textSub + '90',
    },
});

const createPickerStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    pickerContainer: {
        backgroundColor: colors.surface,
    },
    pickerHeader: {
        borderBottomColor: colors.border,
    },
    pickerTitle: {
        color: colors.textMain,
    },
    pickerItem: {
        borderBottomColor: colors.border,
    },
    pickerItemText: {
        color: colors.textMain,
    },
});


