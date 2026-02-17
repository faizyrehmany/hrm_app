import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { createLeaveType, updateLeaveType } from '../services/leave';
import { useTheme } from '../contexts/ThemeContext';

// Static colors that don't change with theme
const STATIC_COLORS = {
    blue: '#3b82f6',
    red: '#ef4444',
    amber: '#f59e0b',
    emerald: '#10b981',
    violet: '#8b5cf6',
    slate: '#64748b',
};

export default function AddLeaveTypeScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const params = useLocalSearchParams();
    const isEditing = !!params.id;

    // Form States matching API
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [isPaid, setIsPaid] = useState(true);
    const [annualQuota, setAnnualQuota] = useState('');
    const [requiresApproval, setRequiresApproval] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [selectedColor, setSelectedColor] = useState(STATIC_COLORS.blue);
    const [isLoading, setIsLoading] = useState(false);
    
    const dynamicStyles = createDynamicStyles(colors, isDark);

    useEffect(() => {
        if (isEditing) {
            setName(params.name as string || '');
            setCode(params.code as string || '');
            setIsPaid(params.isPaid === 'true');
            setAnnualQuota(params.defaultAnnualQuota?.toString() || '');
            setRequiresApproval(params.requiresApproval === 'true');
            setIsActive(params.isActive === 'true');
        }
    }, []);

    const colorOptions = [
        STATIC_COLORS.blue,
        STATIC_COLORS.red,
        STATIC_COLORS.amber,
        STATIC_COLORS.emerald,
        STATIC_COLORS.violet,
        STATIC_COLORS.slate,
    ];

    const handleSave = async () => {
        if (!name || !code) {
            Alert.alert('Error', 'Please fill in Name and Code fields.');
            return;
        }

        setIsLoading(true);

        const payload = {
            name,
            code,
            isPaid,
            defaultAnnualQuota: Number(annualQuota) || 0,
            requiresApproval,
            isActive
        };

        let result;
        if (isEditing) {
            result = await updateLeaveType(Number(params.id), payload);
        } else {
            result = await createLeaveType(payload);
        }

        setIsLoading(false);

        if (result.success) {
            Alert.alert('Success', `Leave Type ${isEditing ? 'Updated' : 'Created'} Successfully`, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } else {
            Alert.alert('Error', result.error || 'Something went wrong');
        }
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, dynamicStyles.iconButton]}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>{isEditing ? 'Edit Leave Type' : 'Add Leave Type'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Leave Type Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Name</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            placeholder="e.g. Sick Leave"
                            placeholderTextColor={colors.textSub}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    {/* Leave Code */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Code</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            placeholder="e.g. SL"
                            placeholderTextColor={colors.textSub}
                            value={code}
                            onChangeText={setCode}
                            autoCapitalize="characters"
                        />
                    </View>

                    {/* Annual Quota */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Annual Quota</Text>
                        <View style={styles.daysInputContainer}>
                            <TextInput
                                style={[styles.input, dynamicStyles.input, { paddingRight: 50 }]}
                                placeholder="0"
                                placeholderTextColor={colors.textSub}
                                keyboardType="numeric"
                                value={annualQuota}
                                onChangeText={setAnnualQuota}
                            />
                            <Text style={[styles.daysSuffix, dynamicStyles.daysSuffix]}>Days</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, dynamicStyles.divider]} />

                    {/* Toggles Container */}
                    <View style={styles.togglesContainer}>

                        {/* Paid Leave Toggle */}
                        <View style={[styles.toggleCard, dynamicStyles.toggleCard]}>
                            <View style={styles.toggleInfo}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                    <MaterialIcons name="payments" size={24} color={STATIC_COLORS.blue} />
                                </View>
                                <View>
                                    <Text style={[styles.toggleTitle, dynamicStyles.toggleTitle]}>Paid Leave</Text>
                                    <Text style={[styles.toggleSub, dynamicStyles.toggleSub]}>Is this leave type paid?</Text>
                                </View>
                            </View>
                            <Switch
                                trackColor={{ false: isDark ? colors.border : '#cbd5e1', true: STATIC_COLORS.blue }}
                                thumbColor={'#ffffff'}
                                ios_backgroundColor={isDark ? colors.border : '#cbd5e1'}
                                onValueChange={setIsPaid}
                                value={isPaid}
                            />
                        </View>

                        {/* Requires Approval Toggle */}
                        <View style={[styles.toggleCard, dynamicStyles.toggleCard]}>
                            <View style={styles.toggleInfo}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                    <MaterialIcons name="approval" size={24} color={STATIC_COLORS.amber} />
                                </View>
                                <View>
                                    <Text style={[styles.toggleTitle, dynamicStyles.toggleTitle]}>Requires Approval</Text>
                                    <Text style={[styles.toggleSub, dynamicStyles.toggleSub]}>Manager approval needed</Text>
                                </View>
                            </View>
                            <Switch
                                trackColor={{ false: isDark ? colors.border : '#cbd5e1', true: STATIC_COLORS.amber }}
                                thumbColor={'#ffffff'}
                                ios_backgroundColor={isDark ? colors.border : '#cbd5e1'}
                                onValueChange={setRequiresApproval}
                                value={requiresApproval}
                            />
                        </View>

                        {/* Is Active Toggle */}
                        <View style={[styles.toggleCard, dynamicStyles.toggleCard]}>
                            <View style={styles.toggleInfo}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <MaterialIcons name="check-circle" size={24} color={STATIC_COLORS.emerald} />
                                </View>
                                <View>
                                    <Text style={[styles.toggleTitle, dynamicStyles.toggleTitle]}>Active Status</Text>
                                    <Text style={[styles.toggleSub, dynamicStyles.toggleSub]}>Enable this leave type</Text>
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

                    </View>

                    {/* Color Tag (Frontend Only) */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Color Tag (UI Display)</Text>
                        <View style={styles.colorContainer}>
                            {colorOptions.map((color, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: color },
                                        selectedColor === color && styles.selectedColorCircle
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                >
                                    {selectedColor === color && (
                                        <View style={[styles.whiteRing, dynamicStyles.whiteRing]} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
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
                        <Text style={styles.saveButtonText}>Save Leave Type</Text>
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
        padding: 16,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
    },
    divider: {
        height: 1,
        opacity: 0.5,
    },
    togglesContainer: {
        gap: 12,
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
    daysInputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    daysSuffix: {
        position: 'absolute',
        right: 16,
        fontWeight: '500',
    },
    colorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedColorCircle: {
        // No extra border needed here as ring handles it
    },
    whiteRing: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        position: 'absolute',
        opacity: 0.5,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    saveButton: {
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.background,
    },
    iconButton: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
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
    daysSuffix: {
        color: colors.textSub,
    },
    whiteRing: {
        borderColor: colors.textMain,
    },
    footer: {
        backgroundColor: isDark ? 'rgba(28, 37, 46, 0.95)' : 'rgba(246, 247, 248, 0.95)',
        borderTopColor: colors.border,
    },
});



