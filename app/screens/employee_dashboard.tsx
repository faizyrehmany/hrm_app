import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import EmployeeBottomTabBar from "../components/EmployeeBottomTabBar";
import SideMenu from "../components/SideMenu";
import TodayAttendanceHeader from "../components/TodayAttendanceHeader";
import { useTheme } from "../contexts/ThemeContext";
import { SessionManager, User } from "../services/SessionManager";
import { getSalaryAdvances, SalaryAdvance } from "../services/advanceSalary";
import { getAttendanceCorrections, getAttendanceLogs } from "../services/attendance";
import { EmployeeApi } from "../services/auth";
import { getHolidays } from "../services/holidays";
import { fetchLeaveRequests, LeaveApplication } from "../services/leave";
import { getLoans, Loan } from "../services/loan";
import { fetchPayrollRecords, Payslip } from "../services/payrollHistory";

const screenWidth = Dimensions.get("window").width;

// ✅ SAFE — manually parses parts, always local time on every engine
const parseLocalDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    const [datePart, timePart = "00:00:00"] = dateString.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes, seconds] = (timePart.split(".")[0]).split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds || 0);
};

// Returns Monday of the week that is `offset` weeks from the current week
const getWeekMonday = (offset: number): Date => {
    const today = new Date();
    const dow = today.getDay(); // 0=Sun, 1=Mon...
    const diff = dow === 0 ? 6 : dow - 1; // days since Monday
    const mon = new Date(today);
    mon.setHours(0, 0, 0, 0);
    mon.setDate(today.getDate() - diff + offset * 7);
    return mon;
};

export default function DashboardScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();

    const [isMenuVisible, setMenuVisible] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
    const [loadingLeaves, setLoadingLeaves] = useState(true);

    const [payrolls, setPayrolls] = useState<Payslip[]>([]);
    const [loadingPayrolls, setLoadingPayrolls] = useState(true);

    const [loans, setLoans] = useState<Loan[]>([]);
    const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>([]);
    const [loadingLoans, setLoadingLoans] = useState(true);
    const [loadingAdvances, setLoadingAdvances] = useState(true);

    const [holidays, setHolidays] = useState<any[]>([]);
    const [loadingHolidays, setLoadingHolidays] = useState(true);

    const [attendanceCorrections, setAttendanceCorrections] = useState<any[]>([]);
    const [loadingCorrections, setLoadingCorrections] = useState(true);

    const [selectedBar, setSelectedBar] = useState<{
        label: string;
        value: number;
        index: number;
        x: number;
    } | null>(null);

    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [chartWeekOffset, setChartWeekOffset] = useState(0);

    const [displayName, setDisplayName] = useState('');

    const TOOLTIP_WIDTH = 80;

    const formatYLabel = (label: string): string => {
        const num = parseFloat(label);
        if (isNaN(num) || num === 0) return label;
        const absNum = Math.abs(num);
        if (absNum >= 1_000_000) return (absNum / 1_000_000).toFixed(absNum < 10_000_000 ? 2 : 1) + " M";
        if (absNum >= 1_000) return Math.round(absNum / 1_000) + " K";
        return num.toLocaleString();
    };

    const showBarTooltip = (item: any, index: number) => {
        let x =
            3 + // initialSpacing
            index * (barWidth + spacing) +
            barWidth / 2 -
            TOOLTIP_WIDTH / 2;

        // Clamp x position to keep tooltip within mobile view
        const minX = 30; // left padding
        const maxX = screenWidth - 30 - TOOLTIP_WIDTH; // right padding - tooltip width

        x = Math.max(minX, Math.min(x, maxX));

        setSelectedBar({
            label: item.label ?? "",
            value: item.value ?? 0,
            index,
            x,
        });

        setTooltipVisible(true);

        setTimeout(() => {
            setTooltipVisible(false);
            setSelectedBar(null);
        }, 9800);
    };



    const now = new Date();
    const [fromDate, setFromDate] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1));
    const [toDate, setToDate] = useState<Date>(now);
    const [activeDatePicker, setActiveDatePicker] = useState<'from' | 'to' | null>(null);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    const dynamicStyles = createDynamicStyles(colors, isDark);

    // ──────────────────────────────────────────────
    // Data loading (unchanged)
    // ──────────────────────────────────────────────

    useEffect(() => {
        const loadUser = async () => {
            const userData = await SessionManager.getUser();
            setUser(userData);
            if (!userData) router.replace("/");
        };
        loadUser();
    }, []);



    useEffect(() => {
        const loadEmployee = async () => {
            try {
                const data = await EmployeeApi.getEmployeeDetails();

                if (data) {
                    const name =
                        data.firstName && data.lastName
                            ? `${data.firstName} ${data.lastName}`
                            : `Employee #${data.employeeId}`;

                    setDisplayName(name);
                } else {
                    setDisplayName('Employee');
                }
            } catch (err) {
                console.error('Failed to fetch employee details', err);
                setDisplayName('Employee');
            }
        };

        loadEmployee();
    }, []);

    useEffect(() => {
        const loadHolidays = async () => {
            setLoadingHolidays(true);
            try {
                const yearsToFetch = new Set<number>();
                const startYear = fromDate.getFullYear();
                const endYear = toDate.getFullYear();
                for (let year = startYear; year <= endYear; year++) {
                    yearsToFetch.add(year);
                }
                const holidayResponses = await Promise.all(
                    Array.from(yearsToFetch).map((year) => getHolidays(year))
                );
                setHolidays(
                    holidayResponses.flatMap((res) => (res.success ? res.data : []))
                );
            } catch (err) {
                console.error("Failed to fetch holidays:", err);
                setHolidays([]);
            } finally {
                setLoadingHolidays(false);
            }
        };
        loadHolidays();
    }, [fromDate, toDate]);

    useEffect(() => {
        const loadLoans = async () => {
            setLoadingLoans(true);
            try {
                setLoans(await getLoans());
            } catch (err) {
                console.error("Failed to fetch loans:", err);
            } finally {
                setLoadingLoans(false);
            }
        };

        const loadAdvances = async () => {
            setLoadingAdvances(true);
            try {
                setSalaryAdvances(await getSalaryAdvances());
            } catch (err) {
                console.error("Failed to fetch salary advances:", err);
            } finally {
                setLoadingAdvances(false);
            }
        };

        loadLoans();
        loadAdvances();
    }, []);

    useEffect(() => {
        const loadPayrolls = async () => {
            setLoadingPayrolls(true);
            try {
                setPayrolls(await fetchPayrollRecords());
            } catch (err) {
                console.error("Failed to fetch payrolls:", err);
            } finally {
                setLoadingPayrolls(false);
            }
        };
        loadPayrolls();
    }, []);

    useEffect(() => {
        const fetchAttendanceLogs = async () => {
            if (!user?.enrollNo) return;
            setLoadingLogs(true);
            try {
                const logs = await getAttendanceLogs(user.enrollNo);

                // console.log("RAW API logs count:", logs.length);
                // console.log("RAW first 3:", JSON.stringify(logs.slice(0, 3)));
                const correctedLogs = logs.map((log) => ({
                    workDate: log.logTime,
                    logTime: log.logTime,
                    modeLabel: log.inOutMode === 0 ? "CheckIn" : "CheckOut",
                    status: "Pending",
                }));

                // ✅ Deduplicate by logTime + mode — belt and suspenders fix
                const seen = new Set<string>();
                const dedupedLogs = correctedLogs.filter((log) => {
                    const key = `${log.logTime}-${log.modeLabel}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                setAttendanceLogs(dedupedLogs);
            } catch (err) {
                console.error("Failed to fetch attendance logs:", err);
            } finally {
                setLoadingLogs(false);
            }
        };
        fetchAttendanceLogs();
    }, [user?.enrollNo]);

    useEffect(() => {
        const loadLeaves = async () => {
            setLoadingLeaves(true);
            try {
                setLeaves(await fetchLeaveRequests());
            } finally {
                setLoadingLeaves(false);
            }
        };
        loadLeaves();
    }, []);

    useEffect(() => {
        const fetchCorrections = async () => {
            if (!user?.enrollNo) return;
            setLoadingCorrections(true);
            try {
                setAttendanceCorrections(await getAttendanceCorrections());
            } catch (err) {
                console.error("Failed to fetch attendance corrections:", err);
            } finally {
                setLoadingCorrections(false);
            }
        };
        fetchCorrections();
    }, [user?.enrollNo]);

    // ──────────────────────────────────────────────
    // Filtering logic (kept minimal – only what's needed for tables + pending)
    // ──────────────────────────────────────────────

    const rangeStart = new Date(fromDate);
    rangeStart.setHours(0, 0, 0, 0);

    const rangeEnd = new Date(toDate);
    rangeEnd.setHours(23, 59, 59, 999);

    const isInRange = (date: Date) => date >= rangeStart && date <= rangeEnd;

    const filteredAttendanceLogs = attendanceLogs.filter((log) => {
        const date = parseLocalDate(log.workDate);
        return isInRange(date);
    });

    const filteredLeaves = leaves.filter((l) => {
        const start = parseLocalDate(l.startDate);
        const end = parseLocalDate(l.endDate);
        return end >= rangeStart && start <= rangeEnd;
    });

    const filteredPayrolls = payrolls.filter((pay) => {
        const payDate = new Date(pay.payrollYear, pay.payrollMonth - 1, 1);
        return isInRange(payDate);
    });

    // Only keep what's needed for Pending Requests
    const pendingMissingTime = attendanceCorrections.filter((corr) => {
        if (corr.status !== "Pending") return false;
        if (!user) return false;
        if (corr.enrollNo && corr.enrollNo !== user.enrollNo) return false;
        return isInRange(parseLocalDate(corr.date));
    }).length;

    const pendingLeaves = leaves.filter((l) => {
        if (l.status !== "Pending") return false;
        if (!user) return false;
        if (l.enrollNo && l.enrollNo !== user.enrollNo) return false;
        return isInRange(parseLocalDate(l.startDate));
    }).length;


    //calculate exception

    const calculateExceptions = () => {
        let lateCount = 0;
        let earlyCount = 0;

        const grouped: Record<string, any[]> = {};

        filteredAttendanceLogs.forEach((log) => {
            // console.log("logs", `${log.logTime} | ${log.modeLabel}`);

            const dateObj = parseLocalDate(log.logTime);


            if (dateObj.getDay() === 0) return; // skip Sunday
            const isHoliday = holidays.some(
                h => parseLocalDate(h.date).toDateString() === dateObj.toDateString()
            );
            if (isHoliday) return;

            const dateKey = dateObj.toDateString();
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push({ time: dateObj, mode: log.modeLabel });
        });

        Object.values(grouped).forEach((logs) => {
            const sorted = logs.sort((a, b) => a.time.getTime() - b.time.getTime());

            const firstIn = sorted.find(l => l.mode === "CheckIn");
            const lastOut = sorted
                .filter(l => l.mode === "CheckOut")
                .sort((a, b) => b.time.getTime() - a.time.getTime())[0];

            if (firstIn) {
                // Late if check-in is after 9:30 AM (570 minutes)
                const totalInMinutes = firstIn.time.getHours() * 60 + firstIn.time.getMinutes();
                if (totalInMinutes > 9 * 60 + 30) lateCount++;
            }

            if (lastOut) {
                // Early going if check-out is before 6:00 PM (1080 minutes)
                const totalOutMinutes = lastOut.time.getHours() * 60 + lastOut.time.getMinutes();
                if (totalOutMinutes < 18 * 60) earlyCount++;
            }
        });

        return { lateCount, earlyCount };
    };

    const { lateCount: lateComingCount, earlyCount: earlyGoingCount } = calculateExceptions();

    const formatDateLabel = (date: Date) => {
        if (date.toDateString() === new Date().toDateString()) {
            return `Today, ${date.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        return date.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const cardTitleSuffix = fromDate.toDateString() === toDate.toDateString()
        ? formatDateLabel(fromDate)
        : `${formatDateLabel(fromDate)} – ${formatDateLabel(toDate)}`;

    const getTotalWorkDaysInRange = (startDate: Date, endDate: Date, holidaysList: any[] = []) => {
        let count = 0;
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        while (current <= end) {
            const isSunday = current.getDay() === 0;
            const isHoliday = holidaysList.some(
                (h) => parseLocalDate(h.date).toDateString() === current.toDateString()
            );
            if (!isSunday && !isHoliday) count++;
            current.setDate(current.getDate() + 1);
        }

        return count;
    };

    let presentDatesSet = new Set(
        filteredAttendanceLogs.map((log) => parseLocalDate(log.logTime).toDateString())
    );

    let leaveDatesSet = new Set(
        filteredLeaves.flatMap((l) => {
            const start = parseLocalDate(l.startDate);
            const end = parseLocalDate(l.endDate);
            const dates: string[] = [];
            const current = new Date(start);
            while (current <= end) {
                if (isInRange(current)) {
                    dates.push(current.toDateString());
                }
                current.setDate(current.getDate() + 1);
            }
            return dates;
        })
    );

    const totalWorkDays = getTotalWorkDaysInRange(rangeStart, rangeEnd, holidays);

    const absentDaysCount = totalWorkDays - presentDatesSet.size - leaveDatesSet.size;

    const attendancePercentValue = totalWorkDays > 0
        ? Math.round((presentDatesSet.size / totalWorkDays) * 100)
        : 0;

    const presentDays = presentDatesSet.size;
    const absentDays = absentDaysCount >= 0 ? absentDaysCount : 0;
    const leavesThisMonth = leaveDatesSet.size;
    const attendancePercent = `${attendancePercentValue}%`;

    const SHIFT_START_HOUR = 9;
    const SHIFT_START_MINUTE = 29; // ✅ 9:30 AM
    const SHIFT_END_HOUR = 18;

    const calculateShiftStats = () => {
        let onTimeCount = 0;
        let lateCount = 0;
        let earlyCount = 0;

        const grouped: Record<string, any[]> = {};

        filteredAttendanceLogs.forEach((log) => {
            const dateObj = parseLocalDate(log.logTime);

            if (!isInRange(dateObj)) return;
            if (dateObj.getDay() === 0) return;
            const isHoliday = holidays.some(h => parseLocalDate(h.date).toDateString() === dateObj.toDateString());
            if (isHoliday) return;

            const dateKey = dateObj.toDateString();
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push({ time: new Date(log.logTime), mode: log.modeLabel });
        });

        Object.keys(grouped).forEach((dateKey) => {
            const logs = grouped[dateKey].sort((a, b) => a.time.getTime() - b.time.getTime());

            const firstIn = logs.find(l => l.mode === "CheckIn");
            const lastOut = [...logs].reverse().find(l => l.mode === "CheckOut");

            if (!firstIn) return;

            // ✅ Check-in analysis using total minutes
            const totalInMinutes = firstIn.time.getHours() * 60 + firstIn.time.getMinutes();
            const shiftStartMinutes = SHIFT_START_HOUR * 60 + SHIFT_START_MINUTE; // 570

            if (totalInMinutes <= shiftStartMinutes) {
                onTimeCount++;
            } else {
                lateCount++;
            }

            // ✅ Check-out analysis — only if lastOut exists
            if (lastOut) {
                const totalOutMinutes = lastOut.time.getHours() * 60 + lastOut.time.getMinutes();
                if (totalOutMinutes < SHIFT_END_HOUR * 60) {
                    earlyCount++;
                }
            }
        });

        return [
            { name: "On Time", population: onTimeCount, color: "#10b981" },
            { name: "Late", population: lateCount, color: "#f59e0b" },
            { name: "Early", population: earlyCount, color: "#3b82f6" },
        ];
    };

    const shiftData = calculateShiftStats();


    const combinedLoansAdvances = [
        ...loans.map((loan) => ({
            type: "LOAN",
            amount: loan.totalAmount,
            balance: loan.remainingAmount,
            status: loan.status,
        })),
        ...salaryAdvances.map((adv) => ({
            type: "ADVANCE",
            amount: adv.amount,
            balance: adv.isRecovered ? 0 : adv.amount,
            status: adv.status,
        })),
    ];


    //calculate daily work hours

    const calculateDailyWorkHours = () => {
        if (!filteredAttendanceLogs.length) return { labels: [], hours: [], totalHours: 0 };

        const grouped: Record<number, any[]> = {};

        filteredAttendanceLogs.forEach((log) => {
            const dateObj = parseLocalDate(log.logTime);

            if (!isInRange(dateObj)) return;

            const dateKey = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push({ time: dateObj, mode: log.modeLabel });
        });

        const labels: string[] = [];
        const hours: number[] = [];
        let totalMinutes = 0;

        Object.keys(grouped)
            .map(k => Number(k))
            .sort((a, b) => a - b)
            .forEach((ts) => {
                let logs = grouped[ts].sort((a, b) => a.time.getTime() - b.time.getTime());

                let dailyMinutes = 0;
                let lastCheckIn: Date | null = null;

                logs.forEach(log => {
                    if (log.mode === "CheckIn") {
                        lastCheckIn = log.time;
                    } else if (log.mode === "CheckOut" && lastCheckIn) {
                        const diff = (log.time.getTime() - lastCheckIn.getTime()) / 60000;
                        if (diff > 0 && diff < 12 * 60) {
                            dailyMinutes += diff;
                        }
                        lastCheckIn = null;
                    }
                });

                // ✅ DEBUG — see exactly what each day contributes
                // console.log(`📅 ${new Date(ts).toDateString()} → ${(dailyMinutes / 60).toFixed(2)}h | logs: ${logs.map(l => l.mode + "@" + l.time.toTimeString().slice(0, 5)).join(", ")}`);

                if (dailyMinutes > 0) {
                    hours.push(Number((dailyMinutes / 60).toFixed(2)));
                    labels.push(new Date(ts).getDate().toString());
                    totalMinutes += dailyMinutes;
                }
            });

        // console.log("🕐 TOTAL HOURS:", (totalMinutes / 60).toFixed(2));

        return {
            labels,
            hours,
            totalHours: (totalMinutes / 60).toFixed(2),
        };
    };

    const { labels: dailyLabels, hours: dailyHours, totalHours } =
        calculateDailyWorkHours();

    const screenWidth = Dimensions.get("window").width;

    //number of bars
    const numBars = dailyLabels.length;

    // total width available (same as your advanced chart)
    // ScrollView padding: 16*2=32, chartCard padding: 12*2=24 → 56 total
    const totalWidth = screenWidth - 56;

    // dynamic spacing like your MonthWiseSalesChart
    const isManyBars = numBars > 20;

    const spacing = isManyBars ? 5 : 5;
    const barWidth = Math.max(5, Math.min(1, totalWidth / (numBars * 1.5)));

    // getWeekMonday is defined at module level above the component

    const getWeekRangeLabel = () => {
        const mon = getWeekMonday(chartWeekOffset);
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleDateString('en', { month: 'short' })}`;
        return `${fmt(mon)} – ${fmt(sun)}`;
    };

    const renderTopLabel = (text: string, color: string) => (
        <View style={{
            position: 'absolute',
            bottom: 6,
            alignItems: 'center',
            justifyContent: 'center',
            width: 25,
        }}>
            <Text style={{
                fontSize: 8,
                color: color,
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: 0.3,
                transform: [{ rotate: '-90deg' }],
                width: 40,
                textAlign: 'center',
            }}>
                {text}
            </Text>
        </View>
    );
    const get7DayChartData = () => {
        const mon = getWeekMonday(chartWeekOffset);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        let weeklyTotalMinutes = 0;

        const data = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(mon);
            day.setDate(mon.getDate() + i);
            const dayStr = day.toDateString();
            const dayLabel = day.toLocaleDateString('en', { weekday: 'short' });
            const isFuture = day > today;
            const isSunday = day.getDay() === 0;

            // Holiday check (Sunday or from holidays array)
            const isHoliday = isSunday || holidays.some(h => parseLocalDate(h.date).toDateString() === dayStr);

            if (isHoliday) {
                return {
                    value: 8,
                    label: dayLabel,
                    frontColor: '#FFE082',
                    topLabelComponent: () => (
                        <View style={{ marginBottom: -72, zIndex: 10, alignItems: 'center' }}>
                            {renderTopLabel("Holiday", "#B45309")}
                        </View>
                    ),
                    isHoliday: true,
                };
            }

            const dayLogs = attendanceLogs.filter(log => parseLocalDate(log.logTime).toDateString() === dayStr);

            if (dayLogs.length === 0 && !isFuture) {
                return {
                    value: 4,           // taller so text fits
                    label: dayLabel,
                    frontColor: '#FFAB91',
                    topLabelComponent: () => (
                        <View style={{ marginBottom: -40, zIndex: 10, alignItems: 'center' }}>
                            {renderTopLabel("Absent", "#C2410C")}
                        </View>
                    ),
                    isAbsent: true,
                };
            }

            // Calculate work hours
            const sorted = [...dayLogs].sort((a, b) => parseLocalDate(a.logTime).getTime() - parseLocalDate(b.logTime).getTime());
            let mins = 0;
            let lastIn: Date | null = null;
            sorted.forEach(log => {
                if (log.modeLabel === 'CheckIn') lastIn = parseLocalDate(log.logTime);
                else if (log.modeLabel === 'CheckOut' && lastIn) {
                    const d = (parseLocalDate(log.logTime).getTime() - lastIn.getTime()) / 60000;
                    if (d > 0 && d < 720) mins += d;
                    lastIn = null;
                }
            });

            mins = Math.min(mins, 14 * 60);
            weeklyTotalMinutes += mins;
            const h = Number((mins / 60).toFixed(2));
            return {
                value: h,
                label: dayLabel,
                frontColor: '#90CAF9', // Pastel Blue
            };
        });

        return { data, totalHours: (weeklyTotalMinutes / 60).toFixed(2) };
    };

    const { data: weekData, totalHours: weekTotalHours } = get7DayChartData();
    const weekRangeLabel = getWeekRangeLabel();

    const barData = dailyLabels.map((label, index) => ({
        value: dailyHours[index],
        label: label,
    }));

    return (

        <View style={{ flex: 1, backgroundColor: colors.primary }}>
            <StatusBar backgroundColor={colors.primary} barStyle="light-content" translucent={false} />

            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
                <View style={{ flex: 1, backgroundColor: colors.background }}>

                    <TodayAttendanceHeader
                        displayName={displayName}
                        attendanceLogs={attendanceLogs}
                        onMenuPress={() => setMenuVisible(true)}
                        parseLocalDate={parseLocalDate}
                    />

                    <SideMenu visible={isMenuVisible} onClose={() => setMenuVisible(false)} />

                    <ScrollView
                        style={[styles.container, dynamicStyles.container]}
                        contentContainerStyle={{ paddingBottom: 140 }}
                    >
                        <View style={{ marginVertical: 5, zIndex: 10 }}>
                            <View style={[styles.dateRangeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <TouchableOpacity
                                    style={[styles.dateSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                    onPress={() => {
                                        setActiveDatePicker('from');
                                        setDatePickerVisible(true);
                                    }}
                                >
                                    <Text style={[styles.dateSelectorLabel, { color: colors.textSub }]}>From</Text>
                                    <Text style={[styles.dateSelectorText, { color: colors.textMain }]}>{fromDate.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.dateSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                    onPress={() => {
                                        setActiveDatePicker('to');
                                        setDatePickerVisible(true);
                                    }}
                                >
                                    <Text style={[styles.dateSelectorLabel, { color: colors.textSub }]}>To</Text>
                                    <Text style={[styles.dateSelectorText, { color: colors.textMain }]}>{toDate.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePickerModal
                                isVisible={isDatePickerVisible}
                                mode="date"
                                date={activeDatePicker === 'from' ? fromDate : toDate}
                                onConfirm={(date) => {
                                    setDatePickerVisible(false);
                                    if (activeDatePicker === 'from') {
                                        const newFrom = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                        setFromDate(newFrom);
                                        if (newFrom > toDate) setToDate(newFrom);
                                    } else if (activeDatePicker === 'to') {
                                        const newTo = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                        setToDate(newTo);
                                        if (newTo < fromDate) setFromDate(newTo);
                                    }
                                    setActiveDatePicker(null);
                                }}
                                onCancel={() => {
                                    setDatePickerVisible(false);
                                    setActiveDatePicker(null);
                                }}
                            />
                        </View>


                        {/* ── TOTAL ATTENDANCE SECTION ── */}
                        <View style={[styles.totalAttCard, { backgroundColor: colors.surface }]}>
                            {/* Header */}
                            <View style={styles.totalAttHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <MaterialIcons name="assessment" size={22} color={colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.totalAttTitle, dynamicStyles.sectionTitle, { marginBottom: 0 }]}>Total Attendance</Text>
                                </View>
                            </View>

                            {/* Row 1: Present | Absent | Leaves */}
                            <View style={styles.totalAttRow}>
                                <View style={styles.totalAttCell}>
                                    <Text style={[styles.totalAttValue, { color: '#22c55e', backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#ecfdf5' }]}>
                                        {presentDays}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <MaterialIcons name="check-circle" size={12} color="#22c55e" style={{ marginRight: 4 }} />
                                        <Text style={[styles.totalAttLabel, dynamicStyles.textSub, { marginTop: 0 }]}>Present</Text>
                                    </View>
                                </View>
                                <View style={[styles.totalAttDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.totalAttCell}>
                                    <Text style={[styles.totalAttValue, { color: '#ef4444', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2' }]}>
                                        {absentDays}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <MaterialIcons name="cancel" size={12} color="#ef4444" style={{ marginRight: 4 }} />
                                        <Text style={[styles.totalAttLabel, dynamicStyles.textSub, { marginTop: 0 }]}>Absent</Text>
                                    </View>
                                </View>
                                <View style={[styles.totalAttDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.totalAttCell}>
                                    <Text style={[styles.totalAttValue, { color: colors.primary, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff' }]}>
                                        {leavesThisMonth}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <MaterialIcons name="event" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                                        <Text style={[styles.totalAttLabel, dynamicStyles.textSub, { marginTop: 0 }]}>Leaves</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Separator */}
                            <View style={[styles.totalAttSeparator, { backgroundColor: colors.border, marginVertical: 12 }]} />

                            {/* Row 2: Attendance % | Missing Time Request | Leave Request */}
                            <View style={styles.totalAttRow}>
                                <View style={styles.totalAttCell}>
                                    <Text style={[styles.totalAttValue, { color: '#8b5cf6', backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : '#f5f3ff' }]}>
                                        {attendancePercent}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <MaterialIcons name="trending-up" size={12} color="#8b5cf6" style={{ marginRight: 4 }} />
                                        <Text style={[styles.totalAttLabel, dynamicStyles.textSub, { marginTop: 0 }]}>Attendance %</Text>
                                    </View>
                                </View>
                                <View style={[styles.totalAttDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.totalAttCell}>
                                    <Text style={[styles.totalAttValue, { color: '#f59e0b', backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb' }]}>
                                        {pendingMissingTime}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <MaterialIcons name="access-time" size={12} color="#f59e0b" style={{ marginRight: 4 }} />
                                        <Text style={[styles.totalAttLabel, dynamicStyles.textSub, { marginTop: 0 }]}>Missing Time</Text>
                                    </View>
                                </View>
                                <View style={[styles.totalAttDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.totalAttCell}>
                                    <Text style={[styles.totalAttValue, { color: '#ec4899', backgroundColor: isDark ? 'rgba(236, 72, 153, 0.1)' : '#fdf2f8' }]}>
                                        {pendingLeaves}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <MaterialIcons name="assignment" size={12} color="#ec4899" style={{ marginRight: 4 }} />
                                        <Text style={[styles.totalAttLabel, dynamicStyles.textSub, { marginTop: 0 }]}>Leave Request</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Separator */}
                            <View style={[styles.totalAttSeparator, { backgroundColor: colors.border, marginVertical: 12 }]} />

                            {/* Row 3: Late Coming | Early Going */}
                            <View style={styles.totalAttRow}>
                                <View style={[styles.totalAttCell, { flex: 1 }]}>
                                    <Text style={[styles.totalAttValue, { color: '#f97316', backgroundColor: isDark ? 'rgba(249, 115, 22, 0.1)' : '#fff7ed' }]}>
                                        {lateComingCount}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <MaterialIcons name="schedule" size={12} color="#f97316" style={{ marginRight: 4 }} />
                                        <Text style={[styles.totalAttLabel, dynamicStyles.textSub, { marginTop: 0 }]}>Late Coming</Text>
                                    </View>
                                </View>
                                <View style={[styles.totalAttDivider, { backgroundColor: colors.border }]} />
                                <View style={[styles.totalAttCell, { flex: 1 }]}>
                                    <Text style={[styles.totalAttValue, { color: '#06b6d4', backgroundColor: isDark ? 'rgba(6, 182, 212, 0.1)' : '#ecfeff' }]}>
                                        {earlyGoingCount}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <MaterialIcons name="directions-run" size={12} color="#06b6d4" style={{ marginRight: 4 }} />
                                        <Text style={[styles.totalAttLabel, dynamicStyles.textSub, { marginTop: 0 }]}>Early Going</Text>
                                    </View>
                                </View>
                            </View>
                        </View>


                        {/* Shift Stats – kept UI */}
                        {/* <View style={styles.section}>
                            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <MaterialIcons name="pie-chart" size={22} color={colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle, { marginBottom: 0 }]}>
                                        Shift Stats
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <PieChart
                                        data={shiftData.map(item => ({
                                            ...item,
                                            color: item.color,
                                            legendFontColor: "transparent", // hide default legend text
                                            legendFontSize: 0,
                                        }))}
                                        width={screenWidth / 2}
                                        height={160}
                                        chartConfig={{
                                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                        }}
                                        accessor="population"
                                        backgroundColor="transparent"
                                        paddingLeft="20"
                                        hasLegend={false}
                                        absolute
                                    />

                                    {/* Custom Legend */}
                        {/* <View style={{ flex: 1, paddingLeft: 10 }}>
                                        {shiftData.map((item, index) => {
                                            const total = shiftData.reduce((acc, curr) => acc + curr.population, 0);
                                            const percentage = total > 0 ? Math.round((item.population / total) * 100) : 0;

                                            const getShiftIcon = (name: string) => {
                                                if (name === "On Time") return "timer";
                                                if (name === "Late") return "schedule";
                                                return "shutter-speed";
                                            };

                                            return (
                                                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                    <MaterialIcons name={getShiftIcon(item.name)} size={16} color={item.color} style={{ marginRight: 8 }} />
                                                    <View>
                                                        <Text style={[dynamicStyles.textMain, { fontSize: 13, fontWeight: '700' }]}>
                                                            {percentage}%
                                                        </Text>
                                                        <Text style={[dynamicStyles.textSub, { fontSize: 11 }]}>
                                                            {item.name}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View> 
                        </View> */}

                        {/* Daily Work Hours – 7-day Week Wise */}
                        <View style={styles.section}>
                            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
                                <View style={styles.dailyWorkHeader}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialIcons name="bar-chart" size={22} color={colors.primary} style={{ marginRight: 8 }} />
                                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle, { marginBottom: 0 }]}>
                                                Weekly Work Hours
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <TouchableOpacity onPress={() => setChartWeekOffset(w => w - 1)}>
                                                <MaterialIcons name="chevron-left" size={24} color={colors.textSub} />
                                            </TouchableOpacity>
                                            <Text style={[styles.weekRangeLabel, dynamicStyles.textSub, { marginHorizontal: 8, fontSize: 13, fontWeight: '600' }]}>
                                                {weekRangeLabel}
                                            </Text>
                                            <TouchableOpacity onPress={() => setChartWeekOffset(w => w + 1)} disabled={chartWeekOffset >= 0}>
                                                <MaterialIcons name="chevron-right" size={24} color={chartWeekOffset >= 0 ? colors.border : colors.textSub} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.totalHours, dynamicStyles.textMain, { fontSize: 16, fontWeight: '800' }]}>
                                            {weekTotalHours}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialIcons name="history" size={12} color={colors.textSub} style={{ marginRight: 4 }} />
                                            <Text style={[dynamicStyles.textSub, { fontSize: 10 }]}>TOTAL HOURS</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Legend */}
                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15, marginTop: 10, justifyContent: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#90CAF9' }} />
                                        <Text style={[dynamicStyles.textSub, { fontSize: 10 }]}>Work</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFE082' }} />
                                        <Text style={[dynamicStyles.textSub, { fontSize: 10 }]}>Holiday</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFAB91' }} />
                                        <Text style={[dynamicStyles.textSub, { fontSize: 10 }]}>Absent</Text>
                                    </View>
                                </View>

                                {/* Tooltip */}
                                {tooltipVisible && selectedBar && (
                                    <View style={[styles.fixedTooltip, { borderColor: colors.primary }]}>
                                        <Text style={styles.tooltipLabel}>{selectedBar.label}</Text>
                                        <Text style={[styles.tooltipValue, { color: colors.primary }]}>
                                            {selectedBar.value}h
                                        </Text>
                                    </View>
                                )}

                                <View style={{ overflow: "hidden", minHeight: 180, justifyContent: 'center' }}>
                                    {loadingLogs ? (
                                        <Text style={[{ textAlign: 'center' }, dynamicStyles.textSub]}>Loading weekly data...</Text>
                                    ) : (
                                        <BarChart
                                            key={`chart-week-${chartWeekOffset}`}
                                            data={weekData}
                                            width={totalWidth}
                                            height={180}
                                            barWidth={25}
                                            spacing={14}
                                            initialSpacing={10}
                                            barBorderRadius={6}
                                            labelsExtraHeight={20}
                                            xAxisLabelsHeight={20}
                                            overflowTop={30}
                                            disableScroll
                                            yAxisLabelWidth={20}
                                            formatYLabel={formatYLabel}
                                            xAxisLabelTextStyle={{ fontSize: 9, color: colors.textSub }}
                                            yAxisTextStyle={{ fontSize: 8, color: colors.textSub }}
                                            xAxisColor={isDark ? '#334155' : '#e2e8f0'}
                                            yAxisThickness={0}
                                            xAxisThickness={1}
                                            rulesType="solid"
                                            rulesColor={isDark ? '#1e293b' : '#f1f5f9'}
                                            noOfSections={4}
                                            isAnimated
                                            onPress={(item: any, index: number) => showBarTooltip(item, index)}
                                        />
                                    )}
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <EmployeeBottomTabBar activeTab="home" />
                </View>
            </SafeAreaView>

        </View>
    );
}



function TableRow({ date, time, mode, dynamicStyles }: any) {
    return (
        <View style={styles.tableRow}>
            <Text style={[styles.tableText, dynamicStyles.textMain]}>
                {date}
            </Text>

            <Text style={[styles.tableText, dynamicStyles.textMain]}>
                {time}
            </Text>

            <Text style={[styles.tableText, dynamicStyles.textMain]}>
                {mode}
            </Text>
        </View>
    );
}

function DashboardCard({ title, children, seeMore, onSeeMorePress }: any) {
    const { colors } = useTheme();
    return (
        <View
            style={{
                backgroundColor: colors.surface,
                borderRadius: 10,
                padding: 16,
                marginBottom: 16,
            }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: colors.textMain, fontWeight: "700" }}>{title}</Text>
                {onSeeMorePress && (
                    <TouchableOpacity onPress={onSeeMorePress}>
                        <Text style={{ color: "#3b82f6" }}>See More</Text>
                    </TouchableOpacity>
                )}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 16
    },

    header: {
        marginBottom: 20
    },

    title: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700"
    },



    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
    },

    subtitle: {
        color: "#94a3b8",
        fontSize: 12
    },

    tableHeader: {
        flex: 1,
        fontSize: 12,
        fontWeight: "700",
    },

    tableText: {
        flex: 1,
        fontSize: 12,
    },





    section: {
        marginTop: 20
    },

    dateRangeRow: {
        flexDirection: 'row',
        gap: 12,
    },

    dateSelector: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },

    dateSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    dateSelectorLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    dateSelectorText: {
        fontSize: 14,
        fontWeight: '600',
    },

    sectionTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 10
    },

    chartBox: {
        height: 120,
        backgroundColor: "#1e293b",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center"
    },

    placeholder: {
        color: "#94a3b8"
    },



    tableRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#334155"
    },


    payrollBox: {
        backgroundColor: "#1e293b",
        padding: 16,
        borderRadius: 10
    },

    payrollText: {
        color: "#cbd5f5"
    },

    payrollAmount: {
        color: "#22c55e",
        fontSize: 20,
        fontWeight: "700",
        marginTop: 6
    },

    payrollStatus: {
        color: "#f87171",
        marginTop: 4
    },

    holidayRow: {
        backgroundColor: "#1e293b",
        padding: 14,
        borderRadius: 10,
        flexDirection: "row",
        justifyContent: "space-between"
    },

    holidayDate: {
        color: "#60a5fa"
    },

    holidayName: {
        color: "#fff"
    },

    dailyWorkHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },

    totalHours: {
        fontSize: 14,
        fontWeight: "700",
    },

    fixedTooltip: {
        position: "absolute",
        top: 100,
        alignSelf: "center",
        width: 130,
        zIndex: 10,
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },

    tooltipLabel: {
        fontSize: 11,
        color: "#4b5563",
    },

    tooltipValue: {
        fontSize: 14,
        fontWeight: "700",
        marginTop: 2,
    },

    chartCard: {
        borderRadius: 12,
        padding: 12,
        marginTop: 4,
        width: "100%",
        alignSelf: "stretch",
        overflow: "hidden",
    },

    weekRangeLabel: {
        fontSize: 13,
        fontWeight: "600",
    },

    // Total Attendance Section Styles
    totalAttCard: {
        borderRadius: 16,
        padding: 16,
        marginTop: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    totalAttHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    totalAttTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    totalAttRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingVertical: 10,
    },
    totalAttCell: {
        flex: 1,
        alignItems: "center",
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    totalAttValue: {
        fontSize: 22,
        fontWeight: "800",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        overflow: "hidden",
        textAlign: "center",
        minWidth: 50,
    },
    totalAttLabel: {
        fontSize: 11,
        fontWeight: "600",
        marginTop: 8,
        textAlign: "center",
    },
    totalAttDivider: {
        width: 1,
        height: "60%",
        opacity: 0.2,
    },
    totalAttSeparator: {
        height: 1,
        width: "100%",
        opacity: 0.1,
        marginVertical: 4,
    },

});

const createDynamicStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.background,
        },
        title: {
            color: colors.textMain,
        },
        subtitle: {
            color: colors.textSub,
        },
        sectionTitle: {
            color: colors.textMain,
        },
        card: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        textMain: {
            color: colors.textMain,
        },
        textSub: {
            color: colors.textSub,
        },
        textAlert: {
            color: colors.error,
        },
        textPrimary: {
            color: colors.primary,
        },
    });