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
import { LineChart, PieChart } from "react-native-chart-kit";
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

    const [displayName, setDisplayName] = useState('');


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
                const correctedLogs = logs.map((log) => ({
                    workDate: log.logTime,
                    logTime: log.logTime,
                    modeLabel: log.inOutMode === 0 ? "CheckIn" : "CheckOut",
                    status: "Pending",
                }));
                setAttendanceLogs(correctedLogs);
            } catch (err) {
                console.error("Failed to fetch attendance logs:", err);
            } finally {
                setLoadingLogs(false);
            }
        };
        fetchAttendanceLogs();
    }, [user]);

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
    }, [user]);

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
            const lastOut = [...sorted].reverse().find(l => l.mode === "CheckOut");

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
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isSunday = date.getDay() === 0;
            const isHoliday = holidaysList.some(h => parseLocalDate(h.date).toDateString() === date.toDateString());
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

    const SHIFT_START_HOUR = 9;   // 9:00 AM
    const SHIFT_END_HOUR = 18;    // 5:00 PM

    //calculate shift stats

    const calculateShiftStats = () => {
        let onTimeCount = 0;
        let lateCount = 0;
        let earlyCount = 0;

        const grouped: Record<string, any[]> = {};

        filteredAttendanceLogs.forEach((log) => {
            const dateObj = parseLocalDate(log.logTime);

            // Skip if not in selected month/year
            if (dateObj.getMonth() !== filterMonth || dateObj.getFullYear() !== filterYear) return;

            // Skip Sundays and holidays
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

            if (!firstIn || !lastOut) return;

            // Check-in analysis
            if (firstIn.time.getHours() < SHIFT_START_HOUR ||
                (firstIn.time.getHours() === SHIFT_START_HOUR && firstIn.time.getMinutes() === 0)
            ) {
                onTimeCount++;
            } else {
                lateCount++;
            }

            // Check-out analysis
            if (lastOut.time.getHours() < SHIFT_END_HOUR) {
                earlyCount++;
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

        const grouped: Record<number, any[]> = {}; // use timestamp as key

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
                const logs = grouped[ts].sort((a, b) => a.time.getTime() - b.time.getTime());
                const firstIn = logs.find(l => l.mode === "CheckIn");
                const lastOut = [...logs].reverse().find(l => l.mode === "CheckOut");
                if (!firstIn || !lastOut) return;

                const diffMinutes = (lastOut.time.getTime() - firstIn.time.getTime()) / 60000;
                if (diffMinutes <= 0) return;
                hours.push(Number((diffMinutes / 60).toFixed(2)));

                const dayNumber = new Date(ts).getDate();
                labels.push(dayNumber.toString()); // horizontal label = day of month

                totalMinutes += diffMinutes;
            });

        return {
            labels,
            hours,
            totalHours: (totalMinutes / 60).toFixed(2),
        };
    };

    const { labels: dailyLabels, hours: dailyHours, totalHours } =
        calculateDailyWorkHours();

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
                <View style={styles.header}>
                    <Text style={[styles.title, dynamicStyles.title]}>
                        {displayName && `Welcome Back, ${displayName} 👋`}
                    </Text>
                    <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
                        Here's what's happening with your work profile today.
                    </Text>
                </View>

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
                    <View style={styles.dailyWorkHeader}>
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                            Daily Work Hours
                        </Text>
                        <Text style={[styles.totalHours, dynamicStyles.textMain]}>
                            {totalHours} TOTAL HOURS
                        </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ alignItems: "center" }}>
                            <LineChart
                                data={{
                                    labels: dailyLabels, // use as-is
                                    datasets: [
                                        { data: dailyHours, color: () => colors.primary, strokeWidth: 2 }
                                    ],
                                }}
                                width={Math.max(screenWidth, dailyLabels.length * 40)} // dynamic width
                                height={180}
                                fromZero
                                withDots={true}
                                withShadow={false}
                                withVerticalLines={false}
                                chartConfig={{
                                    backgroundGradientFrom: colors.background,
                                    backgroundGradientTo: colors.background,
                                    decimalPlaces: 1,
                                    color: () => colors.primary,
                                    labelColor: () => colors.textSub,
                                    propsForDots: { r: "3", strokeWidth: "2", stroke: colors.primary },
                                    propsForBackgroundLines: { stroke: "#334155", strokeDasharray: "" },
                                }}
                                style={{ borderRadius: 10, marginVertical: 8 }}
                            />
                        </View>
                    </ScrollView>
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
                    onSeeMorePress={() => router.push("/screens/holidays")}
                >                    {/* Header Row */}
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