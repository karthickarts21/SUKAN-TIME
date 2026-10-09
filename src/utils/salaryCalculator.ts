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

  // Manual Unpaid Leaves marked explicitly by user
  const manualLeavesList = Array.isArray(monthObj.manualLeaves) ? monthObj.manualLeaves : [];
  const manualLeaveSet = new Set(manualLeavesList);

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
  const curDayNumber = parseInt(monthObj.date?.split('-')[2] || '0', 10);

  // Combine saved daily entries and current active session if active session has any times
  const activeEntriesMap: Record<number, DayRecord> = { ...dailyEntries };
  if (curDayNumber >= 1 && curDayNumber <= totalDays && !activeEntriesMap[curDayNumber] && monthObj.sections) {
    const hasActiveTimes = monthObj.sections.some(s => s.startTime && s.endTime);
    if (hasActiveTimes) {
      const activeCalc = calculateTotalDuration(monthObj.sections);
      activeEntriesMap[curDayNumber] = {
        date: `${monthName} Date ${curDayNumber}`,
        dayNumber: curDayNumber,
        sections: monthObj.sections,
        durations: activeCalc.durations,
        totalDuration: activeCalc.totalFormatted,
        otDuration: activeCalc.otFormatted,
        savedAt: '',
      };
    }
  }

  const entriesList = Object.values(activeEntriesMap) as DayRecord[];
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

    // Check if this day is a weekly off day or a manual holiday
    const dt = new Date(year, mIdx, entry.dayNumber);
    const isOffDay = dt.getDay() === targetDayIdx || manualHolidaySet.has(entry.dayNumber);

    // Requirement:
    // "Holiday or Sunday kku 'Early Incentive & OT Incentive' kidaiyathu, Ethavathu any Start & End Time irunthaley 1 day salary (Leave + Holiday Incentive) add aaganum"
    if (isOffDay) {
      const hasAnyTime = entry.sections.some(
        s => typeof s.startTime === 'string' && s.startTime.trim() !== '' && typeof s.endTime === 'string' && s.endTime.trim() !== ''
      );
      if (hasAnyTime || totals.totalMinutes > 0) {
        holidayWorkedDays++;
        totalWorkedMinutes += totals.totalMinutes;
        // NOTE: No OT and No Early Incentive added for Holiday / Sunday work!
      }
    } else {
      totalWorkedMinutes += totals.totalMinutes;
      totalOtMinutes += totals.otMinutes;

      // Sum automated early arrival / late departure incentive from daily records on regular working days only
      if (entry.earlyIncentive !== undefined) {
        autoEarlyIncentive += entry.earlyIncentive;
      }

      if (totals.totalMinutes > 0) {
        presentDays++;
        if (totals.totalMinutes < halfDutyMinsThreshold) {
          halfDaysCount++;
        }
      }
    }
  }

  // Check if the month's last date (e.g. 31 for Oct, 30 for Nov) has an End Time entered/logged
  const lastDayNumber = totalDays;
  const lastDayRecord = dailyEntries[lastDayNumber] || dailyEntries[String(lastDayNumber)];
  
  const activeSections = curDayNumber === lastDayNumber ? monthObj.sections : undefined;

  const hasLastDayEndTime = Boolean(
    (lastDayRecord?.sections && lastDayRecord.sections.some(s => typeof s.endTime === 'string' && s.endTime.trim() !== '')) ||
    (activeSections && activeSections.some(s => typeof s.endTime === 'string' && s.endTime.trim() !== ''))
  );

  // Count unworked manual unpaid leaves
  let manualUnpaidLeavesCount = 0;
  for (const d of manualLeavesList) {
    if (d >= 1 && d <= totalDays) {
      const dt = new Date(year, mIdx, d);
      const isOff = dt.getDay() === targetDayIdx || manualHolidaySet.has(d);
      if (!isOff) {
        const entry = dailyEntries[d] || dailyEntries[String(d)];
        const totals = entry ? calculateTotalDuration(entry.sections) : { totalMinutes: 0 };
        if (totals.totalMinutes === 0) {
          manualUnpaidLeavesCount++;
        }
      }
    }
  }

  // Business Rule:
  // "LEAVE INCENTIVE la 'Leave' la ipothai kku 0 kattanum, month oda lost la thaan Leave Calculation aaganum"
  // Manually marked Unpaid Leaves show immediately. At month end (hasLastDayEndTime), all unlogged working days are calculated.
  const leaveDays = hasLastDayEndTime
    ? Math.max(manualUnpaidLeavesCount, workingDays - presentDays)
    : manualUnpaidLeavesCount;

  // Business Rule: Tiered Leave + Holiday Incentive in EARNINGS
  // Requirement:
  // "Holiday mark pannirunthu & Sunday time add panniruntha 'EARNINGS' la irukka 'Leave Incentive' la
  // bonus 2 days + (Holiday or Sunday) salary add aaganum (2+1 or etc.),
  // and next 'EARNINGS' la irukka 'Leave Incentive' change to 'Leave + Holiday Incentive'"
  // Leave 0 => 2 Days Salary Bonus
  // Leave 1 => 1 Day Salary Bonus
  // Leave >= 2 => 0 Bonus
  // Plus: Extra days worked on Sunday or Marked Holiday (holidayWorkedDays)
  const leaveBonusDays = hasLastDayEndTime ? (leaveDays === 0 ? 2 : leaveDays === 1 ? 1 : 0) : 0;
  const totalLeaveHolidayDays = leaveBonusDays + holidayWorkedDays;
  const leaveHolidayIncentive = Number((totalLeaveHolidayDays * perDaySalary).toFixed(2));
  const leaveIncentive = leaveHolidayIncentive;
  const isLeaveIncentiveEligible = (hasLastDayEndTime && leaveDays <= 1 && workingDays > 0) || holidayWorkedDays > 0;

  // Holiday Worked Salary is now grouped directly in Leave + Holiday Incentive
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

  // Earned Basic Salary (Fixed Monthly Basic Salary)
  // Requirement:
  // "EARNINGS" Basic salary "daily Complete" aana Earnings kattanum, Full month leave, sunday, HOliday Poga Complete aana 2 days Leave naalum, Basic Salary la "Settings La Basic salary" thaa kattanum
  const progressiveEarned = Number((presentDays * perDaySalary).toFixed(2));
  const earnedRegularSalary = hasLastDayEndTime
    ? basicSalary
    : Math.min(basicSalary, progressiveEarned);
  const earnedBasicSalary = Number(earnedRegularSalary.toFixed(2));

  // Total Earnings
  const totalEarnings = Number(
    (earnedBasicSalary + earlyIncentive + billIncentive + leaveHolidayIncentive + otIncentive).toFixed(2)
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

  // Requirement:
  // "Day Selector la 'unpaid Leave' Add pannirunthalum 'DEDUCTIONS' la irukka 'Leave Incentive' la 3 days & Etc.... athukku mela 'Leave' nna (2 days Bonus) kalichi thaa 'DEDUCTIONS' la 'Leave Incentive' 1 day, Etc Salary - aaganum"
  // 2 days free bonus leave allowance subtracted from total leave days:
  // Leave 0 => 0 deducted (2 days bonus in EARNINGS)
  // Leave 1 => 0 deducted (1 day bonus in EARNINGS)
  // Leave 2 => 0 deducted (0 bonus in EARNINGS)
  // Leave 3 => (3 - 2) = 1 day salary deducted
  // Leave 4 => (4 - 2) = 2 days salary deducted
  const deductedLeaveDays = Math.max(0, leaveDays - 2);
  const autoLeaveDeduction = Number((deductedLeaveDays * perDaySalary).toFixed(2));
  const defaultOtherDeduction = autoLeaveDeduction;

  const isAdvanceDefault = monthObj.salaryData?.advance === undefined;
  const advance = !isAdvanceDefault ? monthObj.salaryData!.advance! : defaultAdvance;

  const isOtherDeductionDefault = monthObj.salaryData?.otherDeduction === undefined;
  const otherDeduction = !isOtherDeductionDefault ? monthObj.salaryData!.otherDeduction! : defaultOtherDeduction;

  const halfDayDeduction = Number((halfDaysCount * (perDaySalary / 2)).toFixed(2));

  const totalDeductions = Number(
    (pf + esi + advance + halfDayDeduction + otherDeduction).toFixed(2)
  );

  // Requirement:
  // Deductions are only subtracted from Net Salary when the month's last date has an end time!
  const appliedDeductions = hasLastDayEndTime ? totalDeductions : 0;

  // Net Salary
  const netSalary = Number(Math.max(0, totalEarnings - appliedDeductions).toFixed(2));

  // Bank Transfer & Cash in Hand Split:
  // Requirement:
  // "Earning la Kammiya Irunthalum, Bank Transfer la Setting la enna irukko athu apdi ye varanum, Yenna Earning ah vida Salary athikamanal, Cash in Hand la (-) la amound varanum"
  let bankTransfer = 0;
  let cashInHand = 0;

  if (hasLastDayEndTime) {
    // Priority: Whatever user configured in Settings for Bank Transfer comes directly
    if (typeof settings.bankTransferAmount === 'number' && settings.bankTransferAmount > 0) {
      bankTransfer = settings.bankTransferAmount;
    } else if (typeof settings.basicSalary === 'number' && settings.basicSalary > 0) {
      bankTransfer = settings.basicSalary;
    } else if (monthObj.salaryData?.bankTransferAmount !== undefined) {
      bankTransfer = monthObj.salaryData.bankTransferAmount;
    } else {
      bankTransfer = basicSalary;
    }

    // Cash in Hand: Net Salary (Total Earnings minus Deductions) minus Bank Transfer.
    // If Net Salary after deductions is less than Bank Transfer, it displays as negative (-) amount!
    cashInHand = netSalary - bankTransfer;
  } else {
    // Before month's last date end time, both Bank Transfer and Cash in Hand remain 0 / Pending
    bankTransfer = 0;
    cashInHand = 0;
  }

  const bankTransferAmount = Number(bankTransfer.toFixed(2));
  const cashInHandAmount = Number(cashInHand.toFixed(2));

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
    leaveHolidayIncentive,
    leaveBonusDays,
    deductedLeaveDays,
    totalLeaveHolidayDays,
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
    hasLastDayEndTime,
    appliedDeductions,

    // Final Net & Split
    netSalary,
    bankTransferAmount,
    cashInHandAmount,
  };
}
