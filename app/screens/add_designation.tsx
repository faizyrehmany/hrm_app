import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { addDesignation, reactivateDesignation, updateDesignation } from '../services/designation';

// Static colors that don't change with theme
const STATIC_COLORS = {
    emerald: '#10b981',
};

export default function AddDesignationScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const params = useLocalSearchParams();
    const isEditMode = !!params.id;

    // Form States
    const [name, setName] = useState(params.name ? String(params.name) : '');
    const [department, setDepartment] = useState(params.department ? String(params.department) : '');
    const [isActive, setIsActive] = useState(params.isActive ? params.isActive === 'true' : true);
    const [isLoading, setIsLoading] = useState(false);
    
    const dynamicStyles = createDynamicStyles(colors, isDark);


    const handleSave = async () => {
        if (!name || !department) {
            Alert.alert('Error', 'Please fill in Designation Name and Department.');
            return;
        }

        setIsLoading(true);

        let result;
        const payload = {
            name,
            department,
            isActive
        };

        if (isEditMode) {
            // Check if we need to reactivate first
            const wasInactive = params.isActive === 'false';
            if (wasInactive && isActive) {
                const reactivateResult = await reactivateDesignation(String(params.id));
                if (!reactivateResult.success) {
                    setIsLoading(false);
                    Alert.alert('Error', typeof reactivateResult.error === 'string' ? reactivateResult.error : 'Failed to reactivate designation.');
                    return;
                }
            }
            result = await updateDesignation(String(params.id), payload);
        } else {
            result = await addDesignation(payload);
        }

        setIsLoading(false);

        if (result.success) {
            Alert.alert(
                'Success',
                `Designation ${isEditMode ? 'Updated' : 'Created'} Successfully`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } else {
            Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} designation. Please try again.`);
        }
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>{isEditMode ? 'Edit Designation' : 'Add Designation'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Context Hint */}
                    <View style={styles.contextContainer}>
                        <Text style={[styles.contextLabel, dynamicStyles.contextLabel]}>{isEditMode ? 'Update Entry' : 'New Entry'}</Text>
                        <Text style={[styles.contextTitle, dynamicStyles.contextTitle]}>{isEditMode ? 'Edit existing role' : 'Create a new role'}</Text>
                        <Text style={[styles.contextSub, dynamicStyles.contextSub]}>
                            {isEditMode
                                ? 'Update the details for this employee designation.'
                                : 'Define the details for the new employee designation below.'}
                        </Text>
                    </View>

                    {/* Designation Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>
                            Designation Name <Text style={{ color: colors.primary }}>*</Text>
                        </Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, dynamicStyles.input]}
                                placeholder="e.g. Senior Product Designer"
                                placeholderTextColor={colors.textSub}
                                value={name}
                                onChangeText={setName}
                            />
                            <MaterialIcons name="badge" size={20} color={colors.textSub} style={styles.inputIcon} />
                        </View>
                    </View>

                    {/* Department */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>
                            Department <Text style={{ color: colors.primary }}>*</Text>
                        </Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, dynamicStyles.input]}
                                placeholder="e.g. Engineering"
                                placeholderTextColor={colors.textSub}
                                value={department}
                                onChangeText={setDepartment}
                            />
                            <MaterialIcons name="business" size={20} color={colors.textSub} style={styles.inputIcon} />
                        </View>
                    </View>

                    <View style={[styles.divider, dynamicStyles.divider]} />

                    {/* Active Status Toggle */}
                    <View style={[styles.toggleCard, dynamicStyles.toggleCard]}>
                        <View style={styles.toggleInfo}>
                            <View style={[styles.iconBox, { backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9') }]}>
                                <MaterialIcons
                                    name={isActive ? "check-circle" : "cancel"}
                                    size={24}
                                    color={isActive ? STATIC_COLORS.emerald : colors.textSub}
                                />
                            </View>
                            <View>
                                <Text style={[styles.toggleTitle, dynamicStyles.toggleTitle]}>Active Status</Text>
                                <Text style={[styles.toggleSub, dynamicStyles.toggleSub]}>{isActive ? 'Designation is active' : 'Designation is inactive'}</Text>
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
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleSave} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.saveButtonText}>{isEditMode ? 'Update Designation' : 'Save Designation'}</Text>
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
    inputIcon: {
        position: 'absolute',
        right: 16,
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
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: '#ffffff',
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

const createDynamicStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
    footer: {
        backgroundColor: isDark ? 'rgba(28, 37, 46, 0.95)' : 'rgba(246, 247, 248, 0.95)',
        borderTopColor: colors.border,
    },
    cancelButtonText: {
        color: colors.textSub,
    },
});



