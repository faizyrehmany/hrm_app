import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import {
  AttendanceLog,
  getAttendanceCorrections,
  getAttendanceLogs,
  postAttendanceCorrection,
} from '../services/attendance';
import { SessionManager } from '../services/SessionManager';
import MissingTimeModal from './MissingTimeModal';

interface Props {
  colors: any;
  isDark: boolean;
}

type TabType = 'attendance' | 'missing';

// Map verifyMode numbers → human-readable labels
const VERIFY_MODE_LABELS: Record<number, string> = {
  1: 'Fingerprint',
  2: 'Password',
  3: 'Card',
  4: 'Face',
  6: 'Face + Fingerprint',
  10: 'RF Card',
  11: 'Fingerprint + Password',
  15: 'Manual Entry',
  200: 'Duress Fingerprint',
};

const getVerifyModeLabel = (verifyMode: number): string =>
  VERIFY_MODE_LABELS[verifyMode] ?? `Mode ${verifyMode}`;

export default function AttendanceScreen({ colors, isDark }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedRow, setSelectedRow] = useState<any>(null);

  const [missingTimeRequests, setMissingTimeRequests] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Guard so the date-filter effect doesn't fire before the first load completes
  // (this was the root cause of "starts on page 2").
  const initializedRef = useRef(false);

  const PAGE_SIZE = 10;
  const [attendancePage, setAttendancePage] = useState(1);
  const [missingPage, setMissingPage] = useState(1);

  // ─── Formatters ────────────────────────────────────────────────────────────
  const formatDate = (date: Date | null) => {
    if (!date) return 'Select Date';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const formatDateShort = (date: Date | null | string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (date: Date | string | number | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    const localHours = d.getHours();
    const localMinutes = d.getMinutes();
    const ampm = localHours >= 12 ? 'PM' : 'AM';
    let hours = localHours % 12;
    if (hours === 0) hours = 12;
    return `${hours.toString().padStart(2, '0')}:${localMinutes
      .toString()
      .padStart(2, '0')} ${ampm}`;
  };

  // ─── Merge raw logs by date ────────────────────────────────────────────────
  const mergeAttendanceLogs = (logs: AttendanceLog[]) => {
    const grouped: Record<string, any> = {};
    logs.forEach((log) => {
      const dateKey = new Date(log.logTime).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          _uniqueKey: `${dateKey}-${log.enrollNo}`,
          DATE: log.logTime,
          EMPLOYEE: log.enrollNo,
          'CHECK-IN': log.inOutMode === 0 ? log.logTime : null,
          'CHECK-OUT': log.inOutMode === 1 ? log.logTime : null,
          // Derive mode label from verifyMode since modeLabel is absent in the API response
          MODE: getVerifyModeLabel(log.verifyMode ?? log.inOutMode),
          enrollNo: log.enrollNo,
          workDate: log.logTime,
          inOutMode: log.inOutMode,
          logTime: log.logTime,
        };
      } else {
        if (log.inOutMode === 0) grouped[dateKey]['CHECK-IN'] = log.logTime;
        if (log.inOutMode === 1) grouped[dateKey]['CHECK-OUT'] = log.logTime;
      }
    });
    return Object.values(grouped);
  };

  const computeHours = (item: any) => {
    if (item['CHECK-IN'] && item['CHECK-OUT']) {
      const diff =
        new Date(item['CHECK-OUT']).getTime() - new Date(item['CHECK-IN']).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      return `${h}h ${m}m`;
    }
    return '-';
  };

  // ─── Date picker handlers ──────────────────────────────────────────────────
  const onChangeFrom = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowFromPicker(Platform.OS === 'ios');
    if (selectedDate) setFromDate(selectedDate);
  };

  const onChangeTo = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowToPicker(Platform.OS === 'ios');
    if (selectedDate) setToDate(selectedDate);
  };

  // ─── Modal ─────────────────────────────────────────────────────────────────
  const submitCorrection = (row: any) => {
    setSelectedRow(row);
    setSelectedEmployee(row.enrollNo);
    setModalVisible(true);
  };

  const handleModalSubmit = async (data: any) => {
    setSubmitting(true);
    const requestDate = selectedRow?.workDate ? new Date(selectedRow.workDate) : new Date();
    const payload = {
      employeeId: selectedEmployee,
      mode: data.checkIn ? 1 : 2,
      date: formatDate(requestDate),
      time: data.checkIn || data.checkOut,
      reason: data.reason,
      verifyMode: 15,
    };
    try {
      const response = await postAttendanceCorrection(payload);
      await fetchMissingRequests(currentEmployeeId ?? undefined);
      setActiveTab('missing');
      Alert.alert('Success', response.message);
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const user = await SessionManager.getUser();
        const enrollNo = user?.enrollNo;
        if (!enrollNo) {
          Alert.alert('Error', 'Enroll number not found. Please login again.');
          return;
        }
        const enrollNoStr = enrollNo.toString();
        setCurrentEmployeeId(enrollNoStr);
        setAttendancePage(1);
        setMissingPage(1);
        await fetchAttendanceLogs(enrollNoStr, null, null);
        await fetchMissingRequests(enrollNoStr);
        // Mark init done AFTER fetches — prevents the date effect firing early
        initializedRef.current = true;
      } catch (e) {
        Alert.alert('Error', 'Failed to load attendance data');
      }
    };
    init();
  }, []);

  const fetchAttendanceLogs = async (
    enrollNo?: string,
    from?: Date | null,
    to?: Date | null
  ) => {
    if (!enrollNo) return;
    setLoadingAttendance(true);
    try {
      const data = await getAttendanceLogs(enrollNo);
      const filtered = data.filter((item) => {
        const log = new Date(item.logTime);
        if (from) {
          const fromStart = new Date(from);
          fromStart.setHours(0, 0, 0, 0);
          if (log < fromStart) return false;
        }
        if (to) {
          const toEnd = new Date(to);
          toEnd.setHours(23, 59, 59, 999);
          if (log > toEnd) return false;
        }
        return true;
      });
      setAttendanceLogs(filtered);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch attendance logs');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchMissingRequests = async (enrollNo?: string) => {
    if (!enrollNo) return;
    setLoadingAttendance(true);
    try {
      const data = await getAttendanceCorrections();
      const missing = data
        .filter((item: any) => item.verifyMode === 15)
        .filter((item: any) => item.enrollNo === enrollNo);
      missing.sort(
        (a: any, b: any) =>
          new Date(b.requestedAtUtc).getTime() - new Date(a.requestedAtUtc).getTime()
      );
      setMissingTimeRequests(missing);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch missing requests');
    } finally {
      setLoadingAttendance(false);
    }
  };

  // ─── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setAttendancePage(1);
    setMissingPage(1);
  }, [activeTab]);

  // Only re-fetch on date change after initial load is complete
  useEffect(() => {
    if (!initializedRef.current) return;
    if (currentEmployeeId) {
      setAttendancePage(1);
      fetchAttendanceLogs(currentEmployeeId, fromDate, toDate);
    }
  }, [fromDate, toDate]);

  // ─── Derived data ──────────────────────────────────────────────────────────
  const mergedLogs = mergeAttendanceLogs(attendanceLogs);
  const totalAttendancePages = Math.max(1, Math.ceil(mergedLogs.length / PAGE_SIZE));
  const totalMissingPages = Math.max(1, Math.ceil(missingTimeRequests.length / PAGE_SIZE));

  const paginatedAttendance = mergedLogs.slice(
    (attendancePage - 1) * PAGE_SIZE,
    attendancePage * PAGE_SIZE
  );
  const paginatedMissing = missingTimeRequests.slice(
    (missingPage - 1) * PAGE_SIZE,
    missingPage * PAGE_SIZE
  );

  // ─── Theme shortcuts ───────────────────────────────────────────────────────
  const bg = colors.surface;
  const border = colors.border;
  const primary = colors.primary;
  const textMain = colors.textMain;
  const textSub = colors.textSub;
  const subtleBg = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc';

  // ─── Pagination helpers ────────────────────────────────────────────────────
  const currentPage = activeTab === 'attendance' ? attendancePage : missingPage;
  const totalPages = activeTab === 'attendance' ? totalAttendancePages : totalMissingPages;

  const goToPrev = () => {
    if (activeTab === 'attendance') setAttendancePage((p) => Math.max(1, p - 1));
    else setMissingPage((p) => Math.max(1, p - 1));
  };
  const goToNext = () => {
    if (activeTab === 'attendance')
      setAttendancePage((p) => Math.min(totalAttendancePages, p + 1));
    else setMissingPage((p) => Math.min(totalMissingPages, p + 1));
  };

  const getAttendanceStatus = (checkIn: string | null) => {
    if (!checkIn) return 'No Check-In';

    const checkInTime = new Date(checkIn);

    const officeStart = new Date(checkIn);
    officeStart.setHours(9, 30, 0, 0); // 9:30 AM

    return checkInTime > officeStart ? 'Late' : 'On Time';
  };

  // ─── Attendance Card ───────────────────────────────────────────────────────
  const AttendanceCard = ({ item }: { item: any }) => {
    const checkIn = item['CHECK-IN'];
    const checkOut = item['CHECK-OUT'];
    const hours = computeHours(item);
    const hasCheckIn = !!checkIn;
    const hasCheckOut = !!checkOut;
    const attendanceStatus = getAttendanceStatus(checkIn);
    const isLate = attendanceStatus === 'Late';



    return (
      <View style={[mobileStyles.card, { backgroundColor: bg, borderColor: border }]}>
        {/* Header: date + status tag + mode badge */}
        <View style={mobileStyles.cardHeader}>
          <View style={mobileStyles.dateBlock}>
            <MaterialIcons name="calendar-today" size={13} color={textSub} />
            <Text style={[mobileStyles.dateText, { color: textMain }]}>
              {formatDateShort(item.DATE)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View
              style={[
                {
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: isLate ? '#fee2e2' : '#dcfce7',
                  borderWidth: 1,
                  borderColor: isLate ? '#fecaca' : '#bbf7d0',
                },
              ]}
            >
              <Text
                style={[
                  mobileStyles.modeBadgeText,
                  {
                    color: isLate ? '#991b1b' : '#166534',
                    fontWeight: '600',
                    fontSize: 10,
                  },
                ]}
              >
                {attendanceStatus}
              </Text>
            </View>
            <View style={[mobileStyles.modeBadge, { backgroundColor: subtleBg, borderColor: border }]}>
              <Text style={[mobileStyles.modeBadgeText, { color: textSub }]}>{item.MODE}</Text>
            </View>
          </View>
        </View>

        {/* Time row */}
        <View style={mobileStyles.timeRow}>
          <View style={mobileStyles.timeBlock}>
            <View style={mobileStyles.timeLabelRow}>
              <View
                style={[
                  mobileStyles.dot,
                  { backgroundColor: hasCheckIn ? '#22c55e' : '#cbd5e1' },
                ]}
              />
              <Text style={[mobileStyles.timeLabel, { color: textSub }]}>Check In</Text>
            </View>
            <Text style={[mobileStyles.timeValue, { color: hasCheckIn ? '#22c55e' : textSub }]}>
              {hasCheckIn ? formatTime(checkIn) : '--:--'}
            </Text>
          </View>

          <View style={mobileStyles.timeDivider}>
            <View style={[mobileStyles.dividerLine, { backgroundColor: border }]} />
            <View
              style={[mobileStyles.hoursPill, { backgroundColor: subtleBg, borderColor: border }]}
            >
              <MaterialIcons name="access-time" size={11} color={textSub} />
              <Text style={[mobileStyles.hoursText, { color: textSub }]}>{hours}</Text>
            </View>
            <View style={[mobileStyles.dividerLine, { backgroundColor: border }]} />
          </View>

          <View style={[mobileStyles.timeBlock, { alignItems: 'flex-end' }]}>
            <View style={[mobileStyles.timeLabelRow, { flexDirection: 'row-reverse' }]}>
              <View
                style={[
                  mobileStyles.dot,
                  { backgroundColor: hasCheckOut ? '#ef4444' : '#cbd5e1' },
                ]}
              />
              <Text
                style={[
                  mobileStyles.timeLabel,
                  { color: textSub, marginRight: 4, marginLeft: 0 },
                ]}
              >
                Check Out
              </Text>
            </View>
            <Text
              style={[mobileStyles.timeValue, { color: hasCheckOut ? '#ef4444' : textSub }]}
            >
              {hasCheckOut ? formatTime(checkOut) : '--:--'}
            </Text>
          </View>
        </View>

        {/* Action - Show button when either check-in or check-out is missing */}
        {(!hasCheckIn || !hasCheckOut) && (
          <TouchableOpacity
            style={[mobileStyles.requestBtn, { backgroundColor: primary }]}
            onPress={() => submitCorrection(item)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={14} color="#fff" />
            <Text style={mobileStyles.requestBtnText}>Request Missing Time</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ─── Missing Time Card ─────────────────────────────────────────────────────
  const MissingCard = ({ item }: { item: any }) => {
    const isPending = item.status?.toLowerCase() === 'pending';
    return (
      <View style={[mobileStyles.card, { backgroundColor: bg, borderColor: border }]}>
        <View style={mobileStyles.cardHeader}>
          <View style={mobileStyles.dateBlock}>
            <MaterialIcons name="calendar-today" size={13} color={textSub} />
            <Text style={[mobileStyles.dateText, { color: textMain }]}>
              {formatDateShort(item.workDate)}
            </Text>
          </View>
          <View
            style={[
              mobileStyles.statusChip,
              { backgroundColor: isPending ? '#fef3c7' : '#dcfce7' },
            ]}
          >
            <View
              style={[
                mobileStyles.statusDot,
                { backgroundColor: isPending ? '#f59e0b' : '#22c55e' },
              ]}
            />
            <Text
              style={[
                mobileStyles.statusChipText,
                { color: isPending ? '#92400e' : '#166534' },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={mobileStyles.detailsGrid}>
          <View style={mobileStyles.detailItem}>
            <Text style={[mobileStyles.detailLabel, { color: textSub }]}>Request For</Text>
            <Text style={[mobileStyles.detailValue, { color: textMain }]}>{item.modeLabel}</Text>
          </View>
          <View style={mobileStyles.detailItem}>
            <Text style={[mobileStyles.detailLabel, { color: textSub }]}>Time</Text>
            <Text style={[mobileStyles.detailValue, { color: textMain }]}>
              {formatTime(item.logTime)}
            </Text>
          </View>
          <View style={[mobileStyles.detailItem, { flex: 1 }]}>
            <Text style={[mobileStyles.detailLabel, { color: textSub }]}>Employee ID</Text>
            <Text style={[mobileStyles.detailValue, { color: textMain }]}>{item.enrollNo}</Text>
          </View>
        </View>

        {item.reason ? (
          <View
            style={[mobileStyles.reasonBox, { backgroundColor: subtleBg, borderColor: border }]}
          >
            <Text style={[mobileStyles.reasonLabel, { color: textSub }]}>Reason</Text>
            <Text style={[mobileStyles.reasonText, { color: textMain }]}>{item.reason}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[mobileStyles.wrapper, { backgroundColor: colors.background ?? '#f1f5f9' }]}>

      {/* Tab Bar */}
      <View style={[mobileStyles.tabBar, { backgroundColor: bg, borderBottomColor: border }]}>
        {(['attendance', 'missing'] as TabType[]).map((tab) => {
          const active = activeTab === tab;
          const icon = tab === 'attendance' ? 'access-time' : 'pending-actions';
          const label = tab === 'attendance' ? 'Attendance Logs' : 'Missing Time';
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[mobileStyles.tabItem, active && { borderBottomColor: primary }]}
              activeOpacity={0.7}
            >
              <MaterialIcons name={icon as any} size={18} color={active ? primary : textSub} />
              <Text style={[mobileStyles.tabLabel, { color: active ? primary : textSub }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Controls */}
      {activeTab === 'attendance' ? (
        <View
          style={[mobileStyles.controlsPanel, { backgroundColor: bg, borderBottomColor: border }]}
        >
          <View style={mobileStyles.datePickerRow}>
            <TouchableOpacity
              style={[mobileStyles.datePicker, { borderColor: border, backgroundColor: subtleBg }]}
              onPress={() => setShowFromPicker(true)}
            >
              <MaterialIcons name="event" size={15} color={primary} />
              <View>
                <Text style={[mobileStyles.datePickerLabel, { color: textSub }]}>From</Text>
                <Text style={[mobileStyles.datePickerValue, { color: textMain }]}>
                  {fromDate ? formatDate(fromDate) : 'All time'}
                </Text>
              </View>
            </TouchableOpacity>

            <MaterialIcons
              name="arrow-forward"
              size={16}
              color={textSub}
              style={{ marginTop: 8 }}
            />

            <TouchableOpacity
              style={[mobileStyles.datePicker, { borderColor: border, backgroundColor: subtleBg }]}
              onPress={() => setShowToPicker(true)}
            >
              <MaterialIcons name="event" size={15} color={primary} />
              <View>
                <Text style={[mobileStyles.datePickerLabel, { color: textSub }]}>To</Text>
                <Text style={[mobileStyles.datePickerValue, { color: textMain }]}>
                  {toDate ? formatDate(toDate) : 'Today'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              mobileStyles.syncBtn,
              { backgroundColor: primary, opacity: loadingAttendance ? 0.6 : 1 },
            ]}
            onPress={() => currentEmployeeId && fetchAttendanceLogs(currentEmployeeId)}
            disabled={loadingAttendance}
            activeOpacity={0.8}
          >
            <MaterialIcons name="sync" size={16} color="#fff" />
            <Text style={mobileStyles.syncBtnText}>
              {loadingAttendance ? 'Syncing...' : 'Sync Fresh Data'}
            </Text>
          </TouchableOpacity>

          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display="default"
              onChange={onChangeFrom}
            />
          )}
          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display="default"
              onChange={onChangeTo}
            />
          )}
        </View>
      ) : (
        <View
          style={[mobileStyles.controlsPanel, { backgroundColor: bg, borderBottomColor: border }]}
        >
          <TouchableOpacity
            style={[
              mobileStyles.syncBtn,
              { backgroundColor: primary, opacity: loadingAttendance ? 0.6 : 1 },
            ]}
            onPress={() => currentEmployeeId && fetchMissingRequests(currentEmployeeId)}
            disabled={loadingAttendance}
            activeOpacity={0.8}
          >
            <MaterialIcons name="refresh" size={16} color="#fff" />
            <Text style={mobileStyles.syncBtnText}>
              {loadingAttendance ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading indicator */}
      {loadingAttendance && (
        <View style={mobileStyles.loadingRow}>
          <ActivityIndicator size="small" color={primary} />
          <Text style={[mobileStyles.loadingText, { color: textSub }]}>Loading records…</Text>
        </View>
      )}

      {/* Card list — pure pagination, no infinite scroll */}
      <FlatList
        data={activeTab === 'attendance' ? paginatedAttendance : paginatedMissing}
        keyExtractor={(item, index) => item._uniqueKey || `${item.enrollNo}-${item.logTime}-${index}`}
        contentContainerStyle={mobileStyles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          activeTab === 'attendance' ? (
            <AttendanceCard item={item} />
          ) : (
            <MissingCard item={item} />
          )
        }
        ListEmptyComponent={
          !loadingAttendance ? (
            <View style={mobileStyles.emptyState}>
              <MaterialIcons
                name={activeTab === 'attendance' ? 'access-time' : 'pending-actions'}
                size={48}
                color={border}
              />
              <Text style={[mobileStyles.emptyTitle, { color: textMain }]}>No records found</Text>
              <Text style={[mobileStyles.emptySubtitle, { color: textSub }]}>
                {activeTab === 'attendance'
                  ? 'Adjust the date filter or sync fresh data.'
                  : 'No missing time requests have been submitted.'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          (activeTab === 'attendance' ? mergedLogs.length : missingTimeRequests.length) > 0 ? (
            <View style={[mobileStyles.pagination, { borderTopColor: border }]}>
              <TouchableOpacity
                onPress={goToPrev}
                disabled={currentPage === 1}
                style={[
                  mobileStyles.pageBtn,
                  { borderColor: border, opacity: currentPage === 1 ? 0.4 : 1 },
                ]}
                activeOpacity={0.7}
              >
                <MaterialIcons name="chevron-left" size={20} color={primary} />
                <Text style={[mobileStyles.pageBtnText, { color: primary }]}>Prev</Text>
              </TouchableOpacity>

              <View
                style={[
                  mobileStyles.pageIndicator,
                  { backgroundColor: subtleBg, borderColor: border },
                ]}
              >
                <Text style={[mobileStyles.pageIndicatorText, { color: textMain }]}>
                  {currentPage} / {totalPages}
                </Text>
              </View>

              <TouchableOpacity
                onPress={goToNext}
                disabled={currentPage === totalPages}
                style={[
                  mobileStyles.pageBtn,
                  { borderColor: border, opacity: currentPage === totalPages ? 0.4 : 1 },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[mobileStyles.pageBtnText, { color: primary }]}>Next</Text>
                <MaterialIcons name="chevron-right" size={20} color={primary} />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Modal */}
      <MissingTimeModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        colors={colors}
        employeeName={selectedEmployee}
        initialDate={selectedRow ? formatDate(new Date(selectedRow.workDate)) : ''}
        initialCheckIn={
          selectedRow && selectedRow.inOutMode === 0 ? formatTime(selectedRow.logTime) : ''
        }
        initialCheckOut={
          selectedRow && selectedRow.inOutMode === 1 ? formatTime(selectedRow.logTime) : ''
        }
        submitting={submitting}
      />
    </View>
  );
}

const mobileStyles = StyleSheet.create({
  wrapper: { flex: 1 },

  // Tabs
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 13, fontWeight: '700' },

  // Controls
  controlsPanel: { padding: 14, gap: 10, borderBottomWidth: 1 },
  datePickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  datePicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  datePickerLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  datePickerValue: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  syncBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: { fontSize: 13 },

  // List
  listContent: { padding: 12, gap: 10, paddingBottom: 24 },

  // Card shared
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBlock: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 13, fontWeight: '700' },
  modeBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  modeBadgeText: { fontSize: 11, fontWeight: '600' },

  // Attendance card
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeBlock: { flex: 1, gap: 4 },
  timeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginLeft: 2,
  },
  timeValue: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  timeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 6,
    gap: 4,
  },
  dividerLine: { flex: 1, height: 1 },
  hoursPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  hoursText: { fontSize: 10, fontWeight: '700' },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  requestBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Missing time card
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: { minWidth: '28%', gap: 2 },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: { fontSize: 13, fontWeight: '600' },
  reasonBox: { borderRadius: 8, borderWidth: 1, padding: 10, gap: 3 },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reasonText: { fontSize: 13, lineHeight: 18 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 19,
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    marginTop: 4,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pageBtnText: { fontSize: 13, fontWeight: '700' },
  pageIndicator: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  pageIndicatorText: { fontSize: 13, fontWeight: '700' },
});