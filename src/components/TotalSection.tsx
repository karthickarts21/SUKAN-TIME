import React from 'react';
import { Save } from 'lucide-react';

interface TotalSectionProps {
  totalFormatted: string;
  otFormatted: string;
  onSave: () => void;
}

export const TotalSection: React.FC<TotalSectionProps> = ({
  totalFormatted,
  otFormatted,
  onSave,
}) => {
  return (
    <div className="w-full my-2 bg-white border border-neutral-200/90 rounded-xl p-3 sm:p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* METRICS ROW: TOTAL WORKING TIME (LEFT) & OVERTIME (RIGHT) */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-8 flex-1">
          {/* LEFT: TOTAL WORKING TIME */}
          <div className="space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
              TOTAL WORKING TIME
            </span>
            <div className="font-mono font-extrabold text-xl sm:text-2xl lg:text-3xl tracking-tight text-neutral-900 tabular-nums leading-none">
              {totalFormatted}
            </div>
          </div>

          {/* RIGHT: OVERTIME (OT) - EXACT SAME FORMAT */}
          <div className="space-y-1 text-right sm:text-left">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              OVERTIME (OT)
            </span>
            <div className="font-mono font-extrabold text-xl sm:text-2xl lg:text-3xl tracking-tight text-emerald-800 tabular-nums leading-none">
              {otFormatted}
            </div>
          </div>
        </div>

        {/* SAVE DAY BUTTON */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onSave}
            className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE DAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
