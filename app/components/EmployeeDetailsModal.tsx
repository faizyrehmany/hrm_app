import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Static colors that don't change with theme
const STATIC_COLORS = {
    successBg: '#dcfce7', // green-100
    successText: '#15803d', // green-700
};

interface EmployeeDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    employee: {
        id: number;
        name: string;
        role: string;
        status: string;
        initials: string;
        color: string;
        bgColor: string;
        department: string;
        phone: string;
        email: string;
        employeeCode?: string; // Optional if not in data
        location?: string;    // Optional if not in data
    } | null;
}

export default function EmployeeDetailsModal({ visible, onClose, employee }: EmployeeDetailsModalProps) {
    const { isDark, colors } = useTheme();
    
    if (!employee) return null;

    const dynamicStyles = createDynamicStyles(colors, isDark);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />
                <View style={[styles.modalContainer, dynamicStyles.modalContainer]}>
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: colors.primary }]}>
                        <Text style={styles.headerTitle}>Employee Details</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={[styles.content, dynamicStyles.content]}>
                        {/* Profile Section */}
                        <View style={styles.profileSection}>
                            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarText}>{employee.initials}</Text>
                            </View>
                            <View>
                                <Text style={[styles.name, dynamicStyles.name]}>{employee.name}</Text>
                                <Text style={[styles.role, dynamicStyles.role]}>{employee.role}</Text>
                                <View style={[styles.statusBadge, dynamicStyles.statusBadge]}>
                                    <Text style={[styles.statusText, dynamicStyles.statusText]}>{employee.status}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Details Grid */}
                        <View style={styles.grid}>
                            {/* Email */}
                            <View style={[styles.gridItem, dynamicStyles.gridItem]}>
                                <MaterialIcons name="email" size={20} color="#3b82f6" />
                                <View style={styles.itemTextContainer}>
                                    <Text style={[styles.itemLabel, dynamicStyles.itemLabel]}>Email</Text>
                                    <Text style={[styles.itemValue, dynamicStyles.itemValue]}>{employee.email}</Text>
                                </View>
                            </View>

                            {/* Phone */}
                            <View style={[styles.gridItem, dynamicStyles.gridItem]}>
                                <MaterialIcons name="phone" size={20} color="#22c55e" />
                                <View style={styles.itemTextContainer}>
                                    <Text style={[styles.itemLabel, dynamicStyles.itemLabel]}>Phone</Text>
                                    <Text style={[styles.itemValue, dynamicStyles.itemValue]}>{employee.phone}</Text>
                                </View>
                            </View>

                            {/* Department */}
                            <View style={[styles.gridItem, dynamicStyles.gridItem]}>
                                <MaterialIcons name="work" size={20} color="#a855f7" />
                                <View style={styles.itemTextContainer}>
                                    <Text style={[styles.itemLabel, dynamicStyles.itemLabel]}>Department</Text>
                                    <Text style={[styles.itemValue, dynamicStyles.itemValue]}>{employee.department}</Text>
                                </View>
                            </View>

                            {/* Employee Code */}
                            <View style={[styles.gridItem, dynamicStyles.gridItem]}>
                                <MaterialIcons name="badge" size={20} color="#f97316" />
                                <View style={styles.itemTextContainer}>
                                    <Text style={[styles.itemLabel, dynamicStyles.itemLabel]}>Employee Code</Text>
                                    <Text style={[styles.itemValue, dynamicStyles.itemValue]}>{employee.employeeCode || 'emp-0014'}</Text>
                                </View>
                            </View>

                            {/* Location */}
                            <View style={[styles.gridItem, styles.fullWidthItem, dynamicStyles.gridItem]}>
                                <MaterialIcons name="location-pin" size={20} color="#ef4444" />
                                <View style={styles.itemTextContainer}>
                                    <Text style={[styles.itemLabel, dynamicStyles.itemLabel]}>Location</Text>
                                    <Text style={[styles.itemValue, dynamicStyles.itemValue]}>{employee.location || 'karachi'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={[styles.footer, dynamicStyles.footer]}>
                        <TouchableOpacity style={[styles.closeButton, dynamicStyles.closeButton]} onPress={onClose}>
                            <Text style={[styles.closeButtonText, dynamicStyles.closeButtonText]}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    overlayTouch: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        padding: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    role: {
        fontSize: 14,
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    gridItem: {
        width: '47%',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    fullWidthItem: {
        width: '100%',
    },
    itemTextContainer: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 12,
    },
    itemValue: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        alignItems: 'flex-end',
    },
    closeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    modalContainer: {
        backgroundColor: colors.surface,
    },
    content: {
        backgroundColor: colors.surface,
    },
    name: {
        color: colors.textMain,
    },
    role: {
        color: colors.textSub,
    },
    statusBadge: {
        backgroundColor: STATIC_COLORS.successBg,
    },
    statusText: {
        color: STATIC_COLORS.successText,
    },
    gridItem: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
    },
    itemLabel: {
        color: colors.textSub,
    },
    itemValue: {
        color: colors.textMain,
    },
    footer: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
    },
    closeButton: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9',
    },
    closeButtonText: {
        color: colors.primary,
    },
});


