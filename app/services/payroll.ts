import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './Config';
import { SessionManager } from './SessionManager';

export type PayrollId = string;
export type EmployeeId = string;

export interface PayrollEmployee {
  id: EmployeeId;
  name: string;
  designation: string;
  department: string;
  employeeCode: string;
  salary: number; // Added from API
}

export interface SalaryProfile {
  employeeId: EmployeeId;
  currencySymbol: string; // e.g. "₨" or "$"
  // Fixed monthly earnings
  basic: number;
  hra: number;
  allowance: number;
  // Fixed monthly deductions
  providentFund: number;
  professionalTax: number;
}

export interface PayrollEmployeeInput {
  // Monthly variables (can differ employee-wise, month-wise)
  employeeId?: string; // Added for API payload
  bonus: number;
  overtimeHours: number;
  overtimeRate: number;
  otherEarnings: number;
  unpaidLeaveDaysOverride: number; // Renamed from unpaidLeaveDays to match API
  tax: number;
  loan: number;
  otherDeductions: number;
  remarks?: string;
}

export interface Payslip {
  id: PayrollId;
  runId: PayrollId;
  employeeId: EmployeeId;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  periodYear: number;
  periodMonth: number; // 0-11
  payDateISO: string;
  createdAtISO: string;
  currencySymbol: string;
  earnings: {
    basic: number;
    hra: number;
    allowance: number;
    bonus: number;
    overtime: number;
    otherEarnings: number;
  };
  deductions: {
    providentFund: number;
    professionalTax: number;
    tax: number;
    loan: number;
    unpaidLeaveDeduction: number;
    otherDeductions: number;
  };
  totals: {
    totalEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  notes?: string;
}

export interface PayrollRun {
  id: PayrollId;
  periodYear: number;
  periodMonth: number; // 0-11
  payDateISO: string;
  createdAtISO: string;
  status: 'Processed' | 'Paid';
  employeeCount: number;
  totalNetPay: number;
  notes?: string;
  paidAtUtc?: string;
}

const PAYROLL_RUNS_KEY = 'payroll_runs_v1';
const PAYSLIPS_KEY = 'payslips_v1';
const SALARY_PROFILES_KEY = 'salary_profiles_v1';

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(amount: number, currency = '₨'): string {
  // Simple formatter
  return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCompactMoney(amount: number, currency = '₨'): string {
  if (amount >= 10000000) return `${currency}${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 1000000) return `${currency}${(amount / 1000000).toFixed(2)} M`;
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(1)} k`;
  return formatMoney(amount, currency);
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Fetch employees from the backend API
 */
export async function getPayrollEmployees(): Promise<PayrollEmployee[]> {
  try {
    const token = await SessionManager.getToken();
    if (!token) return [];

    const response = await fetch(`${API_BASE_URL}/employees`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch employees:', response.status);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((emp: any) => ({
      id: emp.id,
      name: emp.fullName || `${emp.firstName} ${emp.lastName}`,
      designation: emp.designation || 'N/A',
      department: emp.department || 'N/A',
      employeeCode: emp.employeeCode || '',
      salary: safeNumber(emp.salary)
    }));
  } catch (error) {
    console.error('getPayrollEmployees error:', error);
    return [];
  }
}

/**
 * Get salary profiles. 
 * Since we now fetch real salary from API, we'll generate profile wrappers around that salary.
 * We can still overlay local overrides if needed, but for now we rely on the employee.salary
 */
export async function getSalaryProfiles(employees: PayrollEmployee[]): Promise<Record<EmployeeId, SalaryProfile>> {
  // We can fetch local overrides if they exist
  const raw = await AsyncStorage.getItem(SALARY_PROFILES_KEY);
  let localProfiles: Record<string, SalaryProfile> = {};
  if (raw) {
    try {
      localProfiles = JSON.parse(raw);
    } catch { }
  }

  const result: Record<EmployeeId, SalaryProfile> = {};

  for (const emp of employees) {
    if (localProfiles[emp.id]) {
      result[emp.id] = localProfiles[emp.id];
    } else {
      // Create default profile from API data
      // Assuming 'salary' is the TOTAL fixed monthly salary.
      // We can split it or just put it in basic. Putting in basic for simplicity.
      result[emp.id] = {
        employeeId: emp.id,
        currencySymbol: '₨',
        basic: emp.salary,
        hra: 0,
        allowance: 0,
        providentFund: 0,
        professionalTax: 0
      };
    }
  }

  return result;
}

export async function upsertSalaryProfile(profile: SalaryProfile): Promise<void> {
  const raw = await AsyncStorage.getItem(SALARY_PROFILES_KEY);
  let existing: Record<string, SalaryProfile> = {};
  if (raw) {
    try {
      existing = JSON.parse(raw);
    } catch { }
  }
  existing[profile.employeeId] = profile;
  await AsyncStorage.setItem(SALARY_PROFILES_KEY, JSON.stringify(existing));
}

// Deprecated or can be removed if not used, kept for compatibility
export async function ensureSeedSalaryProfiles(): Promise<void> {
  // No-op now as we use dynamic data
}

export function computePayslipTotals(args: {
  employee: PayrollEmployee;
  profile: SalaryProfile;
  input: PayrollEmployeeInput;
  periodYear: number;
  periodMonth: number;
}): Omit<Payslip, 'id' | 'runId' | 'createdAtISO' | 'payDateISO' | 'notes'> {
  const { employee, profile, input, periodYear, periodMonth } = args;

  const overtime = safeNumber(input.overtimeHours) * safeNumber(input.overtimeRate);
  const fixedEarnings = safeNumber(profile.basic) + safeNumber(profile.hra) + safeNumber(profile.allowance);
  const variableEarnings =
    safeNumber(input.bonus) + overtime + safeNumber(input.otherEarnings);

  const totalEarnings = fixedEarnings + variableEarnings;

  // Simple pro-rate for unpaid leaves: monthly fixed earnings / days in month * unpaidLeaveDays
  const dim = daysInMonth(periodYear, periodMonth);
  const unpaidLeaveDeduction = dim > 0 ? (fixedEarnings / dim) * safeNumber(input.unpaidLeaveDaysOverride) : 0;

  const totalDeductions =
    safeNumber(profile.providentFund) +
    safeNumber(profile.professionalTax) +
    safeNumber(input.tax) +
    safeNumber(input.loan) +
    unpaidLeaveDeduction +
    safeNumber(input.otherDeductions);

  const netPay = totalEarnings - totalDeductions;

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    employeeCode: employee.employeeCode,
    designation: employee.designation,
    department: employee.department,
    periodYear,
    periodMonth,
    currencySymbol: profile.currencySymbol || '₨',
    earnings: {
      basic: safeNumber(profile.basic),
      hra: safeNumber(profile.hra),
      allowance: safeNumber(profile.allowance),
      bonus: safeNumber(input.bonus),
      overtime,
      otherEarnings: safeNumber(input.otherEarnings),
    },
    deductions: {
      providentFund: safeNumber(profile.providentFund),
      professionalTax: safeNumber(profile.professionalTax),
      tax: safeNumber(input.tax),
      loan: safeNumber(input.loan),
      unpaidLeaveDeduction,
      otherDeductions: safeNumber(input.otherDeductions),
    },
    totals: {
      totalEarnings,
      totalDeductions,
      netPay,
    },
  };
}

// ... existing imports ...
// make sure API_BASE_URL is imported

export interface PayrollHistoryItem {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  basicSalary: number;
  presentDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  deductions: number;
  netSalary: number;
  processedAtUtc: string;
  paidAtUtc?: string;
  employee: any | null;
}

export interface PayrollRunResponse {
  id: string;
  periodYear: number;
  periodMonth: number;
  payDate: string | null;
  status: string;
  employeeCount: number;
  totalNetPay: number;
  createdAtUtc: string;
  paidAtUtc: string | null;
}

export async function getPayrollHistory(): Promise<PayrollRunResponse[]> {
  try {
    const token = await SessionManager.getToken();
    if (!token) return [];

    const response = await fetch(`${API_BASE_URL}/payroll/history`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch payroll history:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('getPayrollHistory error:', error);
    return [];
  }
}

/**
 * Lists "Runs" by mapping the API response to PayrollRun objects.
 */
export async function listPayrollRuns(): Promise<PayrollRun[]> {
  try {
    const history = await getPayrollHistory();

    return history.map(run => ({
      id: run.id,
      periodYear: run.periodYear,
      periodMonth: run.periodMonth - 1, // API is 1-based, App uses 0-based
      payDateISO: run.paidAtUtc || run.payDate || run.createdAtUtc,
      createdAtISO: run.createdAtUtc,
      status: run.status as any,
      employeeCount: run.employeeCount,
      totalNetPay: run.totalNetPay,
      notes: undefined,
      paidAtUtc: run.paidAtUtc || undefined // Add this property to PayrollRun interface if valid
    })).sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime());

  } catch (error) {
    console.error('listPayrollRuns error:', error);
    return [];
  }
}

export async function getPayrollRunDetails(year: number, month: number): Promise<PayrollHistoryItem[]> {
  try {
    const token = await SessionManager.getToken();
    if (!token) return [];

    const response = await fetch(`${API_BASE_URL}/admin/payroll/history`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.filter((p: any) => p.year === year && p.month === month + 1);
      }
    }

    return [];
  } catch (error) {
    return [];
  }
}

// Deprecated local storage methods kept for compatibility but effectively replaced by API calls for read operations where applicable
// Note: listPayslips and others might need similar updates if used heavily, but let's focus on the User Request.

export async function listPayslips(): Promise<Payslip[]> {
  // If we want to fully switch to API, we should map history items to Payslips.
  // However, Payslip interface is complex. For now, let's just make sure the history screen works.
  // The user asked for history fetch.
  const raw = await AsyncStorage.getItem(PAYSLIPS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getPayslipById(id: PayrollId): Promise<Payslip | null> {
  const slips = await listPayslips();
  return slips.find((s) => s.id === id) || null;
}

export async function listPayslipsForEmployee(employeeId: EmployeeId): Promise<Payslip[]> {
  // TODO: Implement API call for individual employee history when endpoint is known.
  // The global getPayrollHistory() now returns run summaries, so filtering it for employees is not possible without fetching details for each run.

  // fetch from local storage for now
  const slips = await listPayslips();
  return slips
    .filter((s) => s.employeeId === employeeId)
    .sort((a, b) => (a.payDateISO < b.payDateISO ? 1 : -1));
}

export async function markPayrollRunAsPaid(year: number, month: number, paidAtUtc: string): Promise<boolean> {
  try {
    const token = await SessionManager.getToken();
    if (!token) return false;

    const monthNum = month + 1;
    const monthStr = monthNum.toString().padStart(2, '0');
    const runId = `run_${year}_${monthStr}`;

    // Note: User specified /api/payroll/history... (without admin)
    const response = await fetch(`${API_BASE_URL}/payroll/history/${runId}/mark-paid`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paidAtUtc })
    });

    if (!response.ok) {
      console.error('markPayrollRunAsPaid failed', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error('markPayrollRunAsPaid error', error);
    return false;
  }
}

export async function markEmployeePayrollAsPaid(employeeId: string, paidAtUtc: string): Promise<boolean> {
  try {
    const token = await SessionManager.getToken();
    if (!token) return false;

    // Note: User specified /api/payroll/employee... (without admin)
    const response = await fetch(`${API_BASE_URL}/payroll/employee/${employeeId}/mark-paid`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paidAtUtc })
    });

    if (!response.ok) {
      console.error('markEmployeePayrollAsPaid failed', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error('markEmployeePayrollAsPaid error', error);
    return false;
  }
}

// ... rest of the file (processPayrollRun) ...


/**
 * PROCESS PAYROLL RUN - API INTEGRATION
 */
export async function processPayrollRun(args: {
  periodYear: number;
  periodMonth: number;
  payDateISO: string;
  notes?: string;
  employeeInputs: Record<EmployeeId, PayrollEmployeeInput>;
  forceReprocess?: boolean;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await SessionManager.getToken();
    if (!token) throw new Error('Authentication required');

    // Build the payload for the API
    // Need to convert inputs map to array
    const employeesPayload = Object.entries(args.employeeInputs).map(([empId, input]) => ({
      employeeId: empId,
      bonus: safeNumber(input.bonus),
      otherEarnings: safeNumber(input.otherEarnings),
      overtimeHours: safeNumber(input.overtimeHours),
      overtimeRate: safeNumber(input.overtimeRate),
      unpaidLeaveDaysOverride: safeNumber(input.unpaidLeaveDaysOverride),
      tax: safeNumber(input.tax),
      loan: safeNumber(input.loan),
      otherDeductions: safeNumber(input.otherDeductions),
      remarks: input.remarks || args.notes // Use specific remark or general note if empty
    }));

    const payload = {
      year: args.periodYear,
      month: args.periodMonth + 1, // API likely expects 1-12 based on common conventions, JS is 0-11
      payDate: args.payDateISO,
      employees: employeesPayload,
      forceReprocess: args.forceReprocess || false
    };

    console.log('Submitting Payroll:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${API_BASE_URL}/admin/payroll/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payroll API Error:', errorText);
      throw new Error(`Failed to process payroll: ${response.status} ${errorText}`);
    }

    // Success - we might want to store a local record too for immediate UI feedback 
    // before we have a GET history endpoint
    const employees = await getPayrollEmployees();
    const profiles = await getSalaryProfiles(employees);

    // Create local artifacts purely for the "Payroll History" screen to work 
    // until a GET history endpoint is available
    const runId = makeId('run');
    const createdAtISO = new Date().toISOString();

    // Calculate totals for local display
    let totalNet = 0;
    const payslips: Payslip[] = employees.map(emp => {
      const input = args.employeeInputs[emp.id] || {
        bonus: 0,
        otherEarnings: 0,
        overtimeHours: 0,
        overtimeRate: 0,
        unpaidLeaveDaysOverride: 0,
        tax: 0,
        loan: 0,
        otherDeductions: 0,
        remarks: ''
      };

      const computed = computePayslipTotals({
        employee: emp,
        profile: profiles[emp.id],
        input,
        periodYear: args.periodYear,
        periodMonth: args.periodMonth
      });
      totalNet += computed.totals.netPay;
      return {
        id: makeId('slip'),
        runId,
        payDateISO: args.payDateISO,
        createdAtISO,
        notes: input.remarks,
        ...computed
      };
    });

    const run: PayrollRun = {
      id: runId,
      periodYear: args.periodYear,
      periodMonth: args.periodMonth,
      payDateISO: args.payDateISO,
      createdAtISO,
      status: 'Processed',
      employeeCount: employees.length,
      totalNetPay: totalNet,
      notes: args.notes
    };

    const existingRuns = await listPayrollRuns();
    await AsyncStorage.setItem(PAYROLL_RUNS_KEY, JSON.stringify([run, ...existingRuns]));

    const existingPayslips = await listPayslips();
    await AsyncStorage.setItem(PAYSLIPS_KEY, JSON.stringify([...payslips, ...existingPayslips]));

    return { success: true };

  } catch (error: any) {
    console.error('processPayrollRun error:', error);
    throw error;
  }
}


