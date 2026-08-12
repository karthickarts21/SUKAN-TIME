import React from 'react';

interface TotalSectionProps {
  totalFormatted: string;
  otFormatted: string;
}

export const TotalSection: React.FC<TotalSectionProps> = ({ totalFormatted, otFormatted }) => {
  return (
    <div className="w-full my-6 p-4 bg-gray-50 border-2 border-black shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-center">
      {/* TOTAL HOURS */}
      <div className="flex-1 inline-flex items-center justify-center gap-3">
        <span className="font-black text-lg md:text-xl uppercase tracking-widest text-black">
          TOTAL HOURS =
        </span>
        <span className="font-mono font-black text-2xl text-black bg-white px-4 py-1.5 border-2 border-black shadow-xs">
          {totalFormatted}
        </span>
      </div>

      {/* DEDUCTION BADGE */}
      <div className="px-3 py-1 bg-black text-white text-xs font-bold font-mono rounded-xs uppercase tracking-wider whitespace-nowrap">
        - 8.30 HOURS DUTY
      </div>

      {/* BALANCE OT */}
      <div className="flex-1 inline-flex items-center justify-center gap-3">
        <span className="font-black text-lg md:text-xl uppercase tracking-widest text-black">
          BALANCE OT =
        </span>
        <span className="font-mono font-black text-2xl text-black bg-emerald-50 px-4 py-1.5 border-2 border-black shadow-xs">
          {otFormatted}
        </span>
      </div>
    </div>
  );
};
