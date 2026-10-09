import React, { useRef } from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { Period, TimeEntry } from '../types';
import { calculateDuration } from '../utils/timeCalculator';

interface TimeSectionProps {
  sectionIndex: number;
  entry: TimeEntry;
  onChange: (updated: TimeEntry) => void;
  onClearSection: () => void;
  title?: string;
  subtitle?: string;
}

const DEFAULT_METADATA = [
  { title: 'Morning', subtitle: 'Session 1' },
  { title: 'Afternoon', subtitle: 'Session 2' },
  { title: 'Evening', subtitle: 'Session 3' },
  { title: 'Overtime', subtitle: 'Night' },
];

export const TimeSection: React.FC<TimeSectionProps> = ({
  sectionIndex,
  entry,
  onChange,
  onClearSection,
  title,
  subtitle,
}) => {
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const startPeriodBtnRef = useRef<HTMLButtonElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);
  const endPeriodBtnRef = useRef<HTMLButtonElement>(null);

  const duration = calculateDuration(entry);
  const meta = DEFAULT_METADATA[sectionIndex] || {
    title: `Session 0${sectionIndex + 1}`,
    subtitle: `Session ${sectionIndex + 1}`,
  };

  const displayTitle = title || meta.title;
  const displaySubtitle = subtitle || meta.subtitle;

  const handleStartTimeChange = (val: string) => {
    onChange({ ...entry, startTime: val });
  };

  const handleStartPeriodToggle = () => {
    const nextPeriod: Period = entry.startPeriod === 'AM' ? 'PM' : 'AM';
    onChange({ ...entry, startPeriod: nextPeriod });
  };

  const handleEndTimeChange = (val: string) => {
    onChange({ ...entry, endTime: val });
  };

  const handleEndPeriodToggle = () => {
    const nextPeriod: Period = entry.endPeriod === 'AM' ? 'PM' : 'AM';
    onChange({ ...entry, endPeriod: nextPeriod });
  };

  // Auto-format input like "930" -> "09:30" or "9" -> "09:00" on blur
  const autoFormatTimeOnBlur = (val: string, field: 'startTime' | 'endTime') => {
    let clean = val.replace(/[^\d:]/g, '').trim();
    if (!clean) return;

    if (!clean.includes(':')) {
      if (clean.length === 1 || clean.length === 2) {
        let h = parseInt(clean, 10);
        if (h > 12) h = 12;
        if (h < 1) h = 1;
        clean = `${h.toString().padStart(2, '0')}:00`;
      } else if (clean.length === 3) {
        let h = parseInt(clean.substring(0, 1), 10);
        let m = parseInt(clean.substring(1), 10);
        clean = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      } else if (clean.length === 4) {
        let h = parseInt(clean.substring(0, 2), 10);
        let m = parseInt(clean.substring(2), 10);
        if (h > 12) h = 12;
        clean = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
    } else {
      const parts = clean.split(':');
      let h = parseInt(parts[0] || '0', 10);
      let m = parseInt(parts[1] || '0', 10);
      if (isNaN(h)) h = 0;
      if (isNaN(m)) m = 0;
      if (h > 12) h = 12;
      if (m > 59) m = 59;
      clean = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    onChange({ ...entry, [field]: clean });
  };

  const hasData = !!(entry.startTime || entry.endTime);

  return (
    <div className="bg-white border border-neutral-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between transition-all hover:border-neutral-300">
      <div>
        {/* COMPACT CARD HEADER */}
        <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-neutral-100">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-neutral-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
              {sectionIndex + 1}
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-neutral-900 leading-none">
                {displayTitle}
              </h2>
              <span className="text-[10px] text-neutral-400">{displaySubtitle}</span>
            </div>
          </div>

          {hasData && (
            <button
              type="button"
              onClick={onClearSection}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
              title="Clear this session"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* INPUTS CONTAINER - COMPACT HEIGHT */}
        <div className="space-y-2">
          {/* START TIME */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">
              START TIME
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1 min-w-0 flex items-center">
                <div
                  className="absolute left-2.5 w-4 h-4 flex items-center justify-center text-neutral-400 pointer-events-none z-10"
                  aria-hidden="true"
                >
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <input
                  ref={startTimeInputRef}
                  type="text"
                  placeholder="09:00"
                  value={entry.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  onBlur={(e) => autoFormatTimeOnBlur(e.target.value, 'startTime')}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !e.shiftKey) {
                      e.preventDefault();
                      startPeriodBtnRef.current?.focus();
                    }
                  }}
                  className="h-9 w-full bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg pl-8 pr-2.5 text-center font-mono text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 tabular-nums transition-colors"
                  aria-label={`${displayTitle} Start Time`}
                />
              </div>
              <button
                ref={startPeriodBtnRef}
                type="button"
                tabIndex={0}
                onClick={handleStartPeriodToggle}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    endTimeInputRef.current?.focus();
                  } else if (e.key === 'Tab' && e.shiftKey) {
                    e.preventDefault();
                    startTimeInputRef.current?.focus();
                  } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'a' || e.key === 'A' || e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    handleStartPeriodToggle();
                  }
                }}
                className="h-9 w-12 rounded-lg font-mono font-bold text-xs tracking-wider uppercase transition-all bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 shadow-2xs cursor-pointer flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
                title="Click or press Space / Enter / A / P to toggle AM / PM"
                aria-label={`${displayTitle} Start Period: ${entry.startPeriod}`}
              >
                {entry.startPeriod}
              </button>
            </div>
          </div>

          {/* END TIME */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">
              END TIME
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1 min-w-0 flex items-center">
                <div
                  className="absolute left-2.5 w-4 h-4 flex items-center justify-center text-neutral-400 pointer-events-none z-10"
                  aria-hidden="true"
                >
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <input
                  ref={endTimeInputRef}
                  type="text"
                  placeholder="01:00"
                  value={entry.endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  onBlur={(e) => autoFormatTimeOnBlur(e.target.value, 'endTime')}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !e.shiftKey) {
                      e.preventDefault();
                      endPeriodBtnRef.current?.focus();
                    } else if (e.key === 'Tab' && e.shiftKey) {
                      e.preventDefault();
                      startPeriodBtnRef.current?.focus();
                    }
                  }}
                  className="h-9 w-full bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg pl-8 pr-2.5 text-center font-mono text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 tabular-nums transition-colors"
                  aria-label={`${displayTitle} End Time`}
                />
              </div>
              <button
                ref={endPeriodBtnRef}
                type="button"
                tabIndex={0}
                onClick={handleEndPeriodToggle}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && e.shiftKey) {
                    e.preventDefault();
                    endTimeInputRef.current?.focus();
                  } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'a' || e.key === 'A' || e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    handleEndPeriodToggle();
                  }
                }}
                className="h-9 w-12 rounded-lg font-mono font-bold text-xs tracking-wider uppercase transition-all bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 shadow-2xs cursor-pointer flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
                title="Click or press Space / Enter / A / P to toggle AM / PM"
                aria-label={`${displayTitle} End Period: ${entry.endPeriod}`}
              >
                {entry.endPeriod}
              </button>
            </div>
          </div>

          {/* WORKED TIME - DIRECTLY FOLLOWING END TIME */}
          <div className="pt-0.5">
            <div className="bg-neutral-50/90 rounded-lg p-2 border border-neutral-200/80 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 leading-tight">
                  WORKED TIME
                </span>
                <span className="text-[9px] text-neutral-400">Duration</span>
              </div>
              <span className="font-mono font-bold text-base text-neutral-900 tabular-nums tracking-tight">
                {duration.formatted}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
