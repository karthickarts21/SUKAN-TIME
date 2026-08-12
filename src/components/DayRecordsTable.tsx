import React, { useState } from 'react';
import { DayRecord, TimeEntry } from '../types';
import { calculateTotalDuration, calculateOvertime, formatTotalMinutes } from '../utils/timeCalculator';

interface DayRecordsTableProps {
  selectedMonth: string;
  dailyEntries: Record<number, DayRecord>;
  currentSections: [TimeEntry, TimeEntry, TimeEntry, TimeEntry];
  currentDate: string;
  onSaveDayRecord: (dayNumber: number, record: DayRecord) => void;
  onDeleteDayRecord: (dayNumber: number) => void;
  onLoadDayRecordToSheet: (record: DayRecord) => void;
}

export const DayRecordsTable: React.FC<DayRecordsTableProps> = ({
  selectedMonth,
  dailyEntries,
  currentSections,
  currentDate,
  onSaveDayRecord,
  onDeleteDayRecord,
  onLoadDayRecordToSheet,
}) => {
  // Extract day number from currentDate or default to 1
  const initialDayNum = () => {
    if (currentDate) {
      const parts = currentDate.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        if (day >= 1 && day <= 31) return day;
      }
    }
    return 1;
  };

  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(initialDayNum());
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Compute accumulated monthly total across all logged days
  const loggedDaysList: DayRecord[] = (Object.values(dailyEntries || {}) as DayRecord[]).sort((a, b) => a.dayNumber - b.dayNumber);

  const grandTotalMinutes = loggedDaysList.reduce((acc, entry) => {
    const totals = calculateTotalDuration(entry.sections);
    return acc + totals.totalMinutes;
  }, 0);

  const grandTotalOtMinutes = loggedDaysList.reduce((acc, entry) => {
    const totals = calculateTotalDuration(entry.sections);
    return acc + totals.otMinutes;
  }, 0);

  const handleLogCurrentToDay = () => {
    const calcResult = calculateTotalDuration(currentSections);
    const newRecord: DayRecord = {
      date: currentDate || `${selectedMonth} Day ${selectedDayNumber}`,
      dayNumber: selectedDayNumber,
      sections: JSON.parse(JSON.stringify(currentSections)),
      durations: calcResult.durations,
      totalDuration: calcResult.totalFormatted,
      otDuration: calcResult.otFormatted,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSaveDayRecord(selectedDayNumber, newRecord);
  };

  return (
    <div className="w-full mt-8 border-2 border-black bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
        <div>
          <h2 className="text-base font-black uppercase tracking-wider text-black">
            {selectedMonth} — DAILY TIME SHEET (DATE 1 TO 31)
          </h2>
          <p className="text-xs text-gray-600">
            Log time calculations for each date from 1 to 31 in {selectedMonth}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold uppercase underline text-black px-2 py-1"
        >
          {isOpen ? '[ Hide Sheet ]' : '[ Show Sheet ]'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Quick Log Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 border border-gray-300">
            <div className="flex items-center gap-2">
              <label htmlFor="day-num-select" className="text-xs font-bold uppercase text-black">
                Select Date Number (1–31):
              </label>
              <select
                id="day-num-select"
                value={selectedDayNumber}
                onChange={(e) => setSelectedDayNumber(parseInt(e.target.value, 10))}
                className="border border-black px-2 py-1 text-sm font-bold bg-white text-black"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Date {day} {dailyEntries[day] ? '✓ (Logged)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleLogCurrentToDay}
              className="px-4 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider border border-black hover:bg-gray-800 transition-colors"
            >
              Save Current Calculation to Date {selectedDayNumber}
            </button>
          </div>

          {/* Records Table */}
          {loggedDaysList.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-gray-300">
              No daily logs recorded yet for {selectedMonth}. Enter time entries above and click "Save Current Calculation to Date" to log dates 1 to 31.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-black text-xs font-mono">
                <thead>
                  <tr className="bg-black text-white uppercase text-[11px] tracking-wider">
                    <th className="border border-black px-3 py-2 text-center w-16">Date #</th>
                    <th className="border border-black px-3 py-2">Full Date</th>
                    <th className="border border-black px-3 py-2 text-center">Section 1</th>
                    <th className="border border-black px-3 py-2 text-center">Section 2</th>
                    <th className="border border-black px-3 py-2 text-center">Section 3</th>
                    <th className="border border-black px-3 py-2 text-center">Section 4</th>
                    <th className="border border-black px-3 py-2 text-center font-bold">Day Total</th>
                    <th className="border border-black px-3 py-2 text-center font-bold text-emerald-300">Balance OT</th>
                    <th className="border border-black px-3 py-2 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loggedDaysList.map((entry) => {
                    const entryCalc = calculateTotalDuration(entry.sections);
                    return (
                      <tr key={entry.dayNumber} className="border-b border-gray-300 hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 text-center font-bold text-sm">
                          {entry.dayNumber}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 font-sans font-semibold">
                          {entry.date}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {entry.sections[0]?.startTime
                            ? `${entry.sections[0].startTime} ${entry.sections[0].startPeriod} - ${entry.sections[0].endTime} ${entry.sections[0].endPeriod} (${entry.durations[0]})`
                            : '-'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {entry.sections[1]?.startTime
                            ? `${entry.sections[1].startTime} ${entry.sections[1].startPeriod} - ${entry.sections[1].endTime} ${entry.sections[1].endPeriod} (${entry.durations[1]})`
                            : '-'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {entry.sections[2]?.startTime
                            ? `${entry.sections[2].startTime} ${entry.sections[2].startPeriod} - ${entry.sections[2].endTime} ${entry.sections[2].endPeriod} (${entry.durations[2]})`
                            : '-'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {entry.sections[3]?.startTime
                            ? `${entry.sections[3].startTime} ${entry.sections[3].startPeriod} - ${entry.sections[3].endTime} ${entry.sections[3].endPeriod} (${entry.durations[3]})`
                            : '-'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-bold text-black bg-gray-50">
                          {entry.totalDuration}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-bold text-emerald-800 bg-emerald-50">
                          {entry.otDuration || entryCalc.otFormatted}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center space-x-1">
                          <button
                            type="button"
                            onClick={() => onLoadDayRecordToSheet(entry)}
                            className="px-2 py-0.5 bg-gray-200 text-black border border-black hover:bg-gray-300 text-[10px] font-bold uppercase"
                            title="Load into sheet above"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDayRecord(entry.dayNumber)}
                            className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-800 hover:bg-red-200 text-[10px] font-bold uppercase"
                            title="Delete entry"
                          >
                            Del
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-black">
                    <td colSpan={6} className="border border-black px-3 py-2 text-right uppercase text-xs font-sans">
                      {selectedMonth} Grand Total Accumulated Time:
                    </td>
                    <td className="border border-black px-3 py-2 text-center text-sm font-black text-black bg-white">
                      {formatTotalMinutes(grandTotalMinutes)}
                    </td>
                    <td className="border border-black px-3 py-2 text-center text-sm font-black text-emerald-800 bg-emerald-50">
                      {formatTotalMinutes(grandTotalOtMinutes)}
                    </td>
                    <td className="border border-black px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
