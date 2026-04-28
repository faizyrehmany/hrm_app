import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import * as FileSystem from "expo-file-system/legacy"; // ✅ IMPORTANT
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { SafeAreaView } from "react-native-safe-area-context";
import AddExpenseModal from "../components/AddExpenseModal";
import EmployeeBottomTabBar from "../components/EmployeeBottomTabBar";
import EmployeeHeader from "../components/EmployeeHeader";
import SideMenu from "../components/SideMenu";
import { useTheme } from "../contexts/ThemeContext";
import { API_BASE_URL } from "../services/Config";
import { deleteExpense, getExpenseCategories, getExpenses, updateExpense } from "../services/expense";


const STATUS_CONFIG = (isDark: boolean) => ({
    pending: { label: "PENDING", bg: isDark ? "#2A1F06" : "#FEF3C7", text: isDark ? "#F59E0B" : "#B45309", dot: isDark ? "#F59E0B" : "#B45309" },
    approved: { label: "APPROVED", bg: isDark ? "#0D2B1A" : "#DCFCE7", text: isDark ? "#22C55E" : "#15803D", dot: isDark ? "#22C55E" : "#15803D" },
    rejected: { label: "REJECTED", bg: isDark ? "#2A1015" : "#FEE2E2", text: isDark ? "#EF4444" : "#DC2626", dot: isDark ? "#EF4444" : "#DC2626" },
});

function StatusBadge({ status, isDark, colors }: { status: string; isDark: boolean; colors: any }) {
    const cfg = STATUS_CONFIG(isDark)[status as keyof ReturnType<typeof STATUS_CONFIG>];
    return (
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: cfg.dot }]} />
            <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
    );
}

function ApprovalDot({ checked, crossed, isDark, colors }: { checked?: boolean; crossed?: boolean; isDark: boolean; colors: any }) {
    const statusCfg = STATUS_CONFIG(isDark);
    if (crossed) {
        return (
            <View style={[styles.approvalDot, { borderColor: statusCfg.rejected.dot }]}>
                <Ionicons name="close" size={10} color={statusCfg.rejected.dot} />
            </View>
        );
    }
    if (checked) {
        return (
            <View style={[styles.approvalDot, { borderColor: statusCfg.approved.dot, backgroundColor: statusCfg.approved.bg }]}>
                <Ionicons name="checkmark" size={10} color={statusCfg.approved.dot} />
            </View>
        );
    }
    return <View style={[styles.approvalDot, { borderColor: colors.border }]} />;
}

function SummaryCard({
    label,
    amount,
    cases,
    icon,
    iconBg,
    iconColor,
    colors,
}: {
    label: string;
    amount: string;
    cases: number;
    icon: string;
    iconBg: string;
    iconColor: string;
    colors: any;
}) {
    return (
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.summaryTop}>
                <View style={[styles.summaryIcon, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon as any} size={20} color={iconColor} />
                </View>
                <View style={[styles.casesBadge, { backgroundColor: "#A855F7" + "30" }]}>
                    <Text style={[styles.casesText, { color: "#A855F7" }]}>{cases} CASES</Text>
                </View>
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSub }]}>{label}</Text>
            <Text style={[styles.summaryAmount, { color: colors.textMain }]}>{amount}</Text>
        </View>
    );
}

function ExpenseCard({ item, onEdit, onDelete, onDownload, onView, isDark, colors }: { item: any; onEdit: () => void; onDelete: () => void; onDownload: (url: string) => void; onView: (url: string) => void; isDark: boolean; colors: any }) {
    const isLocked =
        item.status === "approved" ||
        item.status === "rejected";
    return (
        <View style={[styles.expenseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                    <Text style={[styles.cardDate, { color: colors.textSub }]}>{item.date}</Text>
                    <StatusBadge status={item.status} isDark={isDark} colors={colors} />
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.backgroundLight }]}
                        onPress={() => onView(`${API_BASE_URL}${item.attachmentUrl}`)}
                    >
                        <Ionicons name="eye-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.backgroundLight }]}
                        onPress={() =>
                            onDownload(`${API_BASE_URL}${item.attachmentUrl}`)
                        }
                    >
                        <Ionicons name="download-outline" size={16} color="#A855F7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.backgroundLight }, isLocked && { opacity: 0.3 }]}
                        disabled={isLocked}
                        onPress={onEdit}
                    >
                        <Feather name="edit-2" size={14} color={colors.textSub} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.backgroundLight }, isLocked && { opacity: 0.3 }]}
                        disabled={isLocked}
                        onPress={onDelete}
                    >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

            <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                    <Text style={[styles.cardFieldLabel, { color: colors.textSub }]}>Title</Text>
                    <Text style={[styles.cardFieldValue, { color: colors.textMain }]}>{item.title}</Text>
                </View>
                <View style={styles.cardRow}>
                    <Text style={[styles.cardFieldLabel, { color: colors.textSub }]}>Vendor</Text>
                    <Text style={[styles.cardFieldValue, { color: colors.textMain }]}>{item.vendor}</Text>
                </View>
                <View style={styles.cardRow}>
                    <Text style={[styles.cardFieldLabel, { color: colors.textSub }]}>Category</Text>
                    <View style={[styles.categoryPill, { backgroundColor: "#A855F7" + "15" }]}>
                        <Text style={[styles.cardFieldValue, { color: colors.textMain }]}>
                            {item.category ?? item.categoryName ?? "N/A"}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardRow}>
                    <Text style={[styles.cardFieldLabel, { color: colors.textSub }]}>Payment</Text>
                    <Text style={[styles.cardFieldValue, { color: colors.textMain }]}>
                        {item.payment ?? item.paymentMethod ?? item.paymentMode ?? "N/A"}
                    </Text>
                </View>
                <View style={styles.cardRow}>
                    <Text style={[styles.cardFieldLabel, { color: colors.textSub }]}>Amount</Text>
                    <Text style={[styles.cardAmount, item.status === "rejected" ? { color: "#EF4444" } : item.status === "approved" ? { color: "#22C55E" } : { color: "#F59E0B" }, { color: colors.textMain }]}>
                        PKR {item.amount.toLocaleString()}
                    </Text>
                </View>
            </View>

            <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

            <View style={styles.approvalRow}>
                <Text style={[styles.approvalLabel, { color: colors.textSub }]}>Approvals</Text>
                <View style={styles.approvalDots}>
                    <View style={styles.approvalItem}>
                        <ApprovalDot
                            checked={item.managerStatus === "approved"}
                            crossed={item.managerStatus === "rejected"}
                            isDark={isDark}
                            colors={colors}
                        />
                        <Text style={[styles.approvalItemLabel, { color: colors.textSub }]}>Mngr</Text>
                    </View>
                    <View style={styles.approvalItem}>
                        <ApprovalDot
                            checked={item.hrStatus === "approved"}
                            crossed={item.hrStatus === "rejected"}
                            isDark={isDark}
                            colors={colors}
                        />
                        <Text style={[styles.approvalItemLabel, { color: colors.textSub }]}>HR</Text>
                    </View>
                    <View style={styles.approvalItem}>
                        <ApprovalDot
                            checked={item.ceoStatus === "approved"}
                            crossed={item.ceoStatus === "rejected"}
                            isDark={isDark}
                            colors={colors}
                        />
                        <Text style={[styles.approvalItemLabel, { color: colors.textSub }]}>Head</Text>
                    </View>
                </View>
                {item.files > 0 && (
                    <View style={[styles.filesChip, { backgroundColor: colors.backgroundLight }]}>
                        <Ionicons name="attach" size={12} color={colors.textSub} />
                        <Text style={[styles.filesChipText, { color: colors.textSub }]}>{item.files}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

export default function EmployeeExpense() {
    const { isDark, colors } = useTheme();
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");

    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);

    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const [editingExpense, setEditingExpense] = useState<any | null>(null);

    const [showModal, setShowModal] = useState(false);

    const user = { id: 1, name: "Waqas Muneer", role: "Software Engineer", email: "", fullName: "" };

    const statuses = ["All Status", "Pending", "Approved", "Rejected"];
    const categories = ["All Categories", "Marketing", "IT", "Office", "Travel"];

    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [categoryOptions, setCategoryOptions] = useState([]);

    useEffect(() => {
        const loadCategories = async () => {
            const data = await getExpenseCategories();

            const formatted = data.map((item: any) => ({
                label: item.name,
                value: item.id, // ✅ instead of id
            }));

            setCategoryOptions(formatted);
        };

        loadCategories();
    }, []);


    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        setLoading(true);
        const data = await getExpenses();

        setExpenses(data);
        setLoading(false);
    };

    const normalized = expenses.map((e: any) => ({
        ...e,
        status: e.status?.toLowerCase(),
        managerStatus: e.managerStatus?.toLowerCase(),
        hrStatus: e.hrStatus?.toLowerCase(),
        ceoStatus: e.ceoStatus?.toLowerCase(),
    }));



    const filtered = normalized.filter((e) => {

        const q = search.toLowerCase();

        const matchSearch =
            q === "" ||
            String(e.title ?? "").toLowerCase().includes(q) ||
            String(e.employee ?? "").toLowerCase().includes(q);

        const matchStatus =
            statusFilter === "all" ||
            e.status?.toLowerCase() === statusFilter;

        const matchCategory =
            categoryFilter === "All Categories" ||
            e.categoryId === categoryFilter;

        const expenseDate = new Date(e.date);

        // safety check
        if (isNaN(expenseDate.getTime())) return false;

        // normalize ALL dates
        const exp = new Date(
            expenseDate.getFullYear(),
            expenseDate.getMonth(),
            expenseDate.getDate()
        );

        const from = fromDate
            ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
            : null;

        const to = toDate
            ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
            : null;

        const matchFrom = !from || exp >= from;
        const matchTo = !to || exp <= to;

        return matchSearch && matchStatus && matchCategory && matchFrom && matchTo;
    });

    const pendingTotal = normalized.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0);
    const approvedTotal = normalized.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0);
    const rejectedTotal = normalized.filter((e) => e.status === "rejected").reduce((s, e) => s + e.amount, 0);
    const pendingCount = normalized.filter((e) => e.status === "pending").length;
    const approvedCount = normalized.filter((e) => e.status === "approved").length;
    const rejectedCount = normalized.filter((e) => e.status === "rejected").length;

    const statusOptions = [
        { label: "All Status", value: "all" },
        ...Array.from(
            new Set(normalized.map((e) => e.status))
        ).map((status) => ({
            label: status,
            value: status.toLowerCase(),
        })),
    ];

    const handleDelete = async (id: number) => {
        try {
            await deleteExpense(id);

            // remove from UI instantly (no reload needed)
            setExpenses((prev) => prev.filter((e) => e.id !== id));

        } catch (error) {
            console.log("Delete failed", error);
        }
    };

    const handleUpdate = async (id: number, updatedData: any) => {
        try {
            const updated = await updateExpense(id, updatedData);

            setExpenses((prev) =>
                prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
            );

        } catch (error) {
            console.log("Update failed", error);
        }
    };

    const handleDownload = async (url: string) => {
        try {
            const fileName = url.split("/").pop() || "file";
            const fileUri = FileSystem.cacheDirectory + fileName;

            const result = await FileSystem.downloadAsync(url, fileUri);

            console.log("Downloaded:", result.uri);

            // detect file type
            const extension = fileName.split(".").pop()?.toLowerCase();

            let mimeType = "application/octet-stream";

            if (extension === "pdf") mimeType = "application/pdf";
            else if (extension === "png") mimeType = "image/png";
            else if (extension === "jpg" || extension === "jpeg") mimeType = "image/jpeg";

            await Sharing.shareAsync(result.uri, {
                mimeType,
                dialogTitle: "Share Attachment",
            });

        } catch (err) {
            console.log("Download error:", err);
            Alert.alert("Error", "Sharing failed");
        }
    };

    const handleView = async (url: string) => {
        try {
            if (!url) return;

            const fullUrl = `${API_BASE_URL}${url}`;

            const supported = await Linking.canOpenURL(fullUrl);

            if (supported) {
                await Linking.openURL(fullUrl);
            } else {
                Alert.alert("Error", "Cannot open file");
            }

        } catch (err) {
            console.log("View error:", err);
            Alert.alert("Error", "Failed to open file");
        }
    };


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
            <EmployeeHeader
                user={user}
                title="Expense Management"
                onMenuPress={() => setMenuVisible(true)}
                onNotificationPress={() => console.log("Notifications pressed")}
            />
            <SideMenu visible={isMenuVisible} onClose={() => setMenuVisible(false)} />

            <ScrollView
                style={[styles.scroll, { backgroundColor: colors.background }]}
                contentContainerStyle={{ paddingBottom: 100 }} // 👈 IMPORTANT
                showsVerticalScrollIndicator={false}
            >
                {/* Summary cards */}
                <View style={styles.summaryRow}>
                    <SummaryCard
                        label="PENDING EXPENSES"
                        amount={`PKR ${pendingTotal.toLocaleString()}`}
                        cases={pendingCount}
                        icon="time-outline"
                        iconBg={isDark ? "#2A1F06" : "#FEF3C7"}
                        iconColor={isDark ? "#F59E0B" : "#B45309"}
                        colors={colors}
                    />
                    <SummaryCard
                        label="APPROVED EXPENSES"
                        amount={`PKR ${approvedTotal.toLocaleString()}`}
                        cases={approvedCount}
                        icon="checkmark-circle-outline"
                        iconBg={isDark ? "#0D2B1A" : "#DCFCE7"}
                        iconColor={isDark ? "#22C55E" : "#15803D"}
                        colors={colors}
                    />
                    <SummaryCard
                        label="REJECTED EXPENSES"
                        amount={`PKR ${rejectedTotal.toLocaleString()}`}
                        cases={rejectedCount}
                        icon="close-circle-outline"
                        iconBg={isDark ? "#2A1015" : "#FEE2E2"}
                        iconColor={isDark ? "#EF4444" : "#DC2626"}
                        colors={colors}
                    />
                </View>

                {/* Search + filters */}
                <View style={styles.filtersBlock}>

                    {/* SEARCH + STATUS */}
                    <View style={styles.searchRow}>
                        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="search-outline" size={16} color={colors.textSub} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.textMain }]}
                                placeholder="Search..."
                                placeholderTextColor={colors.textSub}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>

                        {/* STATUS */}
                        <Dropdown
                            style={[styles.dropdownInput, { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderColor: colors.border }]}
                            containerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            data={statusOptions}
                            labelField="label"
                            valueField="value"
                            value={statusFilter}
                            placeholder="Select Status"
                            placeholderStyle={{ color: colors.textSub }}
                            selectedTextStyle={{ color: colors.textMain }}
                            onChange={(item) => setStatusFilter(item.value)}
                        />
                    </View>

                    {/* CATEGORY + DATE */}
                    <View style={[styles.searchRow, { marginTop: 10 }]}>

                        <Dropdown
                            style={[styles.dropdownInput, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}
                            containerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            data={categoryOptions}
                            labelField="label"
                            valueField="value"
                            value={categoryFilter}
                            placeholder="Select Category"
                            placeholderStyle={{ color: colors.textSub }}
                            selectedTextStyle={{ color: colors.textMain }}
                            onChange={(item) => setCategoryFilter(item.value)}
                        />

                        {/* FROM DATE */}
                        <TouchableOpacity
                            style={[styles.statusDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => setShowFromPicker(true)}
                        >
                            <Text style={[styles.statusDropdownText, { color: colors.textMain }]}>
                                {fromDate ? fromDate.toLocaleDateString() : "From"}
                            </Text>
                        </TouchableOpacity>

                        {/* TO DATE */}
                        <TouchableOpacity
                            style={[styles.statusDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => setShowToPicker(true)}
                        >
                            <Text style={[styles.statusDropdownText, { color: colors.textMain }]}>
                                {toDate ? toDate.toLocaleDateString() : "To"}
                            </Text>
                        </TouchableOpacity>
                    </View>


                </View>
                {/* Add button */}
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setShowModal(true)}
                >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Add New Expense</Text>
                </TouchableOpacity>

                {/* Expense cards */}
                <View style={styles.list}>
                    {filtered.map((item) => (
                        <ExpenseCard
                            key={item.id}
                            item={item}
                            onEdit={() => {
                                setEditingExpense(item);
                                setShowModal(true);
                            }}
                            onDelete={() => handleDelete(item.id)}
                            onDownload={handleDownload}
                            onView={handleView}
                            isDark={isDark}
                            colors={colors}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={40} color={colors.textSub} />
                            <Text style={[styles.emptyText, { color: colors.textSub }]}>No expenses found</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>
            {showFromPicker && (
                <DateTimePicker
                    value={fromDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowFromPicker(false);
                        if (date) setFromDate(date);
                    }}
                />
            )}

            {showToPicker && (
                <DateTimePicker
                    value={toDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowToPicker(false);
                        if (date) setToDate(date);
                    }}
                />
            )}
            <AddExpenseModal
                visible={showModal}
                initialData={editingExpense}   // 👈 IMPORTANT
                onClose={() => {
                    setShowModal(false);
                    setEditingExpense(null);
                }}
                onSubmit={async (data) => {
                    try {
                        if (editingExpense) {
                            // UPDATE
                            const updated = await updateExpense(editingExpense.id, data);

                            setExpenses((prev) =>
                                prev.map((e) =>
                                    e.id === editingExpense.id ? { ...e, ...updated } : e
                                )
                            );
                        } else {
                            // CREATE
                            console.log("NEW EXPENSE:", data);
                        }

                        setShowModal(false);
                        setEditingExpense(null);
                    } catch (err) {
                        console.log(err);
                    }
                }}
            />
            <EmployeeBottomTabBar activeTab="home" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
        paddingHorizontal: 16,
    },

    // Summary
    summaryRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16,
        marginBottom: 4,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        borderWidth: 0.5,
    },
    summaryTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    summaryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    casesBadge: {
        borderRadius: 20,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    casesText: {
        fontSize: 8,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    summaryLabel: {
        fontSize: 8,
        fontWeight: "600",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    summaryAmount: {
        fontSize: 13,
        fontWeight: "700",
    },

    // Filters
    filtersBlock: {
        marginTop: 16,
        marginBottom: 12,
    },
    searchRow: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    searchBox: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 10,
        borderWidth: 0.5,
        paddingHorizontal: 12,
        height: 42,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
    },
    statusDropdown: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 10,
        borderWidth: 0.5,
        paddingHorizontal: 12,
        height: 42,
    },
    statusDropdownText: {
        fontSize: 13,
    },
    dropdownMenu: {
        borderRadius: 10,
        borderWidth: 0.5,
        marginTop: 6,
        overflow: "hidden",
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
    },
    dropdownItemActive: {},
    dropdownItemText: {
        fontSize: 14,
    },

    // Add button
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 10,
        paddingVertical: 12,
        marginBottom: 16,
    },
    addBtnText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },

    // Expense card
    list: {
        gap: 12,
    },
    expenseCard: {
        borderRadius: 14,
        borderWidth: 0.5,
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    cardHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
        flexShrink: 1,
    },
    cardDate: {
        fontSize: 12,
        fontWeight: "500",
        flexShrink: 1,
    },
    cardActions: {
        flexDirection: "row",
        gap: 4,
        flexShrink: 0,
    },
    actionBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    cardDivider: {
        height: 0.5,
    },
    cardBody: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 8,
    },
    cardRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardFieldLabel: {
        fontSize: 12,
    },
    cardFieldValue: {
        fontSize: 13,
        fontWeight: "500",
    },
    cardAmount: {
        fontSize: 15,
        fontWeight: "700",
    },
    categoryPill: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    categoryPillText: {
        fontSize: 11,
        fontWeight: "600",
    },

    // Approval
    approvalRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 12,
    },
    approvalLabel: {
        fontSize: 11,
        flex: 1,
    },
    approvalDots: {
        flexDirection: "row",
        gap: 12,
    },
    approvalItem: {
        alignItems: "center",
        gap: 3,
    },
    approvalDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    approvalItemLabel: {
        fontSize: 9,
    },
    filesChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 4,
    },
    filesChipText: {
        fontSize: 11,
    },

    // Badge
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    badgeDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 0.5,
    },

    // Empty
    emptyState: {
        alignItems: "center",
        paddingVertical: 48,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
    },

    dropdownInput: {
        borderRadius: 10,
        borderWidth: 0.5,
        paddingHorizontal: 12,
        height: 42,
    },

    dropdownContainer: {
        borderRadius: 10,
        borderWidth: 0.5,
    },
});