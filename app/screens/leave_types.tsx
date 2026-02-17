import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
// Reanimated Swipeable (Preferred for smoother animations)
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { getLeaveTypes, LeaveTypeResponse, removeLeaveType } from '../services/leave';
import { useTheme } from '../contexts/ThemeContext';

// Static colors that don't change with theme
const STATIC_COLORS = {
    red: '#ef4444',
    redBg: '#fef2f2',
    blue: '#3b82f6',
    blueBg: '#eff6ff',
    orange: '#f97316',
    orangeBg: '#fff7ed',
    emerald: '#10b981',
    emeraldBg: '#ecfdf5',
    purple: '#8b5cf6',
    purpleBg: '#f5f3ff',
    gray: '#94a3b8',
};

function SwipeableLeaveItem({ title, info, icon, iconColor, iconBg, onEdit, onDelete, colors, isDark }: any) {
    // Right Action for Swipeable
    const RightAction = (prog: any, drag: any) => {
        return (
            <View style={{ flexDirection: 'row', width: 140 }}>
                <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primary }]} onPress={onEdit}>
                    <MaterialIcons name="edit" size={20} color="#FFF" />
                    <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: STATIC_COLORS.red }]} onPress={onDelete}>
                    <MaterialIcons name="delete" size={20} color="#FFF" />
                    <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const dynamicStyles = createItemStyles(colors, isDark);

    return (
        <ReanimatedSwipeable
            friction={2}
            enableTrackpadTwoFingerGesture
            rightThreshold={40}
            renderRightActions={RightAction}
            containerStyle={styles.swipeableContainer}
        >
            <View style={[styles.card, dynamicStyles.card]}>
                <View style={styles.cardLeft}>
                    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                        <MaterialIcons name={icon} size={24} color={iconColor} />
                    </View>
                    <View>
                        <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>{title}</Text>
                        <Text style={[styles.cardSub, dynamicStyles.cardSub]}>{info}</Text>
                    </View>
                </View>
                {/* Drag Handle Indicator */}
                <View style={[styles.dragHandle, dynamicStyles.dragHandle]} />
            </View>
        </ReanimatedSwipeable>
    );
}

export default function LeaveTypesScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [leaveTypes, setLeaveTypes] = useState<LeaveTypeResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    
    const dynamicStyles = createDynamicStyles(colors, isDark);

    useFocusEffect(
        useCallback(() => {
            loadLeaveTypes();
        }, [showInactive])
    );

    const loadLeaveTypes = async () => {
        setIsLoading(true);
        const result = await getLeaveTypes(showInactive);
        if (result.success && result.data) {
            let data = result.data;
            if (showInactive) {
                // Filter to show ONLY inactive items if toggle is ON
                data = data.filter(item => !item.isActive);
            }
            setLeaveTypes(data);
        } else {
            Alert.alert("Error", result.error || "Failed to load leave types");
        }
        setIsLoading(false);
    };

    const handleEdit = (item: LeaveTypeResponse) => {
        // Convert all props to strings for URL params
        router.push({
            pathname: '/screens/add_leave_type',
            params: {
                id: item.id,
                name: item.name,
                code: item.code,
                isPaid: String(item.isPaid),
                defaultAnnualQuota: String(item.defaultAnnualQuota),
                requiresApproval: String(item.requiresApproval),
                isActive: String(item.isActive)
            }
        });
    };

    const handleDelete = (item: LeaveTypeResponse) => {
        Alert.alert(
            "Delete Leave Type",
            `Are you sure you want to delete "${item.name}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        const result = await removeLeaveType(item.id);
                        if (result.success) {
                            Alert.alert('Success', 'Leave type deleted successfully');
                            loadLeaveTypes();
                        } else {
                            Alert.alert('Error', result.error || 'Failed to delete leave type');
                            setIsLoading(false); // Only stop loading on error, success reloads list which handles loading
                        }
                    }
                }
            ]
        );
    };

    // Helper to get visual properties based on index
    const getVisualProps = (index: number) => {
        const stylesList = [
            { icon: 'thermostat', color: STATIC_COLORS.red, bg: STATIC_COLORS.redBg },
            { icon: 'calendar-today', color: STATIC_COLORS.blue, bg: STATIC_COLORS.blueBg },
            { icon: 'directions-run', color: STATIC_COLORS.orange, bg: STATIC_COLORS.orangeBg },
            { icon: 'home-work', color: STATIC_COLORS.emerald, bg: STATIC_COLORS.emeraldBg },
            { icon: 'child-care', color: STATIC_COLORS.purple, bg: STATIC_COLORS.purpleBg },
        ];
        const style = stylesList[index % stylesList.length];
        return {
            icon: style.icon as any,
            iconColor: style.color,
            iconBg: style.bg
        };
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[styles.container, dynamicStyles.container]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />

                {/* Header */}
                <View style={[styles.header, dynamicStyles.header]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <MaterialIcons name="arrow-back-ios" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Leave Types</Text>
                    <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/screens/add_leave_type')}>
                        <MaterialIcons name="add" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBox, dynamicStyles.searchBox]}>
                        <MaterialIcons name="search" size={24} color={colors.textSub} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, dynamicStyles.searchInput]}
                            placeholder="Search leave types..."
                            placeholderTextColor={colors.textSub + '90'}
                        />
                    </View>
                </View>

                {/* Filter Toggle */}
                <View style={[styles.toggleContainer, dynamicStyles.toggleContainer]}>
                    <Text style={[styles.toggleLabel, dynamicStyles.toggleLabel]}>Show Inactive Leave Types</Text>
                    <Switch
                        trackColor={{ false: isDark ? colors.border : '#e2e8f0', true: colors.primary }}
                        thumbColor={'#ffffff'}
                        ios_backgroundColor={isDark ? colors.border : '#e2e8f0'}
                        onValueChange={setShowInactive}
                        value={showInactive}
                    />
                </View>

                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {leaveTypes.map((item, index) => {
                            const visual = getVisualProps(index);
                            return (
                                <SwipeableLeaveItem
                                    key={item.id}
                                    title={item.name}
                                    info={`${item.isPaid ? 'Paid' : 'Unpaid'} • ${item.defaultAnnualQuota} days/year`}
                                    icon={visual.icon}
                                    iconColor={visual.iconColor}
                                    iconBg={visual.iconBg}
                                    onEdit={() => handleEdit(item)}
                                    onDelete={() => handleDelete(item)}
                                    colors={colors}
                                    isDark={isDark}
                                />
                            );
                        })}
                        {leaveTypes.length === 0 && (
                            <View style={{ alignItems: 'center', marginTop: 50 }}>
                                <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No leave types found.</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </GestureHandlerRootView>
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
    searchContainer: {
        padding: 16,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 16,
    },
    swipeableContainer: {
        backgroundColor: 'transparent',
        overflow: 'hidden',
        borderRadius: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
        height: 80,
        width: '100%',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    cardSub: {
        fontSize: 13,
    },
    moreButton: {
        padding: 8,
    },
    dragHandle: {
        width: 4,
        height: 32,
        borderRadius: 2,
        position: 'absolute',
        right: 8,
    },
    editBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        color: '#FFF',
        fontSize: 10,
        marginTop: 2,
        fontWeight: '500',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    toggleLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 14,
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: isDark ? 'rgba(28, 37, 46, 0.95)' : 'rgba(246, 247, 248, 0.95)',
        borderBottomColor: colors.border,
    },
    headerTitle: {
        color: colors.textMain,
    },
    searchBox: {
        backgroundColor: colors.surface,
    },
    searchInput: {
        color: colors.textMain,
    },
    toggleContainer: {
        backgroundColor: colors.background,
    },
    toggleLabel: {
        color: colors.textMain,
    },
});

const createItemStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
    },
    cardTitle: {
        color: colors.textMain,
    },
    cardSub: {
        color: colors.textSub,
    },
    dragHandle: {
        backgroundColor: (isDark ? colors.textSub : STATIC_COLORS.gray) + '20',
    },
});



