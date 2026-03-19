import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const RECENT_ACTIVITY = [
    { date: 'Dec 19, 2024', clockIn: '09:00 AM', clockOut: '06:00 PM', hours: '9h', status: 'PRESENT' },
    { date: 'Dec 18, 2024', clockIn: '09:15 AM', clockOut: '06:10 PM', hours: '8h 55m', status: 'LATE' },
    { date: 'Dec 17, 2024', clockIn: '08:55 AM', clockOut: '06:00 PM', hours: '9h 5m', status: 'PRESENT' },
];

const EmployeeActivityTable = () => {
    const { isDark, colors } = useTheme();
    const { width: SCREEN_WIDTH } = useWindowDimensions(); // dynamic screen width

    return (
        <View style={styles.section}>
            <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Header Section */}
                <View style={styles.headerRow}>
                    <Text style={[styles.headerTitle, { color: colors.textMain }]}>RECENT ACTIVITY</Text>
                    <TouchableOpacity>
                        <MaterialIcons name="more-vert" size={20} color={colors.textSub} />
                    </TouchableOpacity>
                </View>

                {/* Horizontal Scroll Area if needed */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: SCREEN_WIDTH, width: '100%' }}>
                        {/* Column Labels */}
                        <View style={[styles.tableHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                            <Text style={[styles.colHeader, { flex: 1.5 }]}>DATE</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>CLOCK IN</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>CLOCK OUT</Text>
                            <Text style={[styles.colHeader, { flex: 1.2 }]}>WORK HOURS</Text>
                            <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
                        </View>

                        {/* Table Rows */}
                        {RECENT_ACTIVITY.map((item, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.row,
                                    {
                                        borderBottomWidth: index === RECENT_ACTIVITY.length - 1 ? 0 : 1,
                                        borderBottomColor: colors.border,
                                    },
                                ]}
                            >
                                <Text style={[styles.cellText, styles.bold, { flex: 1.5, color: colors.textMain }]}>
                                    {item.date}
                                </Text>
                                <Text style={[styles.cellText, { flex: 1, color: colors.textSub }]}>{item.clockIn}</Text>
                                <Text style={[styles.cellText, { flex: 1, color: colors.textSub }]}>{item.clockOut}</Text>

                                <View style={[styles.hoursBox, { flex: 1.2 }]}>
                                    <MaterialIcons name="access-time" size={14} color="#3B82F6" />
                                    <Text style={styles.hoursText}>{item.hours}</Text>
                                </View>

                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <View
                                        style={[
                                            styles.badge,
                                            { borderColor: item.status === 'PRESENT' ? '#10b981' : '#fb923c' },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.badgeText,
                                                { color: item.status === 'PRESENT' ? '#10b981' : '#fb923c' },
                                            ]}
                                        >
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginVertical: 10,
    },
    container: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 12,
    },
    colHeader: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        paddingHorizontal: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12, // adds spacing between all children

    },
    cellText: {
        fontSize: 13,
        paddingHorizontal: 6, // <-- add horizontal spacing inside each cell

    },
    bold: {
        fontWeight: '700',
    },
    hoursBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8, // <-- add horizontal spacing inside each cell

    },
    hoursText: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '600',

    },
    badge: {
        paddingHorizontal: 5,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,

    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
    },
});

export default EmployeeActivityTable;