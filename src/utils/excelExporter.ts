import ExcelJS from 'exceljs';
import { AllMonthsData, DayRecord, MonthData } from '../types';
import { calculateTotalDuration, formatTotalMinutes } from './timeCalculator';
import { getDaysInMonth, getYearFromDate, isSunday } from './dateUtils';
import { createEmptyTimeEntry, MONTHS } from './storage';

// Helper to trigger browser file download from an ExcelJS buffer
async function saveWorkbookToDownload(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

// Border styles
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

const headerBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'medium', color: { argb: 'FF0F172A' } },
  left: { style: 'thin', color: { argb: 'FF334155' } },
  bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
  right: { style: 'thin', color: { argb: 'FF334155' } },
};

/**
 * Export current month report to a beautifully designed & colored Excel workbook (.xlsx)
 */
export async function exportMonthExcelReport(monthName: string, monthObj: MonthData): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Salary Calculator App';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`${monthName} Report`, {
    views: [{ showGridLines: true }],
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

  // 1. Title Banner (Rows 1 & 2)
  worksheet.mergeCells('A1:Q1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `⏱ SALARY CALCULATOR — MONTHLY REPORT (${monthName.toUpperCase()})`;
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Deep Slate Navy
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 40;

  // Subtitle / Info bar (Row 2)
  worksheet.mergeCells('A2:Q2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = `Month: ${monthName}   |   Logged Days: ${sortedDays.length}/31   |   Total Hours: ${formatTotalMinutes(totalMonthMinutes)}   |   Total OT: ${formatTotalMinutes(totalMonthOtMinutes)}   |   Exported: ${new Date().toLocaleDateString()}`;
  subtitleCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF065F46' } };
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD1FAE5' }, // Soft Emerald Mint
  };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 24;

  // Blank spacing row 3
  worksheet.getRow(3).height = 10;

  // 2. Table Column Headers (Row 4)
  const headers = [
    'Day',
    'Date',
    'Sec 1 In',
    'Sec 1 Out',
    'Sec 1 Dur',
    'Sec 2 In',
    'Sec 2 Out',
    'Sec 2 Dur',
    'Sec 3 In',
    'Sec 3 Out',
    'Sec 3 Dur',
    'Sec 4 In',
    'Sec 4 Out',
    'Sec 4 Dur',
    'Day Total',
    'Total OT',
    'Saved At',
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.height = 28;
  headers.forEach((h, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = headerBorder;

    // Special header colors for key metrics
    if (h === 'Day Total') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Dark Slate
    } else if (h === 'Total OT') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } }; // Deep Emerald
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; // Slate Gray
    }
  });

  // 3. Data Rows (Row 5 onwards)
  let currentRowIndex = 5;

  sortedDays.forEach((dayRec, idx) => {
    const s1 = dayRec.sections[0] || { startTime: '', startPeriod: 'AM', endTime: '', endPeriod: 'PM' };
    const s2 = dayRec.sections[1] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' };
    const s3 = dayRec.sections[2] || { startTime: '', startPeriod: 'AM', endTime: '', endPeriod: 'PM' };
    const s4 = dayRec.sections[3] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' };

    const s1In = s1.startTime ? `${s1.startTime} ${s1.startPeriod}` : '-';
    const s1Out = s1.endTime ? `${s1.endTime} ${s1.endPeriod}` : '-';

    const s2In = s2.startTime ? `${s2.startTime} ${s2.startPeriod}` : '-';
    const s2Out = s2.endTime ? `${s2.endTime} ${s2.endPeriod}` : '-';

    const s3In = s3.startTime ? `${s3.startTime} ${s3.startPeriod}` : '-';
    const s3Out = s3.endTime ? `${s3.endTime} ${s3.endPeriod}` : '-';

    const s4In = s4.startTime ? `${s4.startTime} ${s4.startPeriod}` : '-';
    const s4Out = s4.endTime ? `${s4.endTime} ${s4.endPeriod}` : '-';

    const totals = calculateTotalDuration(dayRec.sections);
    const isEven = idx % 2 === 0;
    const isSun = isSunday(dayRec.dayNumber, monthName, getYearFromDate(monthObj.date));

    const row = worksheet.getRow(currentRowIndex);
    row.height = 22;

    const dateFormatted = isSun ? `${dayRec.date} (Sunday - Holiday)` : dayRec.date;

    const rowData = [
      dayRec.dayNumber,
      dateFormatted,
      s1In,
      s1Out,
      dayRec.durations[0] || '00 H 00 M',
      s2In,
      s2Out,
      dayRec.durations[1] || '00 H 00 M',
      s3In,
      s3Out,
      dayRec.durations[2] || '00 H 00 M',
      s4In,
      s4Out,
      dayRec.durations[3] || '00 H 00 M',
      dayRec.totalDuration,
      dayRec.otDuration || totals.otFormatted,
      dayRec.savedAt || '-',
    ];

    rowData.forEach((val, colIdx) => {
      const colNum = colIdx + 1;
      const cell = row.getCell(colNum);
      cell.value = val;
      cell.font = { name: 'Arial', size: 9.5 };
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', horizontal: colIdx === 1 ? 'left' : 'center' };

      // Base background: Soft rose tint for Sunday Holiday, otherwise Zebra striping
      const defaultBg = isSun ? 'FFFFF1F2' : isEven ? 'FFFFFFFF' : 'FFF8FAFC';
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: defaultBg } };

      // Highlight Day Number
      if (colIdx === 0) {
        cell.font = {
          name: 'Arial',
          size: 9.5,
          bold: true,
          color: { argb: isSun ? 'FFE11D48' : 'FF0F172A' },
        };
      }

      // If Sunday Holiday, format date text slightly in rose
      if (colIdx === 1 && isSun) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFBE123C' } };
      }

      // Highlight Total Duration (Col 15)
      if (colIdx === 14) {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      }

      // Highlight Total OT (Col 16)
      if (colIdx === 15) {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF166534' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light Green Badge
      }
    });

    currentRowIndex++;
  });

  // Spacing row
  worksheet.getRow(currentRowIndex).height = 8;
  currentRowIndex++;

  // 4. Grand Total Summary Row
  const summaryRow = worksheet.getRow(currentRowIndex);
  summaryRow.height = 30;

  worksheet.mergeCells(`A${currentRowIndex}:N${currentRowIndex}`);
  const summaryLabel = worksheet.getCell(`A${currentRowIndex}`);
  summaryLabel.value = `GRAND TOTAL FOR ${monthName.toUpperCase()}:`;
  summaryLabel.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  summaryLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  summaryLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

  const totalMinCell = summaryRow.getCell(15);
  totalMinCell.value = formatTotalMinutes(totalMonthMinutes);
  totalMinCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  totalMinCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totalMinCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  totalMinCell.border = headerBorder;

  const totalOtCell = summaryRow.getCell(16);
  totalOtCell.value = formatTotalMinutes(totalMonthOtMinutes);
  totalOtCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  totalOtCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totalOtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
  totalOtCell.border = headerBorder;

  const endCell = summaryRow.getCell(17);
  endCell.value = '';
  endCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

  // Set explicit clean column widths
  const columnWidths = [7, 16, 11, 11, 13, 11, 11, 13, 11, 11, 13, 11, 11, 13, 15, 15, 12];
  columnWidths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w;
  });

  const fileName = `Time_Calculator_${monthName}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  await saveWorkbookToDownload(workbook, fileName);
}

/**
 * Export overall 12-month report into a styled Excel workbook (.xlsx)
 */
export async function exportOverallExcelReport(allMonthsData: AllMonthsData): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Salary Calculator App';
  workbook.created = new Date();

  // --- SHEET 1: OVERALL ANNUAL SUMMARY ---
  const summarySheet = workbook.addWorksheet('Annual Summary', {
    views: [{ showGridLines: true }],
  });

  summarySheet.mergeCells('A1:E1');
  const title = summarySheet.getCell('A1');
  title.value = '⏱ SALARY CALCULATOR — ANNUAL SUMMARY (ALL 12 MONTHS)';
  title.font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 36;

  const summaryHeaders = ['Month', 'Days Logged', 'Total Duration (HH:MM)', 'Total OT', 'Total Minutes'];
  const sHeadRow = summarySheet.getRow(3);
  sHeadRow.height = 26;
  summaryHeaders.forEach((h, idx) => {
    const cell = sHeadRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.border = headerBorder;
  });

  let grandTotalMinutesAllYear = 0;
  let grandTotalOtAllYear = 0;
  let sRowIdx = 4;

  Object.entries(allMonthsData).forEach(([monthName, monthObj], idx) => {
    const dailyEntries = monthObj.dailyEntries || {};
    const loggedDaysCount = Object.keys(dailyEntries).length;

    let monthTotalMin = 0;
    let monthOtMin = 0;
    Object.values(dailyEntries).forEach((dayRec) => {
      const totals = calculateTotalDuration(dayRec.sections);
      monthTotalMin += totals.totalMinutes;
      monthOtMin += totals.otMinutes;
    });

    grandTotalMinutesAllYear += monthTotalMin;
    grandTotalOtAllYear += monthOtMin;

    const row = summarySheet.getRow(sRowIdx);
    row.height = 22;
    const isEven = idx % 2 === 0;
    const bg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    [
      monthName,
      loggedDaysCount,
      formatTotalMinutes(monthTotalMin),
      formatTotalMinutes(monthOtMin),
      monthTotalMin,
    ].forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', horizontal: colIdx === 0 ? 'left' : 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };

      if (colIdx === 0) cell.font = { bold: true };
      if (colIdx === 2) cell.font = { bold: true, color: { argb: 'FF0F172A' } };
      if (colIdx === 3) {
        cell.font = { bold: true, color: { argb: 'FF166534' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
      }
    });

    sRowIdx++;
  });

  // Grand Total Row
  const gRow = summarySheet.getRow(sRowIdx + 1);
  gRow.height = 28;
  gRow.getCell(1).value = 'ANNUAL GRAND TOTAL';
  gRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  gRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

  gRow.getCell(3).value = formatTotalMinutes(grandTotalMinutesAllYear);
  gRow.getCell(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  gRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
  gRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

  gRow.getCell(4).value = formatTotalMinutes(grandTotalOtAllYear);
  gRow.getCell(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  gRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
  gRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };

  [18, 16, 26, 20, 16].forEach((w, i) => {
    summarySheet.getColumn(i + 1).width = w;
  });

  const fileName = `Time_Calculator_Overall_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  await saveWorkbookToDownload(workbook, fileName);
}
