import React, { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { SafeAreaView } from "react-native-safe-area-context";
import EmployeeBottomTabBar from "../components/EmployeeBottomTabBar";
import EmployeeHeader from "../components/EmployeeHeader";
import SideMenu from "../components/SideMenu";
import { useTheme } from "../contexts/ThemeContext";
import { EmployeeApi } from "../services/auth";
import { getEmployeeIncrements, getIncrementPolicies } from "../services/increment";
import { User } from "./employee_grading";



const DROPDOWN_OPTIONS = [
    { label: "All Types", value: "all" },
    { label: "Percentage", value: "Percentage" },
    { label: "Fixed", value: "Fixed" },
];

// ─── Transaction Card ─────────────────────────────────────────────────────────
const TransactionCard = ({ item, colors, isDark }: { item: any; colors: any; isDark: boolean }) => {
    const pct = ((parseFloat(item.amount) / parseFloat(item.previousSalary.replace(",", ""))) * 100).toFixed(1);

    return (
        <View style={[styles.txCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Top row: avatar + name + date */}
            <View style={styles.txTop}>
                <View style={[styles.avatar, { backgroundColor: item.avatarColor + "33", borderColor: item.avatarColor + "66" }]}>
                    <Text style={[styles.avatarText, { color: item.avatarColor }]}>{item.initials}</Text>
                </View>
                <View style={styles.txNameBlock}>
                    <Text style={[styles.txName, { color: colors.textMain }]}>{item.employeeName}</Text>
                    <Text style={[styles.txRole, { color: colors.textSub }]}>{item.role}</Text>
                </View>
                <View style={[styles.txBadge, { backgroundColor: "#34d39955", borderColor: "#34d39988" }]}>
                    <Text style={[styles.txBadgeText, { color: "#34d399" }]}>+{pct}%</Text>
                </View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Salary row */}
            <View style={styles.txSalaryRow}>
                <View style={styles.txSalaryBlock}>
                    <Text style={[styles.txSalaryLabel, { color: colors.textSub }]}>PREVIOUS</Text>
                    <Text style={[styles.txSalaryOld, { color: colors.textSub }]}>${item.previousSalary}</Text>
                </View>

                <View style={styles.txArrowWrap}>
                    <View style={[styles.txArrowLine, { backgroundColor: colors.border }]} />
                    <View style={[styles.txIncBox, { backgroundColor: "rgba(124,58,237,0.2)", borderColor: "#7c3aed55" }]}>
                        <Text style={[styles.txIncText, { color: "#b06ef3" }]}>+${item.amount}</Text>
                    </View>
                    <View style={[styles.txArrowLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.txArrowHead, { color: colors.textSub }]}>›</Text>
                </View>

                <View style={[styles.txSalaryBlock, { alignItems: "flex-end" }]}>
                    <Text style={[styles.txSalaryLabel, { color: colors.textSub }]}>NEW SALARY</Text>
                    <Text style={[styles.txSalaryNew, { color: colors.textMain }]}>${item.newSalary}</Text>
                </View>
            </View>

            {/* Effective date */}
            <View style={styles.txFooter}>
                <Text style={styles.txFooterIcon}>📅</Text>
                <Text style={[styles.txFooterText, { color: colors.textSub }]}>Effective {item.effectiveDate}</Text>
            </View>
        </View>
    );
};

// ─── Policy Card ──────────────────────────────────────────────────────────────
const PolicyCard = ({ item, colors, isDark }: { item: any; colors: any; isDark: boolean }) => {
    const isActive = item.status === "Active";
    const isPct = item.type === "Percentage";

    return (
        <View style={[styles.policyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.policyTop}>
                <View style={[styles.policyIconWrap, { backgroundColor: "rgba(124,58,237,0.15)", borderColor: "#3b1f6e" }]}>
                    <Text style={styles.policyIcon}>{item.icon}</Text>
                </View>
                <View style={styles.policyTitleBlock}>
                    <Text style={[styles.policyName, { color: colors.textMain }]}>{item.policyName}</Text>
                    <View style={[styles.typePill, isPct ? styles.typePillPct : styles.typePillAnnual]}>
                        <Text style={[styles.typePillText, isPct ? styles.typePillTextPct : styles.typePillTextAnnual]}>
                            {item.type}
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusDot, isActive ? { backgroundColor: "#34d399" } : { backgroundColor: colors.textSub }]} />
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Stats grid */}
            <View style={[styles.policyStatsRow, { backgroundColor: colors.backgroundLight }]}>
                <View style={styles.policyStat}>
                    <Text style={[styles.policyStatLabel, { color: colors.textSub }]}>VALUE</Text>
                    <Text style={[styles.policyStatValue, { color: colors.textMain }]}>{item.value}</Text>
                </View>
                <View style={[styles.policyStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.policyStat}>
                    <Text style={[styles.policyStatLabel, { color: colors.textSub }]}>DELAY</Text>
                    <Text style={[styles.policyStatValue, { color: colors.textMain }]}>{item.months}mo</Text>
                </View>
                <View style={[styles.policyStatDivider, { backgroundColor: colors.border }]} />

                <View style={[styles.policyStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.policyStat}>
                    <Text style={[styles.policyStatLabel, { color: colors.textSub }]}>STATUS</Text>
                    <Text style={[styles.policyStatStatus, isActive ? { color: "#34d399" } : { color: colors.textSub }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EmployeeIncrements() {
    const { isDark, colors } = useTheme();
    const [activeTab, setActiveTab] = useState("employees");
    const [search, setSearch] = useState("");
    const [dropdownValue, setDropdownValue] = useState("all");

    const [policies, setPolicies] = useState([]);
    const [loadingPolicies, setLoadingPolicies] = useState(true);

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        const loadEmployee = async () => {
            try {
                const data = await EmployeeApi.getEmployeeDetails();

                if (data) {
                    const name =
                        data.firstName && data.lastName
                            ? `${data.firstName} ${data.lastName}`
                            : `Employee #${data.employeeId}`;

                    setDisplayName(name);
                } else {
                    setDisplayName('Employee');
                }
            } catch (err) {
                console.error('Failed to fetch employee details', err);
                setDisplayName('Employee');
            }
        };

        loadEmployee();
    }, []);


    const loadTransactions = async () => {
        setLoadingTransactions(true);

        const data: any = await getEmployeeIncrements();

        setTransactions(Array.isArray(data) ? data : []);

        setLoadingTransactions(false);
    };



    useEffect(() => {
        loadPolicies();
        loadTransactions();
    }, []);

    const formattedTransactions = useMemo(() => {
        return (transactions || []).map((t: any) => {
            return {
                id: t.id.toString(),
                employeeName: displayName || `Employee ${t.employeeId}`,
                initials: `E${t.employeeId}`,
                role: "Employee",
                previousSalary: Number(t.previousSalary).toLocaleString(),
                amount: Number(t.incrementAmount).toLocaleString(),
                newSalary: Number(t.newSalary).toLocaleString(),
                effectiveDate: new Date(t.incrementDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }),
                avatarColor: "#7c3aed",
            };
        });
    }, [transactions]);

    const loadPolicies = async () => {
        setLoadingPolicies(true);

        const data = await getIncrementPolicies();

        setPolicies(data);

        setLoadingPolicies(false);
    };

    const formattedPolicies = policies.map((p: any) => ({
        id: p.id.toString(),
        policyName: p.name,
        type: p.incrementType === 1 ? "Percentage" : "Fixed",
        value:
            p.incrementType === 1
                ? `${p.incrementValue}%`
                : `$${p.incrementValue}`,
        months: p.applicableAfterMonths.toString(),
        delay: "0",
        status: p.isActive ? "Active" : "Inactive",
        icon: p.incrementType === 1 ? "📈" : "💰",
    }));

    const filteredPolicies = useMemo(() => {
        const base =
            dropdownValue === "all"
                ? formattedPolicies
                : formattedPolicies.filter((p) => p.type === dropdownValue);

        if (!search.trim()) return base;

        return base.filter((p) =>
            p.policyName.toLowerCase().includes(search.toLowerCase())
        );
    }, [formattedPolicies, dropdownValue, search]);

    const filteredTransactions = formattedTransactions.filter((t) =>
        t.employeeName.toLowerCase().includes(search.toLowerCase())
    );

    const totalPolicies = policies.length;


    // if you later add transactions API, this will auto work
    const totalTransactions = formattedTransactions.length;

    const totalIncrease = formattedTransactions.reduce((sum, item) => {
        return sum + parseFloat(String(item.amount).replace(/,/g, "") || "0");
    }, 0);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <EmployeeHeader
                user={user}
                title="Employee Increments"
                onMenuPress={() => setMenuVisible(true)}
                onNotificationPress={() => console.log('Notifications pressed')}
            />
             <SideMenu visible={isMenuVisible} onClose={() => setMenuVisible(false)} />
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 48 }}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Text style={[styles.eyebrow, { color: colors.textSub }]}>SALARY & POLICY ADJUSTMENTS</Text>
                    <Text style={[styles.title, { color: colors.textMain }]}>EMPLOYEE{"\n"}INCREMENTS</Text>
                </View>

                {/* ── Tab Bar ── */}
                <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {["employees", "policies"].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && [styles.tabActive, { backgroundColor: colors.primary }]]}
                            onPress={() => setActiveTab(tab)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, { color: activeTab === tab ? "#fff" : colors.textSub }, activeTab === tab && styles.tabTextActive]}>
                                {tab === "employees" ? "EMPLOYEE LIST" : "POLICIES"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Stat Cards ── */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={styles.statEmoji}>🗂️</Text>
                        <Text style={[styles.statNum, { color: colors.textMain }]}>{totalPolicies}</Text>
                        <Text style={[styles.statLbl, { color: colors.textSub }]}>TOTAL POLICIES</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={styles.statEmoji}>📋</Text>
                        <Text style={[styles.statNum, { color: colors.textMain }]}>{totalTransactions}</Text>
                        <Text style={[styles.statLbl, { color: colors.textSub }]}>NET TRANSACTIONS</Text>
                    </View>
                </View>

                {/* ── Hero Banner ── */}
                <View style={[styles.heroBanner, { backgroundColor: colors.primary }]}>
                    <View style={styles.heroPulse} />
                    <View style={styles.heroText}>
                        <Text style={styles.heroTitle}>SYSTEM INTELLIGENCE: SCALE MANAGEMENT</Text>
                        <Text style={styles.heroSub}>Automated Adjustment Ledger</Text>
                    </View>
                    <View style={styles.heroBtn}>
                        <Text style={styles.heroBtnText}>→</Text>
                    </View>
                </View>

                {/* ── Search ── */}
                <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={styles.searchEmoji}>🔍</Text>
                    <TextInput
                        style={[styles.searchInput, { color: colors.textMain }]}
                        placeholder="Search employee name or ID..."
                        placeholderTextColor={colors.textSub}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* ── Section Label ── */}
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.sectionLabel, { color: colors.textSub }]}>
                        {activeTab === "employees" ? "TRANSACTION LEDGER" : "POLICY FRAMEWORK"}
                    </Text>
                    <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
                </View>

                {/* ── Policies Dropdown ── */}
                {activeTab === "policies" && (
                    <Dropdown
                        style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        containerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        selectedTextStyle={[styles.ddSelectedText, { color: colors.textMain }]}
                        placeholderStyle={[styles.ddPlaceholder, { color: colors.textSub }]}
                        data={DROPDOWN_OPTIONS}
                        labelField="label"
                        valueField="value"
                        placeholder="Filter by type"
                        value={dropdownValue}
                        onChange={(item) => setDropdownValue(item.value)}
                        renderItem={(item) => (
                            <View style={[styles.ddItem, item.value === dropdownValue && { backgroundColor: "rgba(124,58,237,0.15)" }]}>
                                <Text style={[styles.ddItemText, { color: colors.textMain }, item.value === dropdownValue && { color: colors.primary }]}>
                                    {item.label}
                                </Text>
                                {item.value === dropdownValue && <Text style={{ color: colors.primary }}>✓</Text>}
                            </View>
                        )}
                    />
                )}

                {/* ── Employee Cards ── */}
                {activeTab === "employees" && (
                    <View style={styles.cardList}>
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((item) => (
                                <TransactionCard key={item.id} item={item} colors={colors} isDark={isDark} />
                            ))
                        ) : (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyEmoji}>🕳️</Text>
                                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>No records found</Text>
                                <Text style={[styles.emptySub, { color: colors.textSub }]}>No employee increments recorded.</Text>
                                <TouchableOpacity style={[styles.initiateBtn, { borderColor: colors.border }]} activeOpacity={0.8}>
                                    <Text style={[styles.initiateBtnText, { color: colors.textSub }]}>INITIATE ADJUSTMENT</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* ── Policy Cards ── */}
                {activeTab === "policies" && (
                    <View style={styles.cardList}>
                        {filteredPolicies.length > 0 ? (
                            filteredPolicies.map((item) => (
                                <PolicyCard key={item.id} item={item} colors={colors} isDark={isDark} />
                            ))
                        ) : (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyEmoji}>📭</Text>
                                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>No policies found</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
            <EmployeeBottomTabBar activeTab="home" />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, paddingHorizontal: 18 },

    // Header
    header: { paddingTop: 22, paddingBottom: 16 },
    eyebrow: { fontSize: 10, letterSpacing: 2.5, fontWeight: "700", marginBottom: 6 },
    title: { fontSize: 22, fontWeight: "900", letterSpacing: 0.5 },

    // Tabs
    tabBar: {
        flexDirection: "row",
        borderRadius: 10,
        padding: 4,
        marginBottom: 18,
        borderWidth: 1,
    },
    tab: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center" },
    tabActive: {},
    tabText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
    tabTextActive: { color: "#fff" },

    // Stats
    statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
    statCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        alignItems: "flex-start",
    },
    statEmoji: { fontSize: 20, marginBottom: 6 },
    statNum: { fontSize: 26, fontWeight: "900" },
    statLbl: { fontSize: 9, letterSpacing: 1.5, marginTop: 3, fontWeight: "600" },

    // Hero
    heroBanner: {
        borderRadius: 14,
        padding: 18,
        marginBottom: 18,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
    },
    heroPulse: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "rgba(255,255,255,0.5)",
        marginRight: 14,
    },
    heroText: { flex: 1 },
    heroTitle: { color: "#fff", fontSize: 12, fontWeight: "900", letterSpacing: 0.4, lineHeight: 17 },
    heroSub: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 3 },
    heroBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    heroBtnText: { color: "#fff", fontSize: 18 },

    // Search
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 10,
        paddingHorizontal: 14,
        marginBottom: 22,
        borderWidth: 1,
    },
    searchEmoji: { fontSize: 15, marginRight: 10 },
    searchInput: { flex: 1, fontSize: 13, paddingVertical: 12 },

    // Section header
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    sectionLine: { flex: 1, height: 1 },
    sectionLabel: { fontSize: 9, letterSpacing: 2, fontWeight: "700", marginHorizontal: 12 },

    // Dropdown
    dropdown: {
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    dropdownContainer: {
        borderRadius: 10,
        borderWidth: 1,
        overflow: "hidden",
        marginTop: 4,
    },
    ddSelectedText: { fontSize: 13, fontWeight: "600" },
    ddPlaceholder: { fontSize: 13 },
    ddItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 16 },
    ddItemActive: {},
    ddItemText: { fontSize: 13 },

    // Card list
    cardList: { gap: 14 },

    // ── Transaction Card ──
    txCard: {
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
    },
    txTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarText: { fontSize: 15, fontWeight: "800" },
    txNameBlock: { flex: 1 },
    txName: { fontSize: 15, fontWeight: "700" },
    txRole: { fontSize: 11, marginTop: 2 },
    txBadge: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
    },
    txBadgeText: { fontSize: 12, fontWeight: "800" },

    divider: { height: 1, marginBottom: 14 },

    txSalaryRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    txSalaryBlock: { flex: 1 },
    txSalaryLabel: { fontSize: 9, letterSpacing: 1.5, fontWeight: "700", marginBottom: 4 },
    txSalaryOld: { fontSize: 16, fontWeight: "700", textDecorationLine: "line-through" },
    txSalaryNew: { fontSize: 18, fontWeight: "900" },

    txArrowWrap: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
    txArrowLine: { flex: 1, height: 1 },
    txIncBox: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        marginHorizontal: 6,
    },
    txIncText: { fontSize: 11, fontWeight: "800" },
    txArrowHead: { fontSize: 18, marginLeft: -4 },

    txFooter: { flexDirection: "row", alignItems: "center" },
    txFooterIcon: { fontSize: 12, marginRight: 6 },
    txFooterText: { fontSize: 11 },

    // ── Policy Card ──
    policyCard: {
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
    },
    policyTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    policyIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    policyIcon: { fontSize: 20 },
    policyTitleBlock: { flex: 1 },
    policyName: { fontSize: 14, fontWeight: "700", marginBottom: 5 },
    typePill: {
        alignSelf: "flex-start",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderWidth: 1,
    },
    typePillPct: { backgroundColor: "rgba(168,85,247,0.12)", borderColor: "rgba(168,85,247,0.35)" },
    typePillAnnual: { backgroundColor: "rgba(14,165,233,0.12)", borderColor: "rgba(14,165,233,0.35)" },
    typePillText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
    typePillTextPct: { color: "#a855f7" },
    typePillTextAnnual: { color: "#38bdf8" },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusDotActive: {},
    statusDotInactive: {},

    policyStatsRow: {
        flexDirection: "row",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderWidth: 1,
    },
    policyStat: { flex: 1, alignItems: "center" },
    policyStatDivider: { width: 1 },
    policyStatLabel: { fontSize: 8, letterSpacing: 1.5, fontWeight: "700", marginBottom: 5 },
    policyStatValue: { fontSize: 15, fontWeight: "800" },
    policyStatStatus: { fontSize: 12, fontWeight: "800" },

    // Empty
    emptyWrap: { alignItems: "center", paddingVertical: 50 },
    emptyEmoji: { fontSize: 40, marginBottom: 14 },
    emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
    emptySub: { fontSize: 13, marginBottom: 24 },
    initiateBtn: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    initiateBtnText: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
});