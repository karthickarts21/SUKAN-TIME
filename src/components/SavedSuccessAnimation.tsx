import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

interface SavedSuccessAnimationProps {
  show: boolean;
  onDismiss: () => void;
  dayNumber?: number;
  totalFormatted?: string;
  otFormatted?: string;
}

export const SavedSuccessAnimation: React.FC<SavedSuccessAnimationProps> = ({
  show,
  onDismiss,
  dayNumber,
  totalFormatted,
  otFormatted,
}) => {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 1000);
    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs transition-opacity duration-300"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-neutral-100 flex flex-col items-center text-center max-w-xs w-full transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ANIMATED CIRCLE WITH CHECKMARK */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* SAVED TEXT */}
        <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Saved!
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          {dayNumber ? `Day ${dayNumber} entries saved successfully` : 'Daily record saved'}
        </p>

        {/* METRICS PREVIEW */}
        {(totalFormatted || otFormatted) && (
          <div className="mt-3.5 w-full bg-neutral-50 border border-neutral-200/70 rounded-xl p-2.5 flex items-center justify-around">
            {totalFormatted && (
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                  Total
                </span>
                <span className="font-mono font-bold text-xs text-neutral-900">
                  {totalFormatted}
                </span>
              </div>
            )}
            {totalFormatted && otFormatted && (
              <span className="text-neutral-300 text-xs">|</span>
            )}
            {otFormatted && (
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                  OT
                </span>
                <span className="font-mono font-bold text-xs text-emerald-800">
                  {otFormatted}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
