import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { MONTHS } from '../utils/storage';

interface HeaderProps {
  date: string;
  onDateChange: (newDate: string) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  hasSavedData: boolean;
  onSave?: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onClearCurrentMonth: () => void;
  lastSavedNotice?: string;
}

export const Header: React.FC<HeaderProps> = ({
  date,
  onDateChange,
  selectedMonth,
  onSelectMonth,
  hasSavedData,
  onExportExcel,
  onExportPdf,
  onClearCurrentMonth,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-report-dropdown]')) {
        setIsReportOpen(false);
      }
    };
    if (isReportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isReportOpen]);

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

  // Render Action Buttons (REPORT & CLEAR)
  const renderActionButtons = (isMobile?: boolean) => (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {/* REPORT DROPDOWN BUTTON (Pops open right next to button without overlay) */}
      <div className="relative" data-report-dropdown="true">
        <button
          type="button"
          onClick={() => setIsReportOpen(!isReportOpen)}
          className="p-1.5 sm:px-3.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          title={`Download ${selectedMonth} Report`}
          aria-expanded={isReportOpen}
        >
          <FileText className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">REPORT</span>
          <ChevronDown className="hidden sm:inline w-3 h-3 transition-transform" />
        </button>

        {isReportOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-neutral-200/90 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
            <div className="px-2.5 py-1 mb-1 border-b border-neutral-100 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Export {selectedMonth}
              </span>
              <span className="text-[9px] text-neutral-400 font-mono">Select</span>
            </div>

            {/* EXCEL OPTION */}
            <button
              type="button"
              onClick={() => {
                setIsReportOpen(false);
                onExportExcel();
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-neutral-900 group-hover:text-emerald-950">
                  Excel Spreadsheet
                </span>
                <span className="block text-[10px] text-neutral-500">.xlsx with session formulas</span>
              </div>
            </button>

            {/* PDF OPTION */}
            <button
              type="button"
              onClick={() => {
                setIsReportOpen(false);
                onExportPdf();
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer group mt-0.5"
            >
              <div className="w-7 h-7 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-neutral-900 group-hover:text-rose-950">
                  PDF Document
                </span>
                <span className="block text-[10px] text-neutral-500">.pdf printable timesheet</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* CLEAR MONTH BUTTON */}
      <button
        type="button"
        onClick={onClearCurrentMonth}
        className="p-1.5 sm:px-3 sm:py-2 bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 border border-neutral-200 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
        title={`Clear ${selectedMonth} entries`}
      >
        <RotateCcw className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-neutral-500" />
        <span className="hidden sm:inline">CLEAR ({selectedMonth.slice(0, 3)})</span>
      </button>
    </div>
  );

  return (
    <header className="w-full pb-3 border-b border-neutral-200/90">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-4">
        {/* ROW 1: BRANDING + MOBILE ACTIONS */}
        <div className="flex items-center justify-between gap-2 w-full lg:w-auto">
          {/* BRANDING */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight">
                  Time Calculator
                </h1>
                {/* Only show Saved badge when saved, remove Not saved */}
                {hasSavedData && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md text-emerald-800 bg-emerald-50 border border-emerald-200/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Saved
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE ONLY: ACTION BUTTONS (REPORT & CLEAR) ON RIGHT OF BRANDING */}
          <div className="flex lg:hidden">
            {renderActionButtons(true)}
          </div>
        </div>

        {/* ROW 2 (MOBILE) / INLINE CONTROLS (DESKTOP) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {/* DATE & MONTH IN A SINGLE LINE ON MOBILE (grid-cols-2) */}
          <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:flex lg:items-center lg:gap-3">
            {/* 1. DATE SELECTOR */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 shrink-0">
                DATE:
              </span>
              <div
                onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
                className="relative flex-1 flex items-center justify-between gap-1.5 px-2 sm:px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 rounded-lg cursor-pointer transition-colors shadow-2xs min-w-0"
              >
                <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="text-xs font-semibold font-mono tracking-tight text-neutral-900 tabular-nums truncate">
                    {formattedDateDisplay}
                  </span>
                </div>
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

            {/* 2. MONTH SELECTOR (NO < & >, ONLY CLEAN DROPDOWN) */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 shrink-0">
                MONTH:
              </span>
              <div className="relative flex-1 flex items-center bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 rounded-lg px-2 sm:px-2.5 py-1.5 shadow-2xs transition-colors min-w-0">
                <select
                  value={selectedMonth}
                  onChange={(e) => onSelectMonth(e.target.value)}
                  className="appearance-none bg-transparent w-full text-left pr-4 text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer uppercase tracking-wider truncate"
                  aria-label="Select Month"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* DESKTOP ONLY: ACTION BUTTONS (REPORT & CLEAR) INLINE */}
          <div className="hidden lg:flex">
            {renderActionButtons(false)}
          </div>
        </div>
      </div>
    </header>
  );
};

