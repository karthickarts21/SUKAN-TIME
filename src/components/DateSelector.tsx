import React from 'react';
import { DayRecord } from '../types';
import { getDaysInMonth, getYearFromDate, isSunday } from '../utils/dateUtils';
import { Calendar, Palmtree } from 'lucide-react';

interface DateSelectorProps {
  currentDate: string;
  selectedMonth: string;
  dailyEntries: Record<number, DayRecord>;
  manualHolidays?: number[];
  onSelectDayNumber: (dayNumber: number) => void;
  onToggleHoliday?: (dayNumber: number) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  currentDate,
  selectedMonth,
  dailyEntries,
  manualHolidays = [],
  onSelectDayNumber,
  onToggleHoliday,
}) => {
  const currentYear = getYearFromDate(currentDate);
  const totalDaysInMonth = getDaysInMonth(selectedMonth, currentYear);

  // Determine current active day number (clamped to month's total days)
  const currentDayNum = (() => {
    if (currentDate) {
      const parts = currentDate.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        if (d >= 1 && d <= totalDaysInMonth) return d;
        if (d > totalDaysInMonth) return totalDaysInMonth;
      }
    }
    return 1;
  })();

  const isCurrentSunday = isSunday(currentDayNum, selectedMonth, currentYear);
  const isCurrentManualHoliday = manualHolidays.includes(currentDayNum);
  const savedCount = Object.keys(dailyEntries).length;

  return (
    <div className="w-full p-2.5 sm:p-3 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
      <div className="flex items-center justify-between mb-2 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
            Day Selector
          </span>
          {isCurrentSunday && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 uppercase tracking-tight">
              Sunday (Holiday)
            </span>
          )}
          {isCurrentManualHoliday && !isCurrentSunday && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-tight flex items-center gap-1">
              <Palmtree className="w-2.5 h-2.5 text-amber-700" />
              <span>Manual Holiday</span>
            </span>
          )}
        </div>

        {/* Manual Holiday toggle icon button for the selected day */}
        {!isCurrentSunday && onToggleHoliday && (
          <button
            type="button"
            onClick={() => onToggleHoliday(currentDayNum)}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
              isCurrentManualHoliday
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-neutral-100 hover:bg-amber-50 text-neutral-600 hover:text-amber-800 border border-neutral-200 hover:border-amber-300'
            }`}
            title={
              isCurrentManualHoliday
                ? `Day ${currentDayNum}: Holiday Marked (Click to Remove)`
                : `Day ${currentDayNum}: Mark as Holiday`
            }
            aria-label={
              isCurrentManualHoliday
                ? `Remove Day ${currentDayNum} from holidays`
                : `Mark Day ${currentDayNum} as a Holiday`
            }
          >
            <Palmtree
              className={`w-4 h-4 ${
                isCurrentManualHoliday ? 'text-amber-700' : 'text-neutral-500'
              }`}
            />
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-16 lg:grid-cols-31 gap-1">
        {Array.from({ length: totalDaysInMonth }, (_, i) => i + 1).map((day) => {
          const isSelected = day === currentDayNum;
          const hasSavedData = !!dailyEntries[day];
          const isSun = isSunday(day, selectedMonth, currentYear);
          const isManualHol = manualHolidays.includes(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDayNumber(day)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!isSun && onToggleHoliday) {
                  onToggleHoliday(day);
                }
              }}
              className={`relative py-1 px-0.5 text-xs font-mono font-semibold rounded-md transition-all flex flex-col items-center justify-center cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : hasSavedData
                  ? isSun
                    ? 'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100'
                    : isManualHol
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                    : 'bg-emerald-50/80 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                  : isSun
                  ? 'bg-rose-50/50 text-rose-700 border border-rose-200/80 hover:bg-rose-100 hover:text-rose-900'
                  : isManualHol
                  ? 'bg-amber-50/60 text-amber-800 border border-amber-300 hover:bg-amber-100 hover:text-amber-950'
                  : 'bg-neutral-50 text-neutral-600 border border-neutral-200/70 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
              title={
                isSun
                  ? `Day ${day}: Sunday (Holiday)${hasSavedData ? ` - Logged (${dailyEntries[day].totalDuration})` : ''}`
                  : isManualHol
                  ? `Day ${day}: Manual Holiday (Right-click or click button to toggle)${hasSavedData ? ` - Logged (${dailyEntries[day].totalDuration})` : ''}`
                  : hasSavedData
                  ? `Day ${day}: Logged (${dailyEntries[day].totalDuration}) · Right-click to mark as Holiday`
                  : `Day ${day}: No record · Right-click to mark as Holiday`
              }
            >
              <span>{day}</span>
              {/* If Sunday, show tiny Sun tag */}
              {isSun && (
                <span
                  className={`text-[8px] leading-tight font-sans font-bold uppercase tracking-tighter ${
                    isSelected ? 'text-rose-300' : 'text-rose-600'
                  }`}
                >
                  Sun
                </span>
              )}
              {/* If Manual Holiday, show tiny Hol tag */}
              {!isSun && isManualHol && (
                <span
                  className={`text-[8px] leading-tight font-sans font-bold uppercase tracking-tighter ${
                    isSelected ? 'text-amber-300' : 'text-amber-700'
                  }`}
                >
                  Hol
                </span>
              )}
              {hasSavedData && !isSun && !isManualHol && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? 'bg-emerald-400' : 'bg-emerald-600'
                  }`}
                />
              )}
              {hasSavedData && isSun && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? 'bg-emerald-400' : 'bg-rose-600'
                  }`}
                />
              )}
              {hasSavedData && isManualHol && !isSun && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? 'bg-amber-400' : 'bg-amber-600'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Manual Holidays List / Quick Chips if any are marked */}
      {manualHolidays.length > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
            <Palmtree className="w-3 h-3 text-amber-600" />
            <span>Marked Holidays:</span>
          </span>
          {manualHolidays.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onToggleHoliday && onToggleHoliday(d)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 hover:bg-rose-50 text-amber-900 hover:text-rose-700 border border-amber-300 hover:border-rose-300 transition-colors cursor-pointer"
              title={`Click to unmark Day ${d} as Holiday`}
            >
              <span>Day {d}</span>
              <span className="text-[9px] text-neutral-400">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
