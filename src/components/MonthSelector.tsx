import React from 'react';
import { MONTHS } from '../utils/storage';

interface MonthSelectorProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  monthsWithData?: string[];
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onSelectMonth,
  monthsWithData = [],
}) => {
  return (
    <nav className="w-full my-4 overflow-x-auto pb-1" aria-label="Month Navigation">
      <div className="flex items-center gap-1 p-1 bg-neutral-100/90 rounded-xl min-w-max border border-neutral-200/70">
        {MONTHS.map((month) => {
          const isSelected = month === selectedMonth;
          const hasData = monthsWithData.includes(month);

          return (
            <button
              key={month}
              type="button"
              onClick={() => onSelectMonth(month)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <span>{month.slice(0, 3)}</span>
              {hasData && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-neutral-900' : 'bg-emerald-600'
                  }`}
                  title={`${month} has saved entries`}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
