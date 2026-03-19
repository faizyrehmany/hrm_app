import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from "react-native-element-dropdown";

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
    const currentYear = new Date().getFullYear();
    const defaultYears = ["All", ...Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())];

    const yearList = years || defaultYears;

    return (
        <View style={styles.row}>
            {/* Month Dropdown */}
            <Dropdown
                style={styles.dropdown}
                data={[{ label: "All", value: "All" }, ...months.map(m => ({ label: m, value: m }))]}
                labelField="label"
                valueField="value"
                value={selectedMonth}
                onChange={item => onMonthChange(item.value)}
                placeholder="Select Month"
                placeholderStyle={{ color: '#999' }}
                selectedTextStyle={{ color: '#f0e8e8' }}
            />

            {/* Year Dropdown */}
            <Dropdown
                style={styles.dropdown}
                data={yearList.map(y => ({ label: y, value: y }))}
                labelField="label"
                valueField="value"
                value={selectedYear}
                onChange={item => onYearChange(item.value)}
                placeholder="Select Year"
                placeholderStyle={{ color: '#999' }}
                selectedTextStyle={{ color: '#f0e8e8' }}
            />
        </View>
    );
};

export default MonthYearDropdown;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    dropdown: {
        flex: 1,
        height: 36,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
    },
});