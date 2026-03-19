import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LeaveRecord {
  id: string;
  employee: string;
  role: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

const LeaveHistoryTable = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  // Data parsed from your provided image
  const LEAVE_HISTORY: LeaveRecord[] = [
    {
      id: '1',
      employee: 'Muhammad Zaid Sheikh',
      role: 'Frontend Developer',
      type: 'Medical Leave',
      startDate: '2026-02-12',
      endDate: '2026-02-12',
      status: 'APPROVED',
    },
    {
      id: '2',
      employee: 'Muhammad Zaid Sheikh',
      role: 'Frontend Developer',
      type: 'Medical Leave',
      startDate: '2026-02-26',
      endDate: '2026-02-26',
      status: 'APPROVED',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textMain }]}>Leave History</Text>
      
      {LEAVE_HISTORY.map((item) => (
        <View 
          key={item.id} 
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {/* Top Row: Type & Status */}
          <View style={styles.row}>
            <View style={styles.typeBadge}>
              <MaterialIcons name="event-note" size={16} color={colors.primary} />
              <Text style={[styles.typeText, { color: colors.textMain }]}>{item.type}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'APPROVED' ? '#10b98120' : '#f59e0b20' }]}>
              <Text style={[styles.statusText, { color: item.status === 'APPROVED' ? '#10b981' : '#f59e0b' }]}>
                {item.status}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bottom Row: Dates */}
          <View style={styles.dateContainer}>
            <View style={styles.dateBlock}>
              <Text style={[styles.dateLabel, { color: colors.textSub }]}>FROM</Text>
              <Text style={[styles.dateValue, { color: colors.textMain }]}>{item.startDate}</Text>
            </View>
            
            <MaterialIcons name="arrow-forward" size={16} color={colors.textSub} style={{ marginTop: 15 }} />

            <View style={styles.dateBlock}>
              <Text style={[styles.dateLabel, { color: colors.textSub, textAlign: 'right' }]}>TO</Text>
              <Text style={[styles.dateValue, { color: colors.textMain }]}>{item.endDate}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 24, paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, letterSpacing: -0.3 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeText: { fontSize: 15, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800' },
  divider: { height: 1, marginVertical: 12 },
  dateContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dateBlock: { gap: 4 },
  dateLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dateValue: { fontSize: 14, fontWeight: '500' },
});

export default LeaveHistoryTable;