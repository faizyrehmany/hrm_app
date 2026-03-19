import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import BottomTabBar from '../components/BottomTabBar';
import SideMenu from '../components/SideMenu';
import { useTheme } from '../contexts/ThemeContext';
import { SessionManager } from '../services/SessionManager';

const { width } = Dimensions.get('window');

// Color Palette
const COLORS = {
    primary: '#3B82F6',
    backgroundLight: '#F3F4F6',
    cardLight: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    success: '#10B981', // Green
    warning: '#FBBF24', // Yellow
    danger: '#EF4444', // Red
    purple: '#8B5CF6',
    purpleLight: '#F3E8FF',
    orange: '#F97316',
    orangeLight: '#FFEDD5',
};

export default function DashboardScreen() {
    const router = useRouter();
    const [isMenuVisible, setMenuVisible] = useState(false);
    const { isDark, colors, setMode } = useTheme();

    // Check user role on mount
    useEffect(() => {
        const checkRole = async () => {
            const user = await SessionManager.getUser();
            const role = user?.role || '';
            const isAdmin = role.toLowerCase() === 'admin';

            // Redirect employees to employee dashboard
            if (!isAdmin) {
                router.replace('/screens/employee_dashboard');
            }
        };
        checkRole();
    }, []);

    // Circular Chart Data
    const size = Math.min(width * 0.5, 180);
    const strokeWidth = 12;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Segments for the donut chart: Present (75%), Late (15%), Absent (10%)
    // We'll approximate the strokeDasharray logic
    // Total = 100.
    // Segment 1 (Blue/Present): 75%
    // Segment 2 (Yellow/Late): 15%
    // Segment 3 (Red/Absent): 10%

    // Note: react-native-svg strokeDasharray + strokeDashoffset can be tricky.
    // We'll layer circles for simplicity or calculate offsets.

    const toggleDarkMode = () => {
        setMode(isDark ? 'light' : 'dark');
    };

    const dynamicStyles = createDynamicStyles(colors, isDark);

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>

                {/* Header */}
                <View style={[styles.header, dynamicStyles.header]}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            style={[styles.menuButton, dynamicStyles.menuButton, { marginRight: 12 }]}
                            onPress={() => setMenuVisible(true)}
                        >
                            <MaterialIcons name="menu" size={24} color={colors.textMain} />
                        </TouchableOpacity>
                        <View>
                            <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>DREAMS</Text>
                            <Text style={[styles.headerSubtitle, dynamicStyles.headerSubtitle]}>HRM System</Text>
                        </View>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={[styles.menuButton, dynamicStyles.menuButton]}
                            onPress={toggleDarkMode}
                        >
                            <MaterialIcons
                                name={isDark ? "light-mode" : "dark-mode"}
                                size={24}
                                color={colors.textMain}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Top Stats - Grid Layout */}
                    <View style={styles.statsGridContainer}>
                        {/* Total Employees */}
                        <View style={[styles.statCard, dynamicStyles.statCard]}>
                            <View style={styles.statHeader}>
                                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Total Employees</Text>
                            </View>
                            <View style={styles.statFooter}>
                                <Text style={[styles.statValue, dynamicStyles.statValue]}>17</Text>
                                <View style={[styles.iconBox, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                                    <MaterialIcons name="people" size={24} color="#FFF" />
                                </View>
                            </View>
                        </View>

                        {/* On Leave */}
                        <View style={[styles.statCard, dynamicStyles.statCard]}>
                            <View style={styles.statHeader}>
                                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>On Leave</Text>
                            </View>
                            <View style={styles.statFooter}>
                                <View style={styles.statValueContainer}>
                                    <Text style={[styles.statValue, dynamicStyles.statValue]}>24</Text>
                                    <Text style={[styles.statTotal, dynamicStyles.statTotal]}>/120</Text>
                                </View>
                                <View style={[styles.iconBox, { backgroundColor: COLORS.purpleLight }]}>
                                    <MaterialIcons name="event-busy" size={24} color={COLORS.purple} />
                                </View>
                            </View>
                        </View>

                        {/* New Joinee */}
                        <View style={[styles.statCard, dynamicStyles.statCard]}>
                            <View style={styles.statHeader}>
                                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>New Joinee</Text>
                            </View>
                            <View style={styles.statFooter}>
                                <View style={styles.statValueContainer}>
                                    <Text style={[styles.statValue, dynamicStyles.statValue]}>20</Text>
                                    <Text style={[styles.statTotal, dynamicStyles.statTotal]}>/120</Text>
                                </View>
                                <View style={[styles.iconBox, { backgroundColor: COLORS.orangeLight }]}>
                                    <MaterialIcons name="person-add" size={24} color={COLORS.orange} />
                                </View>
                            </View>
                        </View>

                        {/* Happiness Rate */}
                        <View style={[styles.statCard, dynamicStyles.statCard]}>
                            <View style={styles.statHeader}>
                                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Happiness Rate</Text>
                            </View>
                            <View style={styles.statFooter}>
                                <View style={styles.statValueContainer}>
                                    <Text style={[styles.statValue, dynamicStyles.statValue]}>85%</Text>
                                    <Text style={[styles.statTotal, dynamicStyles.statTotal]}>/100%</Text>
                                </View>
                                <LinearGradient
                                    colors={['#FEF3C7', '#D1FAE5']}
                                    style={styles.iconBox}
                                >
                                    <MaterialIcons name="sentiment-satisfied-alt" size={24} color="#059669" />
                                </LinearGradient>
                            </View>
                        </View>
                    </View>

                    {/* Employee Status Section */}
                    <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Employee Status</Text>
                            <TouchableOpacity style={[styles.dropdownButton, dynamicStyles.dropdownButton]}>
                                <Text style={[styles.dropdownText, dynamicStyles.dropdownText]}>This Week</Text>
                                <MaterialIcons name="keyboard-arrow-down" size={16} color={colors.textSub} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.totalEmployeeRow}>
                            <Text style={[styles.textSecondary, dynamicStyles.textSecondary]}>Total Employee</Text>
                            <Text style={[styles.boldText, dynamicStyles.boldText]}>120</Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressSegment, { flex: 0.48, backgroundColor: COLORS.primary }]} />
                            <View style={[styles.progressSegment, { flex: 0.10, backgroundColor: COLORS.warning }]} />
                            <View style={[styles.progressSegment, { flex: 0.22, backgroundColor: COLORS.purple }]} />
                            <View style={[styles.progressSegment, { flex: 0.20, backgroundColor: COLORS.danger }]} />
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <View style={styles.gridItem}>
                                <View style={styles.legendRow}>
                                    <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                                    <Text style={[styles.legendText, dynamicStyles.legendText]}>Fulltime (48%)</Text>
                                </View>
                                <Text style={[styles.gridValue, dynamicStyles.gridValue]}>58</Text>
                            </View>
                            <View style={styles.gridItem}>
                                <View style={styles.legendRow}>
                                    <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
                                    <Text style={[styles.legendText, dynamicStyles.legendText]}>Contract (10%)</Text>
                                </View>
                                <Text style={[styles.gridValue, dynamicStyles.gridValue]}>12</Text>
                            </View>
                            <View style={styles.gridItem}>
                                <View style={styles.legendRow}>
                                    <View style={[styles.dot, { backgroundColor: COLORS.purple }]} />
                                    <Text style={[styles.legendText, dynamicStyles.legendText]}>Probation (22%)</Text>
                                </View>
                                <Text style={[styles.gridValue, dynamicStyles.gridValue]}>26</Text>
                            </View>
                            <View style={styles.gridItem}>
                                <View style={styles.legendRow}>
                                    <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
                                    <Text style={[styles.legendText, dynamicStyles.legendText]}>WFH (20%)</Text>
                                </View>
                                <Text style={[styles.gridValue, dynamicStyles.gridValue]}>24</Text>
                            </View>
                        </View>

                        <View style={[styles.divider, dynamicStyles.divider]} />

                        <View style={[styles.divider, dynamicStyles.divider]} />
                        {/* Top Performer */}
                        <View style={styles.performerSection}>
                            <View style={styles.performerHeader}>
                                <Text style={[styles.cardTitleSmall, dynamicStyles.cardTitleSmall]}>Top Performer</Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.textTiny, dynamicStyles.textTiny]}>Performance</Text>
                                    <Text style={[styles.textBold, { color: colors.primary }]}>98%</Text>
                                </View>
                            </View>

                            <View style={styles.performerRow}>
                                <View>
                                    <Image
                                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdmMpqbqvbIxay_xl1ktNLGz0pr-Ux4XoQjV3SxBl1_vWGyQclJbxBTRHilRra_nSRfnpulojDd59d2yXNxnTtudStfRuG9I7CF7tubS3BWe8lXe2g7t_hGqvgvGhSi4o3NW5l_VKMsDRDLRflR_ISDuEHXQnJ5WaVLAbIPSGIWgvGI9p19zpA-mLugSp-mv27ATTpa_7FOI8QO7lY0Mslw6LjlhEyLTnKpGV2bycy_OmgY2A95GwPq3InU6NXipoRQGTtFno7QBoy' }}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.crownBadge}>
                                        <MaterialIcons name="emoji-events" size={10} color="#FFF" />
                                    </View>
                                </View>
                                <View style={styles.performerInfo}>
                                    <Text style={[styles.performerName, dynamicStyles.performerName]}>Shirley Baker</Text>
                                    <Text style={[styles.performerRole, dynamicStyles.performerRole]}>iOS Developer</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.actionButton, dynamicStyles.actionButton]}>
                                <Text style={[styles.actionButtonText, dynamicStyles.actionButtonText]}>View All Employees</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Attendance Overview */}
                    <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Attendance Overview</Text>
                            <TouchableOpacity style={[styles.dropdownButton, dynamicStyles.dropdownButton]}>
                                <Text style={[styles.dropdownText, dynamicStyles.dropdownText]}>Today</Text>
                                <MaterialIcons name="keyboard-arrow-down" size={16} color={colors.textSub} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.chartContainer}>
                            <Svg width={size} height={size}>
                                <G rotation="-90" origin={`${center}, ${center}`}>
                                    {/* Background Circle */}
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        stroke="#E5E7EB"
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                    {/* Blue Segment (75%) */}
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        stroke={COLORS.primary}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                        strokeDasharray={`${circumference} ${circumference}`}
                                        strokeDashoffset={circumference * (1 - 0.75)}
                                        strokeLinecap="round"
                                    />
                                    {/* Yellow Segment (15%) - offset by 75% */}
                                    {/* Note: In SVG multiple segments requires calculating offsets. 
                      For simplicity we will just show the main 75% blue segment as in the basic example, 
                      or try to overlay them. To keep it simple and robust:
                      I'll just render the main "Present" arc or simulated segments. 
                      Let's do 3 circles with different lengths/rotations. 
                  */}
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        stroke={COLORS.warning}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                        strokeDasharray={`${circumference} ${circumference}`}
                                        strokeDashoffset={circumference * (1 - 0.15)}
                                        rotation={360 * 0.75}
                                        origin={`${center}, ${center}`}
                                        strokeLinecap="round"
                                    />
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        stroke={COLORS.danger}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                        strokeDasharray={`${circumference} ${circumference}`}
                                        strokeDashoffset={circumference * (1 - 0.10)}
                                        rotation={360 * 0.90}
                                        origin={`${center}, ${center}`}
                                        strokeLinecap="round"
                                    />
                                </G>
                            </Svg>
                            <View style={styles.chartCenter}>
                                <Text style={[styles.chartBigText, dynamicStyles.chartBigText]}>100</Text>
                                <Text style={[styles.chartLabel, dynamicStyles.chartLabel]}>TOTAL ATTENDANCE</Text>
                            </View>
                        </View>

                        <View style={styles.attendanceStats}>
                            <View style={styles.attendanceRow}>
                                <View style={styles.legendRow}>
                                    <View style={[styles.dotLarge, { backgroundColor: COLORS.primary }]} />
                                    <Text style={[styles.textMedium, dynamicStyles.textMedium]}>Present</Text>
                                </View>
                                <Text style={[styles.textBold, dynamicStyles.textBold]}>75%</Text>
                            </View>
                            <View style={styles.attendanceRow}>
                                <View style={styles.legendRow}>
                                    <View style={[styles.dotLarge, { backgroundColor: COLORS.warning }]} />
                                    <Text style={[styles.textMedium, dynamicStyles.textMedium]}>Late</Text>
                                </View>
                                <Text style={[styles.textBold, dynamicStyles.textBold]}>15%</Text>
                            </View>
                            <View style={styles.attendanceRow}>
                                <View style={styles.legendRow}>
                                    <View style={[styles.dotLarge, { backgroundColor: COLORS.danger }]} />
                                    <Text style={[styles.textMedium, dynamicStyles.textMedium]}>Absent</Text>
                                </View>
                                <Text style={[styles.textBold, dynamicStyles.textBold]}>10%</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.actionButton, dynamicStyles.actionButton]}>
                            <Text style={[styles.actionButtonText, dynamicStyles.actionButtonText]}>View Details</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Padding for Tab Bar */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Floating Bottom Tab Bar */}
                <BottomTabBar activeTab="dashboard" />

                {/* Side Menu */}
                <SideMenu
                    visible={isMenuVisible}
                    onClose={() => setMenuVisible(false)}
                />

            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: COLORS.cardLight,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 20,
    },
    statsGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        height: 140,
        backgroundColor: COLORS.cardLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    statFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    statValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    statTotal: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 2,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionCard: {
        backgroundColor: COLORS.cardLight,
        borderRadius: 24,
        padding: 20,
        marginTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    cardTitleSmall: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dropdownText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textPrimary,
        marginRight: 4,
    },
    totalEmployeeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    textSecondary: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    boldText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    progressBarContainer: {
        flexDirection: 'row',
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        marginBottom: 20,
    },
    progressSegment: {
        height: '100%',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '48%',
        marginBottom: 16,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 2,
        marginRight: 8,
    },
    dotLarge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    gridValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginLeft: 18,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    performerSection: {
        marginTop: 8,
    },
    performerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    textTiny: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    textBold: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    performerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    crownBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.warning,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    performerInfo: {
        marginLeft: 12,
    },
    performerName: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    performerRole: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    actionButton: {
        marginTop: 20,
        backgroundColor: '#EFF6FF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionButtonText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    chartCenter: {
        position: 'absolute',
        alignItems: 'center',
    },
    chartBigText: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    chartLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginTop: 4,
    },
    attendanceStats: {
        marginTop: 8,
        gap: 12,
    },
    attendanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textMedium: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.surface,
    },
    headerTitle: {
        color: colors.primary,
    },
    headerSubtitle: {
        color: colors.textSub,
    },
    menuButton: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F9FAFB',
    },
    statCard: {
        backgroundColor: colors.surface,
    },
    statLabel: {
        color: colors.textSub,
    },
    statValue: {
        color: colors.textMain,
    },
    statTotal: {
        color: colors.textSub,
    },
    sectionCard: {
        backgroundColor: colors.surface,
    },
    cardTitle: {
        color: colors.textMain,
    },
    cardTitleSmall: {
        color: colors.textSub,
    },
    dropdownButton: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F9FAFB',
        borderColor: colors.border,
    },
    dropdownText: {
        color: colors.textMain,
    },
    textSecondary: {
        color: colors.textSub,
    },
    boldText: {
        color: colors.textMain,
    },
    legendText: {
        color: colors.textSub,
    },
    gridValue: {
        color: colors.textMain,
    },
    divider: {
        backgroundColor: colors.border,
    },
    textTiny: {
        color: colors.textSub,
    },
    textBold: {
        color: colors.textMain,
    },
    textMedium: {
        color: colors.textSub,
    },
    performerName: {
        color: colors.textMain,
    },
    performerRole: {
        color: colors.textSub,
    },
    actionButton: {
        backgroundColor: isDark ? 'rgba(19, 127, 236, 0.2)' : '#EFF6FF',
    },
    actionButtonText: {
        color: colors.primary,
    },
    chartBigText: {
        color: colors.textMain,
    },
    chartLabel: {
        color: colors.textSub,
    },
});





