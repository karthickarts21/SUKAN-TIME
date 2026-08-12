import React from 'react';
import { MONTHS } from '../utils/storage';

interface MonthSelectorProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onSelectMonth,
}) => {
  return (
    <div className="w-full mb-8">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
        SELECT MONTH:
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1 bg-gray-100 p-1 border border-black">
        {MONTHS.map((month) => {
          const isSelected = month === selectedMonth;
          return (
            <button
              key={month}
              type="button"
              onClick={() => onSelectMonth(month)}
              className={`py-1.5 px-1 text-[11px] font-bold tracking-tight uppercase transition-all duration-150 border ${
                isSelected
                  ? 'bg-black text-white border-black shadow-sm font-extrabold'
                  : 'bg-white text-black border-gray-300 hover:border-black hover:bg-gray-50'
              }`}
            >
              {month.slice(0, 3)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
