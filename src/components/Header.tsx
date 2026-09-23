import React, { useRef } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  RotateCcw,
  Save,
} from 'lucide-react';
import { MONTHS } from '../utils/storage';

interface HeaderProps {
  date: string;
  onDateChange: (newDate: string) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  hasSavedData: boolean;
  onSave: () => void;
  onExportMonthExcel: () => void;
  onClearCurrentMonth: () => void;
  lastSavedNotice?: string;
}

export const Header: React.FC<HeaderProps> = ({
  date,
  onDateChange,
  selectedMonth,
  onSelectMonth,
  hasSavedData,
  onSave,
  onExportMonthExcel,
  onClearCurrentMonth,
  lastSavedNotice,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Format date for display: "2026-06-23" -> "23 JUN 2026"
  const formattedDateDisplay = (() => {
    if (!date) return 'Select Date';
    try {
      const parts = date.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10) - 1;
        const day = parts[2].padStart(2, '0');
        const monthShort = MONTHS[monthNum]?.slice(0, 3) || 'MTH';
        return `${day} ${monthShort} ${year}`;
      }
    } catch {
      // fallback
    }
    return date;
  })();

  const currentMonthIndex = MONTHS.indexOf(selectedMonth as any);

  const handlePrevMonth = () => {
    const prevIdx = (currentMonthIndex - 1 + MONTHS.length) % MONTHS.length;
    onSelectMonth(MONTHS[prevIdx]);
  };

  const handleNextMonth = () => {
    const nextIdx = (currentMonthIndex + 1) % MONTHS.length;
    onSelectMonth(MONTHS[nextIdx]);
  };

  return (
    <header className="w-full pb-4 border-b border-neutral-200/90 flex flex-col gap-3">
      {/* TOP ROW: BRANDING & TITLE + ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* BRANDING */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight">
                Time Calculator
              </h1>
              <span className="text-neutral-300">·</span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ${
                  hasSavedData
                    ? 'text-emerald-800 bg-emerald-50 border border-emerald-200/70'
                    : 'text-neutral-500 bg-neutral-100 border border-neutral-200/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasSavedData ? 'bg-emerald-500' : 'bg-neutral-400'
                  }`}
                />
                {hasSavedData ? 'Saved' : 'Not saved'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 hidden sm:block">
              Calculate and record daily work hours & overtime
            </p>
          </div>
        </div>

        {/* TOP ACTION BUTTONS: SAVE, EXCEL, CLEAR, RESET (Moved to Header) */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* SAVE BUTTON */}
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Save daily record and proceed"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE</span>
          </button>

          {/* EXCEL BUTTON */}
          <button
            type="button"
            onClick={onExportMonthExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title={`Download ${selectedMonth} styled Excel report (.xlsx)`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>EXCEL</span>
          </button>

          {/* CLEAR MONTH BUTTON */}
          <button
            type="button"
            onClick={onClearCurrentMonth}
            className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 border border-neutral-200 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title={`Clear ${selectedMonth} entries`}
          >
            <RotateCcw className="w-3 h-3 text-neutral-400" />
            <span>CLEAR ({selectedMonth.slice(0, 3)})</span>
          </button>

          {/* STATUS NOTICE BADGE */}
          {lastSavedNotice && (
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-1 rounded-md">
              ✓ {lastSavedNotice}
            </span>
          )}
        </div>
      </div>

      {/* SECOND ROW: DATE PICKER & MONTH SELECTOR BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
        <div className="flex flex-wrap items-center gap-3">
          {/* DATE SELECTOR */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              DATE:
            </span>
            <div
              onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
              className="relative flex items-center gap-2 px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-xs font-semibold font-mono tracking-tight text-neutral-900 tabular-nums">
                {formattedDateDisplay}
              </span>
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Select Date"
              />
            </div>
          </div>

          {/* MONTH SELECTOR WITH PREV/NEXT ARROWS */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              MONTH:
            </span>
            <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-lg shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors border-r border-neutral-200"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="relative flex items-center px-2.5 py-1">
                <select
                  value={selectedMonth}
                  onChange={(e) => onSelectMonth(e.target.value)}
                  className="appearance-none bg-transparent pr-5 text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer uppercase tracking-wider"
                  aria-label="Select Month"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors border-l border-neutral-200"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-neutral-400 hidden md:block">
          Active Month: <span className="font-semibold text-neutral-700">{selectedMonth}</span>
        </div>
      </div>
    </header>
  );
};
