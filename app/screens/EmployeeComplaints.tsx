import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmployeeBottomTabBar from "../components/EmployeeBottomTabBar";
import EmployeeHeader from "../components/EmployeeHeader";
import SideMenu from "../components/SideMenu";
import { useTheme } from "../contexts/ThemeContext";
import { ComplaintService } from "../services/complaints";
import { SessionManager, User } from "../services/SessionManager";

type ComplaintStatus = "PENDING" | "RESOLVED" | "IN REVIEW";

interface Complaint {
    id: string;
    category: string;
    description: string;
    date: string;
    status: string;
    isAnonymous: boolean;
}


const CATEGORIES = [
    "Work Environment",
    "Management",
    "HR Policy",
    "Harassment",
    "Compensation",
    "Other",
];

const initialComplaints: Complaint[] = [];

export default function EmployeeComplaints() {
    const { isDark, colors } = useTheme();

    const STATUS_COLORS = React.useMemo(() => ({
        PENDING: {
            bg: isDark ? "#2A1F0A" : "#FFF4E5",
            text: isDark ? "#F5A623" : "#B45309"
        },
        RESOLVED: {
            bg: isDark ? "#0A2A15" : "#DCFCE7",
            text: isDark ? "#27AE60" : "#15803D"
        },
        "IN REVIEW": {
            bg: isDark ? "#0A1A2A" : "#EFF6FF",
            text: isDark ? "#5B9BD5" : "#1D4ED8"
        },
    }), [isDark]);
    const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isMenuVisible, setMenuVisible] = useState(false);

    // Form state
    const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
    const [formDescription, setFormDescription] = useState("");
    const [formIsAnonymous, setFormIsAnonymous] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === "N/A") return "N/A";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        } catch (e) {
            return dateStr;
        }
    };

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await ComplaintService.getComplaints();
            console.log("RAW COMPLAINTS DATA:", JSON.stringify(data, null, 2));
            // Map API response to local Complaint interface
            const mapped: Complaint[] = data.map((item: any) => ({
                id: item.id,
                category: item.complaintType || "Other",
                description: item.description,
                date: formatDate(item.date || item.createdAt || item.complaintDate || "N/A"),
                status: (item.status || "PENDING").toUpperCase(),
                isAnonymous: item.isAnonymous
            }));
            setComplaints(mapped);
        } catch (error) {
            console.error("Fetch error:", error);
            Alert.alert("Error", "Could not load complaints.");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchComplaints();
        const loadUser = async () => {
            const userData = await SessionManager.getUser();
            setUser(userData);
        };
        loadUser();
    }, []);

    const filtered = complaints.filter(
        (c) =>
            c.description.toLowerCase().includes(search.toLowerCase()) ||
            c.category.toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => {
        setEditingId(null);
        setFormCategory(CATEGORIES[0]);
        setFormDescription("");
        setFormIsAnonymous(false);
        setModalVisible(true);
    };

    const openEdit = (item: Complaint) => {
        setEditingId(item.id);
        setFormCategory(item.category);
        setFormDescription(item.description);
        setFormIsAnonymous(item.isAnonymous);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formDescription.trim()) {
            Alert.alert("Validation", "Please enter a description.");
            return;
        }
        try {
            setLoading(true);
            const data = {
                complaintType: formCategory,
                description: formDescription,
                isAnonymous: formIsAnonymous
            };
            console.log("SENDING COMPLAINT DATA:", JSON.stringify(data, null, 2));

            if (editingId) {
                await ComplaintService.updateComplaint(editingId, data);
            } else {
                await ComplaintService.createComplaint(data);
            }
            await fetchComplaints();
            setModalVisible(false);
        } catch (error) {
            console.error("Save error:", error);
            Alert.alert("Error", "Could not save complaint.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert("Delete", "Remove this complaint?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await ComplaintService.deleteComplaint(id);
                        await fetchComplaints();
                    } catch (error) {
                        console.error("Delete error:", error);
                        Alert.alert("Error", "Could not delete complaint.");
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: Complaint }) => {
        const statusStyle = STATUS_COLORS[item.status];
        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.categoryText, { color: colors.primary }]}>
                        {item.category.toUpperCase()}
                    </Text>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: statusStyle.bg },
                        ]}
                    >
                        <Text
                            style={[styles.statusText, { color: statusStyle.text }]}
                        >
                            ● {item.status}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textSub }]}>DESCRIPTION</Text>
                <Text style={[styles.fieldValue, { color: colors.textMain }]}>{item.description}</Text>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={[styles.fieldLabel, { color: colors.textSub }]}>DATE</Text>
                        <Text style={[styles.fieldValue, { color: colors.textMain }]}>{item.date}</Text>
                    </View>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => openEdit(item)}
                        >
                            <MaterialIcons name="edit" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleDelete(item.id)}
                        >
                            <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        // edges={["top"]} — only the top safe area is consumed by SafeAreaView.
        // This ensures the header sits just below the status bar on all devices
        // (notch, Dynamic Island, etc.) without double-padding on sides/bottom.
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
            <StatusBar style={isDark ? "light" : "dark"} />

            {/* Header — rendered outside the scrollable container so it stays fixed */}
            <EmployeeHeader
                user={user}
                title="Employee Complaints"
                onMenuPress={() => setMenuVisible(true)}
                onNotificationPress={() => console.log("Notifications pressed")}
            />

            {/* SideMenu renders as a full-screen overlay above everything */}
            <SideMenu
                visible={isMenuVisible}
                onClose={() => setMenuVisible(false)}
            />

            {/* Scrollable body */}
            <View style={styles.container}>
                {/* Search */}
                <View style={[styles.searchWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <MaterialIcons name="search" size={20} color={colors.textSub} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.textMain }]}
                        placeholder="Search complaints..."
                        placeholderTextColor={colors.textSub}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Add Button */}
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary, shadowColor: colors.primary, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
                    onPress={openAdd}
                >
                    <MaterialIcons name="add" size={22} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>ADD COMPLAINT</Text>
                </TouchableOpacity>

                {/* List */}
                {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: 10 }} />}
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: colors.textSub }]}>No complaints found.</Text>
                    }
                />
            </View>

            <EmployeeBottomTabBar activeTab="home" />

            {/* Add / Edit Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                            {editingId ? "Edit Complaint" : "New Complaint"}
                        </Text>

                        {/* Category Selector */}
                        <Text style={[styles.modalLabel, { color: colors.textSub }]}>CATEGORY</Text>
                        <TouchableOpacity
                            style={[styles.selector, { backgroundColor: colors.backgroundLight, borderColor: colors.border }]}
                            onPress={() => setShowCategoryPicker((v) => !v)}
                        >
                            <Text style={[styles.selectorText, { color: colors.textMain }]}>{formCategory}</Text>
                            <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSub} />
                        </TouchableOpacity>

                        {showCategoryPicker && (
                            <View style={[styles.pickerList, { backgroundColor: colors.backgroundLight, borderColor: colors.border }]}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={styles.pickerItem}
                                        onPress={() => {
                                            setFormCategory(cat);
                                            setShowCategoryPicker(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.pickerItemText,
                                                { color: colors.textSub },
                                                cat === formCategory &&
                                                [styles.pickerItemActive, { color: colors.primary }],
                                            ]}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Description */}
                        <Text style={[styles.modalLabel, { color: colors.textSub }]}>DESCRIPTION</Text>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: colors.backgroundLight, borderColor: colors.border, color: colors.textMain }]}
                            placeholder="Describe the issue..."
                            placeholderTextColor={colors.textSub}
                            multiline
                            numberOfLines={4}
                            value={formDescription}
                            onChangeText={setFormDescription}
                        />

                        {/* Anonymous Toggle */}
                        <TouchableOpacity
                            style={styles.anonymousToggle}
                            onPress={() => setFormIsAnonymous(!formIsAnonymous)}
                        >
                            <MaterialIcons
                                name={formIsAnonymous ? "check-box" : "check-box-outline-blank"}
                                size={22}
                                color={formIsAnonymous ? colors.primary : colors.textSub}
                            />
                            <Text style={[styles.anonymousText, { color: colors.textMain }]}>Report Anonymously</Text>
                        </TouchableOpacity>

                        {/* Buttons */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.cancelBtn, { backgroundColor: colors.backgroundLight, borderColor: colors.border }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.textSub }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveBtnText}>
                                    {editingId ? "Update" : "Submit"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },

    // Search
    searchWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 14,
        borderWidth: 1,
    },
    searchIcon: {
        fontSize: 15,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },

    // Add Button
    addButton: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginBottom: 20,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 8,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
        letterSpacing: 1.2,
    },

    // Card
    card: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
    },
    statusBadge: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    fieldLabel: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 2,
    },
    fieldValue: {
        fontSize: 14,
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: 4,
    },
    actionRow: {
        flexDirection: "row",
        gap: 12,
    },
    actionBtn: {
        padding: 4,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        fontSize: 14,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.65)",
    },
    modalSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 36,
        borderTopWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 20,
        textAlign: "center",
    },
    modalLabel: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 6,
        marginTop: 14,
    },
    selector: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
    },
    selectorText: {
        fontSize: 14,
    },
    pickerList: {
        borderRadius: 10,
        marginTop: 4,
        borderWidth: 1,
        overflow: "hidden",
    },
    pickerItem: {
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: 1,
    },
    pickerItemText: {
        fontSize: 14,
    },
    pickerItemActive: {
        fontWeight: "700",
    },
    textArea: {
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        borderWidth: 1,
        textAlignVertical: "top",
        minHeight: 100,
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 24,
    },
    cancelBtn: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1,
    },
    cancelBtnText: {
        fontWeight: "600",
        fontSize: 14,
    },
    saveBtn: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    saveBtnText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },
    anonymousToggle: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        gap: 8,
    },
    anonymousText: {
        fontSize: 14,
        fontWeight: "500",
    },
});