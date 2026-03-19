// services/payrollHistory.ts
import { API_BASE_URL } from './Config';
import { SessionManager } from './SessionManager';
export interface PayslipAPI {
  id: number;
  periodLabel: string;
  payrollMonth: number;   // ✅ add
  payrollYear: number;    // ✅ add
  basicSalary: number;
  allowanceEducation?: number;
  allowanceMedical?: number;
  allowanceFuel?: number;
  allowanceHouseRent?: number;
  allowanceMaintenance?: number;
  allowanceGate?: number;
  allowanceMobile?: number;
  allowanceTransport?: number;
  allowanceMeal?: number;
  allowanceOther?: number;
  shortTimeDeduction?: number;
  leavesDeduction?: number;
  loanDeduction?: number;
  advanceDeduction?: number;
  status: string;
  currencySymbol: string;   // ✅ add
  payDateISO: string;       // ✅ add
}

export interface Payslip {
  id: number;
  periodLabel: string;
  payrollMonth: number;   // ✅ add
  payrollYear: number;    // ✅ add
  basicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netPay: number;
  status: 'PAID' | 'UNPAID';
  currencySymbol: string;   // ✅ add
  payDateISO: string;       // ✅ add
}

export const fetchPayrollRecords = async (): Promise<Payslip[]> => {
  try {
    const user = await SessionManager.getUser();
    if (!user || !user.employeeId) {
      throw new Error('No employeeId in session');
    }

    // Backend endpoint that filters by employeeId via query string
    const url = `${API_BASE_URL}/payroll-records?employeeId=${encodeURIComponent(
      String(user.employeeId),
    )}`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    const data: PayslipAPI[] = await res.json();

    return data.map((item) => {
      const totalAllowances =
        (item.allowanceEducation || 0) +
        (item.allowanceMedical || 0) +
        (item.allowanceFuel || 0) +
        (item.allowanceHouseRent || 0) +
        (item.allowanceMaintenance || 0) +
        (item.allowanceGate || 0) +
        (item.allowanceMobile || 0) +
        (item.allowanceTransport || 0) +
        (item.allowanceMeal || 0) +
        (item.allowanceOther || 0);

      const totalDeductions =
        (item.shortTimeDeduction || 0) +
        (item.leavesDeduction || 0) +
        (item.loanDeduction || 0) +
        (item.advanceDeduction || 0);

      return {
        id: item.id,
        periodLabel: item.periodLabel,
        payrollMonth: item.payrollMonth,   // ✅ add
        payrollYear: item.payrollYear,     // ✅ add
        basicSalary: item.basicSalary,
        totalAllowances,
        totalDeductions,
        netPay: item.basicSalary + totalAllowances - totalDeductions,
        status: item.status.toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID',
        currencySymbol: '₨',
        payDateISO: new Date(item.payrollYear, item.payrollMonth - 1, 1).toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    throw error;
  }
};