import React from 'react';
import { DayRecord } from '../types';

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

  return (
    <div className="w-full mb-6 border border-black p-2 bg-white">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-black uppercase tracking-wider text-black">
          DATE SELECTOR (DATE 1 TO 31 FOR {selectedMonth}):
        </span>
        <span className="text-[11px] font-mono font-bold text-gray-600">
          Selected: Date {currentDayNum}
        </span>
      </div>

      <div className="grid grid-cols-8 sm:grid-cols-11 md:grid-cols-16 lg:grid-cols-31 gap-1">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
          const isSelected = day === currentDayNum;
          const hasSavedData = !!dailyEntries[day];

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDayNumber(day)}
              className={`py-1 text-xs font-mono font-bold border transition-all ${
                isSelected
                  ? 'bg-black text-white border-black ring-1 ring-black font-extrabold'
                  : hasSavedData
                  ? 'bg-gray-100 text-black border-black hover:bg-gray-200'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-black hover:text-black'
              }`}
              title={hasSavedData ? `Date ${day}: Saved entries exist` : `Date ${day}: Empty`}
            >
              {day}
              {hasSavedData && !isSelected && <span className="text-[9px] block text-green-700 leading-none">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
