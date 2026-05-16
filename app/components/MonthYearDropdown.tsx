import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Dropdown } from "react-native-element-dropdown";
import { useTheme } from '../contexts/ThemeContext';
import { MaterialIcons } from "@expo/vector-icons";

interface MonthYearDropdownProps {
    selectedMonth: string;
    selectedYear: string;
    onMonthChange: (month: string) => void;
    onYearChange: (year: string) => void;
    months?: string[]; // optional custom months
    years?: string[];  // optional custom years
}

const defaultMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const MonthYearDropdown: React.FC<MonthYearDropdownProps> = ({
    selectedMonth,
    selectedYear,
    onMonthChange,
    onYearChange,
    months = defaultMonths,
    years
}) => {
    const { isDark, colors } = useTheme();
    const currentYear = new Date().getFullYear();
    const defaultYears = ["All", ...Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())];

    const yearList = years || defaultYears;

    const renderIcon = (name: any) => (
        <MaterialIcons
            style={styles.icon}
            color={colors.textSub}
            name={name}
            size={18}
        />
    );

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {/* Month Dropdown */}
                <Dropdown
                    style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    placeholderStyle={[styles.placeholderStyle, { color: colors.textSub }]}
                    selectedTextStyle={[styles.selectedTextStyle, { color: colors.textMain }]}
                    containerStyle={[styles.containerStyle, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    itemTextStyle={{ color: colors.textMain, fontSize: 13 }}
                    activeColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
                    data={[{ label: "All Months", value: "All" }, ...months.map(m => ({ label: m, value: m }))]}
                    labelField="label"
                    valueField="value"
                    value={selectedMonth}
                    onChange={item => onMonthChange(item.value)}
                    renderLeftIcon={() => renderIcon("calendar-today")}
                    maxHeight={300}
                />

                {/* Year Dropdown */}
                <Dropdown
                    style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    placeholderStyle={[styles.placeholderStyle, { color: colors.textSub }]}
                    selectedTextStyle={[styles.selectedTextStyle, { color: colors.textMain }]}
                    containerStyle={[styles.containerStyle, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    itemTextStyle={{ color: colors.textMain, fontSize: 13 }}
                    activeColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
                    data={yearList.map(y => ({ label: y === "All" ? "All Years" : y, value: y }))}
                    labelField="label"
                    valueField="value"
                    value={selectedYear}
                    onChange={item => onYearChange(item.value)}
                    renderLeftIcon={() => renderIcon("event-note")}
                    maxHeight={300}
                />
            </View>
        </View>
    );
};

export default MonthYearDropdown;

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    dropdown: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    icon: {
        marginRight: 8,
    },
    placeholderStyle: {
        fontSize: 13,
    },
    selectedTextStyle: {
        fontSize: 13,
        fontWeight: '600',
    },
    containerStyle: {
        borderRadius: 12,
        marginTop: 4,
        overflow: 'hidden',
        borderWidth: 1,
    },
});