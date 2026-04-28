import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmployeeBottomTabBar from '../components/EmployeeBottomTabBar';
import EmployeeHeader from '../components/EmployeeHeader';
import MonthYearDropdown from '../components/MonthYearDropdown';
import SideMenu from '../components/SideMenu';
import { useTheme } from '../contexts/ThemeContext';
import { getEmployeeGrading, getGradePolicies } from '../services/grading';

const { width } = Dimensions.get('window');

export interface User {
    id: number | string;
    employeeId?: number;
    enrollNo?: string;
    username?: string;
    email?: string;
    fullName?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    departmentName?: string;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function gradeColor(grade: string): string {
    const map: Record<string, string> = {
        'A+': '#10b981', A: '#3b82f6', 'B+': '#8b5cf6', B: '#f59e0b', C: '#ef4444', D: '#6b7280',
    };
    return map[grade] ?? '#6b7280';
}

function varianceColor(v: number): string {
    if (v > 0) return '#10b981';
    if (v < 0) return '#ef4444';
    return '#6b7280';
}

// ─── Summary Stats ────────────────────────────────────────────────────────────

function SummaryStats({ data, colors, isDark }: { data: any[], colors: any; isDark: boolean }) {
    const total = data.length;
    if (total === 0) return null;
    const avgScore = Math.round(data.reduce((s, e) => s + e.score, 0) / total);
    const topGrades = data.filter((e) => e.grade === 'A+' || e.grade === 'A').length;
    const avgAttendance = Math.round(data.reduce((s, e) => s + (e.present / e.working) * 100, 0) / total);

    const stats = [
        { label: 'Total Staff', value: total, icon: 'people' as const, color: '#3b82f6' },
        { label: 'Avg Score', value: `${avgScore}`, icon: 'star' as const, color: '#f59e0b' },
        { label: 'Top Grades', value: topGrades, icon: 'emoji-events' as const, color: '#10b981' },
        { label: 'Avg Attend.', value: `${avgAttendance}%`, icon: 'schedule' as const, color: '#8b5cf6' },
    ];

    return (
        <View style={summaryStyles.row}>
            {stats.map((s) => (
                <View key={s.label} style={[summaryStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[summaryStyles.iconWrap, { backgroundColor: s.color + '18' }]}>
                        <MaterialIcons name={s.icon} size={18} color={s.color} />
                    </View>
                    <Text style={[summaryStyles.value, { color: colors.textMain }]}>{s.value}</Text>
                    <Text style={[summaryStyles.label, { color: colors.textSub }]}>{s.label}</Text>
                </View>
            ))}
        </View>
    );
}

const summaryStyles = StyleSheet.create({
    row: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 4 },
    card: { flex: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, gap: 4 },
    iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    value: { fontSize: 16, fontWeight: '800' },
    label: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
});

// ─── Employee Grade Card ──────────────────────────────────────────────────────

function EmployeeGradeCard({ emp, colors, isDark }: { emp: any; colors: any; isDark: boolean }) {
    const gc = gradeColor(emp.grade);
    const attendPct = Math.round((emp.present / emp.working) * 100);
    const onTimePct = Math.round((emp.onTime / emp.working) * 100);

    const cells = [
        { label: 'Working', value: `${emp.working}d`, color: colors.textMain },
        { label: 'Present', value: `${emp.present}d`, color: '#10b981' },
        { label: 'On Time', value: `${emp.onTime}d`, color: '#3b82f6' },
        { label: 'Target', value: `${emp.target}%`, color: colors.textMain },
        { label: 'Actual', value: `${emp.actual}%`, color: colors.textMain },
        { label: 'Variance', value: emp.variance > 0 ? `+${emp.variance}%` : `${emp.variance}%`, color: varianceColor(emp.variance) },
    ];

    return (
        <View style={[cardStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Top Row */}
            <View style={cardStyles.topRow}>
                <View style={[cardStyles.avatar, { backgroundColor: gc + '22' }]}>
                    <Text style={[cardStyles.avatarText, { color: gc }]}>
                        {emp.name.split(' ').map((n: string) => n[0]).join('')}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[cardStyles.name, { color: colors.textMain }]}>{emp.name}</Text>
                    <Text style={[cardStyles.sub, { color: colors.textSub }]}>Score: {emp.score}/100</Text>
                </View>
                <View style={[cardStyles.gradeBadge, { backgroundColor: gc + '18', borderColor: gc + '40' }]}>
                    <Text style={[cardStyles.gradeText, { color: gc }]}>{emp.grade}</Text>
                </View>
            </View>

            {/* Score Bar */}
            <View style={cardStyles.barWrap}>
                <View style={[cardStyles.barTrack, { backgroundColor: colors.backgroundLight }]}>
                    <View style={[cardStyles.barFill, { width: `${emp.score}%` as any, backgroundColor: gc }]} />
                </View>
                <Text style={[cardStyles.barPct, { color: gc }]}>{emp.score}%</Text>
            </View>

            {/* Stats Grid */}
            <View style={cardStyles.grid}>
                {cells.map((cell) => (
                    <View key={cell.label} style={[cardStyles.cell, { backgroundColor: colors.backgroundLight }]}>
                        <Text style={[cardStyles.cellLabel, { color: colors.textSub }]}>{cell.label}</Text>
                        <Text style={[cardStyles.cellValue, { color: cell.color }]}>{cell.value}</Text>
                    </View>
                ))}
            </View>


        </View>
    );
}

const cardStyles = StyleSheet.create({
    card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 15, fontWeight: '800' },
    name: { fontSize: 15, fontWeight: '700' },
    sub: { fontSize: 12, marginTop: 1 },
    gradeBadge: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    gradeText: { fontSize: 16, fontWeight: '900' },
    barWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },
    barPct: { fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 10,
    },
    cell: {
        width: (width - 32 - 28 - 12) / 3,
        margin: 3, // instead of gap
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    cellLabel: { fontSize: 10, fontWeight: '500', marginBottom: 2 },
    cellValue: { fontSize: 14, fontWeight: '800' },
    footer: { flexDirection: 'row', gap: 8 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    pillText: { fontSize: 11, fontWeight: '600' },
});

// ─── Grade Policy Card ────────────────────────────────────────────────────────

function GradePolicyCard({ policy, colors }: { policy: any; colors: any }) {
    const items = [
        { label: 'Min Attendance', value: `${Number(policy.minAttendance).toFixed(0)}%` },
        { label: 'Min Punctuality', value: `${Number(policy.minPunctuality).toFixed(0)}%` },
        { label: 'Min Duty Hours', value: `${Number(policy.minDutyHours).toFixed(0)}%` },
    ];

    return (
        <View style={[policyStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            {/* Grade Badge */}
            <View style={policyStyles.left}>
                <View style={[policyStyles.badge, { backgroundColor: policy.bg, borderColor: policy.color + '40' }]}>
                    <Text style={[policyStyles.badgeText, { color: policy.color }]}>
                        {policy.grade}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>

                {/* Status */}
                <View style={policyStyles.rangeRow}>
                    <Text style={[policyStyles.rangeText, { color: policy.color }]}>
                        {policy.status}
                    </Text>
                    <View style={[policyStyles.dot, { backgroundColor: policy.color }]} />
                </View>

                {/* Metrics */}
                {items.map((item) => (
                    <View
                        key={item.label}
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 4,
                        }}
                    >
                        <Text style={[policyStyles.desc, { color: colors.textSub }]}>
                            {item.label}
                        </Text>
                        <Text style={[policyStyles.desc, { color: colors.textMain, fontWeight: '700' }]}>
                            {item.value}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const policyStyles = StyleSheet.create({
    card: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1, padding: 14, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    left: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
    badge: { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 18, fontWeight: '900' },
    rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    rangeText: { fontSize: 13, fontWeight: '700' },
    dot: { width: 6, height: 6, borderRadius: 3 },
    desc: { fontSize: 12, lineHeight: 17 },
});

// ─── Search Bar Styles ────────────────────────────────────────────────────────

const searchStyles = StyleSheet.create({
    wrapper: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingHorizontal: 12, height: 44, borderRadius: 10, gap: 8 },
    input: { flex: 1, fontSize: 14, padding: 0 },
    emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { fontSize: 14, textAlign: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GradingScreen() {
    const { isDark, colors } = useTheme();
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'grades' | 'policy'>('grades');
    const [gradingData, setGradingData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState<string>(monthNames[now.getMonth()]);
    const [selectedYear, setSelectedYear] = useState<string>(now.getFullYear().toString());
    const [gradePolicies, setGradePolicies] = useState<any[]>([]);
    const [policySearch, setPolicySearch] = useState('');
    const [debouncedPolicySearch, setDebouncedPolicySearch] = useState('');

    const getMonthNumber = (monthName: string) => {
        return monthNames.indexOf(monthName) + 1;
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedPolicySearch(policySearch);
        }, 500); // debounce 500ms

        return () => clearTimeout(handler);
    }, [policySearch]);

    useEffect(() => {
        fetchGrading();
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const data = await getGradePolicies();
            console.log('GRADE POLICY API:', data);

            const formatted = data.map((item: any) => ({
                grade: item.grade,
                minAttendance: item.minAttendancePercent,
                minPunctuality: item.minPunctualityPercent,
                minDutyHours: item.minDutyHoursPercent,
                status: item.description,
                isActive: item.isActive,
                color: gradeColor(item.grade),
                bg: gradeColor(item.grade) + '15',
            }));

            setGradePolicies(formatted);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchGrading = async () => {
        try {
            setLoading(true);

            const data = await getEmployeeGrading({
                year: Number(selectedYear),
                month: getMonthNumber(selectedMonth),
            });
            console.log("API DATA:", data);

            const formatted = data.map((item: any) => ({
                id: item.id,
                name: `Employee ${item.employeeId}`, // backend issue
                working: item.officialWorkingDays,
                present: item.presentDays,
                onTime: item.onTimeDays,
                target: 100,
                actual: Math.round((item.actualDutyHours / item.expectedDutyHours) * 100),
                variance: Math.round(item.dutyHoursDifference),
                score: Math.round(item.scorePercentage),
                grade: item.grade,
            }));

            setGradingData(formatted);

        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    // MonthYear — same pattern as DashboardScreen


    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Filtered data — filter by name; when you connect an API, also pass
    // selectedMonth + selectedYear to the fetch call instead.
    const filteredGrades = gradingData.filter((emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    // Dynamic styles
    const dyn = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
safeArea: { 
  flex: 1 
},        segmentedContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
        segmentedControl: { flexDirection: 'row' as const, height: 40, borderRadius: 10, padding: 3, backgroundColor: colors.backgroundLight },
        tab: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: 8, flexDirection: 'row' as const, gap: 6 },
        tabActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
        tabText: { fontSize: 13, fontWeight: '500' as const, color: colors.textSub },
        tabTextActive: { color: colors.textMain, fontWeight: '600' as const },
        sectionHeading: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
        sectionTitle: { fontSize: 18, fontWeight: '800' as const, color: colors.textMain },
        sectionSub: { fontSize: 13, color: colors.textSub, marginTop: 2, marginBottom: 16 },
    });

    const iconColor = (tab: 'grades' | 'policy') =>
        activeTab === tab ? colors.primary : colors.textSub;

    const filteredPolicies = gradePolicies
        .filter(p => p.isActive)
        .filter(p =>
            p.grade.toLowerCase().includes(debouncedPolicySearch.toLowerCase()) ||
            p.status.toLowerCase().includes(debouncedPolicySearch.toLowerCase())
        );

    return (
        <View style={dyn.container}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView style={dyn.safeArea}>

                {/* Header */}
                <EmployeeHeader
                    user={user}
                    title="Grading System"
                    onMenuPress={() => setMenuVisible(true)}
                    onNotificationPress={() => console.log('Notifications pressed')}
                />
                <SideMenu visible={isMenuVisible} onClose={() => setMenuVisible(false)} />

                <ScrollView
                    style={{ flex: 1 }} // 👈 IMPORTANT
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >

                    {/* Segmented Control */}
                    <View style={dyn.segmentedContainer}>
                        <View style={dyn.segmentedControl}>
                            {(['grades', 'policy'] as const).map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[dyn.tab, activeTab === tab && dyn.tabActive]}
                                    onPress={() => setActiveTab(tab)}
                                    activeOpacity={0.8}
                                >
                                    <MaterialIcons
                                        name={tab === 'grades' ? 'bar-chart' : 'policy'}
                                        size={16}
                                        color={iconColor(tab)}
                                    />
                                    <Text style={[dyn.tabText, activeTab === tab && dyn.tabTextActive]}>
                                        {tab === 'grades' ? 'Employee Grade' : 'Grade Policy'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Content */}

                    {activeTab === 'grades' ? (
                        <>
                            {/* Section Heading */}
                            <View style={dyn.sectionHeading}>
                                <Text style={dyn.sectionTitle}>Grade Distribution</Text>
                                <Text style={dyn.sectionSub}>Staff Efficiency Metrics</Text>
                            </View>

                            {/* ── MonthYear Dropdown ── */}
                            <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                                <MonthYearDropdown
                                    selectedMonth={selectedMonth}
                                    selectedYear={selectedYear}
                                    onMonthChange={(m) => {
                                        setSelectedMonth(m);
                                        // TODO: re-fetch grading API data for m + selectedYear
                                    }}
                                    onYearChange={(y) => {
                                        setSelectedYear(y);
                                        // TODO: re-fetch grading API data for selectedMonth + y
                                    }}
                                />
                            </View>

                            {/* ── Search Bar ── */}
                            <View style={[
                                searchStyles.wrapper,
                                { backgroundColor: colors.backgroundLight },
                            ]}>
                                <MaterialIcons name="search" size={20} color={colors.textSub} />
                                <TextInput
                                    style={[searchStyles.input, { color: colors.textMain }]}
                                    placeholder="Search employee..."
                                    placeholderTextColor={colors.textSub}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    returnKeyType="search"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setSearchQuery('')}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <MaterialIcons name="close" size={18} color={colors.textSub} />
                                    </TouchableOpacity>
                                )}
                            </View>



                            {/* ── Employee Cards ── */}
                            <View style={{ marginTop: 16 }}>
                                {filteredGrades.length === 0 ? (
                                    <View style={searchStyles.emptyWrap}>
                                        <MaterialIcons name="search-off" size={40} color={colors.textSub} />
                                        <Text style={[searchStyles.emptyText, { color: colors.textSub }]}>
                                            No employees found for "{searchQuery}"
                                        </Text>
                                    </View>
                                ) : (
                                    filteredGrades.map((emp) => (
                                        <EmployeeGradeCard key={emp.id} emp={emp} colors={colors} isDark={isDark} />
                                    ))
                                )}
                            </View>
                        </>
                    ) : (
                        <>
                            {/* Section Heading */}
                            <View style={dyn.sectionHeading}>
                                <Text style={dyn.sectionTitle}>Grade Policy</Text>
                                <Text style={dyn.sectionSub}>Score ranges and performance criteria</Text>
                            </View>

                            <View style={[
                                searchStyles.wrapper,
                                {
                                    backgroundColor: colors.backgroundLight,
                                    marginHorizontal: 16,
                                    marginBottom: 12
                                }
                            ]}>
                                <MaterialIcons
                                    name="search"
                                    size={20}
                                    color={colors.textSub}
                                />

                                <TextInput
                                    style={[searchStyles.input, { color: colors.textMain }]}
                                    placeholder="Search grade or status..."
                                    placeholderTextColor={colors.textSub}
                                    value={policySearch}
                                    onChangeText={setPolicySearch}
                                />

                                {policySearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setPolicySearch('')}>
                                        <MaterialIcons
                                            name="close"
                                            size={18}
                                            color={colors.textSub}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Info Banner */}
                            <View style={{
                                marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 14,
                                backgroundColor: colors.primary + '12', borderWidth: 1, borderColor: colors.primary + '30',
                                flexDirection: 'row', gap: 10, alignItems: 'flex-start',
                            }}>
                                <MaterialIcons name="info-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
                                <Text style={{ flex: 1, fontSize: 12, color: colors.textSub, lineHeight: 18 }}>
                                    Grades are calculated monthly based on attendance, punctuality,
                                    target achievement and overall performance variance.
                                </Text>
                            </View>

                            {gradePolicies.length === 0 ? (
                                <Text style={{ color: colors.textSub, marginHorizontal: 16 }}>
                                    Loading policies...
                                </Text>
                            ) : (
                                filteredPolicies.length === 0 ? (
                                    <Text style={{ color: colors.textSub, marginHorizontal: 16 }}>
                                        No policies found
                                    </Text>
                                ) : (
                                    filteredPolicies.map((policy) => (
                                        <GradePolicyCard
                                            key={policy.grade}
                                            policy={policy}
                                            colors={colors}
                                        />
                                    ))
                                )
                            )}
                        </>
                    )}
                </ScrollView>
                <EmployeeBottomTabBar activeTab="home" />

            </SafeAreaView>
        </View>
    );
}