import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
    ActionSheetIOS,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { createExpense, getExpenseCategories, updateExpense } from "../services/expense";
import { SessionManager } from "../services/SessionManager";

const COLORS = {
    bg: "#0D1117",
    surface: "#161B22",
    border: "#30363D",
    text: "#E6EDF3",
    textMuted: "#8B949E",
    textDim: "#484F58",
    purple: "#A855F7",
    purpleDim: "#1E1230",
    green: "#22C55E",
    greenDim: "#0D2B1A",
    red: "#EF4444",
};

type AttachmentFile = {
    name: string;
    uri: string;
    mimeType: string;
    size?: number;
};

export default function AddExpenseModal({
    visible,
    onClose,
    onSubmit,
    initialData,
}: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;   // ✅ ADD THIS
}) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<any>(null);
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [payment, setPayment] = useState<any>(null);
    const [vendor, setVendor] = useState("");
    const [description, setDescription] = useState("");
    const [attachment, setAttachment] = useState<AttachmentFile | null>(null);
    const [categoryOptions, setCategoryOptions] = useState([]);

    const isEditMode = !!initialData;

    useEffect(() => {
        const loadCategories = async () => {
            const data = await getExpenseCategories();
            const formatted = data.map((item: any) => ({
                label: item.name,
                value: item.id,
            }));
            setCategoryOptions(formatted);
        };
        loadCategories();
    }, []);



    const paymentOptions = [
        { label: "Cash", value: "Cash" },
        { label: "Bank Transfer", value: "Bank Transfer" },
        { label: "Cheque", value: "Cheque" },
        { label: "Credit Card", value: "Credit Card" },
    ];

    // Pick image from camera roll (jpg/png)
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Please allow access to your photo library.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const ext = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
            setAttachment({
                name: asset.fileName ?? `image.${ext}`,
                uri: asset.uri,
                mimeType: ext === "png" ? "image/png" : "image/jpeg",
                size: asset.fileSize,
            });
        }
    };

    // Pick PDF via document picker
    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: "application/pdf",
            copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setAttachment({
                name: asset.name,
                uri: asset.uri,
                mimeType: "application/pdf",
                size: asset.size,
            });
        }
    };

    const handleChooseFile = () => {
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ["Cancel", "Photo Library (JPG/PNG)", "PDF Document"],
                    cancelButtonIndex: 0,
                },
                (index) => {
                    if (index === 1) pickImage();
                    if (index === 2) pickDocument();
                }
            );
        } else {
            // Android — show a simple Alert as action sheet
            Alert.alert("Choose Attachment", "Select file type", [
                { text: "Photo Library (JPG/PNG)", onPress: pickImage },
                { text: "PDF Document", onPress: pickDocument },
                { text: "Cancel", style: "cancel" },
            ]);
        }
    };

    const removeAttachment = () => setAttachment(null);

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType === "application/pdf") return "document-text-outline";
        if (mimeType === "image/png") return "image-outline";
        return "image-outline";
    };

    const getFileIconColor = (mimeType: string) => {
        if (mimeType === "application/pdf") return COLORS.red;
        return COLORS.purple;
    };

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || "");
            setAmount(String(initialData.amount || ""));
            setVendor(initialData.vendor || "");
            setCategory(initialData.categoryId || null);
            setPayment(initialData.paymentMethod || null);
            setDescription(initialData.description || "");
            setDate(new Date(initialData.date));

            if (initialData.attachmentUrl) {
                const url = initialData.attachmentUrl;
                const fileName = url.split("/").pop() || "file";

                const extension = fileName.split(".").pop()?.toLowerCase();

                let mimeType = "image/jpeg";

                if (extension === "png") mimeType = "image/png";
                else if (extension === "jpg" || extension === "jpeg") mimeType = "image/jpeg";
                else if (extension === "pdf") mimeType = "application/pdf";

                setAttachment({
                    uri: url,
                    name: fileName,
                    mimeType,
                });
            } else {
                setAttachment(null);
            }
        }
    }, [initialData]);

    const handleSubmit = async () => {
        const user = await SessionManager.getUser();

        try {
            const payload = {
                title,
                amount,
                categoryId: category,
                employeeId: user?.employeeId,
                date: date.toISOString(),
                description,
                vendor,
                paymentMethod: payment,
                attachmentUrl: attachment
                    ? {
                        uri: attachment.uri,
                        name: attachment.name,
                        type: attachment.mimeType,
                    }
                    : null,
            };

            let res;

            if (isEditMode) {
                // 🔥 UPDATE
                res = await updateExpense(initialData.id, payload);
                Alert.alert("Success", "Expense updated successfully");
            } else {
                // 🔥 CREATE
                res = await createExpense(payload);
                Alert.alert("Success", "Expense created successfully");
            }

            onSubmit(res);

            // reset
            setTitle("");
            setAmount("");
            setCategory(null);
            setPayment(null);
            setVendor("");
            setDescription("");
            setAttachment(null);

            onClose();
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Operation failed");
        }
    };
    

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>

                    {/* HEADER */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Add New Expense</Text>
                            <Text style={styles.subtitle}>Please fill in the details below</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={22} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* TITLE */}
                        <Text style={styles.label}>Title / Purpose</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Hardware Purchase, Travel reimbursement..."
                            placeholderTextColor={COLORS.textDim}
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* ROW: CATEGORY + AMOUNT */}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Category</Text>
                                <Dropdown
                                    style={styles.dropdownInput}
                                    containerStyle={styles.dropdownContainer}
                                    itemContainerStyle={styles.dropdownItemContainer}
                                    activeColor={COLORS.purpleDim}
                                    data={categoryOptions}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Category"
                                    placeholderStyle={{ color: COLORS.textDim }}
                                    selectedTextStyle={{ color: COLORS.text }}
                                    itemTextStyle={{ color: COLORS.text }}
                                    value={category}
                                    onChange={(item) => setCategory(item.value)}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Amount</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor={COLORS.textDim}
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>
                        </View>

                        {/* ROW: DATE + PAYMENT */}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Date</Text>
                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={() => setShowDate(true)}
                                >
                                    <Text style={{ color: COLORS.text }}>
                                        {date.toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Payment Method</Text>
                                <Dropdown
                                    style={styles.dropdownInput}
                                    containerStyle={styles.dropdownContainer}
                                    itemContainerStyle={styles.dropdownItemContainer}
                                    activeColor={COLORS.purpleDim}
                                    data={paymentOptions}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select Payment"
                                    placeholderStyle={{ color: COLORS.textDim }}
                                    selectedTextStyle={{ color: COLORS.text }}
                                    itemTextStyle={{ color: COLORS.text }}
                                    value={payment}
                                    onChange={(item) => setPayment(item.value)}
                                />
                            </View>
                        </View>

                        {/* VENDOR */}
                        <Text style={styles.label}>Vendor / Payee</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Supplier or Shop name"
                            placeholderTextColor={COLORS.textDim}
                            value={vendor}
                            onChangeText={setVendor}
                        />

                        {/* DESCRIPTION */}
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                            multiline
                            placeholder="Any additional notes..."
                            placeholderTextColor={COLORS.textDim}
                            value={description}
                            onChangeText={setDescription}
                        />

                        {/* ATTACHMENT */}
                        <Text style={styles.label}>Attachment</Text>

                        {attachment ? (
                            // File selected — show preview chip
                            <View style={styles.attachmentPreview}>
                                <View style={styles.attachmentIcon}>
                                    <Ionicons
                                        name={getFileIcon(attachment.mimeType) as any}
                                        size={20}
                                        color={getFileIconColor(attachment.mimeType)}
                                    />
                                </View>
                                <View style={styles.attachmentInfo}>
                                    <Text style={styles.attachmentName} numberOfLines={1}>
                                        {attachment.name}
                                    </Text>
                                    <Text style={styles.attachmentSize}>
                                        {attachment.mimeType.split("/")[1].toUpperCase()}
                                        {attachment.size ? `  ·  ${formatFileSize(attachment.size)}` : ""}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={removeAttachment}
                                    style={styles.attachmentRemove}
                                >
                                    <Ionicons name="close-circle" size={20} color={COLORS.red} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            // No file — show upload zone
                            <TouchableOpacity style={styles.uploadZone} onPress={handleChooseFile}>
                                <Ionicons name="cloud-upload-outline" size={24} color={COLORS.textMuted} />
                                <Text style={styles.uploadText}>Tap to attach a file</Text>
                                <Text style={styles.uploadHint}>JPG · PNG · PDF</Text>
                            </TouchableOpacity>
                        )}

                        {attachment && (
                            <TouchableOpacity style={styles.changeFileBtn} onPress={handleChooseFile}>
                                <Ionicons name="swap-horizontal-outline" size={14} color={COLORS.purple} />
                                <Text style={styles.changeFileBtnText}>Change file</Text>
                            </TouchableOpacity>
                        )}

                        {/* ACTIONS */}
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={{ color: COLORS.textMuted }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                                <Text style={{ color: "#fff", fontWeight: "600" }}>
                                    {isEditMode ? "Update Expense" : "Submit Expense"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </View>
            </View>

            {showDate && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(e, selected) => {
                        setShowDate(false);
                        if (selected) setDate(selected);
                    }}
                />
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
    },
    container: {
        backgroundColor: COLORS.bg,
        margin: 16,
        borderRadius: 16,
        padding: 16,
        maxHeight: "90%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    title: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: "700",
    },
    subtitle: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    label: {
        color: COLORS.textMuted,
        marginBottom: 6,
        marginTop: 12,
        fontSize: 12,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        padding: 12,
        color: COLORS.text,
    },
    row: {
        flexDirection: "row",
        gap: 10,
    },
    dropdownInput: {
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        height: 42,
    },
    dropdownContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: COLORS.border,
    },
    dropdownItemContainer: {
        backgroundColor: COLORS.surface,
    },

    // Upload zone (no file selected)
    uploadZone: {
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: "dashed",
        paddingVertical: 24,
        alignItems: "center",
        gap: 6,
    },
    uploadText: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: "500",
    },
    uploadHint: {
        color: COLORS.textDim,
        fontSize: 11,
        letterSpacing: 1,
    },

    // Attachment preview (file selected)
    attachmentPreview: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        padding: 12,
        gap: 12,
    },
    attachmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 0.5,
        borderColor: COLORS.border,
    },
    attachmentInfo: {
        flex: 1,
    },
    attachmentName: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: "500",
    },
    attachmentSize: {
        color: COLORS.textDim,
        fontSize: 11,
        marginTop: 2,
    },
    attachmentRemove: {
        padding: 4,
    },
    changeFileBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
        alignSelf: "flex-start",
    },
    changeFileBtnText: {
        color: COLORS.purple,
        fontSize: 12,
    },

    actions: {
        flexDirection: "row",
        marginTop: 20,
        marginBottom: 8,
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    submitBtn: {
        flex: 1,
        backgroundColor: COLORS.purple,
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
});