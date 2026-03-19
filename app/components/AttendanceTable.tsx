import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { FlatList, ScrollView } from 'react-native-gesture-handler';
import { AttendanceLog, getAttendanceCorrections, getAttendanceLogs, postAttendanceCorrection } from '../services/attendance';
import { SessionManager } from '../services/SessionManager';
import MissingTimeModal from './MissingTimeModal';

interface Props {
  colors: any;
  isDark: boolean;
}

type TabType = 'attendance' | 'missing';

export default function AttendanceScreen({ colors, isDark }: Props) {
  const { width: windowWidth } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedRow, setSelectedRow] = useState<any>(null);

  const [missingTimeRequests, setMissingTimeRequests] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);

  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);


  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewAllAttendance, setViewAllAttendance] = useState(false);
  const [viewAllMissing, setViewAllMissing] = useState(false);

  // compute checks directly when rendering instead of storing in state

  // Date pickers
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select Date';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const formatTime = (date: Date | string | number | undefined) => {
    if (!date) return '-';

    // convert the input to a Date object
    const d = new Date(date);

    // convert UTC to local time
    const localHours = d.getHours();
    const localMinutes = d.getMinutes();

    // determine AM or PM
    const ampm = localHours >= 12 ? 'PM' : 'AM';

    // convert to 12-hour format
    let hours = localHours % 12;
    if (hours === 0) hours = 12;

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = localMinutes.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr} ${ampm}`;
  };

  const mergeAttendanceLogs = (logs: AttendanceLog[]) => {
    const grouped: Record<string, any> = {};

    logs.forEach(log => {
      const dateKey = new Date(log.logTime).toDateString(); // group by date
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          DATE: log.logTime,
          EMPLOYEE: log.enrollNo,
          'CHECK-IN': log.inOutMode === 0 ? log.logTime : null,
          'CHECK-OUT': log.inOutMode === 1 ? log.logTime : null,
          HOURS: '-', // optional: compute later
          MODE: log.modeLabel,
          ACTIONS: log.status,
        };
      } else {
        if (log.inOutMode === 0) grouped[dateKey]['CHECK-IN'] = log.logTime;
        if (log.inOutMode === 1) grouped[dateKey]['CHECK-OUT'] = log.logTime;
      }
    });

    return Object.values(grouped);
  };


  const onChangeFrom = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowFromPicker(Platform.OS === 'ios');
    if (selectedDate) setFromDate(selectedDate);
  };

  const onChangeTo = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowToPicker(Platform.OS === 'ios');
    if (selectedDate) setToDate(selectedDate);
  };

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
      verifyMode: 15
    };

    try {
      const response = await postAttendanceCorrection(payload);
      await fetchMissingRequests();
      setActiveTab('missing');
      Alert.alert("Success", response.message);
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const user = await SessionManager.getUser();
        console.log('SessionManager user:', user);

        const enrollNo = user?.enrollNo;

        if (!enrollNo) {
          Alert.alert("Error", "Enroll number not found. Please login again.");
          return;
        }

        const enrollNoStr = enrollNo.toString();
        setCurrentEmployeeId(enrollNoStr);

        await fetchAttendanceLogs(enrollNoStr);
        await fetchMissingRequests(enrollNoStr);

      } catch (e) {
        console.error("Error initializing attendance screen:", e);
        Alert.alert("Error", "Failed to load attendance data");
      }
    };

    init();
  }, []);

  const fetchAttendanceLogs = async (enrollNo?: string) => {
    if (!enrollNo) return;
    setLoadingAttendance(true);
    try {
      const data = await getAttendanceLogs(enrollNo);

      // filter by fromDate/toDate
      const filtered = data.filter((item) => {
        const log = new Date(item.logTime);
        if (fromDate) {
          const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0);
          if (log < from) return false;
        }
        if (toDate) {
          // set to end of day
          const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);
          if (log > to) return false;
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

      missing.sort((a: any, b: any) =>
        new Date(b.requestedAtUtc).getTime() - new Date(a.requestedAtUtc).getTime()
      );

      setMissingTimeRequests(missing);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to fetch missing requests");
    } finally {
      setLoadingAttendance(false);
    }
  };


  const columnConfigs = {
    attendance: {
      DATE: 100,
      EMPLOYEE: 150,
      'CHECK-IN': 100,
      'CHECK-OUT': 100,
      HOURS: 80,
      MODE: 100,
      ACTIONS: 140,
    },
    missing: {
      EMPLOYEE: 150,
      DATE: 100,
      'REQUEST FOR': 120,
      TIME: 100,
      REASON: 180,
      STATUS: 100,
    },
  };

  const currentConfig = columnConfigs[activeTab];

  const totalBaseWidth = Object.values(currentConfig).reduce((sum, w) => sum + w, 0);
  const containerWidth = windowWidth - 32;

  // Do not stretch columns beyond their base width; this keeps true horizontal scroll when needed.
  const scaleFactor = 1;

  const dynamicStyles = createDynamicStyles(colors, isDark);

  const attendanceKeyMap: Record<string, (item: any) => string> = {
    DATE: (item) => formatDate(new Date(item.DATE)),   // <-- updated
    EMPLOYEE: (item) => item.EMPLOYEE,               // <-- updated
    'CHECK-IN': (item) => formatTime(item['CHECK-IN']),
    'CHECK-OUT': (item) => formatTime(item['CHECK-OUT']),
    HOURS: (item) => {
      if (item['CHECK-IN'] && item['CHECK-OUT']) {
        const diff = new Date(item['CHECK-OUT']).getTime() - new Date(item['CHECK-IN']).getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
      }
      return '-';
    },
    MODE: (item) => item.MODE,       // <-- updated
    ACTIONS: (item) => item.ACTIONS  // <-- updated
  };

  const missingKeyMap: Record<string, (item: any) => string> = {
    EMPLOYEE: (item) => item.enrollNo,
    DATE: (item) => formatDate(new Date(item.workDate)),
    'REQUEST FOR': (item) => item.modeLabel,
    TIME: (item) => formatTime(item.logTime),
    REASON: (item) => item.reason || '-',
    STATUS: (item) => item.status
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, dynamicStyles.container]}>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>

          <TouchableOpacity
            onPress={() => setActiveTab('attendance')}
            style={[
              styles.tab,
              activeTab === 'attendance' && { borderBottomColor: colors.primary }
            ]}
          >
            <MaterialIcons
              name="access-time"
              size={18}
              color={activeTab === 'attendance' ? colors.primary : colors.textSub}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'attendance' ? colors.primary : colors.textSub }
              ]}
            >
              Attendance Logs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('missing')}
            style={[
              styles.tab,
              activeTab === 'missing' && { borderBottomColor: colors.primary }
            ]}
          >
            <MaterialIcons
              name="calendar-today"
              size={18}
              color={activeTab === 'missing' ? colors.primary : colors.textSub}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'missing' ? colors.primary : colors.textSub }
              ]}
            >
              Missing Time
            </Text>
          </TouchableOpacity>

        </View>

        {/* Header Controls */}
        {activeTab === 'attendance' && (

          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', padding: 16 }}>

            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFromPicker(true)}
            >
              <Text style={styles.syncText}>From: {formatDate(fromDate)}</Text>
            </TouchableOpacity>

            {showFromPicker && (
              <DateTimePicker
                value={fromDate || new Date()}
                mode="date"
                display="default"
                onChange={onChangeFrom}
              />
            )}

            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowToPicker(true)}
            >
              <Text style={styles.syncText}>To: {formatDate(toDate)}</Text>
            </TouchableOpacity>

            {showToPicker && (
              <DateTimePicker
                value={toDate || new Date()}
                mode="date"
                display="default"
                onChange={onChangeTo}
              />
            )}

            <TouchableOpacity
              style={[
                styles.syncButton,
                { backgroundColor: colors.primary, opacity: loadingAttendance ? 0.5 : 1 }
              ]}
              onPress={() => currentEmployeeId && fetchAttendanceLogs(currentEmployeeId)}
              disabled={loadingAttendance}
            >
              <MaterialIcons name="sync" size={16} color="#fff" />
              <Text style={styles.syncText}>
                {loadingAttendance ? "Syncing..." : "Sync Fresh Data"}
              </Text>
            </TouchableOpacity>

          </View>

        )}

        {activeTab === 'missing' && (

          <View style={styles.headerActionRow}>

            <TouchableOpacity
              style={[
                styles.syncButton,
                { backgroundColor: colors.primary, opacity: loadingAttendance ? 0.5 : 1 }
              ]}
              onPress={() => currentEmployeeId && fetchMissingRequests(currentEmployeeId)}
              disabled={loadingAttendance}
            >
              <MaterialIcons name="refresh" size={16} color="#fff" />
              <Text style={styles.syncText}>
                {loadingAttendance ? "Refreshing..." : "Refresh"}
              </Text>
            </TouchableOpacity>

          </View>

        )}

        {/* Table */}
        <View style={{ minWidth: containerWidth }}>

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={{ minWidth: totalBaseWidth }}>

              {/* Table Header */}
              <View style={[styles.tableHeader, dynamicStyles.headerRow]}>
                {Object.keys(currentConfig).map((key) => (
                  <View
                    key={key}
                    style={{
                      width: (currentConfig as any)[key] * scaleFactor,
                      paddingHorizontal: 8
                    }}
                  >
                    <Text style={[styles.headerText, { color: colors.textSub }]}>{key}</Text>
                  </View>
                ))}
              </View>

              {/* Table Rows */}
              <FlatList
                data={
                  activeTab === 'attendance'
                    ? viewAllAttendance
                      ? mergeAttendanceLogs(attendanceLogs)
                      : mergeAttendanceLogs(attendanceLogs).slice(0, 10)
                    : viewAllMissing
                      ? missingTimeRequests
                      : missingTimeRequests.slice(0, 10)
                }
                keyExtractor={(item, index) =>
                  (item.id || item.enrollNo || index).toString()
                }
                nestedScrollEnabled
                renderItem={({ item }) => (
                  <View style={[styles.row, { borderColor: colors.border }]}>
                    {Object.keys(currentConfig).map((key) => (
                      <View
                        key={key}
                        style={{
                          width: (currentConfig as any)[key] * scaleFactor,
                          paddingHorizontal: 8
                        }}
                      >
                        {key === 'STATUS' && activeTab === 'missing' ? (
                          <View
                            style={
                              item.status.toLowerCase() === 'pending'
                                ? dynamicStyles.statusPending
                                : dynamicStyles.statusApproved
                            }
                          >
                            <Text style={dynamicStyles.statusText}>{item.status}</Text>
                          </View>
                        ) : key === 'ACTIONS' && activeTab === 'attendance' ? (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={() => submitCorrection(item)}
                          >
                            <Text style={styles.actionText}>Request Missing Time</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={{ color: colors.textMain, fontSize: 12 }}>
                            {activeTab === 'attendance'
                              ? attendanceKeyMap[key](item)
                              : missingKeyMap[key](item)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                ListEmptyComponent={() => (
                  <View style={{ padding: 20 }}>
                    <Text style={{ color: colors.textSub, textAlign: "center" }}>
                      No records found
                    </Text>
                  </View>
                )}
              />
              {activeTab === 'attendance' && attendanceLogs.length > 10 && (
                <TouchableOpacity
                  style={{ padding: 12, alignItems: 'center' }}
                  onPress={() => setViewAllAttendance(!viewAllAttendance)}
                >
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    {viewAllAttendance ? 'Collapse' : 'View All'}
                  </Text>
                </TouchableOpacity>
              )}

              {activeTab === 'missing' && missingTimeRequests.length > 10 && (
                <TouchableOpacity
                  style={{ padding: 12, alignItems: 'center' }}
                  onPress={() => setViewAllMissing(!viewAllMissing)}
                >
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    {viewAllMissing ? 'Collapse' : 'View All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

      </View>

      <MissingTimeModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        colors={colors}
        employeeName={selectedEmployee}
        initialDate={selectedRow ? formatDate(new Date(selectedRow.workDate)) : ""}
        initialCheckIn={
          selectedRow && selectedRow.inOutMode === 0
            ? formatTime(selectedRow.logTime)
            : ""
        }
        initialCheckOut={
          selectedRow && selectedRow.inOutMode === 1
            ? formatTime(selectedRow.logTime)
            : ""
        }
        submitting={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },

  container: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden'
  },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1
  },

  tab: {
    flexDirection: 'row',
    padding: 14,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center'
  },

  tabText: {
    fontSize: 13,
    fontWeight: '700'
  },

  headerActionRow: {
    padding: 16
  },

  syncButton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },

  syncText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13
  },

  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8
  },

  headerText: {
    fontSize: 11,
    fontWeight: '800'
  },

  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1
  },

  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },

  actionText: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center'
  }
});

const createDynamicStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.border
    },

    headerRow: {
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.03)'
        : '#f1f5f9'
    },

    statusPending: {
      backgroundColor: 'red',
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center'
    },

    statusApproved: {
      backgroundColor: 'green',
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center'
    },

    statusText: {
      color: '#fff',
      fontSize: 12
    }
  });