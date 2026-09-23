import React from 'react';
import { DayRecord } from '../types';
import { getYearFromDate, isSunday } from '../utils/dateUtils';

interface DateSelectorProps {
  currentDate: string;
  selectedMonth: string;
  dailyEntries: Record<number, DayRecord>;
  onSelectDayNumber: (dayNumber: number) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  currentDate,
  selectedMonth,
  dailyEntries,
  onSelectDayNumber,
}) => {
  const currentYear = getYearFromDate(currentDate);

  // Determine current active day number (1-31)
  const currentDayNum = (() => {
    if (currentDate) {
      const parts = currentDate.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        if (d >= 1 && d <= 31) return d;
      }
    }
    return 1;
  })();

  const isCurrentSunday = isSunday(currentDayNum, selectedMonth, currentYear);
  const savedCount = Object.keys(dailyEntries).length;

  return (
    <div className="w-full my-2 p-2.5 sm:p-3 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
            Day Selector (1–31)
          </span>
          <span className="text-neutral-300">·</span>
          <span className="text-xs text-neutral-500">
            {savedCount} {savedCount === 1 ? 'day logged' : 'days logged'} in {selectedMonth}
          </span>
        </div>

        {/* ACTIVE DAY STATUS (Highlights Sunday Holiday if active day is Sunday) */}
        {isCurrentSunday ? (
          <span className="text-xs font-mono font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Active: Day {currentDayNum} (Sunday — Holiday)
          </span>
        ) : (
          <span className="text-xs font-mono font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-md">
            Active: Day {currentDayNum}
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-16 lg:grid-cols-31 gap-1">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
          const isSelected = day === currentDayNum;
          const hasSavedData = !!dailyEntries[day];
          const isSun = isSunday(day, selectedMonth, currentYear);

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDayNumber(day)}
              className={`relative py-1 px-0.5 text-xs font-mono font-semibold rounded-md transition-all flex flex-col items-center justify-center cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : hasSavedData
                  ? isSun
                    ? 'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100'
                    : 'bg-emerald-50/80 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                  : isSun
                  ? 'bg-rose-50/50 text-rose-700 border border-rose-200/80 hover:bg-rose-100 hover:text-rose-900'
                  : 'bg-neutral-50 text-neutral-600 border border-neutral-200/70 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
              title={
                isSun
                  ? `Day ${day}: Sunday (Holiday)${hasSavedData ? ` - Logged (${dailyEntries[day].totalDuration})` : ''}`
                  : hasSavedData
                  ? `Day ${day}: Logged (${dailyEntries[day].totalDuration})`
                  : `Day ${day}: No record`
              }
            >
              <span>{day}</span>
              {/* If Sunday, show tiny SUN / Holiday tag */}
              {isSun && (
                <span
                  className={`text-[8px] leading-tight font-sans font-bold uppercase tracking-tighter ${
                    isSelected ? 'text-rose-300' : 'text-rose-600'
                  }`}
                >
                  Sun
                </span>
              )}
              {hasSavedData && !isSun && (
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
            </button>
          );
        })}
      </div>
    </div>
  );
};
