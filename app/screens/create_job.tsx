import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function CreateJobScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const styles = createStyles(colors, isDark);

    const [jobTitle, setJobTitle] = useState('');
    const [department, setDepartment] = useState('');
    const [location, setLocation] = useState('');
    const [empType, setEmpType] = useState('Full-time');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeptModal, setShowDeptModal] = useState(false);

    const departments = ['Engineering', 'Design', 'Product', 'Human Resources', 'Marketing'];

    const handlePublish = async () => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            router.back();
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <MaterialIcons name="arrow-back-ios" size={20} color={colors.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Opportunity</Text>
                    <TouchableOpacity style={styles.iconButton}>
                        <MaterialIcons name="more-horiz" size={24} color={colors.textMain} />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Job Title */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>JOB TITLE</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="work-outline" size={20} color={colors.textSub} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Senior Product Designer"
                                    placeholderTextColor={colors.textSub}
                                    value={jobTitle}
                                    onChangeText={setJobTitle}
                                />
                            </View>
                        </View>

                        {/* Department */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>DEPARTMENT</Text>
                            <TouchableOpacity
                                style={styles.inputContainer}
                                onPress={() => setShowDeptModal(true)}
                            >
                                <MaterialIcons name="apartment" size={20} color={colors.textSub} style={styles.inputIcon} />
                                <Text style={[styles.inputText, !department && { color: colors.textSub }]}>
                                    {department || "Select Department"}
                                </Text>
                                <MaterialIcons name="expand-more" size={20} color={colors.textSub} style={styles.dropdownIcon} />
                            </TouchableOpacity>
                        </View>

                        {/* Location */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>WORK LOCATION</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="place" size={20} color={colors.textSub} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. New York, NY (Remote)"
                                    placeholderTextColor={colors.textSub}
                                    value={location}
                                    onChangeText={setLocation}
                                />
                            </View>
                        </View>

                        {/* Employment Type */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>EMPLOYMENT TYPE</Text>
                            <View style={styles.radioGroup}>
                                {['Full-time', 'Part-time', 'Contract'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.radioOption,
                                            empType === type && styles.radioOptionSelected
                                        ]}
                                        onPress={() => setEmpType(type)}
                                    >
                                        <Text style={[
                                            styles.radioText,
                                            empType === type && styles.radioTextSelected
                                        ]}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Description */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>JOB DESCRIPTION</Text>
                            <View style={[styles.inputContainer, styles.textAreaContainer]}>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Enter detailed job responsibilities and requirements..."
                                    placeholderTextColor={colors.textSub}
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                    value={description}
                                    onChangeText={setDescription}
                                />
                                <Text style={styles.charCount}>{description.length}/2000</Text>
                            </View>
                        </View>

                        {/* Active Listing Toggle */}
                        <View style={styles.toggleCard}>
                            <View style={styles.toggleInfo}>
                                <View style={styles.toggleIconBox}>
                                    <MaterialIcons name="visibility" size={20} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text style={styles.toggleTitle}>Active Listing</Text>
                                    <Text style={styles.toggleSubtitle}>Post will be visible immediately</Text>
                                </View>
                            </View>
                            <Switch
                                value={isActive}
                                onValueChange={setIsActive}
                                trackColor={{ false: '#767577', true: '#3B82F6' }}
                                thumbColor={isActive ? '#f4f3f4' : '#f4f3f4'}
                            />
                        </View>

                        {/* Bottom Padding */}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Submit Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handlePublish}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Publish Job</Text>
                                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Department Modal */}
                <Modal
                    visible={showDeptModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowDeptModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Department</Text>
                                <TouchableOpacity onPress={() => setShowDeptModal(false)}>
                                    <MaterialIcons name="close" size={24} color={colors.textMain} />
                                </TouchableOpacity>
                            </View>
                            {departments.map((dept) => (
                                <TouchableOpacity
                                    key={dept}
                                    style={styles.modalOption}
                                    onPress={() => {
                                        setDepartment(dept);
                                        setShowDeptModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalOptionText,
                                        department === dept && { color: '#3B82F6', fontWeight: '700' }
                                    ]}>{dept}</Text>
                                    {department === dept && (
                                        <MaterialIcons name="check" size={20} color="#3B82F6" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMain,
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSub,
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        height: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: colors.textMain,
        height: '100%',
    },
    inputText: {
        flex: 1,
        fontSize: 16,
        color: colors.textMain,
    },
    dropdownIcon: {
        marginLeft: 8,
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    radioOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        backgroundColor: colors.surface,
    },
    radioOptionSelected: {
        borderColor: '#3B82F6',
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
    },
    radioText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMain,
    },
    radioTextSelected: {
        color: '#3B82F6',
    },
    textAreaContainer: {
        height: 160,
        alignItems: 'flex-start',
        paddingTop: 16,
    },
    textArea: {
        height: '100%',
        textAlignVertical: 'top',
    },
    charCount: {
        position: 'absolute',
        bottom: 12,
        right: 16,
        fontSize: 12,
        color: colors.textSub,
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    toggleCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    toggleIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textMain,
    },
    toggleSubtitle: {
        fontSize: 12,
        color: colors.textSub,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMain,
    },
    modalOption: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalOptionText: {
        fontSize: 16,
        color: colors.textMain,
    },
});
