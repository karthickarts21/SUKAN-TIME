import React from 'react';

interface HeaderProps {
  date: string;
  onDateChange: (newDate: string) => void;
  selectedMonth: string;
}

export const Header: React.FC<HeaderProps> = ({
  date,
  onDateChange,
  selectedMonth,
}) => {
  return (
    <header className="w-full flex flex-col md:flex-row items-center justify-between border-b-2 border-black pb-4 mb-6 pt-2 px-2 gap-4">
      {/* LEFT: DATE */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <label htmlFor="date-input" className="font-bold text-lg uppercase tracking-wider text-black">
          DATE
        </label>
        <input
          id="date-input"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="border border-black px-2 py-1 bg-white text-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
        />
      </div>

      {/* CENTER: TIME CALCULATOR */}
      <div className="flex items-center justify-center gap-3">
        <img src="/favicon.svg" alt="Time Calculator Logo" className="w-8 h-8 object-contain" />
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-black">
          TIME CALCULATOR
        </h1>
      </div>

      {/* RIGHT: MONTH : [SELECTED MONTH] */}
      <div className="min-w-[200px] text-right font-bold text-lg uppercase tracking-wider text-black">
        MONTH : <span className="underline decoration-2 underline-offset-4 font-black">{selectedMonth}</span>
      </div>
    </header>
  );
};
