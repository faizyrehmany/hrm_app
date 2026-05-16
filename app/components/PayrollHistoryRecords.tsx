import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const getStatusStyles = (status: string) => {
    if (status.toUpperCase() === 'PAID') return {
      bg: 'rgba(16, 185, 129, 0.12)',
      color: '#10b981',
      borderColor: 'rgba(16, 185, 129, 0.25)',
      dot: '#10b981',
    };
    return {
      bg: 'rgba(239, 68, 68, 0.12)',
      color: '#ef4444',
      borderColor: 'rgba(239, 68, 68, 0.25)',
      dot: '#ef4444',
    };
  };

  const formatMoney = (amount: number) => `Rs ${amount.toLocaleString()}`;

  const renderItem = ({ item, index }: { item: Payslip; index: number }) => {
    const statusStyle = getStatusStyles(item.status);
    const cardBg = isDark ? '#1e293b' : '#ffffff';
    const cardBorder = isDark ? '#334155' : '#e2e8f0';
    const subText = isDark ? '#94a3b8' : '#64748b';

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* Card Top: Period + Status */}
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
              <MaterialIcons name="receipt-long" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.periodText, { color: colors.textMain }]}>{item.periodLabel}</Text>
              <Text style={[styles.slipIdText, { color: subText }]}>Slip #{item.id}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.borderColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} />

        {/* Card Body: Salary breakdown */}
        <View style={styles.cardBody}>
          <View style={styles.salaryRow}>
            <View style={styles.salaryItem}>
              <Text style={[styles.salaryLabel, { color: subText }]}>Basic</Text>
              <Text style={[styles.salaryValue, { color: colors.textMain }]}>
                {formatMoney(item.basicSalary)}
              </Text>
            </View>
            <View style={styles.salaryItem}>
              <Text style={[styles.salaryLabel, { color: subText }]}>Allowances</Text>
              <Text style={[styles.salaryValue, { color: '#10b981' }]}>
                +{formatMoney(item.totalAllowances)}
              </Text>
            </View>
            <View style={styles.salaryItem}>
              <Text style={[styles.salaryLabel, { color: subText }]}>Deductions</Text>
              <Text style={[styles.salaryValue, { color: '#ef4444' }]}>
                -{formatMoney(item.totalDeductions)}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} />

        {/* Card Footer: Net Pay */}
        <View style={styles.cardFooter}>
          <Text style={[styles.netPayLabel, { color: subText }]}>Net Pay</Text>
          <Text style={[styles.netPayValue, { color: colors.textMain }]}>
            {formatMoney(item.netPay)}
          </Text>
        </View>
      </View>
    );
  };

  const dropdownStyle = {
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderColor: isDark ? '#334155' : '#e2e8f0',
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="trending-up" size={18} color={colors.textMain} />
          <Text style={[styles.title, { color: colors.textMain }]}>Payroll History</Text>
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

      {/* Filters */}
      <View style={styles.dropdownRow}>
        <Dropdown
          style={[styles.dropdown, dropdownStyle]}
          containerStyle={{ borderRadius: 10 }}
          data={[{ label: "All Months", value: "All" }, ...months.map(m => ({ label: m, value: m }))]}
          labelField="label"
          valueField="value"
          value={selectedMonth}
          onChange={item => setSelectedMonth(item.value)}
          placeholder="Month"
          placeholderStyle={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 13 }}
          selectedTextStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 }}
        />
        <Dropdown
          style={[styles.dropdown, dropdownStyle]}
          containerStyle={{ borderRadius: 10 }}
          data={years.map(y => ({ label: y, value: y }))}
          labelField="label"
          valueField="value"
          value={selectedYear}
          onChange={item => setSelectedYear(item.value)}
          placeholder="Year"
          placeholderStyle={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 13 }}
          selectedTextStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 }}
        />
      </View>

      {/* Card List */}
      <FlatList
        data={filteredSlips}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={() => (
          <View style={[styles.emptyState, {
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            borderColor: isDark ? '#334155' : '#e2e8f0',
          }]}>
            <MaterialIcons name="inbox" size={32} color={isDark ? '#475569' : '#cbd5e1'} />
            <Text style={[styles.emptyTitle, { color: colors.textMain }]}>No records found</Text>
            <Text style={[styles.emptySub, { color: isDark ? '#64748b' : '#94a3b8' }]}>
              Try changing the month or year filter
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  exportContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  exportText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  dropdown: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  listContent: {
    paddingBottom: 8,
  },

  /* ── Card ── */
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 15,
    fontWeight: '700',
  },
  slipIdText: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  cardBody: {
    padding: 14,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  salaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  salaryLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  salaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  netPayLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  netPayValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  /* ── Empty State ── */
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PayrollHistoryRecords;