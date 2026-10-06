import React from 'react';
import { Award, Save, TrendingDown, TrendingUp } from 'lucide-react';
import { EarlyIncentiveResult } from '../utils/timeCalculator';

interface TotalSectionProps {
  totalFormatted: string;
  otFormatted: string;
  earlyIncentive?: EarlyIncentiveResult;
  onSave: () => void;
}

export const TotalSection: React.FC<TotalSectionProps> = ({
  totalFormatted,
  otFormatted,
  earlyIncentive,
  onSave,
}) => {

  return (
    <div className="w-full bg-white border border-neutral-200/90 rounded-xl p-3 sm:p-4 shadow-xs">
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

      {/* EARLY INCENTIVE CARD - DIRECTLY BELOW TOTAL WORKING TIME */}
      <div
        className={`mt-3 p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition-all ${
          earlyIncentive && earlyIncentive.hasEntries && earlyIncentive.amount > 0
            ? 'bg-emerald-50/80 border-emerald-200/90 text-emerald-950'
            : earlyIncentive && earlyIncentive.hasEntries && earlyIncentive.amount < 0
            ? 'bg-rose-50/80 border-rose-200/90 text-rose-950'
            : 'bg-neutral-50 border-neutral-200/70 text-neutral-800'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
              earlyIncentive && earlyIncentive.hasEntries && earlyIncentive.amount > 0
                ? 'bg-emerald-600 text-white'
                : earlyIncentive && earlyIncentive.hasEntries && earlyIncentive.amount < 0
                ? 'bg-rose-600 text-white'
                : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            {earlyIncentive && earlyIncentive.hasEntries && earlyIncentive.amount > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : earlyIncentive && earlyIncentive.hasEntries && earlyIncentive.amount < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Award className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                Early Incentive
              </span>
              {earlyIncentive && earlyIncentive.hasEntries && earlyIncentive.amount > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                  +150 Added
                </span>
              )}
              {earlyIncentive && earlyIncentive.hasEntries && earlyIncentive.amount < 0 && (
                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[10px] font-bold">
                  {earlyIncentive.amount === -300 ? '-300 Deducted' : '-150 Deducted'}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium truncate">
              {earlyIncentive ? earlyIncentive.reason : 'Enter shift start & end times'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 pl-3">
          <span
            className={`font-mono font-extrabold text-xl sm:text-2xl tabular-nums ${
              earlyIncentive && earlyIncentive.hasEntries && earlyIncentive.amount > 0
                ? 'text-emerald-700'
                : earlyIncentive && earlyIncentive.hasEntries && earlyIncentive.amount < 0
                ? 'text-rose-700'
                : 'text-neutral-400'
            }`}
          >
            {earlyIncentive && earlyIncentive.hasEntries
              ? earlyIncentive.formatted
              : '0'}
          </span>
        </div>
      </div>
    </div>
  );
};
