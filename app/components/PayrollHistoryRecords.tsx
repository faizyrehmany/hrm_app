import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Dropdown } from "react-native-element-dropdown";
import { useTheme } from '../contexts/ThemeContext';
import { Payslip } from '../services/payrollHistory';

type Props = {
  slips: Payslip[];
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// --- create a month string -> number map ---
const monthMap: Record<string, number> = months.reduce((acc, m, i) => {
  acc[m] = i + 1;
  return acc;
}, {} as Record<string, number>);

const PayrollHistoryRecords: React.FC<Props> = ({ slips }) => {
  const { colors, isDark } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");

  const currentYear = new Date().getFullYear();
  const years = ["All", ...Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())];

  const filteredSlips = useMemo(() => {
    return slips.filter(slip => {
      const monthMatch = selectedMonth === "All" || slip.payrollMonth === monthMap[selectedMonth];
      const yearMatch = selectedYear === "All" || slip.payrollYear?.toString() === selectedYear;
      return monthMatch && yearMatch;
    });
  }, [slips, selectedMonth, selectedYear]);

  const downloadFile = async (type: 'excel' | 'pdf') => {
    try {
      const fileUrl =
        type === 'excel'
          ? 'http://103.134.238.50:91/api/payroll-records/export/excel'
          : 'http://103.134.238.50:91/api/payroll-records/export/pdf';
      const fileExt = type === 'excel' ? 'xlsx' : 'pdf';
      const fileUri = FileSystem.documentDirectory + `Payroll_History.${fileExt}`;
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      else alert(`Downloaded to: ${uri}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const getStatusStyles = (status: 'PAID' | 'UNPAID' | string) => {
    if (status.toUpperCase() === 'PAID') return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' };
    return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' };
  };

  const columnWidths = { id: 60, period: 120, basic: 100, allowances: 100, deductions: 100, netPay: 100, status: 55 };
  const formatMoney = (amount: number) => `Rs ${amount.toLocaleString()}`;

  const renderItem = ({ item }: { item: Payslip }) => {
    const statusStyle = getStatusStyles(item.status);
    return (
      <View key={item.id} style={[styles.tableRow, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        <View style={{ width: columnWidths.id }}><Text style={[styles.cellText, { color: '#64748b' }]}>{item.id}</Text></View>
        <View style={{ width: columnWidths.period }}><Text style={[styles.cellText, { fontWeight: 'bold', color: colors.textMain }]}>{item.periodLabel}</Text></View>
        <View style={{ width: columnWidths.basic }}><Text style={[styles.cellText, { color: colors.textMain }]}>{formatMoney(item.basicSalary)}</Text></View>
        <View style={{ width: columnWidths.allowances }}><Text style={[styles.cellText, { color: '#10b981' }]}>+ {formatMoney(item.totalAllowances)}</Text></View>
        <View style={{ width: columnWidths.deductions }}><Text style={[styles.cellText, { color: '#ef4444' }]}>- {formatMoney(item.totalDeductions)}</Text></View>
        <View style={{ width: columnWidths.netPay }}><Text style={[styles.cellText, { fontWeight: 'bold', color: colors.textMain }]}>{formatMoney(item.netPay)}</Text></View>
        <View style={{ width: columnWidths.status, alignItems: 'center' }}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.borderColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="trending-up" size={18} color={colors.textMain} />
          <Text style={[styles.title, { color: colors.textMain }]}>PAYROLL HISTORY RECORDS</Text>
        </View>
        <View style={styles.exportContainer}>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: isDark ? '#1e1b4b' : '#f1f5f9' }]}
            onPress={() => downloadFile('excel')}
          >
            <MaterialIcons name="description" size={14} color="#8b5cf6" />
            <Text style={styles.exportText}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: isDark ? '#1e1b4b' : '#f1f5f9' }]}
            onPress={() => downloadFile('pdf')}
          >
            <MaterialIcons name="picture-as-pdf" size={14} color="#f43f5e" />
            <Text style={styles.exportText}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdowns */}
      <View style={styles.dropdownRow}>
        <Dropdown
          style={[styles.dropdown, { borderColor: colors.border }]}
          data={[{ label: "All", value: "All" }, ...months.map(m => ({ label: m, value: m }))]}
          labelField="label"
          valueField="value"
          value={selectedMonth}
          onChange={item => setSelectedMonth(item.value)}
          placeholder="Select Month"
          placeholderStyle={{ color: '#ffffff' }}
          selectedTextStyle={{ color: '#ffffff' }}
        />
        <Dropdown
          style={[styles.dropdown, { borderColor: colors.border }]}
          data={years.map(y => ({ label: y, value: y }))}
          labelField="label"
          valueField="value"
          value={selectedYear}
          onChange={item => setSelectedYear(item.value)}
          placeholder="Select Year"
          placeholderStyle={{ color: '#ffffff' }}
          selectedTextStyle={{ color: '#ffffff' }}
        />
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={[styles.tableBox, { borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
          <View style={[styles.tableHeader, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            {['SLIP ID', 'PERIOD', 'BASIC', 'ALLOWANCES', 'DEDUCTIONS', 'NET PAY', 'STATUS'].map((label, i) => (
              <View key={i} style={{ width: Object.values(columnWidths)[i] }}>
                <Text style={[styles.columnLabel, { color: colors.textMain }]}>{label}</Text>
              </View>
            ))}
          </View>

          <FlatList
            data={filteredSlips}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={() => (
              <View style={[styles.tableRow, { justifyContent: 'flex-start' }]}>
                <Text style={[styles.cellText, { color: colors.textSub, fontStyle: 'italic' }]}>
                  No payroll records found
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, paddingHorizontal: 10 },
  headerRow: { marginBottom: 12 },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 13, fontWeight: '900', marginLeft: 8, letterSpacing: 0.5 },
  exportContainer: { flexDirection: 'row', marginTop: 6 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginRight: 8 },
  exportText: { fontSize: 11, marginLeft: 4, fontWeight: '600', color: '#94a3b8' },
  dropdownRow: { flexDirection: 'row', marginBottom: 12 },
  dropdown: { flex: 1, marginRight: 8, height: 36, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8 },
  tableBox: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1 },
  columnLabel: { fontSize: 10, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, alignItems: 'center' },
  cellText: { fontSize: 11 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: 'bold' },
});

export default PayrollHistoryRecords;