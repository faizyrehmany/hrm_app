import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AddEmployeeModal from '../components/AddEmployeeModal';
import BottomTabBar from '../components/BottomTabBar';
import EmployeeDetailsModal from '../components/EmployeeDetailsModal';
import { useTheme } from '../contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Static colors that don't change with theme
const STATIC_COLORS = {
    success: "#22c55e",
    danger: "#ef4444",
    gray: "#9ca3af",
};

export default function EmployeesScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [isAddModalVisible, setAddModalVisible] = useState(false);

    // Details Modal State
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isDetailsModalVisible, setDetailsModalVisible] = useState(false);

    const stats = [
        { label: 'Total Employees', value: '17', change: '+12%', changeColor: STATIC_COLORS.success, icon: 'people' },
        { label: 'New Hires', value: '8', change: '+2', changeColor: STATIC_COLORS.success, icon: 'person-add' },
        { label: 'On Leave', value: '5', change: '-1', changeColor: STATIC_COLORS.danger, icon: 'event-busy' },
        { label: 'Departments', value: '12', change: '0', changeColor: STATIC_COLORS.gray, icon: 'business' },
    ];

    const dynamicStyles = createDynamicStyles(colors, isDark);

    const employees = [
        {
            id: 1,
            name: 'Ali Sid',
            role: 'Employee',
            status: 'Active',
            initials: 'AS',
            color: 'rgb(161, 98, 7)', // Yellow-700
            bgColor: 'rgb(254, 240, 138)', // Yellow-200
            department: 'General',
            phone: '03001234567',
            email: 'Not Available',
            employeeCode: 'emp-0014',
            location: 'karachi'
        },
        {
            id: 2,
            name: 'Abc Sid',
            role: 'Employee',
            status: 'Active',
            initials: 'AS',
            color: 'rgb(55, 48, 163)', // Indigo-800
            bgColor: 'rgb(199, 210, 254)', // Indigo-200
            department: 'Engineering',
            phone: '03001234567',
            email: 'abc.sid@company.com',
            employeeCode: 'emp-0015',
            location: 'Lahore'
        },
        {
            id: 3,
            name: 'Jane Khan',
            role: 'Product Manager',
            status: 'On Leave',
            initials: 'JK',
            color: 'rgb(157, 23, 77)', // Pink-800
            bgColor: 'rgb(251, 207, 232)', // Pink-200
            department: 'Product',
            phone: '03001234599',
            email: 'jane.khan@company.com',
            employeeCode: 'emp-0016',
            location: 'Islamabad'
        },
        {
            id: 4,
            name: 'Abc Sid',
            role: 'Employee',
            status: 'Active',
            initials: 'AS',
            color: 'rgb(30, 64, 175)', // Blue-800
            bgColor: 'rgb(191, 219, 254)', // Blue-200
            department: 'General',
            phone: '03001234597',
            email: 'Not Available',
            employeeCode: 'emp-0017',
            location: 'karachi'
        },
    ];

    const handleEmployeePress = (emp: any) => {
        setSelectedEmployee(emp);
        setDetailsModalVisible(true);
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <View>
                    <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Employees</Text>
                    <Text style={[styles.headerSubtitle, dynamicStyles.headerSubtitle]}>Manage your team members</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Check user preference: "screen par 4 card show hon" (Show 4 cards on screen) -> Grid Layout */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <View key={index} style={[styles.statCard, dynamicStyles.statCard]}>
                            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>{stat.label}</Text>
                            <View style={styles.statRow}>
                                <Text style={[styles.statValue, dynamicStyles.statValue]}>{stat.value}</Text>
                                <Text style={[styles.statChange, { color: stat.changeColor }]}>{stat.change}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Search & Filters */}
                <View style={styles.searchSection}>
                    <View style={[styles.searchContainer, dynamicStyles.searchContainer]}>
                        <MaterialIcons name="search" size={20} color={STATIC_COLORS.gray} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, dynamicStyles.searchInput]}
                            placeholder="Search employees by name or role..."
                            placeholderTextColor={STATIC_COLORS.gray}
                        />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                        <TouchableOpacity style={[styles.filterChip, dynamicStyles.filterChip]}>
                            <Text style={[styles.filterText, dynamicStyles.filterText]}>All Departments</Text>
                            <MaterialIcons name="arrow-drop-down" size={20} color={colors.textSub} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.filterChip, styles.filterChipActive, dynamicStyles.filterChipActive]}>
                            <MaterialIcons name="filter-list" size={18} color={colors.primary} style={{ marginRight: 4 }} />
                            <Text style={[styles.filterText, { color: colors.primary }]}>Filters</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.filterChip, dynamicStyles.filterChip]}>
                            <MaterialIcons name="download" size={18} color={colors.textSub} style={{ marginRight: 4 }} />
                            <Text style={[styles.filterText, dynamicStyles.filterText]}>Export</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Employee List */}
                <View style={styles.listContainer}>
                    {employees.map((emp) => (
                        <TouchableOpacity
                            key={emp.id}
                            style={[styles.employeeCard, dynamicStyles.employeeCard]}
                            onPress={() => handleEmployeePress(emp)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardMain}>
                                <View style={styles.userInfo}>
                                    <View style={[styles.avatar, { backgroundColor: emp.bgColor }]}>
                                        <Text style={[styles.avatarText, { color: emp.color }]}>{emp.initials}</Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.userName, dynamicStyles.userName]}>{emp.name}</Text>
                                        <Text style={[styles.userRole, dynamicStyles.userRole]}>{emp.role}</Text>
                                    </View>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    emp.status === 'Active' ? styles.statusActive : styles.statusInactive
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        emp.status === 'Active' ? styles.statusTextActive : styles.statusTextInactive
                                    ]}>{emp.status}</Text>
                                </View>
                            </View>

                            <View style={styles.contactInfo}>
                                <View style={styles.contactRow}>
                                    <MaterialIcons name="email" size={16} color={STATIC_COLORS.gray} />
                                    <Text style={[styles.contactText, dynamicStyles.contactText]}>{emp.email}</Text>
                                </View>
                                <View style={styles.contactRow}>
                                    <MaterialIcons name="phone" size={16} color={STATIC_COLORS.gray} />
                                    <Text style={[styles.contactText, dynamicStyles.contactText]}>{emp.phone}</Text>
                                </View>
                            </View>

                            <View style={[styles.cardFooter, dynamicStyles.cardFooter]}>
                                <View>
                                    <Text style={[styles.footerLabel, dynamicStyles.footerLabel]}>DEPARTMENT</Text>
                                    <Text style={[styles.footerValue, dynamicStyles.footerValue]}>{emp.department}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB - Adjusted position to be above the TabBar */}
            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setAddModalVisible(true)}>
                <MaterialIcons name="person-add" size={28} color="#FFF" />
            </TouchableOpacity>

            <BottomTabBar activeTab="employees" />

            {/* Add Employee Modal */}
            <AddEmployeeModal
                visible={isAddModalVisible}
                onClose={() => setAddModalVisible(false)}
            />

            {/* Employee Details Modal */}
            <EmployeeDetailsModal
                visible={isDetailsModalVisible}
                onClose={() => setDetailsModalVisible(false)}
                employee={selectedEmployee}
            />

        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    addButton: {
        padding: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    scrollContent: {
        padding: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'flex-start',
        gap: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    statChange: {
        fontSize: 12,
        fontWeight: '700',
    },
    searchSection: {
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    filterRow: {
        flexDirection: 'row',
        paddingBottom: 4,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
    },
    listContainer: {
        gap: 16,
    },
    employeeCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    cardMain: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
    },
    userRole: {
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusActive: {
        backgroundColor: '#dcfce7',
    },
    statusInactive: {
        backgroundColor: '#f3f4f6',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    statusTextActive: {
        color: '#166534',
    },
    statusTextInactive: {
        color: '#374151',
    },
    contactInfo: {
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactText: {
        fontSize: 14,
        marginLeft: 8,
    },
    cardFooter: {
        padding: 16,
        borderTopWidth: 1,
    },
    footerLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    footerValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 110, // Raised to clear the BottomTabBar (approx 90-100 height)
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: isDark ? 'rgba(28, 37, 46, 0.95)' : 'rgba(243, 244, 246, 0.95)',
        borderBottomColor: colors.border,
    },
    headerTitle: {
        color: colors.primary,
    },
    headerSubtitle: {
        color: colors.textSub,
    },
    statCard: {
        backgroundColor: colors.surface,
        borderColor: isDark ? colors.border : '#f1f5f9',
    },
    statLabel: {
        color: colors.textSub,
    },
    statValue: {
        color: colors.textMain,
    },
    searchContainer: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    searchInput: {
        color: colors.textMain,
    },
    filterChip: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    filterChipActive: {
        backgroundColor: isDark ? 'rgba(19, 127, 236, 0.2)' : '#eff6ff',
        borderColor: isDark ? colors.primary : '#bfdbfe',
    },
    filterText: {
        color: colors.textSub,
    },
    employeeCard: {
        backgroundColor: colors.surface,
        borderColor: isDark ? colors.border : '#f1f5f9',
    },
    userName: {
        color: colors.textMain,
    },
    userRole: {
        color: colors.textSub,
    },
    contactText: {
        color: colors.textSub,
    },
    cardFooter: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
        borderTopColor: colors.border,
    },
    footerLabel: {
        color: isDark ? colors.textSub : '#9ca3af',
    },
    footerValue: {
        color: colors.textMain,
    },
});



