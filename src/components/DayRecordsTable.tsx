import React, { useState } from 'react';
import { DayRecord, TimeEntry } from '../types';
import { calculateTotalDuration, formatTotalMinutes } from '../utils/timeCalculator';
import { getDaysInMonth, getYearFromDate, isSunday } from '../utils/dateUtils';
import { createEmptyTimeEntry, MONTHS } from '../utils/storage';
import {
  FileSpreadsheet,
  FileText,
  List,
  Trash2,
  Upload,
} from 'lucide-react';

interface DayRecordsTableProps {
  selectedMonth: string;
  dailyEntries: Record<number, DayRecord>;
  currentSections: [TimeEntry, TimeEntry, TimeEntry, TimeEntry];
  currentDate: string;
  onSaveDayRecord?: (dayNumber: number, record: DayRecord) => void;
  onDeleteDayRecord: (dayNumber: number) => void;
  onLoadDayRecordToSheet: (record: DayRecord) => void;
}

export const DayRecordsTable: React.FC<DayRecordsTableProps> = ({
  selectedMonth,
  dailyEntries,
  currentDate,
  onDeleteDayRecord,
  onLoadDayRecordToSheet,
}) => {
  const currentYear = getYearFromDate(currentDate);
  const daysInMonth = getDaysInMonth(selectedMonth, currentYear);
  const mIdx = MONTHS.indexOf(selectedMonth as any);
  const mStr = (mIdx >= 0 ? mIdx + 1 : 1).toString().padStart(2, '0');

  // Default to spreadsheet table view as requested
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Build the list of records:
  // All user-logged days + ALL Sundays in the month even if not logged!
  const allRecordsMap: Record<number, DayRecord> = { ...dailyEntries };

  for (let d = 1; d <= daysInMonth; d++) {
    if (isSunday(d, selectedMonth, currentYear) && !allRecordsMap[d]) {
      const dStr = d.toString().padStart(2, '0');
      allRecordsMap[d] = {
        dayNumber: d,
        date: `${currentYear}-${mStr}-${dStr}`,
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

  const displayedDaysList: DayRecord[] = (Object.values(allRecordsMap) as DayRecord[]).sort(
    (a, b) => a.dayNumber - b.dayNumber
  );

  const loggedCount = Object.keys(dailyEntries).length;

  const grandTotalMinutes = (Object.values(dailyEntries) as DayRecord[]).reduce(
    (acc: number, entry: DayRecord) => {
      const totals = calculateTotalDuration(entry.sections);
      return acc + totals.totalMinutes;
    },
    0
  );

  const grandTotalOtMinutes = (Object.values(dailyEntries) as DayRecord[]).reduce(
    (acc: number, entry: DayRecord) => {
      const totals = calculateTotalDuration(entry.sections);
      return acc + totals.otMinutes;
    },
    0
  );

  return (
    <aside className="w-full bg-white border border-neutral-200/90 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col h-full min-h-0 overflow-hidden">
      {/* HEADER */}
      <div className="pb-2.5 border-b border-neutral-100 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 leading-none">
                Monthly Daily Logs
              </h2>
              <span className="text-[11px] text-neutral-500 font-medium">
                {selectedMonth} · {loggedCount}/{daysInMonth} days logged
              </span>
            </div>
          </div>

          {/* VIEW SWITCHER */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200/60">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Compact list view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Spreadsheet table view"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SUMMARY STATS BADGES (Grand Total & Total OT) */}
        <div className="grid grid-cols-2 gap-2">
          {/* 1. Grand Total */}
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-2 sm:p-2.5 flex flex-col justify-center">
            <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-500 leading-tight">
              Grand Total
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm md:text-base text-neutral-900 tabular-nums mt-0.5">
              {formatTotalMinutes(grandTotalMinutes)}
            </span>
          </div>

          {/* 2. Total OT */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2 sm:p-2.5 flex flex-col justify-center">
            <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-800 leading-tight">
              Total OT
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm md:text-base text-emerald-900 tabular-nums mt-0.5">
              {formatTotalMinutes(grandTotalOtMinutes)}
            </span>
          </div>
        </div>
      </div>

      {/* LOGS CONTENT AREA - SCROLLABLE INSIDE THIS CONTAINER ONLY */}
      <div className="flex-1 mt-2 overflow-y-auto min-h-0 pr-1">
        {displayedDaysList.length === 0 ? (
          <div className="text-center py-10 px-4 bg-neutral-50/60 rounded-xl border border-dashed border-neutral-200 my-auto">
            <p className="text-xs font-semibold text-neutral-700">
              No entries logged for {selectedMonth} yet
            </p>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-[240px] mx-auto">
              Enter session times and click <strong>SAVE DAY</strong>.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* COMPACT LIST VIEW */
          <div className="space-y-2">
            {displayedDaysList.map((entry) => {
              const isSun = isSunday(entry.dayNumber, selectedMonth, currentYear);
              const isSaved = !!dailyEntries[entry.dayNumber];
              const entryCalc = isSaved ? calculateTotalDuration(entry.sections) : null;

              return (
                <div
                  key={entry.dayNumber}
                  className={`p-2.5 border rounded-xl transition-all ${
                    isSun
                      ? 'bg-rose-50/30 hover:bg-rose-50/50 border-rose-200/70'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 border-neutral-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-md font-mono text-[11px] font-bold flex items-center justify-center ${
                          isSun ? 'bg-rose-600 text-white' : 'bg-neutral-900 text-white'
                        }`}
                      >
                        {entry.dayNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-neutral-800">
                          {entry.date}
                        </span>
                        {isSun && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[9px] font-bold tracking-tight uppercase">
                            Sunday (Holiday)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onLoadDayRecordToSheet(entry)}
                        className="px-2 py-0.5 bg-white hover:bg-neutral-200 text-neutral-800 rounded text-[10px] font-semibold transition-colors border border-neutral-200 flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Load record into time calculator"
                      >
                        <Upload className="w-2.5 h-2.5" />
                        <span>Load</span>
                      </button>
                      {isSaved && (
                        <button
                          type="button"
                          onClick={() => onDeleteDayRecord(entry.dayNumber)}
                          className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete day record"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DURATIONS SUMMARY */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-neutral-500">Total:</span>
                      <span className="font-mono font-bold text-neutral-900 tabular-nums text-[11px]">
                        {isSaved ? entry.totalDuration : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-neutral-500">OT:</span>
                      <span className="font-mono font-bold text-emerald-800 tabular-nums text-[11px]">
                        {isSaved ? (entry.otDuration || entryCalc?.otFormatted) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* SESSIONS BREAKDOWN PILLS */}
                  {isSaved && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {entry.sections.map((s, idx) => {
                        if (!s.startTime && !s.endTime) return null;
                        return (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-white border border-neutral-200/90 rounded text-[9px] font-mono text-neutral-600"
                          >
                            S{idx + 1}: {s.startTime}{s.startPeriod}-{s.endTime}{s.endPeriod} ({entry.durations[idx]})
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* SPREADSHEET TABLE VIEW */
          <div className="overflow-x-auto rounded-xl border border-neutral-200/80">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 uppercase tracking-wider text-[9px] sm:text-[10px]">
                  <th className="px-1.5 sm:px-2 py-1.5 text-center w-8">Day</th>
                  <th className="px-1.5 sm:px-2 py-1.5">Date</th>
                  <th className="px-1.5 sm:px-2 py-1.5 text-center font-bold text-neutral-900">Total</th>
                  <th className="px-1.5 sm:px-2 py-1.5 text-center font-bold text-emerald-800">OT</th>
                  <th className="px-1.5 sm:px-2 py-1.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayedDaysList.map((entry) => {
                  const isSun = isSunday(entry.dayNumber, selectedMonth, currentYear);
                  const isSaved = !!dailyEntries[entry.dayNumber];
                  const entryCalc = isSaved ? calculateTotalDuration(entry.sections) : null;

                  return (
                    <tr
                      key={entry.dayNumber}
                      className={`transition-colors ${
                        isSun
                          ? 'bg-rose-50/30 hover:bg-rose-50/55'
                          : 'hover:bg-neutral-50/70'
                      }`}
                    >
                      <td className="px-1.5 sm:px-2 py-1.5 text-center font-mono font-bold">
                        <span
                          className={`inline-block px-1 rounded ${
                            isSun ? 'text-rose-700 bg-rose-100/70' : 'text-neutral-900'
                          }`}
                        >
                          {entry.dayNumber}
                        </span>
                      </td>
                      <td className="px-1.5 sm:px-2 py-1.5 font-medium text-neutral-700 whitespace-nowrap text-[10px] sm:text-[11px]">
                        <div className="inline-flex items-center gap-1.5">
                          <span>{entry.date}</span>
                          {isSun && (
                            <span className="px-1 py-0.2 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[9px] font-bold tracking-tight uppercase">
                              Sun (Holiday)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-1.5 sm:px-2 py-1.5 text-center font-mono font-bold text-neutral-900 tabular-nums text-[11px]">
                        {isSaved ? entry.totalDuration : '-'}
                      </td>
                      <td className="px-1.5 sm:px-2 py-1.5 text-center font-mono font-bold text-emerald-800 tabular-nums text-[11px]">
                        {isSaved ? (entry.otDuration || entryCalc?.otFormatted) : '-'}
                      </td>
                      <td className="px-1.5 sm:px-2 py-1.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-0.5 sm:gap-1">
                          <button
                            type="button"
                            onClick={() => onLoadDayRecordToSheet(entry)}
                            className="p-1 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 rounded cursor-pointer"
                            title="Load record into editor"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                          {isSaved && (
                            <button
                              type="button"
                              onClick={() => onDeleteDayRecord(entry.dayNumber)}
                              className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER ACCUMULATION */}
      <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs shrink-0">
        <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
          {selectedMonth} Grand Total:
        </span>
        <span className="font-mono font-extrabold text-xs sm:text-sm text-neutral-900 tabular-nums">
          {formatTotalMinutes(grandTotalMinutes)}
        </span>
      </div>
    </aside>
  );
};
