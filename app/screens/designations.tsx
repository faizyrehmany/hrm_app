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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { deleteDesignation, getDesignations } from '../services/designation';
import { useTheme } from '../contexts/ThemeContext';

// Static colors that don't change with theme
const STATIC_COLORS = {
    red: '#ef4444',
    blue: '#3b82f6',
    blueBg: '#eff6ff',
    purple: '#8b5cf6',
    purpleBg: '#f5f3ff',
    orange: '#f97316',
    orangeBg: '#fff7ed',
    emerald: '#10b981',
    emeraldBg: '#ecfdf5',
    pink: '#ec4899',
    pinkBg: '#fdf2f8',
    indigo: '#6366f1',
    indigoBg: '#eef2ff',
    gray: '#94a3b8',
};

// Helper to get random icon styling
const getRandomStyle = (index: number) => {
    const styles = [
        { icon: 'code', color: STATIC_COLORS.blue, bg: STATIC_COLORS.blueBg },
        { icon: 'groups', color: STATIC_COLORS.purple, bg: STATIC_COLORS.purpleBg },
        { icon: 'campaign', color: STATIC_COLORS.orange, bg: STATIC_COLORS.orangeBg },
        { icon: 'design-services', color: STATIC_COLORS.emerald, bg: STATIC_COLORS.emeraldBg },
        { icon: 'support-agent', color: STATIC_COLORS.pink, bg: STATIC_COLORS.pinkBg },
        { icon: 'account-balance', color: STATIC_COLORS.indigo, bg: STATIC_COLORS.indigoBg },
    ];
    return styles[index % styles.length];
};

function SwipeableDesignationItem({ title, department, employees, icon, iconColor, iconBg, onEdit, onDelete, colors, isDark }: any) {
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
                        <View style={styles.cardSubContainer}>
                            <Text style={[styles.cardSub, dynamicStyles.cardSub]}>{department}</Text>
                        </View>
                    </View>
                </View>
                {/* Drag Handle Indicator */}
                <View style={[styles.dragHandle, dynamicStyles.dragHandle]} />
            </View>
        </ReanimatedSwipeable>
    );
}

export default function DesignationsScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [designations, setDesignations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRoles: 0, departments: 0 });
    const [showInactive, setShowInactive] = useState(false);
    
    const dynamicStyles = createDynamicStyles(colors, isDark);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [showInactive])
    );

    const fetchData = async () => {
        setLoading(true);
        const result = await getDesignations(showInactive);
        if (result.success && result.data) {
            const data = result.data;

            // Transform data for UI
            let transformedData = data.map((item: any, index: number) => {
                const style = getRandomStyle(index);
                return {
                    id: item.id,
                    title: item.name,
                    department: item.department,
                    employees: 0, // API doesn't provide this yet
                    isActive: item.isActive, // Ensure this is passed
                    icon: style.icon,
                    iconColor: style.color,
                    iconBg: style.bg
                };
            });

            // If toggle is ON, show ONLY inactive designations
            if (showInactive) {
                transformedData = transformedData.filter((item: any) => !item.isActive);
            }

            setDesignations(transformedData);

            // Calculate Stats
            const totalRoles = transformedData.length;
            const uniqueDepartments = new Set(transformedData.map((d: any) => d.department)).size;
            setStats({ totalRoles, departments: uniqueDepartments });

        } else {
            Alert.alert('Error', 'Failed to fetch designations');
        }
        setLoading(false);
    };

    const handleEdit = (item: any) => {
        router.push({
            pathname: '/screens/add_designation',
            params: {
                id: item.id,
                name: item.title, // item.title is mapped from name in fetchData, so we pass it back as name
                department: item.department,
                isActive: String(item.isActive) // Pass the actual active status
            }
        });
    };

    const handleDelete = (item: any) => {
        Alert.alert(
            "Delete Designation",
            `Are you sure you want to delete "${item.title}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        const result = await deleteDesignation(item.id);
                        if (result.success) {
                            Alert.alert('Success', 'Designation deleted successfully');
                            fetchData();
                        } else {
                            Alert.alert('Error', 'Failed to delete designation');
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[styles.container, dynamicStyles.container]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />

                {/* Header */}
                <View style={[styles.header, dynamicStyles.header]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Designations</Text>
                    {/* Empty view to balance header since Add button is removed */}
                    <View style={{ width: 40 }} />
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Search Bar */}
                        <View style={[styles.searchContainer, dynamicStyles.searchContainer]}>
                            <MaterialIcons name="search" size={24} color={colors.textSub} style={styles.searchIcon} />
                            <TextInput
                                style={[styles.searchInput, dynamicStyles.searchInput]}
                                placeholder="Search designations..."
                                placeholderTextColor={colors.textSub + '90'}
                            />
                        </View>

                        {/* Filter Toggle */}
                        <View style={[styles.toggleContainer, dynamicStyles.toggleContainer]}>
                            <Text style={[styles.toggleLabel, dynamicStyles.toggleLabel]}>Show Inactive Designations</Text>
                            <Switch
                                trackColor={{ false: isDark ? colors.border : '#e2e8f0', true: colors.primary }}
                                thumbColor={'#ffffff'}
                                ios_backgroundColor={isDark ? colors.border : '#e2e8f0'}
                                onValueChange={setShowInactive}
                                value={showInactive}
                            />
                        </View>

                        {/* Stats Overview */}
                        <View style={styles.statsContainer}>
                            <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Total Roles</Text>
                                <Text style={[styles.statValue, { color: '#FFF' }]}>{stats.totalRoles}</Text>
                            </View>
                            <View style={[styles.statCard, dynamicStyles.statCardSecondary, { borderWidth: 1, borderColor: colors.border }]}>
                                <Text style={[styles.statLabel, dynamicStyles.statLabelSecondary]}>Departments</Text>
                                <Text style={[styles.statValue, dynamicStyles.statValueSecondary]}>{stats.departments}</Text>
                            </View>
                        </View>

                        {/* List */}
                        <View style={styles.listContainer}>
                            {designations
                                .filter(item => showInactive || item.isActive)
                                .map((item) => (
                                    <SwipeableDesignationItem
                                        key={item.id}
                                        title={item.title}
                                        department={item.department}
                                        employees={item.employees}
                                        icon={item.icon}
                                        iconColor={item.iconColor}
                                        iconBg={item.iconBg}
                                        onEdit={() => handleEdit(item)}
                                        onDelete={() => handleDelete(item)}
                                        colors={colors}
                                        isDark={isDark}
                                    />
                                ))}
                        </View>

                        {/* Bottom Spacer for FAB */}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/screens/add_designation')}
                >
                    <MaterialIcons name="add" size={32} color="#FFF" />
                </TouchableOpacity>

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
    scrollContent: {
        padding: 16,
        gap: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    listContainer: {
        gap: 12,
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
        borderWidth: 1,
        height: 80,
        width: '100%',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
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
    cardSubContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardSub: {
        fontSize: 13,
        fontWeight: '500',
    },
    dotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: STATIC_COLORS.gray + '80',
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
    dragHandle: {
        width: 4,
        height: 32,
        borderRadius: 2,
        position: 'absolute',
        right: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    toggleLabel: {
        fontSize: 14,
        fontWeight: '500',
    }
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
    searchContainer: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
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
    statCardSecondary: {
        backgroundColor: colors.surface,
    },
    statLabelSecondary: {
        color: colors.textSub,
    },
    statValueSecondary: {
        color: colors.textMain,
    },
});

const createItemStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
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



