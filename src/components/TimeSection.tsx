import React from 'react';
import { Period, TimeEntry } from '../types';
import { calculateDuration } from '../utils/timeCalculator';

interface TimeSectionProps {
  sectionIndex: number;
  entry: TimeEntry;
  onChange: (updated: TimeEntry) => void;
  onClearSection: () => void;
}

export const TimeSection: React.FC<TimeSectionProps> = ({
  sectionIndex,
  entry,
  onChange,
  onClearSection,
}) => {
  const duration = calculateDuration(entry);

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

  // Helper to auto-format input like "930" -> "09:30" on blur
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
        // e.g. "930" -> "09:30"
        let h = parseInt(clean.substring(0, 1), 10);
        let m = parseInt(clean.substring(1), 10);
        clean = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      } else if (clean.length === 4) {
        // e.g. "1030" -> "10:30"
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

  return (
    <div className="flex-1 min-w-[210px] border border-black p-3 bg-white flex flex-col justify-between space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-0.5">
        <span className="font-extrabold text-xs uppercase tracking-wider text-black">
          SECTION {sectionIndex + 1}
        </span>
        {(entry.startTime || entry.endTime) && (
          <button
            type="button"
            onClick={onClearSection}
            className="text-[10px] uppercase font-bold text-gray-500 hover:text-black underline"
            title="Reset this section"
          >
            Clear
          </button>
        )}
      </div>

      {/* IN TIME ROW */}
      <div className="flex items-center justify-between gap-1.5">
        <label className="font-bold text-xs uppercase tracking-wide text-black whitespace-nowrap">
          IN TIME
        </label>
        <div className="flex items-center gap-1 flex-1 justify-end">
          <input
            type="text"
            placeholder="09:00"
            value={entry.startTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            onBlur={(e) => autoFormatTimeOnBlur(e.target.value, 'startTime')}
            className="w-20 border border-black px-1.5 py-1 text-center font-mono text-sm bg-white text-black font-bold focus:outline-none focus:ring-1 focus:ring-black"
          />
          <button
            type="button"
            onClick={handleStartPeriodToggle}
            className={`w-10 py-1 px-0.5 border border-black text-[11px] font-black uppercase text-center transition-colors ${
              entry.startPeriod === 'AM'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {entry.startPeriod}
          </button>
        </div>
      </div>

      {/* OUT TIME ROW */}
      <div className="flex items-center justify-between gap-1.5">
        <label className="font-bold text-xs uppercase tracking-wide text-black whitespace-nowrap">
          OUT TIME
        </label>
        <div className="flex items-center gap-1 flex-1 justify-end">
          <input
            type="text"
            placeholder="06:30"
            value={entry.endTime}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            onBlur={(e) => autoFormatTimeOnBlur(e.target.value, 'endTime')}
            className="w-20 border border-black px-1.5 py-1 text-center font-mono text-sm bg-white text-black font-bold focus:outline-none focus:ring-1 focus:ring-black"
          />
          <button
            type="button"
            onClick={handleEndPeriodToggle}
            className={`w-10 py-1 px-0.5 border border-black text-[11px] font-black uppercase text-center transition-colors ${
              entry.endPeriod === 'PM'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {entry.endPeriod}
          </button>
        </div>
      </div>

      {/* SUB TOTAL HOURS = RESULT ROW */}
      <div className="pt-1.5 border-t border-gray-200 flex items-center justify-between mt-1">
        <span className="font-extrabold text-[11px] uppercase tracking-wider text-black">
          SUB TOTAL HOURS =
        </span>
        <span className="font-mono font-black text-base text-black bg-gray-50 px-2 py-0.5 border border-gray-300">
          {duration.formatted}
        </span>
      </div>
    </div>
  );
};
