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
    <div className="w-full my-3 bg-white border border-neutral-200/90 rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* TOTAL TIME & BALANCE OT */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              TOTAL WORKING TIME
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-500">
              Current day calculated total
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 sm:gap-5">
            <div className="font-mono font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-neutral-900 tabular-nums leading-none">
              {totalFormatted}
            </div>

            {/* BALANCE OT METRIC */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 border border-neutral-200/80 rounded-lg">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Balance OT:
              </span>
              <span className="font-mono font-bold text-sm sm:text-base text-emerald-800 tabular-nums">
                {otFormatted}
              </span>
              <span className="text-[10px] text-neutral-400">(-8h 30m duty)</span>
            </div>
          </div>
        </div>

        {/* QUICK SAVE ACTION */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE DAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
