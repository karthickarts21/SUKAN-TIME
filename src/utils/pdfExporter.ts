import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthData, DayRecord } from '../types';
import { calculateTotalDuration, formatTotalMinutes } from './timeCalculator';
import { getDaysInMonth, getYearFromDate, isSunday } from './dateUtils';
import { createEmptyTimeEntry, MONTHS } from './storage';

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
