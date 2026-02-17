import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomTabBar from '../components/BottomTabBar';
import { useTheme } from '../contexts/ThemeContext';

export default function JobsScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const styles = createStyles(colors, isDark);
    const [selectedTab, setSelectedTab] = useState('All Jobs');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = ['All Jobs', 'Engineering', 'Product', 'Marketing'];

    const jobs = [
        {
            id: 1,
            title: 'Senior Product Designer',
            department: 'Design Team',
            status: 'Active',
            applicants: 12,
            color: '#10B981', // green
            icon: 'business',
            applicantsImages: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCCO68Clx3sv8qsjD1vWpdsvL_MUp0Oe2ZndYvze9F8d77QrbG7BBcyDWA1hJ3aeKmHiTMRzZhc5OuiiOS_hIhtWD0Ad07kgBnBWvNdoUKrPFoKsFDIm4RCRDe_uSikIatBlBWSsgOk_lUOuER3lUnTdxzbpuJK5mmuaGW3_ron4svaJoVMum_puntwJ2zXyyGISZn-NCyjtvg2OJZrbt7kBAm7EH9MqWBDSF2eBNgE51kz1RmWUEejtSIQC5XUoDl8PP4j7eKlUpMh',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDVw_9eVuFcAgRl1bXpNX8uTYs73fDziz13ZlzbeSf4Fl7w6-kcdfspmy0MSijmKEKKzhYcYzCK59H-wwM5CLoS1rDJmm43ZLpaMrG97sX59tMGlY6omsjay66ABzTR5sDlQwtza3boQvhJbvXEYPQSVDBWhF9UpI7WDm1ovkp3HE93ThwdindqF4CXuNvcTvYuaytfRCjhHCeQZwIXMKsg5duEZEldU1dIEoFfOiTC5LDWbBN7x5IghFMBOXhNXBmnoxmbY-xV91Im'
            ]
        },
        {
            id: 2,
            title: 'Frontend Developer',
            department: 'Engineering',
            status: 'Pending',
            applicants: 1,
            color: '#F59E0B', // amber
            icon: 'code',
            applicantsImages: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDVolXxV6T4-KhittBMy2hoPhMRD5ndOSSpWhs6Dx4O_FvDBDYKJl_oLg46GXcXTYM7Y_CEMbTAYzxogwikixdM0iWLXEY2cfbsUgZloTfNU60gKJk8k6KBARmEiBaqX7KfKIvwwSanXm62JYSfb3H5GuMok0myNx3macxSsmdh8B67R3yLX6Tmb3Y6hAbUaVP-ywqn-RQoW25e6PjUxfkFza_zJI8-66LScgL_uDvsq4hns3cYbi82GtVpiNzIDvrg-6VxW8P7DGZJ'
            ]
        },
        {
            id: 3,
            title: 'Marketing Manager',
            department: 'Marketing',
            status: 'Closed',
            applicants: 0,
            color: '#9CA3AF', // gray
            icon: 'campaign',
            opacity: 0.8,
            applicantsImages: []
        },
        {
            id: 4,
            title: 'Backend Engineer',
            department: 'Engineering',
            status: 'Active',
            applicants: 5,
            color: '#10B981', // green
            icon: 'dns',
            applicantsImages: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCv00TYsGXYwbgk_kmtpvaDsHmdq5-9cnuEI2lTCVJo9U1YZpkkvhMNDIo4_M0ZGMuecass9GzBR2a3IguiTgiuhHaqF3KiLOeIJ4fxQo3outdlCuKiEfsoCK8yOPIhPg4xy6XAVJwd8UY4rU5Ykx4gNfICfZdRdvpB4KfjNvnqOPLWNsnvSq47bqqfWw_1ufvTkFe1FUwoaj_a-JxRn2wV_qhx3ebymPBtq7qhZZ6Qi93l1xMeeWssW0un_uynjagzKU2GgW05RrA9',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDnuAyJWPx3e6biFyhqf5V-2-lfjSMSk8nrOPYFBiUVpyraq2z12_Z9dPITRteohyJx8G2XtLGUHBlkhdzhMllxtUkR-tyzZjEl4XrT9dZWdVnKIY7JgQvYpujkwEOXv-H7C4YwRC8f5oENU8ryc4OJRp35XdyxmGu9y0e5MYCwSwJ1IuAq7fqL-AK6T4vesqHCOBKHtwrr5liUu4i4SoGiBIxDTTeS-8bNp8VX8s0F2JgLyuq35S9Iarpebo64IRjOmbiVk1A43ftb'
            ]

        }
    ];

    return (
        <View style={styles.container}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    {isSearchVisible ? (
                        <View style={styles.searchHeader}>
                            <View style={styles.searchInputContainer}>
                                <MaterialIcons name="search" size={20} color={colors.textSub} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search jobs..."
                                    placeholderTextColor={colors.textSub}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <MaterialIcons name="close" size={20} color={colors.textSub} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => { setIsSearchVisible(false); setSearchQuery(''); }}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View style={styles.headerLeft}>
                                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                    <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                                </TouchableOpacity>
                                <View>
                                    <Text style={styles.headerTitle}>Jobs</Text>
                                    <Text style={styles.headerSubtitle}>HR Management</Text>
                                </View>
                            </View>
                            <View style={styles.headerActions}>
                                <TouchableOpacity
                                    style={styles.searchButton}
                                    onPress={() => setIsSearchVisible(true)}
                                >
                                    <MaterialIcons name="search" size={24} color={isDark ? '#94A3B8' : '#6B7280'} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButtonHeader}
                                    onPress={() => router.push('/screens/create_job')}
                                >
                                    <MaterialIcons name="add" size={24} color={isDark ? '#94A3B8' : '#6B7280'} />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>24</Text>
                            <Text style={styles.statLabel}>TOTAL</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
                            <Text style={[styles.statNumber, { color: '#16a34a' }]}>18</Text>
                            <Text style={styles.statLabel}>ACTIVE</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
                            <Text style={[styles.statNumber, { color: '#d97706' }]}>6</Text>
                            <Text style={styles.statLabel}>PENDING</Text>
                        </View>
                    </View>

                    {/* Tabs */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={{ paddingRight: 20 }}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, selectedTab === tab && styles.activeTab]}
                                onPress={() => setSelectedTab(tab)}
                            >
                                <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Jobs List */}
                    <View style={styles.jobsList}>
                        {jobs.filter(job => {
                            const matchesTab = selectedTab === 'All Jobs' ||
                                (selectedTab === 'Engineering' && job.department === 'Engineering') ||
                                (selectedTab === 'Product' && job.department.includes('Product') || job.department.includes('Design')) ||
                                (selectedTab === 'Marketing' && job.department === 'Marketing');

                            const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                job.department.toLowerCase().includes(searchQuery.toLowerCase());

                            return matchesTab && matchesSearch;
                        }).map((job) => (
                            <View key={job.id} style={[styles.jobCard, job.opacity ? { opacity: job.opacity } : {}]}>
                                <View style={[styles.accentStrip, { backgroundColor: job.color }]} />
                                <View style={styles.jobCardContent}>
                                    <View style={styles.jobHeader}>
                                        <View>
                                            <Text style={styles.jobTitle}>{job.title}</Text>
                                            <View style={styles.jobMeta}>
                                                <MaterialIcons name={job.icon as any} size={14} color={isDark ? '#94A3B8' : '#6B7280'} style={{ marginRight: 4 }} />
                                                <Text style={styles.jobDepartment}>{job.department}</Text>
                                            </View>
                                        </View>
                                        <View style={[
                                            styles.statusBadge,
                                            {
                                                backgroundColor: job.status === 'Active' ? (isDark ? 'rgba(22, 163, 74, 0.2)' : '#DCFCE7') :
                                                    job.status === 'Pending' ? (isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7') :
                                                        (isDark ? 'rgba(75, 85, 99, 0.2)' : '#F3F4F6'),
                                                borderColor: job.status === 'Active' ? (isDark ? '#166534' : '#BBF7D0') :
                                                    job.status === 'Pending' ? (isDark ? '#B45309' : '#FDE68A') :
                                                        (isDark ? '#374151' : '#E5E7EB')
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.statusText,
                                                {
                                                    color: job.status === 'Active' ? (isDark ? '#4ade80' : '#15803d') :
                                                        job.status === 'Pending' ? (isDark ? '#fbbf24' : '#b45309') :
                                                            (isDark ? '#9ca3af' : '#4b5563')
                                                }
                                            ]}>{job.status}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.jobFooter}>
                                        <View style={styles.applicantsContainer}>
                                            {job.applicants > 0 ? (
                                                <View style={styles.avatarStack}>
                                                    {job.applicantsImages.map((img, idx) => (
                                                        <Image key={idx} source={{ uri: img }} style={[styles.applicantAvatar, { marginLeft: idx > 0 ? -8 : 0 }]} />
                                                    ))}
                                                    {job.applicants > job.applicantsImages.length && (
                                                        <View style={[styles.moreApplicants, { marginLeft: -8 }]}>
                                                            <Text style={styles.moreApplicantsText}>+{job.applicants - job.applicantsImages.length}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            ) : (
                                                <Text style={styles.noApplicants}>No new applicants</Text>
                                            )}
                                            {job.applicants > 0 && <Text style={styles.applicantsLabel}>Applicants</Text>}
                                        </View>

                                        <View style={styles.actionsContainer}>
                                            <TouchableOpacity style={styles.actionButton}>
                                                <MaterialIcons name="edit" size={18} color={isDark ? '#94A3B8' : '#6B7280'} />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.actionButton}>
                                                <MaterialIcons name="delete-outline" size={18} color={isDark ? '#94A3B8' : '#6B7280'} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Bottom Spacer */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Bottom Tab Bar */}
                <BottomTabBar activeTab="jobs" />
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textMain,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.textSub,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionButtonHeader: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
    },
    searchButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
    },
    profileContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        padding: 2,
        backgroundColor: '#3B82F6', // gradient fallback
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 19,
        borderWidth: 2,
        borderColor: isDark ? '#1E293B' : '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSub,
        letterSpacing: 0.5,
    },
    statusDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    tabsContainer: {
        marginBottom: 24,
        maxHeight: 40,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 10,
    },
    activeTab: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSub,
    },
    activeTabText: {
        color: '#FFF',
    },
    jobsList: {
        gap: 16,
    },
    jobCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'row',
    },
    accentStrip: {
        width: 4,
        height: '100%',
    },
    jobCardContent: {
        flex: 1,
        padding: 16,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMain,
    },
    jobMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    jobDepartment: {
        fontSize: 14,
        color: colors.textSub,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    jobFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: isDark ? '#334155' : '#F3F4F6',
    },
    applicantsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatarStack: {
        flexDirection: 'row',
    },
    applicantAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: isDark ? '#1E293B' : '#FFF',
    },
    moreApplicants: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: isDark ? '#334155' : '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: isDark ? '#1E293B' : '#FFF',
    },
    moreApplicantsText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSub,
    },
    applicantsLabel: {
        fontSize: 12,
        color: colors.textSub,
    },
    noApplicants: {
        fontSize: 12,
        fontStyle: 'italic',
        color: colors.textSub,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: isDark ? '#334155' : '#F9FAFB',
    },
    searchHeader: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.textMain,
    },
    cancelButton: {
        padding: 4,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
});
