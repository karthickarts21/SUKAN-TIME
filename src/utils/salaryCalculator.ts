import { DayRecord, MonthData, SalarySettings, MonthSalaryCalculation } from '../types';
import { getDaysInMonth, getMonthIndex, getYearFromDate } from './dateUtils';
import { calculateTotalDuration, formatTotalMinutes } from './timeCalculator';

export const SALARY_SETTINGS_KEY = 'BROTIME_SALARY_SETTINGS';

export const DEFAULT_SALARY_SETTINGS: SalarySettings = {
  basicSalary: 0,
  dailyDutyHours: '08:30',
  weeklyOff: 'Sunday',
  overtimeMultiplier: 1,
  defaultPf: 0,
  defaultEsi: 0,
  defaultAdvance: 0,
  defaultOtherDeduction: 0,
  bankTransferAmount: 0,
  bankTransferMode: 'basic',
};

/**
 * Loads salary settings from localStorage or returns defaults
 */
export function loadSalarySettings(): SalarySettings {
  try {
    const raw = localStorage.getItem(SALARY_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SALARY_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      basicSalary: typeof parsed.basicSalary === 'number' && !isNaN(parsed.basicSalary) && parsed.basicSalary >= 0
        ? parsed.basicSalary
        : 0,
      dailyDutyHours: typeof parsed.dailyDutyHours === 'string' && parsed.dailyDutyHours.trim()
        ? parsed.dailyDutyHours.trim()
        : '08:30',
      weeklyOff: typeof parsed.weeklyOff === 'string' && parsed.weeklyOff.trim()
        ? parsed.weeklyOff.trim()
        : 'Sunday',
      overtimeMultiplier: typeof parsed.overtimeMultiplier === 'number' && parsed.overtimeMultiplier > 0
        ? parsed.overtimeMultiplier
        : 1,
      defaultPf: typeof parsed.defaultPf === 'number' && !isNaN(parsed.defaultPf) && parsed.defaultPf >= 0
        ? parsed.defaultPf
        : 0,
      defaultEsi: typeof parsed.defaultEsi === 'number' && !isNaN(parsed.defaultEsi) && parsed.defaultEsi >= 0
        ? parsed.defaultEsi
        : 0,
      defaultAdvance: typeof parsed.defaultAdvance === 'number' && !isNaN(parsed.defaultAdvance) && parsed.defaultAdvance >= 0
        ? parsed.defaultAdvance
        : 0,
      defaultOtherDeduction: typeof parsed.defaultOtherDeduction === 'number' && !isNaN(parsed.defaultOtherDeduction) && parsed.defaultOtherDeduction >= 0
        ? parsed.defaultOtherDeduction
        : 0,
      bankTransferAmount: typeof parsed.bankTransferAmount === 'number' && !isNaN(parsed.bankTransferAmount) && parsed.bankTransferAmount >= 0
        ? parsed.bankTransferAmount
        : (typeof parsed.basicSalary === 'number' && parsed.basicSalary > 0 ? parsed.basicSalary : 0),
      bankTransferMode: parsed.bankTransferMode || 'basic',
    };
  } catch (err) {
    console.error('Failed to load salary settings', err);
    return { ...DEFAULT_SALARY_SETTINGS };
  }
}

/**
 * Saves salary settings to localStorage
 */
export function saveSalarySettings(settings: SalarySettings): void {
  try {
    localStorage.setItem(SALARY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save salary settings', err);
  }
}

/**
 * Converts "HH:MM" (e.g. "08:30") to total minutes (e.g. 510)
 */
export function parseDutyHoursToMinutes(dutyHoursStr: string): number {
  if (!dutyHoursStr) return 510;
  const parts = dutyHoursStr.split(':');
  if (parts.length === 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }
  const num = parseFloat(dutyHoursStr);
  if (!isNaN(num)) {
    return Math.round(num * 60);
  }
  return 510; // default 8.5 hours
}

/**
 * Converts "HH:MM" (e.g. "08:30") to decimal hours (e.g. 8.5)
 */
export function parseDutyHoursToDecimal(dutyHoursStr: string): number {
  const mins = parseDutyHoursToMinutes(dutyHoursStr);
  return Number((mins / 60).toFixed(2));
}

/**
 * Day name to day-of-week index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDayOfWeekIndex(dayName: string): number {
  const map: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };
  const key = dayName.toLowerCase().trim();
  return map[key] !== undefined ? map[key] : 0; // default Sunday (0)
}

/**
 * Counts how many weekly off days exist in the given month and year
 */
export function countWeeklyOffDaysInMonth(
  monthName: string,
  year: number,
  weeklyOffDayName: string = 'Sunday'
): number {
  const totalDays = getDaysInMonth(monthName, year);
  const mIdx = getMonthIndex(monthName);
  const targetDayIdx = getDayOfWeekIndex(weeklyOffDayName);

  let count = 0;
  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(year, mIdx, d);
    if (dt.getDay() === targetDayIdx) {
      count++;
    }
  }
  return count;
}

/**
 * Calculates complete HR salary breakdown for a given month
 */
export function calculateMonthlySalary(
  monthName: string,
  monthObj: MonthData,
  settings: SalarySettings
): MonthSalaryCalculation {
  const year = getYearFromDate(monthObj.date);
  const totalDays = getDaysInMonth(monthName, year);
  const weeklyOffDay = settings.weeklyOff || 'Sunday';
  const weeklyOffCount = countWeeklyOffDaysInMonth(monthName, year, weeklyOffDay);

  const mIdx = getMonthIndex(monthName);
  const targetDayIdx = getDayOfWeekIndex(weeklyOffDay);

  // Manual Holidays: exclude from working days if not already falling on a weekly off day
  const manualHolidaysList = Array.isArray(monthObj.manualHolidays) ? monthObj.manualHolidays : [];
  const manualHolidaySet = new Set(manualHolidaysList);

  let nonOffManualHolidays = 0;
  for (const d of manualHolidaysList) {
    if (d >= 1 && d <= totalDays) {
      const dt = new Date(year, mIdx, d);
      if (dt.getDay() !== targetDayIdx) {
        nonOffManualHolidays++;
      }
    }
  }

  const workingDays = Math.max(1, totalDays - weeklyOffCount - nonOffManualHolidays);

  const basicSalary = typeof settings.basicSalary === 'number' && settings.basicSalary > 0 ? settings.basicSalary : 0;
  const perDaySalary = workingDays > 0 ? Number((basicSalary / workingDays).toFixed(2)) : 0;
  const dutyMins = parseDutyHoursToMinutes(settings.dailyDutyHours || '08:30');
  const dailyDutyHoursDecimal = Number((dutyMins / 60).toFixed(2));
  const perHourRate = dailyDutyHoursDecimal > 0 ? Number((perDaySalary / dailyDutyHoursDecimal).toFixed(2)) : 0;

  const dailyEntries = monthObj.dailyEntries || {};
  const entriesList = Object.values(dailyEntries) as DayRecord[];
  const loggedDaysCount = entriesList.length;

  let totalWorkedMinutes = 0;
  let totalOtMinutes = 0;
  let presentDays = 0;
  let holidayWorkedDays = 0;
  let halfDaysCount = 0;
  let autoEarlyIncentive = 0;

  const halfDutyMinsThreshold = Math.floor(dutyMins / 2); // e.g. 255 mins (4h 15m) for 8.5h duty

  for (const entry of entriesList) {
    const totals = calculateTotalDuration(entry.sections);
    totalWorkedMinutes += totals.totalMinutes;
    totalOtMinutes += totals.otMinutes;

    // Sum automated early arrival / late departure incentive from daily records
    if (entry.earlyIncentive !== undefined) {
      autoEarlyIncentive += entry.earlyIncentive;
    }

    // Check if this day is a weekly off day or a manual holiday
    const dt = new Date(year, mIdx, entry.dayNumber);
    const isOffDay = dt.getDay() === targetDayIdx || manualHolidaySet.has(entry.dayNumber);

    if (totals.totalMinutes > 0) {
      if (!isOffDay) {
        presentDays++;
        if (totals.totalMinutes < halfDutyMinsThreshold) {
          halfDaysCount++;
        }
      } else {
        // Employee worked on Holiday / Sunday: Count as extra worked day salary
        holidayWorkedDays++;
      }
    }
  }

  const leaveDays = Math.max(0, workingDays - presentDays);

  // Business Rule: If employee attends ALL working days (Leave == 0), give 2 days salary incentive
  const isLeaveIncentiveEligible = leaveDays === 0 && workingDays > 0 && presentDays >= workingDays;
  const leaveIncentive = isLeaveIncentiveEligible ? Number((perDaySalary * 2).toFixed(2)) : 0;

  // Holiday Worked Salary: When time is added on Sunday or Holiday, add that day's salary to Earnings
  const holidayWorkedSalary = Number((holidayWorkedDays * perDaySalary).toFixed(2));

  // Early Incentive
  const isEarlyIncentiveManual = monthObj.salaryData?.earlyIncentiveManual !== undefined;
  const earlyIncentive = isEarlyIncentiveManual
    ? monthObj.salaryData!.earlyIncentiveManual!
    : autoEarlyIncentive;

  // Requirement: Bill Incentive: NUMBER (TYPE PANRA MARI) x 30 = TOTAL
  const billCount =
    typeof monthObj.salaryData?.billCount === 'number'
      ? monthObj.salaryData.billCount
      : typeof monthObj.billCount === 'number'
      ? monthObj.billCount
      : typeof monthObj.salaryData?.billIncentiveManual === 'number'
      ? Math.round(monthObj.salaryData.billIncentiveManual / 30)
      : 0;

  const billIncentive = billCount * 30;
  const autoBillCount = billCount;
  const autoBillIncentive = billIncentive;

  const multiplier = settings.overtimeMultiplier && settings.overtimeMultiplier > 0 ? settings.overtimeMultiplier : 1;
  const otHoursDecimal = totalOtMinutes / 60;
  const otIncentive = Number((otHoursDecimal * perHourRate * multiplier).toFixed(2));

  // Earned Basic Salary (Regular earned salary + extra Holiday worked salary)
  const earnedRegularSalary = presentDays >= workingDays
    ? basicSalary
    : Number((presentDays * perDaySalary).toFixed(2));
  
  const earnedBasicSalary = Number((earnedRegularSalary + holidayWorkedSalary).toFixed(2));

  // Total Earnings
  const totalEarnings = Number(
    (earnedBasicSalary + earlyIncentive + billIncentive + leaveIncentive + otIncentive).toFixed(2)
  );

  // Requirement: "DEDUCTIONS" la PF, ESI settings la mattum thaa edit panra mari venum
  // PF & ESI are configured strictly in Settings!
  const defaultPf = settings.defaultPf ?? 0;
  const defaultEsi = settings.defaultEsi ?? 0;
  const pf = defaultPf;
  const esi = defaultEsi;
  const isPfDefault = true;
  const isEsiDefault = true;

  const defaultAdvance = settings.defaultAdvance ?? 0;
  const defaultOtherDeduction = settings.defaultOtherDeduction ?? 0;

  const isAdvanceDefault = monthObj.salaryData?.advance === undefined;
  const advance = !isAdvanceDefault ? monthObj.salaryData!.advance! : defaultAdvance;

  const isOtherDeductionDefault = monthObj.salaryData?.otherDeduction === undefined;
  const otherDeduction = !isOtherDeductionDefault ? monthObj.salaryData!.otherDeduction! : defaultOtherDeduction;

  const halfDayDeduction = Number((halfDaysCount * (perDaySalary / 2)).toFixed(2));

  const totalDeductions = Number(
    (pf + esi + advance + halfDayDeduction + otherDeduction).toFixed(2)
  );

  // Net Salary
  const netSalary = Number((totalEarnings - totalDeductions).toFixed(2));

  // Bank Transfer & Cash in Hand Split:
  // "ethukkunna Basic salary mattum Bank transfer pannuvanga, balace Cash in Hand tharuvanga"
  let bankTransfer = 0;
  if (monthObj.salaryData?.bankTransferAmount !== undefined) {
    bankTransfer = monthObj.salaryData.bankTransferAmount;
  } else if (typeof settings.bankTransferAmount === 'number' && settings.bankTransferAmount > 0) {
    bankTransfer = settings.bankTransferAmount;
  } else {
    // Default is Basic Salary (or earned basic salary), capped at netSalary
    bankTransfer = earnedBasicSalary;
  }

  // Ensure bankTransfer does not exceed netSalary if netSalary > 0
  if (netSalary > 0 && bankTransfer > netSalary) {
    bankTransfer = netSalary;
  } else if (netSalary <= 0) {
    bankTransfer = 0;
  }

  const bankTransferAmount = Number(bankTransfer.toFixed(2));
  const cashInHandAmount = Number(Math.max(0, netSalary - bankTransferAmount).toFixed(2));

  return {
    monthName,
    year,
    totalDays,
    weeklyOffCount,
    workingDays,
    presentDays,
    leaveDays,
    halfDaysCount,
    holidayWorkedDays,
    holidayWorkedSalary,
    basicSalary,
    perDaySalary,
    dailyDutyHoursDecimal,
    perHourRate,
    loggedDaysCount,
    totalWorkedMinutes,
    totalWorkedFormatted: formatTotalMinutes(totalWorkedMinutes),
    totalOtMinutes,
    totalOtFormatted: formatTotalMinutes(totalOtMinutes),

    // Earnings
    earnedBasicSalary,
    earlyIncentive,
    autoEarlyIncentive,
    isEarlyIncentiveAuto: !isEarlyIncentiveManual,
    billCount,
    billIncentive,
    autoBillIncentive,
    autoBillCount,
    isBillIncentiveAuto: false,
    leaveIncentive,
    isLeaveIncentiveEligible,
    otIncentive,
    totalEarnings,

    // Deductions
    pf,
    isPfDefault,
    defaultPf,
    esi,
    isEsiDefault,
    defaultEsi,
    advance,
    isAdvanceDefault,
    defaultAdvance,
    halfDayDeduction,
    otherDeduction,
    isOtherDeductionDefault,
    defaultOtherDeduction,
    totalDeductions,

    // Final Net & Split
    netSalary,
    bankTransferAmount,
    cashInHandAmount,
  };
}
