import * as XLSX from 'xlsx';
import { AllMonthsData, MonthData } from '../types';
import { calculateTotalDuration, formatTotalMinutes } from './timeCalculator';

/**
 * Export overall 12-month report into a styled Excel workbook (.xlsx)
 */
export function exportOverallExcelReport(allMonthsData: AllMonthsData): void {
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: OVERALL ANNUAL SUMMARY ---
  const summaryRows: any[] = [
    ['TIME CALCULATOR - OVERALL ANNUAL REPORT'],
    ['Generated Date', new Date().toLocaleDateString()],
    [''],
    ['Month', 'Total Days Logged', 'Total Duration (HH:MM)', 'Total Minutes'],
  ];

  let grandTotalMinutesAllYear = 0;

  Object.entries(allMonthsData).forEach(([monthName, monthObj]) => {
    const dailyEntries = monthObj.dailyEntries || {};
    const loggedDaysCount = Object.keys(dailyEntries).length;

    let monthTotalMin = 0;
    Object.values(dailyEntries).forEach((dayRec) => {
      const totals = calculateTotalDuration(dayRec.sections);
      monthTotalMin += totals.totalMinutes;
    });

    grandTotalMinutesAllYear += monthTotalMin;

    summaryRows.push([
      monthName,
      loggedDaysCount,
      formatTotalMinutes(monthTotalMin),
      monthTotalMin,
    ]);
  });

  summaryRows.push(['']);
  summaryRows.push([
    'GRAND TOTAL (ALL MONTHS)',
    '',
    formatTotalMinutes(grandTotalMinutesAllYear),
    grandTotalMinutesAllYear,
  ]);

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Annual Summary');

  // --- SHEET 2: ALL DAILY LOGS (DATE 1 TO 31 ACROSS ALL MONTHS) ---
  const detailRows: any[] = [
    [
      'Month',
      'Date #',
      'Full Date',
      'Section 1 Start',
      'Section 1 End',
      'Sec 1 Duration',
      'Section 2 Start',
      'Section 2 End',
      'Sec 2 Duration',
      'Section 3 Start',
      'Section 3 End',
      'Sec 3 Duration',
      'Section 4 Start',
      'Section 4 End',
      'Sec 4 Duration',
      'Day Total Duration',
      'Balance OT',
      'Saved At',
    ],
  ];

  Object.entries(allMonthsData).forEach(([monthName, monthObj]) => {
    const dailyEntries = monthObj.dailyEntries || {};
    const sortedDays = Object.values(dailyEntries).sort((a, b) => a.dayNumber - b.dayNumber);

    sortedDays.forEach((dayRec) => {
      const s1 = dayRec.sections[0] || { startTime: '', startPeriod: 'AM', endTime: '', endPeriod: 'PM' };
      const s2 = dayRec.sections[1] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' };
      const s3 = dayRec.sections[2] || { startTime: '', startPeriod: 'AM', endTime: '', endPeriod: 'PM' };
      const s4 = dayRec.sections[3] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' };

      const s1Start = s1.startTime ? `${s1.startTime} ${s1.startPeriod}` : '-';
      const s1End = s1.endTime ? `${s1.endTime} ${s1.endPeriod}` : '-';

      const s2Start = s2.startTime ? `${s2.startTime} ${s2.startPeriod}` : '-';
      const s2End = s2.endTime ? `${s2.endTime} ${s2.endPeriod}` : '-';

      const s3Start = s3.startTime ? `${s3.startTime} ${s3.startPeriod}` : '-';
      const s3End = s3.endTime ? `${s3.endTime} ${s3.endPeriod}` : '-';

      const s4Start = s4.startTime ? `${s4.startTime} ${s4.startPeriod}` : '-';
      const s4End = s4.endTime ? `${s4.endTime} ${s4.endPeriod}` : '-';

      const totals = calculateTotalDuration(dayRec.sections);

      detailRows.push([
        monthName,
        dayRec.dayNumber,
        dayRec.date,
        s1Start,
        s1End,
        dayRec.durations[0] || '00 H 00 M',
        s2Start,
        s2End,
        dayRec.durations[1] || '00 H 00 M',
        s3Start,
        s3End,
        dayRec.durations[2] || '00 H 00 M',
        s4Start,
        s4End,
        dayRec.durations[3] || '00 H 00 M',
        dayRec.totalDuration,
        dayRec.otDuration || totals.otFormatted,
        dayRec.savedAt || '-',
      ]);
    });
  });

  const detailSheet = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, detailSheet, 'All Daily Entries');

  // Save workbook file
  const fileName = `Time_Calculator_Overall_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export current month report to Excel (.xlsx)
 */
export function exportMonthExcelReport(monthName: string, monthObj: MonthData): void {
  const wb = XLSX.utils.book_new();

  const dailyEntries = monthObj.dailyEntries || {};
  const sortedDays = Object.values(dailyEntries).sort((a, b) => a.dayNumber - b.dayNumber);

  const monthRows: any[] = [
    [`TIME CALCULATOR - ${monthName} REPORT`],
    ['Month', monthName],
    ['Report Date', new Date().toLocaleDateString()],
    [''],
    [
      'Date #',
      'Full Date',
      'Section 1 Start',
      'Section 1 End',
      'Sec 1 Duration',
      'Section 2 Start',
      'Section 2 End',
      'Sec 2 Duration',
      'Section 3 Start',
      'Section 3 End',
      'Sec 3 Duration',
      'Section 4 Start',
      'Section 4 End',
      'Sec 4 Duration',
      'Day Total Duration',
      'Balance OT',
      'Saved At',
    ],
  ];

  let totalMonthMinutes = 0;
  let totalMonthOtMinutes = 0;

  sortedDays.forEach((dayRec) => {
    const s1 = dayRec.sections[0] || { startTime: '', startPeriod: 'AM', endTime: '', endPeriod: 'PM' };
    const s2 = dayRec.sections[1] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' };
    const s3 = dayRec.sections[2] || { startTime: '', startPeriod: 'AM', endTime: '', endPeriod: 'PM' };
    const s4 = dayRec.sections[3] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' };

    const s1Start = s1.startTime ? `${s1.startTime} ${s1.startPeriod}` : '-';
    const s1End = s1.endTime ? `${s1.endTime} ${s1.endPeriod}` : '-';

    const s2Start = s2.startTime ? `${s2.startTime} ${s2.startPeriod}` : '-';
    const s2End = s2.endTime ? `${s2.endTime} ${s2.endPeriod}` : '-';

    const s3Start = s3.startTime ? `${s3.startTime} ${s3.startPeriod}` : '-';
    const s3End = s3.endTime ? `${s3.endTime} ${s3.endPeriod}` : '-';

    const s4Start = s4.startTime ? `${s4.startTime} ${s4.startPeriod}` : '-';
    const s4End = s4.endTime ? `${s4.endTime} ${s4.endPeriod}` : '-';

    const totals = calculateTotalDuration(dayRec.sections);
    totalMonthMinutes += totals.totalMinutes;
    totalMonthOtMinutes += totals.otMinutes;

    monthRows.push([
      dayRec.dayNumber,
      dayRec.date,
      s1Start,
      s1End,
      dayRec.durations[0] || '00 H 00 M',
      s2Start,
      s2End,
      dayRec.durations[1] || '00 H 00 M',
      s3Start,
      s3End,
      dayRec.durations[2] || '00 H 00 M',
      s4Start,
      s4End,
      dayRec.durations[3] || '00 H 00 M',
      dayRec.totalDuration,
      dayRec.otDuration || totals.otFormatted,
      dayRec.savedAt || '-',
    ]);
  });

  monthRows.push(['']);
  monthRows.push([
    'TOTAL MONTH DURATION',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    formatTotalMinutes(totalMonthMinutes),
    formatTotalMinutes(totalMonthOtMinutes),
  ]);

  const monthSheet = XLSX.utils.aoa_to_sheet(monthRows);
  XLSX.utils.book_append_sheet(wb, monthSheet, `${monthName} Log`);

  const fileName = `Time_Calculator_${monthName}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
