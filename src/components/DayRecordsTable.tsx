import React, { useState } from 'react';
import { DayRecord, TimeEntry } from '../types';
import { calculateTotalDuration, formatSignedOtMinutes, formatTotalMinutes, isLateArrivalAfter940 } from '../utils/timeCalculator';
import { getDaysInMonth, getYearFromDate, isPastOrToday, isSunday } from '../utils/dateUtils';
import { createEmptyTimeEntry, MONTHS } from '../utils/storage';
import { parseDutyHoursToMinutes } from '../utils/salaryCalculator';
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
  manualHolidays?: number[];
  manualLeaves?: number[];
  manualHalfDays?: number[];
  dailyDutyHours?: string;
  onToggleHoliday?: (dayNumber: number) => void;
  onToggleLeave?: (dayNumber: number) => void;
  onSaveDayRecord?: (dayNumber: number, record: DayRecord) => void;
  onDeleteDayRecord: (dayNumber: number) => void;
  onLoadDayRecordToSheet: (record: DayRecord) => void;
}

export const DayRecordsTable: React.FC<DayRecordsTableProps> = ({
  selectedMonth,
  dailyEntries,
  currentDate,
  manualHolidays = [],
  manualLeaves = [],
  manualHalfDays = [],
  dailyDutyHours = '08:30',
  onDeleteDayRecord,
  onLoadDayRecordToSheet,
}) => {
  const currentYear = getYearFromDate(currentDate);
  const daysInMonth = getDaysInMonth(selectedMonth, currentYear);
  const mIdx = MONTHS.indexOf(selectedMonth as any);
  const mStr = (mIdx >= 0 ? mIdx + 1 : 1).toString().padStart(2, '0');

  // Duty threshold for Half Day (e.g. 255 mins for 8.5h duty)
  const dutyMins = parseDutyHoursToMinutes(dailyDutyHours);
  const halfDutyMinsThreshold = Math.floor(dutyMins / 2);

  // Default to spreadsheet table view as requested
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Build the list of records: Worked/logged entries + ALL Sundays & manual holidays for the selected month
  const allRecordsMap: Record<number, DayRecord> = {};

  // 1. Copy user-saved dailyEntries, guaranteeing dayNumber is a valid numeric key
  Object.entries(dailyEntries || {}).forEach(([key, rec]: [string, DayRecord]) => {
    const dNum = Number(rec?.dayNumber || key);
    if (!isNaN(dNum)) {
      allRecordsMap[dNum] = {
        ...rec,
        dayNumber: dNum,
      };
    }
  });

  // 2. Add ALL Sundays and manual holidays in the month even if not logged!
  for (let d = 1; d <= daysInMonth; d++) {
    const isSun = isSunday(d, selectedMonth, currentYear);
    const isManHol = manualHolidays.includes(d);

    if ((isSun || isManHol) && !allRecordsMap[d]) {
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
        otDuration: '00 H 00 M',
        savedAt: '',
        isHoliday: true,
      };
    }
  }

  const displayedDaysList: DayRecord[] = (Object.values(allRecordsMap) as DayRecord[]).sort(
    (a, b) => a.dayNumber - b.dayNumber
  );

  const loggedCount = Object.keys(dailyEntries).length;

  // Requirement: Sunday & Holiday worked time MUST NOT be added to total hr!
  const grandTotalMinutes = (Object.values(dailyEntries) as DayRecord[]).reduce(
    (acc: number, entry: DayRecord) => {
      const isSun = isSunday(entry.dayNumber, selectedMonth, currentYear);
      const isManualHol = manualHolidays.includes(entry.dayNumber);
      if (isSun || isManualHol) return acc; // Exclude Sunday & Holiday worked hours from total hr
      const totals = calculateTotalDuration(entry.sections);
      return acc + totals.totalMinutes;
    },
    0
  );

  const grandTotalOtMinutes = (Object.values(dailyEntries) as DayRecord[]).reduce(
    (acc: number, entry: DayRecord) => {
      const isSun = isSunday(entry.dayNumber, selectedMonth, currentYear);
      const isManualHol = manualHolidays.includes(entry.dayNumber);
      if (isSun || isManualHol) return acc; // Exclude Sunday & Holiday OT
      const totals = calculateTotalDuration(entry.sections);
      return acc + totals.otMinutes;
    },
    0
  );

  const grandTotalEarlyIncentive = (Object.values(dailyEntries) as DayRecord[]).reduce(
    (acc: number, entry: DayRecord) => {
      const isSun = isSunday(entry.dayNumber, selectedMonth, currentYear);
      const isManualHol = manualHolidays.includes(entry.dayNumber);
      if (isSun || isManualHol) return acc;
      const totals = calculateTotalDuration(entry.sections);
      const isHalf = totals.totalMinutes > 0 && totals.totalMinutes <= halfDutyMinsThreshold;
      const inc = isHalf ? -150 : (entry.earlyIncentive || 0);
      return acc + inc;
    },
    0
  );

  return (
    <aside className="w-full bg-transparent sm:bg-white border-0 sm:border sm:border-neutral-200/90 rounded-none sm:rounded-2xl p-0 sm:p-4 shadow-none sm:shadow-xs flex flex-col h-full min-h-0 overflow-hidden">
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

          <div className="flex items-center gap-1">
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Spreadsheet Table View"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Compact Cards View"
              >
                <List className="w-3 h-3" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto min-h-0 my-2 pr-0.5 space-y-2">
        {displayedDaysList.length === 0 ? (
          <div className="text-center py-8 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl my-2">
            <p className="text-xs font-semibold text-neutral-500">No records saved yet for {selectedMonth}</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Select a day and click "Save Day" to build monthly logs.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* COMPACT LIST VIEW */
          <div className="space-y-2">
            {displayedDaysList.map((entry) => {
              const isSun = isSunday(entry.dayNumber, selectedMonth, currentYear);
              const isManualHol = manualHolidays.includes(entry.dayNumber);
              const hasTime = entry.sections && entry.sections.some(
                (s) => (typeof s.startTime === 'string' && s.startTime.trim() !== '') || (typeof s.endTime === 'string' && s.endTime.trim() !== '')
              );
              const isPastOrCurr = isPastOrToday(entry.dayNumber, selectedMonth, currentYear);
              const isManualLev = !isSun && !isManualHol && isPastOrCurr && (manualLeaves.includes(entry.dayNumber) || !!entry.isLeave || !hasTime);
              const isManualHalf = manualHalfDays.includes(entry.dayNumber) || !!entry.isHalfDay;
              const isSaved = !!(dailyEntries[entry.dayNumber] || dailyEntries[String(entry.dayNumber)]);
              const entryCalc = isSaved ? calculateTotalDuration(entry.sections) : null;
              const totalMins = entryCalc ? entryCalc.totalMinutes : 0;

              const isHalfDay = !isSun && !isManualHol && !isManualLev && (isManualHalf || (isSaved && totalMins > 0 && totalMins <= halfDutyMinsThreshold));
              const isLate = isSaved && !isSun && !isManualHol && !isManualLev && isLateArrivalAfter940(entry.sections);
              const dateDisplay = `${selectedMonth.toUpperCase()} ${entry.dayNumber}`;

              // Daily OT calculation:
              // For Half Day: base duty is 4h 15m (255 mins) -> excess over 255 mins is OT (+), shortage is (-)
              // For Regular Day: base duty is 8h 30m (510 mins) -> excess over 510 mins is OT (+), shortage is (-)
              let otMins = 0;
              let otFormatted = '00 H 00 M';
              if (isSaved && !isSun && !isManualHol && !isManualLev && totalMins > 0) {
                if (isHalfDay) {
                  otMins = totalMins - halfDutyMinsThreshold;
                } else {
                  otMins = totalMins - dutyMins;
                }
                otFormatted = formatSignedOtMinutes(otMins);
              }

              return (
                <div
                  key={entry.dayNumber}
                  className={`p-2.5 border rounded-xl transition-all ${
                    isSun
                      ? 'bg-rose-50/30 hover:bg-rose-50/50 border-rose-200/70'
                      : isManualHol
                      ? 'bg-amber-50/30 hover:bg-amber-50/50 border-amber-200/70'
                      : isManualLev
                      ? 'bg-rose-50/40 hover:bg-rose-50/60 border-rose-300'
                      : isHalfDay
                      ? 'bg-orange-50/60 hover:bg-orange-100/60 border-orange-300 shadow-2xs'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 border-neutral-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isSun
                            ? 'text-rose-600'
                            : isManualHol
                            ? 'text-amber-600'
                            : isManualLev
                            ? 'text-rose-700'
                            : isHalfDay
                            ? 'text-orange-950 font-black'
                            : 'text-neutral-900'
                        }`}
                      >
                        {dateDisplay}
                      </span>
                      {isManualLev && !isSun && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                          Leave
                        </span>
                      )}
                      {isManualHol && !isSun && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                          Holiday
                        </span>
                      )}
                      {isHalfDay && !isSun && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-orange-100 text-orange-950 border border-orange-300 uppercase">
                          ½ Half
                        </span>
                      )}
                      {isLate && !isSun && !isHalfDay && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-purple-100 text-purple-900 border border-purple-300 uppercase">
                          Late
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onLoadDayRecordToSheet(entry)}
                        className="px-2 py-0.5 bg-white hover:bg-neutral-200 text-neutral-800 rounded text-[10px] font-semibold transition-colors border border-neutral-200 flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Load record into salary calculator"
                      >
                        <Upload className="w-2.5 h-2.5" />
                        <span>Load</span>
                      </button>
                      {isSaved && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDayRecord(Number(entry.dayNumber));
                          }}
                          className="p-1.5 sm:p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded transition-colors cursor-pointer"
                          title="Delete day record"
                          aria-label={`Delete record for day ${entry.dayNumber}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DURATIONS SUMMARY */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-neutral-500">Total:</span>
                      <span
                        className={`font-mono font-bold tabular-nums text-[11px] ${
                          isHalfDay ? 'text-orange-950 font-black' : 'text-neutral-900'
                        }`}
                      >
                        {isSaved ? (isSun || isManualHol ? `${entry.totalDuration} (Ref)` : entry.totalDuration) : '-'}
                      </span>
                    </div>

                    {/* OT COLUMN DISPLAY WITH CLEAR SIGNED SHORTAGE OR OVERTIME */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-neutral-500">OT:</span>
                      {isSaved ? (
                        <span
                          className={`font-mono font-bold tabular-nums text-[11px] px-1 py-0.2 rounded ${
                            otMins < 0
                              ? 'text-rose-700 bg-rose-50 border border-rose-200'
                              : otMins > 0
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : 'text-neutral-600'
                          }`}
                        >
                          {otFormatted}
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-mono text-[11px]">-</span>
                      )}
                    </div>

                    {isSaved && (() => {
                      const effectiveEarlyInc = isHalfDay ? -150 : entry.earlyIncentive;
                      if (effectiveEarlyInc === undefined || effectiveEarlyInc === 0) return null;
                      return (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-medium text-neutral-500">Inc:</span>
                          <span
                            className={`font-mono font-bold tabular-nums text-[11px] ${
                              effectiveEarlyInc > 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {effectiveEarlyInc > 0 ? `+${effectiveEarlyInc}` : `${effectiveEarlyInc}`}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* SESSIONS BREAKDOWN PILLS */}
                  {isSaved && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {entry.sections.map((s, idx) => {
                        if (!s.startTime && !s.endTime) return null;
                        const sStart = `${s.startTime}${s.startPeriod}`;
                        const sEnd = `${s.endTime}${s.endPeriod}`;
                        return (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-white border border-neutral-200/90 rounded text-[9px] font-mono text-neutral-600"
                          >
                            S{idx + 1}: {sStart}-{sEnd} ({entry.durations[idx]})
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
                  <th className="px-2 py-1.5 font-bold text-neutral-800">Date</th>
                  <th className="px-1.5 sm:px-2 py-1.5 text-center font-bold text-neutral-900">Total</th>
                  <th className="px-1.5 sm:px-2 py-1.5 text-center font-bold text-emerald-800">OT</th>
                  <th className="px-1 sm:px-1.5 py-1.5 text-center font-bold text-neutral-700">Inc</th>
                  <th className="px-1.5 sm:px-2 py-1.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayedDaysList.map((entry) => {
                  const isSun = isSunday(entry.dayNumber, selectedMonth, currentYear);
                  const isManualHol = manualHolidays.includes(entry.dayNumber);
                  const hasTime = entry.sections && entry.sections.some(
                    (s) => (typeof s.startTime === 'string' && s.startTime.trim() !== '') || (typeof s.endTime === 'string' && s.endTime.trim() !== '')
                  );
                  const isPastOrCurr = isPastOrToday(entry.dayNumber, selectedMonth, currentYear);
                  const isManualLev = !isSun && !isManualHol && isPastOrCurr && (manualLeaves.includes(entry.dayNumber) || !!entry.isLeave || !hasTime);
                  const isManualHalf = manualHalfDays.includes(entry.dayNumber) || !!entry.isHalfDay;
                  const isSaved = !!(dailyEntries[entry.dayNumber] || dailyEntries[String(entry.dayNumber)]);
                  const entryCalc = isSaved ? calculateTotalDuration(entry.sections) : null;
                  const totalMins = entryCalc ? entryCalc.totalMinutes : 0;

                  const isHalfDay = !isSun && !isManualHol && !isManualLev && (isManualHalf || (isSaved && totalMins > 0 && totalMins <= halfDutyMinsThreshold));
                  const isLate = isSaved && !isSun && !isManualHol && !isManualLev && isLateArrivalAfter940(entry.sections);
                  const dateDisplay = `${selectedMonth.toUpperCase()} ${entry.dayNumber}`;

                  // Daily OT calculation for table:
                  let otMins = 0;
                  let otFormatted = '00 H 00 M';
                  if (isSaved && !isSun && !isManualHol && !isManualLev && totalMins > 0) {
                    if (isHalfDay) {
                      otMins = totalMins - halfDutyMinsThreshold;
                    } else {
                      otMins = totalMins - dutyMins;
                    }
                    otFormatted = formatSignedOtMinutes(otMins);
                  }

                  return (
                    <tr
                      key={entry.dayNumber}
                      className={`transition-colors ${
                        isSun
                          ? 'bg-rose-50/30 hover:bg-rose-50/55'
                          : isManualHol
                          ? 'bg-amber-50/30 hover:bg-amber-50/55'
                          : isManualLev
                          ? 'bg-rose-50/40 hover:bg-rose-50/60'
                          : isHalfDay
                          ? 'bg-orange-50/60 hover:bg-orange-100/70 border-l-4 border-l-orange-500'
                          : 'hover:bg-neutral-50/70'
                      }`}
                    >
                      <td className="px-2 py-1.5 whitespace-nowrap text-[11px]">
                        <div className="flex flex-col items-start leading-tight">
                          <span
                            className={`font-mono text-[11px] font-bold ${
                              isSun
                                ? 'text-rose-600'
                                : isManualHol
                                ? 'text-amber-600'
                                : isManualLev
                                ? 'text-rose-700'
                                : isHalfDay
                                ? 'text-orange-950 font-black'
                                : 'text-neutral-900'
                            }`}
                          >
                            {dateDisplay}
                          </span>
                          {(isManualLev || isManualHol || isHalfDay || isLate) && !isSun && (
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              {isManualLev && (
                                <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                                  Leave
                                </span>
                              )}
                              {isManualHol && (
                                <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                                  Holiday
                                </span>
                              )}
                              {isHalfDay && (
                                <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-orange-100 text-orange-950 border border-orange-300 uppercase">
                                  ½ Half
                                </span>
                              )}
                              {isLate && (
                                <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-purple-100 text-purple-900 border border-purple-300 uppercase">
                                  Late
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-1.5 sm:px-2 py-1.5 text-center font-mono font-bold tabular-nums text-[11px] ${
                        isHalfDay ? 'text-orange-950 font-black' : 'text-neutral-900'
                      }`}>
                        {isSaved ? (isSun || isManualHol ? `${entry.totalDuration} (Ref)` : entry.totalDuration) : '-'}
                      </td>
                      <td className="px-1.5 sm:px-2 py-1.5 text-center font-mono font-bold tabular-nums text-[11px]">
                        {isSaved && !isSun && !isManualHol && !isManualLev ? (
                          <span
                            className={`font-bold ${
                              otMins < 0
                                ? 'text-rose-700'
                                : otMins > 0
                                ? 'text-emerald-700'
                                : 'text-neutral-600'
                            }`}
                          >
                            {otFormatted}
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-1 sm:px-1.5 py-1.5 text-center font-mono font-bold tabular-nums text-[10px]">
                        {isSaved && (() => {
                          const effectiveEarlyInc = isHalfDay ? -150 : entry.earlyIncentive;
                          if (effectiveEarlyInc !== undefined && effectiveEarlyInc !== 0) {
                            return (
                              <span
                                className={`px-1 py-0.2 rounded font-bold text-[9px] ${
                                  effectiveEarlyInc > 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                                title={`Early Incentive: ${effectiveEarlyInc}`}
                              >
                                {effectiveEarlyInc > 0 ? `+${effectiveEarlyInc}` : effectiveEarlyInc}
                              </span>
                            );
                          }
                          return <span className="text-neutral-300">-</span>;
                        })()}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteDayRecord(Number(entry.dayNumber));
                              }}
                              className="p-1.5 sm:p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded cursor-pointer transition-colors"
                              title="Delete record"
                              aria-label={`Delete record for day ${entry.dayNumber}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
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
      <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
            {selectedMonth} Full Time:
          </span>
          <span className="font-mono font-extrabold text-xs sm:text-sm text-neutral-900 tabular-nums">
            {formatTotalMinutes(grandTotalMinutes)}
          </span>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold">
          <div className="flex items-center gap-1">
            <span className="text-neutral-400 text-[9px] uppercase">OT:</span>
            <span className="text-emerald-800 font-bold">
              {formatTotalMinutes(grandTotalOtMinutes)}
            </span>
          </div>

          {grandTotalEarlyIncentive !== 0 && (
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-[9px] uppercase">Inc:</span>
              <span className={grandTotalEarlyIncentive > 0 ? "text-emerald-800 font-bold" : "text-rose-800 font-bold"}>
                {grandTotalEarlyIncentive > 0 ? `+₹${grandTotalEarlyIncentive}` : `-₹${Math.abs(grandTotalEarlyIncentive)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
