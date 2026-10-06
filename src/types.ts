export type Period = 'AM' | 'PM';

export interface TimeEntry {
  startTime: string; // "HH:MM" format e.g. "09:00"
  startPeriod: Period;
  endTime: string;   // "HH:MM" format e.g. "06:30"
  endPeriod: Period;
}

export interface DayRecord {
  date: string;
  dayNumber: number;
  sections: [TimeEntry, TimeEntry, TimeEntry, TimeEntry];
  durations: [string, string, string, string];
  totalDuration: string;
  otDuration?: string;
  savedAt: string;
  isHoliday?: boolean;
  earlyIncentive?: number;
  billCount?: number;
  billIncentive?: number;
}

export interface MonthSalaryData {
  earlyIncentiveManual?: number; // Manual entry e.g. 500
  billIncentiveManual?: number;  // Direct manual entry if any
  billCount?: number;           // Number of bills for the month: number x 30 = Total
  pf?: number;                   // Manual entry e.g. 1800
  esi?: number;                  // Manual entry e.g. 500
  advance?: number;              // Manual entry e.g. 2000
  otherDeduction?: number;       // Manual entry e.g. 0
  bankTransferAmount?: number;  // Optional month-level override
}

export interface MonthData {
  date: string;
  sections: [TimeEntry, TimeEntry, TimeEntry, TimeEntry];
  dailyEntries?: Record<number, DayRecord>; // 1 to 31
  lastSavedAt?: string;
  billCount?: number;
  salaryData?: MonthSalaryData;
  manualHolidays?: number[]; // [e.g. 15, 26] days manually marked as Holiday
}

export type AllMonthsData = Record<string, MonthData>;

export interface SalarySettings {
  basicSalary: number; // e.g. 25000 (editable)
  dailyDutyHours: string; // e.g. "08:30" (editable)
  weeklyOff: string; // e.g. "Sunday" (editable)
  overtimeMultiplier?: number; // e.g. 1
  defaultPf?: number;          // Default PF deduction
  defaultEsi?: number;         // Default ESI deduction
  defaultAdvance?: number;     // Default Advance deduction
  defaultOtherDeduction?: number; // Default Other deduction
  bankTransferAmount?: number; // Fixed/Default Bank Transfer amount e.g. 25000
  bankTransferMode?: 'basic' | 'fixed' | 'full'; // 'basic' = Transfer Basic Salary, 'fixed' = Fixed Amount, 'full' = Full Net
}

export interface MonthSalaryCalculation {
  monthName: string;
  year: number;
  totalDays: number;
  weeklyOffCount: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  halfDaysCount: number;
  holidayWorkedDays?: number;
  holidayWorkedSalary?: number;
  basicSalary: number;
  perDaySalary: number;
  dailyDutyHoursDecimal: number;
  perHourRate: number;
  loggedDaysCount: number;
  totalWorkedMinutes: number;
  totalWorkedFormatted: string;
  totalOtMinutes: number;
  totalOtFormatted: string;

  // Earnings
  earnedBasicSalary: number;
  earlyIncentive: number;
  autoEarlyIncentive: number;
  isEarlyIncentiveAuto: boolean;
  billCount: number;
  billIncentive: number;
  autoBillIncentive: number;
  autoBillCount: number;
  isBillIncentiveAuto: boolean;
  leaveIncentive: number;
  isLeaveIncentiveEligible: boolean;
  otIncentive: number;
  totalEarnings: number;

  // Deductions
  pf: number;
  isPfDefault: boolean;
  defaultPf: number;
  esi: number;
  isEsiDefault: boolean;
  defaultEsi: number;
  advance: number;
  isAdvanceDefault: boolean;
  defaultAdvance: number;
  halfDayDeduction: number;
  otherDeduction: number;
  isOtherDeductionDefault: boolean;
  defaultOtherDeduction: number;
  totalDeductions: number;
  hasLastDayEndTime?: boolean;
  appliedDeductions?: number;

  // Final Net & Split
  netSalary: number;
  bankTransferAmount: number;
  cashInHandAmount: number;
}

export interface AppStorage {
  selectedMonth: string;
  months: AllMonthsData;
  salarySettings?: SalarySettings;
}
