import { formatTime } from "@/helpers/helper";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import EmployeeBottomTabBar from "../components/EmployeeBottomTabBar";
import EmployeeHeader from "../components/EmployeeHeader";
import MonthYearDropdown from "../components/MonthYearDropdown";
import SideMenu from "../components/SideMenu";
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
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    const [selectedMonth, setSelectedMonth] = useState<string>(monthNames[now.getMonth()]);
    const [selectedYear, setSelectedYear] = useState<string>(now.getFullYear().toString());

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
                const res = await getHolidays(Number(selectedYear));
                if (res.success) setHolidays(res.data);
            } catch (err) {
                console.error("Failed to fetch holidays:", err);
            } finally {
                setLoadingHolidays(false);
            }
        };
        loadHolidays();
    }, [selectedYear]);

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
                setAttendanceCorrections(await getAttendanceCorrections(user.enrollNo));
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

    const shouldFilter = selectedMonth !== null && selectedYear !== null;
    const monthMap: Record<string, number> = {
        January: 0, February: 1, March: 2, April: 3,
        May: 4, June: 5, July: 6, August: 7,
        September: 8, October: 9, November: 10, December: 11,
    };
    const filterMonth = shouldFilter ? monthMap[selectedMonth!] : null;
    const filterYear = shouldFilter ? Number(selectedYear) : null;

    const filteredAttendanceLogs = attendanceLogs.filter((log) => {
        if (!shouldFilter) return true;
        const date = parseLocalDate(log.workDate);
        return date.getMonth() === filterMonth && date.getFullYear() === filterYear;
    });

    const filteredLeaves = leaves.filter((l) => {
        if (!shouldFilter) return true;
        const start = parseLocalDate(l.startDate);
        const end = parseLocalDate(l.endDate);
        const days: string[] = [];
        const current = new Date(start);
        while (current <= end) {
            if (current.getMonth() === filterMonth && current.getFullYear() === filterYear) {
                days.push(current.toDateString());
            }
            current.setDate(current.getDate() + 1);
        }
        return days.length > 0;
    });

    const filteredPayrolls = payrolls.filter((pay) => {
        if (!shouldFilter) return true;
        const date = parseLocalDate(pay.period);
        return date.getMonth() === filterMonth && date.getFullYear() === filterYear;
    });

    // Only keep what's needed for Pending Requests
    const pendingMissingTime = attendanceCorrections.filter((corr) => {
        if (corr.status !== "Pending") return false;
        if (!user) return false;
        if (corr.enrollNo && corr.enrollNo !== user.enrollNo) return false;
        if (!shouldFilter) return true;
        return (
            parseLocalDate(corr.date).getMonth() === filterMonth &&
            parseLocalDate(corr.date).getFullYear() === filterYear
        );
    }).length;

    const pendingLeaves = leaves.filter((l) => {
        if (l.status !== "Pending") return false;
        if (!user) return false;
        if (l.enrollNo && l.enrollNo !== user.enrollNo) return false;
        if (!shouldFilter) return true;
        return (
            parseLocalDate(l.startDate).getMonth() === filterMonth &&
            parseLocalDate(l.startDate).getFullYear() === filterYear
        );
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
                const h = firstIn.time.getHours();
                const m = firstIn.time.getMinutes();
                // Late if arrived after 9:00 AM
                if (h > 9 || (h === 9 && m > 0)) lateCount++;
            }

            if (lastOut) {
                const h = lastOut.time.getHours();
                // Early if left before 6:00 PM
                if (h < 18) earlyCount++;
            }
        });

        return { lateCount, earlyCount };
    };

    const { lateCount: lateComingCount, earlyCount: earlyGoingCount } = calculateExceptions();

    const monthTitle = selectedMonth === "All" ? "All Months" : selectedMonth;
    const yearTitle = selectedYear === "All" ? "" : ` ${selectedYear}`;
    const cardTitleSuffix = `${monthTitle}${yearTitle}`;

    const getTotalWorkDaysInMonth = (month: number, year: number, holidaysList: any[] = []) => {
        let count = 0;
        const today = new Date();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // ✅ If it's the current month/year, only count up to today
        const lastDay = (month === today.getMonth() && year === today.getFullYear())
            ? today.getDate()
            : daysInMonth;

        for (let day = 1; day <= lastDay; day++) {
            const date = new Date(year, month, day);
            const isSunday = date.getDay() === 0;
            const isHoliday = holidaysList.some(
                h => parseLocalDate(h.date).toDateString() === date.toDateString()
            );
            if (!isSunday && !isHoliday) count++;
        }
        return count;
    };

    // Dummy values so UI doesn't break (you can replace with real data later)
    let presentDatesSet = new Set(
        filteredAttendanceLogs.map(log => parseLocalDate(log.logTime).toDateString())
    );

    let leaveDatesSet = new Set(
        filteredLeaves.flatMap(l => {
            const start = parseLocalDate(l.startDate);
            const end = parseLocalDate(l.endDate);
            const dates: string[] = [];
            const current = new Date(start);
            while (current <= end) {
                if (current.getMonth() === filterMonth && current.getFullYear() === filterYear) {
                    dates.push(current.toDateString());
                }
                current.setDate(current.getDate() + 1);
            }
            return dates;
        })
    );

    const totalWorkDays = filterMonth !== null && filterYear !== null
        ? getTotalWorkDaysInMonth(filterMonth, filterYear, holidays)
        : 0;

    const absentDaysCount = totalWorkDays - presentDatesSet.size - leaveDatesSet.size;

    const attendancePercentValue = totalWorkDays > 0
        ? Math.round((presentDatesSet.size / totalWorkDays) * 100)
        : 0;

    // Assign to UI variables
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

            if (dateObj.getMonth() !== filterMonth || dateObj.getFullYear() !== filterYear) return;
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
            { name: "On Time", population: onTimeCount, color: "#22c55e" },
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

            if (
                dateObj.getMonth() !== monthMap[selectedMonth!] ||
                dateObj.getFullYear() !== Number(selectedYear)
            ) return;

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

    const barData = dailyLabels.map((label, index) => ({
        value: dailyHours[index],
        label: label,
    }));

    return (
        <SafeAreaView style={[{ flex: 1 }, dynamicStyles.container]}>
            <EmployeeHeader
                user={user}
                onMenuPress={() => setMenuVisible(true)}
                onNotificationPress={() => console.log("Notifications pressed")}
            />
            <SideMenu visible={isMenuVisible} onClose={() => setMenuVisible(false)} />

            <ScrollView
                style={[styles.container, dynamicStyles.container]}
                contentContainerStyle={{ paddingBottom: 82 }}
            >
                {/* <View style={styles.header}>
                    <Text style={[styles.title, dynamicStyles.title]}>
                        {displayName && `Welcome Back, ${displayName} 👋`}
                    </Text>
                    <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
                        Here's what's happening with your work profile today.
                    </Text>
                </View> */}

                <View style={{ marginVertical: 16 }}>
                    <MonthYearDropdown
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        onMonthChange={setSelectedMonth}
                        onYearChange={setSelectedYear}
                    />
                </View>

                {/* Stats Cards – kept UI, removed real calc */}
                <View style={styles.cardRow}>
                    <StatCard
                        title="Present Days"
                        value={presentDays}
                        icon="check-circle"
                        dynamicStyles={dynamicStyles}
                    />
                    <StatCard
                        title="Absent Days"
                        value={absentDays}
                        icon="cancel"
                        dynamicStyles={dynamicStyles}
                    />
                </View>

                <View style={styles.cardRow}>
                    <StatCard
                        title="Leaves This Month"
                        value={leavesThisMonth}
                        icon="event"
                        dynamicStyles={dynamicStyles}
                    />
                    <StatCard
                        title="Attendance %"
                        value={attendancePercent}
                        icon="trending-up"
                        dynamicStyles={dynamicStyles}
                    />
                </View>

                {/* Daily Work Hours – kept UI structure */}
                <View style={styles.section}>
                    <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.dailyWorkHeader}>
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                                Daily Work Hours
                            </Text>
                            <Text style={[styles.totalHours, dynamicStyles.textMain]}>
                                {totalHours} TOTAL HOURS
                            </Text>
                        </View>

                        {/* Tooltip */}
                        {tooltipVisible && selectedBar && (
                            <View
                                style={[
                                    styles.fixedTooltip,
                                    { borderColor: colors.primary },
                                ]}
                            >
                                <Text style={styles.tooltipLabel}>
                                    Day {selectedBar.label}
                                </Text>
                                <Text style={[styles.tooltipValue, { color: colors.primary }]}>
                                    {selectedBar.value}h
                                </Text>
                            </View>
                        )}

                        <View style={{ overflow: "hidden" }}>
                            <BarChart
                                data={barData}
                                width={totalWidth}
                                height={180}
                                barWidth={barWidth}
                                spacing={spacing}
                                initialSpacing={1}
                                barBorderRadius={4}
                                labelsExtraHeight={20}
                                xAxisLabelsHeight={20}
                                overflowTop={30}
                                disableScroll
                                frontColor={colors.primary}
                                yAxisLabelWidth={15}
                                formatYLabel={formatYLabel}
                                xAxisLabelTextStyle={{ fontSize: 7, color: colors.textSub }}
                                yAxisTextStyle={{ fontSize: 8, color: "#555" }}
                                xAxisColor="#d1d5db"
                                yAxisThickness={0}
                                xAxisThickness={1}
                                rulesType="solid"
                                noOfSections={5}
                                isAnimated={false}
                                onPress={(item: any, index: number) => showBarTooltip(item, index)}
                            />
                        </View>
                    </View>
                </View>

                {/* Shift Stats – kept UI */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                        Shift Stats
                    </Text>
                    <PieChart
                        data={shiftData.map(item => ({
                            ...item,
                            color: item.color, // this controls slice color
                            legendFontColor: item.color, // this controls label/legend text color
                            legendFontSize: 12,
                        }))}
                        width={screenWidth - 40}
                        height={180}
                        chartConfig={{
                            backgroundColor: "transparent",
                            color: () => colors.textMain, // slice number (percentage) color
                            labelColor: () => colors.textMain, // fallback for label inside slice
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="10"
                        absolute
                    />
                </View>

                {/* Exceptions – kept UI */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                        Exceptions
                    </Text>
                    <View style={styles.cardRow}>
                        <InfoCard
                            label="Late Coming"
                            value={lateComingCount.toString()}
                            dynamicStyles={dynamicStyles}
                        />
                        <InfoCard
                            label="Early Going"
                            value={earlyGoingCount.toString()}
                            dynamicStyles={dynamicStyles}
                        />
                    </View>
                </View>

                {/* Pending Requests – kept (only real remaining counts) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                        Pending Requests
                    </Text>
                    <View style={styles.cardRow}>
                        <InfoCard
                            label="Missing Time Requests"
                            value={pendingMissingTime.toString()}
                            dynamicStyles={dynamicStyles}
                        />
                        <InfoCard
                            label="Leave Requests"
                            value={pendingLeaves.toString()}
                            dynamicStyles={dynamicStyles}
                        />
                    </View>
                </View>

                {/* Tables – unchanged */}
                <DashboardCard
                    title={`Attendance Logs (${cardTitleSuffix})`}
                    seeMore
                    onSeeMorePress={() => router.push("/screens/attendance")}
                >
                    <View style={[styles.tableRow, { borderBottomWidth: 2, borderBottomColor: colors.primary }]}>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Date</Text>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Time</Text>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Mode</Text>
                    </View>
                    {loadingLogs ? (
                        <Text style={[{ textAlign: "center", marginVertical: 16 }, dynamicStyles.textSub]}>
                            Loading attendance logs...
                        </Text>
                    ) : (
                        filteredAttendanceLogs.slice(0, 5).map((log, idx) => (
                            <TableRow
                                key={idx}
                                date={log.workDate ? new Date(log.workDate).toLocaleDateString() : "-"}
                                time={log.logTime ? formatTime(log.logTime) : "-"}
                                mode={log.modeLabel || "-"}
                                dynamicStyles={dynamicStyles}
                            />
                        ))
                    )}
                </DashboardCard>

                {/* LEAVES CARD */}
                <DashboardCard
                    title={`Leaves (${cardTitleSuffix})`}
                    seeMore
                    onSeeMorePress={() => router.push("/screens/employee_leaves")}
                >

                    {/* Header Row */}
                    <View style={[styles.tableRow, { borderBottomWidth: 2, borderBottomColor: colors.primary }]}>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Type</Text>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Duration</Text>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Status</Text>
                    </View>

                    {loadingLeaves ? (
                        <Text style={[{ textAlign: "center", marginVertical: 16 }, dynamicStyles.textSub]}>
                            Loading leave requests...
                        </Text>
                    ) : (
                        filteredLeaves.slice(0, 5).map((leave, idx) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.tableText, dynamicStyles.textMain]}>{leave.type}</Text>
                                <Text style={[styles.tableText, dynamicStyles.textMain]}>
                                    {leave.startDate} - {leave.endDate}
                                </Text>
                                <Text style={[styles.tableText, { color: leave.statusColor }]}>
                                    {leave.status}
                                </Text>
                            </View>
                        ))
                    )}
                </DashboardCard>
                {/* PAYROLL CARD */}
                <DashboardCard
                    title={`Payroll (${cardTitleSuffix})`}
                    seeMore
                    onSeeMorePress={() => router.push("/screens/employee_payroll")}
                >

                    {/* Header Row */}
                    <View style={[styles.tableRow, { borderBottomWidth: 2, borderBottomColor: colors.primary }]}>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Month</Text>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Net Salary</Text>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Status</Text>
                    </View>

                    {loadingPayrolls ? (
                        <Text style={[{ textAlign: "center", marginVertical: 16 }, dynamicStyles.textSub]}>
                            Loading payroll records...
                        </Text>
                    ) : (
                        filteredPayrolls.slice(0, 5).map((pay, idx) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.tableText, dynamicStyles.textMain]}>
                                    {pay.periodLabel}
                                </Text>
                                <Text style={[styles.tableText, dynamicStyles.textMain]}>
                                    Rs {pay.netPay.toLocaleString()}
                                </Text>
                                <Text style={[styles.tableText, { color: pay.status === 'PAID' ? '#10b981' : '#ef4444' }]}>
                                    {pay.status}
                                </Text>
                            </View>
                        ))
                    )}
                </DashboardCard>

                {/* LOANS & ADVANCES CARD */}
                <DashboardCard title="Loans & Advances" seeMore onSeeMorePress={() => router.push("/screens/allowances")}>
                    {/* Header Row */}
                    <View style={[styles.tableRow, { borderBottomWidth: 2, borderBottomColor: colors.primary }]}>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Type</Text>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Amount</Text>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Balance</Text>
                    </View>

                    {loadingLoans || loadingAdvances ? (
                        <Text style={[{ textAlign: "center", marginVertical: 16 }, dynamicStyles.textSub]}>
                            Loading loans and advances...
                        </Text>
                    ) : combinedLoansAdvances.length === 0 ? (
                        <Text style={[{ textAlign: "center", marginVertical: 16 }, dynamicStyles.textSub]}>
                            No records found
                        </Text>
                    ) : (
                        combinedLoansAdvances.slice(0, 5).map((item, idx) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.tableText, dynamicStyles.textMain]}>
                                    {item.type}
                                </Text>
                                <Text style={[styles.tableText, dynamicStyles.textMain]}>
                                    Rs {item.amount.toLocaleString()}
                                </Text>
                                <Text style={[styles.tableText, dynamicStyles.textMain]}>
                                    Rs {item.balance.toLocaleString()}
                                </Text>
                            </View>
                        ))
                    )}
                </DashboardCard>
                {/* HOLIDAYS CARD */}
                <DashboardCard
                    title={`Holidays In (${cardTitleSuffix})`}
                    seeMore
                    onSeeMorePress={() => router.push("/screens/employee_holidays")}
                >
                    <View style={[styles.tableRow, { borderBottomWidth: 2, borderBottomColor: colors.primary }]}>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Date</Text>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Holiday</Text>
                        <Text style={[styles.tableHeader, dynamicStyles.textSub]}>Type</Text>
                    </View>

                    {loadingHolidays ? (
                        <Text style={[{ textAlign: "center", marginVertical: 16 }, dynamicStyles.textSub]}>
                            Loading holidays...
                        </Text>
                    ) : holidays.filter(h => {
                        const date = parseLocalDate(h.date);
                        return (filterMonth === null || date.getMonth() === filterMonth) &&
                            (filterYear === null || date.getFullYear() === filterYear);
                    }).slice(0, 5).map((holiday, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={[styles.tableText, dynamicStyles.textMain]}>
                                {new Date(holiday.date).toLocaleDateString()}
                            </Text>
                            <Text style={[styles.tableText, dynamicStyles.textMain]}>
                                {holiday.title}
                            </Text>
                            <Text style={[styles.tableText, dynamicStyles.textMain]}>
                                {holiday.type === 1 ? "National" : "Religious"}
                            </Text>
                        </View>
                    ))}
                </DashboardCard>
            </ScrollView>

            <EmployeeBottomTabBar activeTab="home" />
        </SafeAreaView>
    );
}

// StatCard, InfoCard, TableRow, DashboardCard, styles, createDynamicStyles remain unchanged
// (you can copy them directly from your original file)

function StatCard({ title, value, icon, dynamicStyles }: any) {
    return (
        <View style={[styles.statCard, dynamicStyles.card]}>
            <MaterialIcons name={icon} size={20} color={dynamicStyles.textPrimary.color} />
            <Text style={[styles.statValue, dynamicStyles.textMain]}>{value}</Text>
            <Text style={[styles.statTitle, dynamicStyles.textSub]}>{title}</Text>
        </View>
    )
}

function InfoCard({ label, value, dynamicStyles }: any) {
    return (
        <View style={[styles.infoCard, dynamicStyles.card]}>
            <Text style={[styles.infoValue, dynamicStyles.textMain]}>{value}</Text>
            <Text style={[styles.infoLabel, dynamicStyles.textSub]}>{label}</Text>
        </View>
    )
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

    cardRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12
    },

    statCard: {
        flex: 1,
        backgroundColor: "#1e293b",
        padding: 16,
        borderRadius: 10,
        marginHorizontal: 4
    },

    statValue: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "700",
        marginTop: 6
    },

    statTitle: {
        color: "#94a3b8",
        fontSize: 12
    },

    section: {
        marginTop: 20
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

    infoCard: {
        flex: 1,
        backgroundColor: "#1e293b",
        padding: 16,
        borderRadius: 10,
        marginHorizontal: 4
    },

    infoValue: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700"
    },

    infoLabel: {
        color: "#94a3b8",
        fontSize: 12
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