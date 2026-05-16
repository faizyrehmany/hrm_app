import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface Props {
    displayName: string;
    attendanceLogs: any[];
    onMenuPress: () => void;
    parseLocalDate: (dateString: string) => Date;
}

export default function TodayAttendanceHeader({
    displayName,
    attendanceLogs,
    onMenuPress,
    parseLocalDate,
}: Props) {
    const { colors, isDark, setMode } = useTheme();

    const todayStr = new Date().toDateString();
    const todayLogs = attendanceLogs.filter(
        (log) => parseLocalDate(log.logTime).toDateString() === todayStr
    );
    const firstCheckIn = todayLogs
        .filter((l) => l.modeLabel === "CheckIn")
        .sort(
            (a, b) =>
                parseLocalDate(a.logTime).getTime() -
                parseLocalDate(b.logTime).getTime()
        )[0];

    let timeDisplay = { hh: "--", mm: "--", ampm: "" };
    if (firstCheckIn) {
        const d = parseLocalDate(firstCheckIn.logTime);
        const rawH = d.getHours();
        timeDisplay = {
            hh: (rawH % 12 || 12).toString().padStart(2, "0"),
            mm: d.getMinutes().toString().padStart(2, "0"),
            ampm: rawH >= 12 ? "PM" : "AM",
        };
    }

    const todayLabel = new Date().toLocaleDateString("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const initials = displayName
        ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    // How much of the card peeks below the header
    const CARD_OVERLAP = 70;

    return (
        // Outer container — extends below header by CARD_OVERLAP
        <View style={{ zIndex: 10 }}>
            {/* ── Colored background strip ── */}
            <View style={[s.bg, { backgroundColor: colors.primary }]}>
                {/* Top bar */}
                <View style={s.topBar}>
                    <TouchableOpacity
                        onPress={onMenuPress}
                        style={s.iconBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons name="menu" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={s.nameRow}>
                        {/* <View style={[s.avatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                            <Text style={s.avatarText}>{initials}</Text>
                        </View> */}
                        <View>
                            <Text style={s.name} numberOfLines={1}>
                                {displayName || "Employee"}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={s.iconBtn}
                        onPress={() => setMode(isDark ? 'light' : 'dark')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons
                            name={isDark ? "light-mode" : "dark-mode"}
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Floating card — sits over the bg bottom edge ── */}
            <View style={[s.cardWrapper, { marginTop: -CARD_OVERLAP }]}>
                <View style={[s.card, { backgroundColor: colors.surface }]}>
                    {/* Card header row */}
                    <View style={s.cardHeader}>
                        <Text style={[s.cardTitle, { color: colors.textMain }]}>
                            Today's Attendance
                        </Text>
                        <Text style={[s.cardDate, { color: colors.textSub }]}>
                            {todayLabel}
                        </Text>
                    </View>

                    {/* Working Time label */}
                    <Text style={[s.workingLabel, { color: colors.textSub }]}>
                        Working Time
                    </Text>

                    {/* Clock */}
                    <View style={s.clockRow}>
                        <Text style={[s.clockHH, { color: colors.textMain }]}>
                            {timeDisplay.hh}
                        </Text>
                        <Text style={[s.clockColon, { color: colors.primary }]}>
                            {" : "}
                        </Text>
                        <Text style={[s.clockMM, { color: colors.textMain }]}>
                            {timeDisplay.mm}
                        </Text>
                        {timeDisplay.ampm ? (
                            <Text style={[s.clockAmPm, { color: colors.textSub }]}>
                                {" "}{timeDisplay.ampm}
                            </Text>
                        ) : null}
                    </View>

                    {/* Status badge */}
                    <View
                        style={[
                            s.badge,
                            {
                                backgroundColor: firstCheckIn
                                    ? "rgba(34,197,94,0.1)"
                                    : "rgba(239,68,68,0.1)",
                            },
                        ]}
                    >
                        <MaterialIcons
                            name={firstCheckIn ? "login" : "schedule"}
                            size={13}
                            color={firstCheckIn ? "#22c55e" : "#ef4444"}
                        />
                        <Text
                            style={[
                                s.badgeText,
                                { color: firstCheckIn ? "#22c55e" : "#ef4444" },
                            ]}
                        >
                            {firstCheckIn ? "Checked In" : "Not Checked In"}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    // ── colored background ──
    bg: {
        paddingTop: 14,
        paddingHorizontal: 16,
        paddingBottom: 90,          // extra room so card overlaps nicely
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },

    // ── top bar ──
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
        justifyContent: "center",
    },

    name: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        maxWidth: 160,
    },
    role: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 11,
        fontWeight: "500",
        marginTop: 1,
        marginLeft: 12
    },

    // ── floating card ──
    cardWrapper: {
        paddingHorizontal: 16,
    },
    card: {
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
        elevation: 10,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "700",
    },
    cardDate: {
        fontSize: 12,
        fontWeight: "500",
    },
    workingLabel: {
        fontSize: 11,
        fontWeight: "500",
        letterSpacing: 0.6,
        textTransform: "uppercase",
        marginBottom: 4,
        textAlign: "center",
    },

    // ── clock ──
    clockRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        marginBottom: 14,
    },
    clockHH: {
        fontSize: 30,
        fontWeight: "800",
        lineHeight: 58,
        letterSpacing: 2,
    },
    clockColon: {
        fontSize: 30,
        fontWeight: "800",
        lineHeight: 58,
        paddingBottom: 2,
    },
    clockMM: {
        fontSize: 30,
        fontWeight: "800",
        lineHeight: 58,
        letterSpacing: 2,
    },
    clockAmPm: {
        fontSize: 15,
        fontWeight: "700",
        marginLeft: 4,
        marginBottom: 14,
    },

    // ── badge ──
    badge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 7,
        gap: 6,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: "700",
    },
});