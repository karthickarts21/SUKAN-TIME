import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthData, DayRecord, SalarySettings } from '../types';
import { calculateTotalDuration, formatTotalMinutes } from './timeCalculator';
import { getDaysInMonth, getYearFromDate, isSunday } from './dateUtils';
import { createEmptyTimeEntry, MONTHS } from './storage';
import { calculateMonthlySalary } from './salaryCalculator';

export async function exportMonthPdfReport(monthName: string, monthObj: MonthData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const year = getYearFromDate(monthObj.date);
  const daysInMonth = getDaysInMonth(monthName, year);
  const mIdx = MONTHS.indexOf(monthName as any);
  const mStr = (mIdx >= 0 ? mIdx + 1 : 1).toString().padStart(2, '0');

  // Include all logged days + all Sundays even if unlogged
  const allRecordsMap: Record<number, DayRecord> = { ...(monthObj.dailyEntries || {}) };
  for (let d = 1; d <= daysInMonth; d++) {
    if (isSunday(d, monthName, year) && !allRecordsMap[d]) {
      const dStr = d.toString().padStart(2, '0');
      allRecordsMap[d] = {
        dayNumber: d,
        date: `${year}-${mStr}-${dStr}`,
        sections: [
          createEmptyTimeEntry(0),
          createEmptyTimeEntry(1),
          createEmptyTimeEntry(2),
          createEmptyTimeEntry(3),
        ],
        durations: ['-', '-', '-', '-'],
        totalDuration: '-',
        otDuration: '-',
        savedAt: '',
        isHoliday: true,
      };
    }
  }

  const sortedDays = (Object.values(allRecordsMap) as DayRecord[]).sort(
    (a, b) => a.dayNumber - b.dayNumber
  );

  let totalMonthMinutes = 0;
  let totalMonthOtMinutes = 0;

  // Only sum actual logged days
  Object.values(monthObj.dailyEntries || {}).forEach((dayRec) => {
    const totals = calculateTotalDuration(dayRec.sections);
    totalMonthMinutes += totals.totalMinutes;
    totalMonthOtMinutes += totals.otMinutes;
  });

  // Header banner
  doc.setFillColor(15, 23, 42); // Dark slate (#0f172a)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`TIME CALCULATOR — MONTHLY REPORT: ${monthName.toUpperCase()} ${year}`, 40, 36);

  // Subtitle info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()} | Logged Days: ${sortedDays.length}/31`, 40, 50);

  // Summary Metrics Bar
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, 75, doc.internal.pageSize.getWidth() - 80, 40, 4, 4, 'F');

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL WORKING HOURS:', 55, 98);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text(formatTotalMinutes(totalMonthMinutes), 200, 98);

  doc.setTextColor(6, 95, 70);
  doc.setFontSize(10);
  doc.text('TOTAL OVERTIME (OT):', 310, 98);
  doc.setFontSize(12);
  doc.text(formatTotalMinutes(totalMonthOtMinutes), 450, 98);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.text(`DAYS LOGGED: ${sortedDays.length}`, 570, 98);

  // Table Data
  const tableRows = sortedDays.map((dayRec) => {
    const totals = calculateTotalDuration(dayRec.sections);
    const isSun = isSunday(dayRec.dayNumber, monthName, year);

    const s1 = dayRec.sections[0] || { startTime: '', startPeriod: 'AM', endTime: '', endPeriod: 'PM' };
    const s2 = dayRec.sections[1] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' };
    const s3 = dayRec.sections[2] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' };
    const s4 = dayRec.sections[3] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' };

    const fmtSession = (s: typeof s1, dur: string) => {
      if (!s.startTime && !s.endTime) return '-';
      return `${s.startTime}${s.startPeriod}-${s.endTime}${s.endPeriod} (${dur})`;
    };

    return [
      dayRec.dayNumber.toString(),
      isSun ? `${dayRec.date} (Sun - Holiday)` : dayRec.date,
      fmtSession(s1, dayRec.durations[0]),
      fmtSession(s2, dayRec.durations[1]),
      fmtSession(s3, dayRec.durations[2]),
      fmtSession(s4, dayRec.durations[3]),
      totals.totalFormatted,
      totals.otFormatted,
    ];
  });

  // Table headers
  const tableHeaders = [
    'Day',
    'Date',
    'Morning (S1)',
    'Afternoon (S2)',
    'Evening (S3)',
    'Overtime (S4)',
    'Total Hours',
    'Total OT',
  ];

  autoTable(doc, {
    startY: 130,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 35 },
      1: { halign: 'left', cellWidth: 100 },
      2: { halign: 'center', cellWidth: 120 },
      3: { halign: 'center', cellWidth: 120 },
      4: { halign: 'center', cellWidth: 120 },
      5: { halign: 'center', cellWidth: 120 },
      6: { halign: 'center', fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 65 },
      7: { halign: 'center', fontStyle: 'bold', textColor: [4, 120, 87], cellWidth: 65 },
    },
    foot: [
      [
        '',
        'GRAND TOTAL:',
        '',
        '',
        '',
        '',
        formatTotalMinutes(totalMonthMinutes),
        formatTotalMinutes(totalMonthOtMinutes),
      ],
    ],
    footStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9.5,
      halign: 'center',
    },
    didParseCell: (data) => {
      // Highlight Sunday rows in table
      if (data.section === 'body') {
        const row = sortedDays[data.row.index];
        if (row && isSunday(row.dayNumber, monthName, year)) {
          data.cell.styles.fillColor = [255, 241, 242]; // Light rose
          if (data.column.index === 1) {
            data.cell.styles.textColor = [190, 18, 60]; // Rose 700
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
  });

  // Footer note
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Time Calculator · Powered by Karthi Designer | Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 15,
      { align: 'center' }
    );
  }

  const fileName = `Time_Calculator_${monthName}_Report_${year}.pdf`;
  doc.save(fileName);
}

/**
 * Generates and downloads a clean, professional Salary Payslip PDF
 */
export async function exportSalarySlipPdf(
  monthName: string,
  monthObj: MonthData,
  settings: SalarySettings
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const salaryCalc = calculateMonthlySalary(monthName, monthObj, settings);
  const pageWidth = doc.internal.pageSize.getWidth();
  const year = salaryCalc.year;

  // Header Banner
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SALARY PAYSLIP', 40, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`Pay Period: ${monthName.toUpperCase()} ${year} | BroTime Salary Calculator`, 40, 52);

  // Attendance & Days Overview Bar
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 80, pageWidth - 80, 52, 6, 6, 'FD');
  doc.setDrawColor(226, 232, 240);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('WORKING DAYS', 55, 100);
  doc.text('PRESENT', 160, 100);
  doc.text('LEAVE', 250, 100);
  doc.text('HALF DAYS', 330, 100);
  doc.text('LOGGED DAYS', 430, 100);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${salaryCalc.workingDays}`, 55, 120);

  doc.setTextColor(4, 120, 87); // Emerald
  doc.text(`${salaryCalc.presentDays}`, 160, 120);

  doc.setTextColor(salaryCalc.leaveDays > 0 ? 225 : 15, salaryCalc.leaveDays > 0 ? 29 : 23, salaryCalc.leaveDays > 0 ? 72 : 42);
  doc.text(`${salaryCalc.leaveDays}`, 250, 120);

  doc.setTextColor(15, 23, 42);
  doc.text(`${salaryCalc.halfDaysCount}`, 330, 120);

  doc.setTextColor(51, 65, 85);
  doc.text(`${salaryCalc.loggedDaysCount} / ${salaryCalc.totalDays}`, 430, 120);

  // Earnings & Deductions Table
  const earningsRows = [
    ['Basic Salary (Earned)', `Rs. ${salaryCalc.earnedBasicSalary.toLocaleString()}`],
    ['Early Arrival Incentive', `Rs. ${salaryCalc.earlyIncentive.toLocaleString()}`],
    [`Bill Incentive (${salaryCalc.autoBillCount} bills @ Rs. 30)`, `Rs. ${salaryCalc.billIncentive.toLocaleString()}`],
    ['Leave Attendance Incentive', `Rs. ${salaryCalc.leaveIncentive.toLocaleString()}`],
    [`Overtime (OT) Incentive (${(salaryCalc.totalOtMinutes / 60).toFixed(1)} hrs)`, `Rs. ${salaryCalc.otIncentive.toLocaleString()}`],
  ];

  const deductionsRows = [
    ['Provident Fund (PF)', `Rs. ${salaryCalc.pf.toLocaleString()}`],
    ['Employee State Insurance (ESI)', `Rs. ${salaryCalc.esi.toLocaleString()}`],
    ['Salary Advance', `Rs. ${salaryCalc.advance.toLocaleString()}`],
    ['Half Day Deductions', `Rs. ${salaryCalc.halfDayDeduction.toLocaleString()}`],
    ['Other Deductions', `Rs. ${salaryCalc.otherDeduction.toLocaleString()}`],
  ];

  const maxRows = Math.max(earningsRows.length, deductionsRows.length);
  const combinedRows = [];

  for (let i = 0; i < maxRows; i++) {
    const earn = earningsRows[i] || ['', ''];
    const ded = deductionsRows[i] || ['', ''];
    combinedRows.push([earn[0], earn[1], ded[0], ded[1]]);
  }

  autoTable(doc, {
    startY: 145,
    margin: { left: 40, right: 40 },
    theme: 'grid',
    head: [
      [
        { content: 'EARNINGS & INCENTIVES', colSpan: 2, styles: { halign: 'left', fillColor: [6, 78, 59] } },
        { content: 'DEDUCTIONS', colSpan: 2, styles: { halign: 'left', fillColor: [159, 18, 57] } },
      ],
      ['Description', 'Amount', 'Description', 'Amount'],
    ],
    headStyles: {
      fontSize: 9,
      fontStyle: 'bold',
      textColor: [255, 255, 255],
    },
    body: combinedRows,
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
      cellPadding: 6,
    },
    columnStyles: {
      0: { cellWidth: 165 },
      1: { cellWidth: 90, halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] },
      2: { cellWidth: 165 },
      3: { cellWidth: 95, halign: 'right', fontStyle: 'bold', textColor: [190, 18, 60] },
    },
    foot: [
      [
        'TOTAL GROSS EARNINGS:',
        `Rs. ${salaryCalc.totalEarnings.toLocaleString()}`,
        'TOTAL DEDUCTIONS:',
        `Rs. ${salaryCalc.totalDeductions.toLocaleString()}`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9.5,
      halign: 'right',
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // Net Salary Highlight Box
  doc.setFillColor(15, 23, 42); // Dark slate
  doc.roundedRect(40, finalY, pageWidth - 80, 55, 6, 6, 'F');

  doc.setTextColor(52, 211, 153); // Emerald 400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NET PAYABLE SALARY', 55, finalY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('(Total Earnings - Total Deductions)', 55, finalY + 38);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(52, 211, 153);
  doc.text(`Rs. ${salaryCalc.netSalary.toLocaleString()}`, pageWidth - 55, finalY + 36, { align: 'right' });

  // Bank Transfer and Cash Breakdown Box
  const payoutY = finalY + 68;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, payoutY, pageWidth - 80, 40, 4, 4, 'FD');
  doc.setDrawColor(226, 232, 240);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161); // Sky
  doc.text('BANK TRANSFER PAYOUT:', 55, payoutY + 24);
  doc.setFontSize(12);
  doc.text(`Rs. ${salaryCalc.bankTransferAmount.toLocaleString()}`, 215, payoutY + 24);

  doc.setFontSize(9);
  doc.setTextColor(4, 120, 87); // Emerald
  doc.text('CASH IN HAND BALANCE:', 340, payoutY + 24);
  doc.setFontSize(12);
  doc.text(`Rs. ${salaryCalc.cashInHandAmount.toLocaleString()}`, 490, payoutY + 24);

  // Signatures
  const signY = payoutY + 85;
  doc.setDrawColor(203, 213, 225);
  doc.line(60, signY, 220, signY);
  doc.line(pageWidth - 220, signY, pageWidth - 60, signY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Employee Signature', 140, signY + 14, { align: 'center' });
  doc.text('Authorized Signature (HR / Employer)', pageWidth - 140, signY + 14, { align: 'center' });

  // Page footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `BroTime Salary Calculator · Generated on ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 20,
    { align: 'center' }
  );

  const fileName = `Salary_Slip_${monthName}_${year}.pdf`;
  doc.save(fileName);
}
