import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    StatusBar as NativeStatusBar,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import BottomTabBar from '../components/BottomTabBar';
import { CustomToast } from '../components/CustomToast';
import { useTheme } from '../contexts/ThemeContext';
import { approveLeaveRequest, getLeaveApprovals, rejectLeaveRequest } from '../services/leave_approvals';

const { width } = Dimensions.get('window');

// Static colors that don't change with theme
const STATIC_COLORS = {
    blueBg: '#eff6ff',
    blueText: '#137fec',
    redBg: '#fef2f2',
    redText: '#ef4444',
    orangeBg: '#fff7ed',
    orangeText: '#f97316',
    purpleBg: '#f5f3ff',
    purpleText: '#8b5cf6',
    grayBg: '#f3f4f6',
};

// Mock Data matching the image/HTML

export default function LeaveApprovalsScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [approvals, setApprovals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Rejection Modal State
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false,
    });

    const dynamicStyles = createDynamicStyles(colors, isDark);

    const fetchApprovals = async () => {
        setIsLoading(true);
        const result = await getLeaveApprovals(activeTab);
        if (result.success && Array.isArray(result.data)) {
            setApprovals(result.data);
        } else {
            setApprovals([]);
        }
        setIsLoading(false);
    };

    React.useEffect(() => {
        fetchApprovals();
    }, [activeTab]);

    const getLeaveTypeStyle = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'sick':
            case 'sick leave':
                return { bg: STATIC_COLORS.orangeBg, color: STATIC_COLORS.orangeText, icon: 'sick' };
            case 'annual':
            case 'annual leave':
                return { bg: STATIC_COLORS.blueBg, color: STATIC_COLORS.blueText, icon: 'calendar-today' };
            case 'maternity':
            case 'paternity':
                return { bg: STATIC_COLORS.purpleBg, color: STATIC_COLORS.purpleText, icon: 'child-care' };
            default:
                return { bg: STATIC_COLORS.grayBg, color: '#4b5563', icon: 'event' };
        }
    };

    const formatDateRange = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);

        // Simple format: "Oct 24 - Oct 26"
        const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (s.toDateString() === e.toDateString()) {
            return format(s);
        }
        return `${format(s)} - ${format(e)}`;
    };

    const calculateTimeAgo = (dateRecent: string) => {
        if (!dateRecent) return '';
        const now = new Date();
        const requested = new Date(dateRecent);
        const diffInHours = Math.floor((now.getTime() - requested.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    const handleApprove = async (id: string) => {
        console.log('Approve clicked for:', id);
        setIsSubmitting(true);
        const result = await approveLeaveRequest(id);
        setIsSubmitting(false);

        console.log('Approve result:', result);

        if (result.success) {
            setToast({ message: 'Request approved successfully', type: 'success', visible: true });
            // Optimistic update: remove item from list immediately
            setApprovals(prev => prev.filter(a => a.id !== id));
            // Then refresh in background
            fetchApprovals();
        } else {
            setToast({ message: 'Failed to approve request', type: 'error', visible: true });
        }
    };

    const handleRejectClick = (id: string) => {
        setSelectedRequestId(id);
        setRejectReason('');
        setRejectModalVisible(true);
    };

    const submitReject = async () => {
        if (!selectedRequestId) return;
        if (!rejectReason.trim()) {
            setToast({ message: 'Please provide a reason', type: 'error', visible: true });
            return;
        }

        console.log('Rejecting with reason:', rejectReason);
        setIsSubmitting(true);
        const result = await rejectLeaveRequest(selectedRequestId, rejectReason);
        setIsSubmitting(false);

        console.log('Reject result:', result);

        if (result.success) {
            setToast({ message: 'Request rejected successfully', type: 'success', visible: true });
            setRejectModalVisible(false);
            // Optimistic update
            setApprovals(prev => prev.filter(a => a.id !== selectedRequestId));
            fetchApprovals();
        } else {
            setToast({ message: 'Failed to reject request', type: 'error', visible: true });
        }
    };

    const hideToast = () => setToast({ ...toast, visible: false });

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.topBar}>
                        <TouchableOpacity style={[styles.iconBtn, dynamicStyles.iconBtn]} onPress={() => router.back()}>
                            <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Leave Approvals</Text>
                        <TouchableOpacity style={styles.historyBtn}>
                            <Text style={[styles.historyBtnText, dynamicStyles.historyBtnText]}>History</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        {['Pending', 'Approved', 'Rejected'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={styles.tabItem}
                                onPress={() => setActiveTab(tab as any)}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        dynamicStyles.tabText,
                                        activeTab === tab && [styles.tabTextActive, dynamicStyles.tabTextActive]
                                    ]}
                                >
                                    {tab}
                                </Text>
                                {activeTab === tab && <View style={[styles.activeIndicator, dynamicStyles.activeIndicator]} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Main Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Search Bar */}
                    <View style={[styles.searchContainer, dynamicStyles.searchContainer]}>
                        <MaterialIcons name="search" size={22} color={colors.textSub} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, dynamicStyles.searchInput]}
                            placeholder="Search employee, ID, or role..."
                            placeholderTextColor={colors.textSub}
                        />
                    </View>

                    {/* Filters */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                        {['Date Range', 'Department', 'Leave Type'].map((filter) => (
                            <TouchableOpacity key={filter} style={[styles.filterBtn, dynamicStyles.filterBtn]}>
                                <Text style={[styles.filterText, dynamicStyles.filterText]}>{filter}</Text>
                                <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.textMain} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Stats Header */}
                    <View style={styles.statsRow}>
                        <View>
                            <Text style={[styles.statsLabel, dynamicStyles.statsLabel]}>{activeTab} REQUESTS</Text>
                            <Text style={[styles.statsValue, dynamicStyles.statsValue]}>{approvals.length} Request{approvals.length !== 1 ? 's' : ''}</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={[styles.markReadText, dynamicStyles.markReadText]}>Mark all read</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Request Cards */}
                    <View style={styles.cardsContainer}>
                        {approvals.length > 0 ? approvals.map((item) => {
                            const styleConfig = getLeaveTypeStyle(item.leaveType);
                            // Using a placeholder avatar since API doesn't return one yet
                            // const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.employeeName) + '&background=random';

                            return (
                                <View key={item.id} style={[styles.card, dynamicStyles.card]}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.userInfo}>
                                            <View style={[styles.avatar, { backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' }]}>
                                                <MaterialIcons name="person" size={32} color={colors.primary} />
                                            </View>
                                            <View>
                                                <Text style={[styles.userName, dynamicStyles.userName]}>{item.employeeName}</Text>
                                                <Text style={[styles.userRole, dynamicStyles.userRole]}>{item.designation || 'Employee'}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.metaInfo}>
                                            <View style={[styles.tag, { backgroundColor: styleConfig.bg, borderColor: styleConfig.bg }]}>
                                                <Text style={[styles.tagText, { color: styleConfig.color }]}>{item.leaveType}</Text>
                                            </View>
                                            <Text style={[styles.timeAgo, dynamicStyles.timeAgo]}>{calculateTimeAgo(item.requestedAt)}</Text>
                                        </View>
                                    </View>

                                    {/* Details Box */}
                                    <View style={[styles.detailsBox, dynamicStyles.detailsBox]}>
                                        <View style={styles.detailsRow}>
                                            <View style={[styles.detailIconBox, dynamicStyles.detailIconBox]}>
                                                <MaterialIcons name={styleConfig.icon as any} size={20} color={styleConfig.color} />
                                            </View>
                                            <View style={styles.detailsGrid}>
                                                <View style={styles.gridCol}>
                                                    <Text style={[styles.detailLabel, dynamicStyles.detailLabel]}>DATES</Text>
                                                    <Text style={[styles.detailValue, dynamicStyles.detailValue]}>
                                                        {formatDateRange(item.startDate, item.endDate)}
                                                    </Text>
                                                    {/* We could calculate day names here if needed */}
                                                </View>
                                                <View style={[styles.gridCol, styles.gridColBorder, dynamicStyles.gridColBorder]}>
                                                    <Text style={[styles.detailLabel, dynamicStyles.detailLabel]}>DURATION</Text>
                                                    <Text style={[styles.detailValue, dynamicStyles.detailValue]}>
                                                        {item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        {item.reason && (
                                            <View style={styles.reasonBox}>
                                                <Text style={[styles.detailLabel, dynamicStyles.detailLabel]}>REASON</Text>
                                                <Text style={[styles.reasonText, dynamicStyles.reasonText]}>"{item.reason}"</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Actions - Only show for Pending */}
                                    {
                                        activeTab === 'Pending' && (
                                            <View style={styles.actionsRow}>
                                                <TouchableOpacity
                                                    style={styles.rejectBtn}
                                                    onPress={() => handleRejectClick(item.id)}
                                                    disabled={isSubmitting}
                                                >
                                                    <MaterialIcons name="close" size={18} color={STATIC_COLORS.redText} />
                                                    <Text style={styles.rejectText}>Reject</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.approveBtn, dynamicStyles.approveBtn]}
                                                    onPress={() => handleApprove(item.id)}
                                                    disabled={isSubmitting}
                                                >
                                                    <MaterialIcons name="check" size={18} color={colors.white} />
                                                    <Text style={styles.approveText}>Approve</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )
                                    }
                                </View>
                            );
                        }) : (
                            <View style={styles.emptyState}>
                                <MaterialIcons name="task-alt" size={48} color={colors.textSub} />
                                <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No {activeTab.toLowerCase()} requests found.</Text>
                            </View>
                        )}

                        {/* Bottom Spacer for Tab Bar */}
                        <View style={{ height: 100 }} />
                    </View>
                </ScrollView>

                {/* Bottom Tab Bar */}
                <BottomTabBar activeTab="leaves" />

            </SafeAreaView>


            {/* Rejection Reason Modal */}
            <Modal
                transparent={true}
                visible={rejectModalVisible}
                animationType="fade"
                onRequestClose={() => setRejectModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.textMain }]}>Reject Request</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSub }]}>Please provide a reason for rejection.</Text>

                        <TextInput
                            style={[styles.modalInput, {
                                color: colors.textMain,
                                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                borderColor: colors.border
                            }]}
                            placeholder="Enter rejection reason..."
                            placeholderTextColor={colors.textSub}
                            multiline
                            numberOfLines={4}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: 'transparent' }]}
                                onPress={() => setRejectModalVisible(false)}
                                disabled={isSubmitting}
                            >
                                <Text style={{ color: colors.textSub, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: STATIC_COLORS.redBg }]}
                                onPress={submitReject}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color={STATIC_COLORS.redText} />
                                ) : (
                                    <Text style={{ color: STATIC_COLORS.redText, fontWeight: '700' }}>Reject Request</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <CustomToast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={hideToast}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0,
    },
    header: {
        borderBottomWidth: 1,
        paddingTop: 8,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    iconBtn: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    historyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    historyBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 16,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextActive: {
        fontWeight: '700',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        width: '100%',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    searchContainer: {
        margin: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    filterScroll: {
        maxHeight: 40,
        marginBottom: 8,
    },
    filterContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 4,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    statsLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statsValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    markReadText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardsContainer: {
        paddingHorizontal: 16,
        gap: 20,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
    },
    userRole: {
        fontSize: 12,
        fontWeight: '500',
    },
    metaInfo: {
        alignItems: 'flex-end',
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        marginBottom: 6,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    timeAgo: {
        fontSize: 11,
        fontWeight: '500',
    },
    detailsBox: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    detailIconBox: {
        marginTop: 2,
        padding: 8,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    detailsGrid: {
        flex: 1,
        flexDirection: 'row',
        gap: 16,
    },
    gridCol: {
        flex: 1,
    },
    gridColBorder: {
        borderLeftWidth: 1,
        paddingLeft: 16,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    detailSub: {
        fontSize: 12,
        marginTop: 2,
    },
    reasonBox: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    reasonText: {
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    rejectBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        borderRadius: 12,
        backgroundColor: STATIC_COLORS.redBg,
        gap: 8,
    },
    rejectText: {
        fontSize: 14,
        fontWeight: '700',
        color: STATIC_COLORS.redText,
    },
    approveBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        borderRadius: 12,
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    approveText: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 14,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
    },
    iconBtn: {
        backgroundColor: colors.surface,
    },
    headerTitle: {
        color: colors.textMain,
    },
    historyBtnText: {
        color: colors.primary,
    },
    tabText: {
        color: colors.textSub,
    },
    tabTextActive: {
        color: colors.primary,
    },
    activeIndicator: {
        backgroundColor: colors.primary,
    },
    searchContainer: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    searchInput: {
        color: colors.textMain,
    },
    filterBtn: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    filterText: {
        color: colors.textMain,
    },
    statsLabel: {
        color: colors.textSub,
    },
    statsValue: {
        color: colors.textMain,
    },
    markReadText: {
        color: colors.primary,
    },
    card: {
        backgroundColor: colors.surface,
    },
    userName: {
        color: colors.textMain,
    },
    userRole: {
        color: colors.textSub,
    },
    timeAgo: {
        color: isDark ? colors.textSub : '#909eb0',
    },
    detailsBox: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.background,
    },
    detailIconBox: {
        backgroundColor: colors.surface,
    },
    gridColBorder: {
        borderLeftColor: colors.border,
    },
    detailLabel: {
        color: colors.textSub,
    },
    detailValue: {
        color: colors.textMain,
    },
    detailSub: {
        color: colors.textSub,
    },
    reasonBox: {
        borderTopColor: colors.border,
    },
    reasonText: {
        color: colors.textMain,
    },
    approveBtn: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
    },
    approveText: {
        color: colors.white,
    },
    emptyText: {
        color: colors.textSub,
    },
});





