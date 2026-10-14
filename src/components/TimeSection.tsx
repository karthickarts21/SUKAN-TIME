import React, { useEffect, useRef, useState } from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { Period, TimeEntry } from '../types';
import { calculateDuration, convert12To24, convert24To12 } from '../utils/timeCalculator';

interface TimeSectionProps {
  sectionIndex: number;
  entry: TimeEntry;
  onChange: (updated: TimeEntry) => void;
  onClearSection: () => void;
  title?: string;
  subtitle?: string;
  timeFormat?: '12h' | '24h';
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

  const [startInput, setStartInput] = useState(() => entry.startTime || '');
  const [endInput, setEndInput] = useState(() => entry.endTime || '');

  // Keep local inputs in sync when entry changes externally
  useEffect(() => {
    setStartInput(entry.startTime || '');
  }, [entry.startTime]);

  useEffect(() => {
    setEndInput(entry.endTime || '');
  }, [entry.endTime]);

  // Clean and auto format time string on blur
  const cleanAndFormatTime = (raw: string) => {
    let clean = raw.replace(/[^\d:]/g, '').trim();
    if (!clean) return '';
    const maxH = 12;
    const minH = 1;

    if (!clean.includes(':')) {
      if (clean.length === 1 || clean.length === 2) {
        let h = parseInt(clean, 10);
        if (h > maxH) h = maxH;
        if (h < minH) h = minH;
        clean = `${h.toString().padStart(2, '0')}:00`;
      } else if (clean.length === 3) {
        let h = parseInt(clean.substring(0, 1), 10);
        let m = parseInt(clean.substring(1), 10);
        if (h > maxH) h = maxH;
        if (m > 59) m = 59;
        clean = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      } else if (clean.length >= 4) {
        let h = parseInt(clean.substring(0, 2), 10);
        let m = parseInt(clean.substring(2, 4), 10);
        if (h > maxH) h = maxH;
        if (m > 59) m = 59;
        clean = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
    } else {
      const parts = clean.split(':');
      let h = parseInt(parts[0] || '0', 10);
      let m = parseInt(parts[1] || '0', 10);
      if (isNaN(h)) h = minH;
      if (isNaN(m)) m = 0;
      if (h > maxH) h = maxH;
      if (h < minH) h = minH;
      if (m > 59) m = 59;
      clean = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    return clean;
  };

  const handleStartTimeChange = (val: string) => {
    setStartInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      onChange({ ...entry, startTime: '' });
      return;
    }
    // If complete HH:MM typed
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      onChange({ ...entry, startTime: trimmed });
    }
  };

  const handleStartBlur = () => {
    const formatted = cleanAndFormatTime(startInput);
    setStartInput(formatted);
    if (!formatted) {
      onChange({ ...entry, startTime: '' });
      return;
    }
    onChange({ ...entry, startTime: formatted });
  };

  const handleEndTimeChange = (val: string) => {
    setEndInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      onChange({ ...entry, endTime: '' });
      return;
    }
    // If complete HH:MM typed
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      onChange({ ...entry, endTime: trimmed });
    }
  };

  const handleEndBlur = () => {
    const formatted = cleanAndFormatTime(endInput);
    setEndInput(formatted);
    if (!formatted) {
      onChange({ ...entry, endTime: '' });
      return;
    }
    onChange({ ...entry, endTime: formatted });
  };

  const handleStartPeriodToggle = () => {
    const nextPeriod: Period = entry.startPeriod === 'AM' ? 'PM' : 'AM';
    onChange({ ...entry, startPeriod: nextPeriod });
  };

  const handleEndPeriodToggle = () => {
    const nextPeriod: Period = entry.endPeriod === 'AM' ? 'PM' : 'AM';
    onChange({ ...entry, endPeriod: nextPeriod });
  };

  const handleClear = () => {
    setStartInput('');
    setEndInput('');
    onClearSection();
  };

  const hasData = !!(entry.startTime || entry.endTime || startInput || endInput);

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
              onClick={handleClear}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors cursor-pointer"
              title="Clear this session"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* INPUTS CONTAINER - SINGLE LINE FOR START & END TIME */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* START TIME */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">
                  START TIME
                </label>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative flex-1 min-w-0 flex items-center">
                  <div
                    className="absolute left-2 w-3.5 h-3.5 flex items-center justify-center text-neutral-400 pointer-events-none z-10"
                    aria-hidden="true"
                  >
                    <Clock className="w-3 h-3" />
                  </div>
                  <input
                    ref={startTimeInputRef}
                    type="text"
                    placeholder="09:00"
                    value={startInput}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    onBlur={handleStartBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        startPeriodBtnRef.current?.focus();
                      }
                    }}
                    className="h-9 w-full bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg pl-6 pr-1 text-center font-mono text-xs sm:text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 tabular-nums transition-colors"
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
                  className="h-9 w-10 sm:w-11 rounded-lg font-mono font-bold text-xs tracking-wider uppercase transition-all bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 shadow-2xs cursor-pointer flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
                  title="Click or press Space / Enter / A / P to toggle AM / PM"
                  aria-label={`${displayTitle} Start Period: ${entry.startPeriod}`}
                >
                  {entry.startPeriod}
                </button>
              </div>
            </div>

            {/* END TIME */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">
                  END TIME
                </label>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative flex-1 min-w-0 flex items-center">
                  <div
                    className="absolute left-2 w-3.5 h-3.5 flex items-center justify-center text-neutral-400 pointer-events-none z-10"
                    aria-hidden="true"
                  >
                    <Clock className="w-3 h-3" />
                  </div>
                  <input
                    ref={endTimeInputRef}
                    type="text"
                    placeholder="01:00"
                    value={endInput}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    onBlur={handleEndBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        endPeriodBtnRef.current?.focus();
                      } else if (e.key === 'Tab' && e.shiftKey) {
                        e.preventDefault();
                        startPeriodBtnRef.current?.focus();
                      }
                    }}
                    className="h-9 w-full bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg pl-6 pr-1 text-center font-mono text-xs sm:text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 tabular-nums transition-colors"
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
                  className="h-9 w-10 sm:w-11 rounded-lg font-mono font-bold text-xs tracking-wider uppercase transition-all bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 shadow-2xs cursor-pointer flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
                  title="Click or press Space / Enter / A / P to toggle AM / PM"
                  aria-label={`${displayTitle} End Period: ${entry.endPeriod}`}
                >
                  {entry.endPeriod}
                </button>
              </div>
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
