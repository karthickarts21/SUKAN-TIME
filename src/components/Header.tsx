import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Cloud,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sliders,
  Smartphone,
  User,
  Wallet,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { MONTHS } from '../utils/storage';
import { usePWAInstall } from '../hooks/usePWAInstall';

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
  onOpenSalarySettings?: () => void;
  lastSavedNotice?: string;
  currentUser?: FirebaseUser | null;
  onOpenAuth?: () => void;
  isSyncing?: boolean;
  syncStatus?: 'connected' | 'syncing' | 'offline' | 'error' | 'disconnected';
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
  onOpenSalarySettings,
  currentUser,
  onOpenAuth,
  isSyncing = false,
  syncStatus = 'connected',
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-dropdown]')) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

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

  // Render Top-Right Profile Icon Menu with Cloud Sync, Salary Settings, Report
  const renderProfileMenu = () => (
    <div className="relative shrink-0" data-profile-dropdown="true">
      <button
        type="button"
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer group"
        title="Profile Menu (Cloud Sync, Salary Settings, Reports)"
        aria-expanded={isProfileOpen}
      >
        {/* User Avatar Circle */}
        <div className="w-6 h-6 rounded-lg bg-neutral-800 text-emerald-400 border border-neutral-700 flex items-center justify-center text-xs font-bold font-mono">
          {currentUser?.email ? currentUser.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
        </div>

        {/* Username/Email label on desktop */}
        <span className="hidden sm:inline text-xs font-bold tracking-tight text-neutral-200 group-hover:text-white max-w-[100px] truncate">
          {currentUser?.email ? currentUser.email.split('@')[0] : 'Menu'}
        </span>

        <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-white transition-transform" />

        {/* Live sync status dot */}
        <span
          className={`w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5 border-2 border-white ${
            syncStatus === 'error'
              ? 'bg-rose-500'
              : syncStatus === 'offline'
              ? 'bg-neutral-400'
              : syncStatus === 'syncing' || isSyncing
              ? 'bg-amber-500 animate-ping'
              : currentUser
              ? 'bg-emerald-500'
              : 'bg-neutral-400'
          }`}
          title={`Cloud: ${syncStatus.toUpperCase()}`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isProfileOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-neutral-200/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
          {/* USER INFO / CLOUD SYNC ITEM */}
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(false);
              onOpenAuth?.();
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-3 cursor-pointer group border-b border-neutral-100"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 group-hover:text-emerald-950">
                  Cloud Sync
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    currentUser
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {currentUser ? 'Active' : 'Offline'}
                </span>
              </div>
              <span className="block text-[11px] text-neutral-500 truncate">
                {currentUser?.email || 'Sign in to sync across devices'}
              </span>
            </div>
          </button>

          {/* SALARY SETTINGS ITEM */}
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(false);
              onOpenSalarySettings?.();
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-3 cursor-pointer group mt-1"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center shrink-0 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-neutral-900 group-hover:text-neutral-950">
                Salary Settings
              </span>
              <span className="block text-[11px] text-neutral-500">
                Basic Pay, Duty Hours & Deductions
              </span>
            </div>
          </button>

          {/* INSTALL BROTIME PWA ITEM */}
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                promptInstall();
              }}
              className="w-full text-left p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80 transition-colors flex items-center gap-3 cursor-pointer group mt-1"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-amber-950">
                  Install BroTime App
                </span>
                <span className="block text-[10px] text-amber-700">
                  Add to Home Screen (Standalone App)
                </span>
              </div>
            </button>
          )}

          {/* REPORTS SUBHEADER */}
          <div className="px-2.5 pt-2 pb-1 mt-1 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Reports & Exports ({selectedMonth})
            </span>
          </div>

          {/* EXCEL REPORT */}
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(false);
              onExportExcel();
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-neutral-900 group-hover:text-emerald-950">
                Excel Spreadsheet
              </span>
              <span className="block text-[10px] text-neutral-500">.xlsx timesheet with formulas</span>
            </div>
          </button>

          {/* PDF REPORT */}
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(false);
              onExportPdf();
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-neutral-900 group-hover:text-rose-950">
                PDF Document
              </span>
              <span className="block text-[10px] text-neutral-500">.pdf printable report</span>
            </div>
          </button>

          {/* CLEAR MONTH (UTILITY) */}
          <div className="pt-1 mt-1 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                onClearCurrentMonth();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-rose-700 transition-colors flex items-center gap-2 cursor-pointer text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Clear {selectedMonth} Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="w-full pb-3 border-b border-neutral-200/90">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-4">
        {/* ROW 1: BRANDING + MOBILE PROFILE ICON */}
        <div className="flex items-center justify-between gap-2 w-full lg:w-auto">
          {/* BRANDING: Salary Calculator with logo.png */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <img
              src="/logo.png"
              alt="Salary Calculator Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0 bg-transparent border-0 shadow-none outline-none"
            />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight">
                  Salary Calculator
                </h1>
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

          {/* MOBILE ONLY: PROFILE MENU ON TOP RIGHT */}
          <div className="flex lg:hidden">
            {renderProfileMenu()}
          </div>
        </div>

        {/* ROW 2 (MOBILE) / INLINE CONTROLS (DESKTOP) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {/* DATE & MONTH IN A SINGLE LINE ON MOBILE (grid-cols-2) */}
          <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:flex lg:items-center lg:gap-3">
            {/* 1. DATE TEXT DISPLAY */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 bg-neutral-50/80 border border-neutral-200/70 rounded-lg min-w-0">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0">
                DATE:
              </span>
              <span className="text-xs font-bold font-mono tracking-tight text-neutral-900 tabular-nums truncate">
                {formattedDateDisplay}
              </span>
            </div>

            {/* 2. MONTH SELECTOR */}
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

          {/* DESKTOP ONLY: PROFILE MENU ON TOP RIGHT */}
          <div className="hidden lg:flex">
            {renderProfileMenu()}
          </div>
        </div>
      </div>
    </header>
  );
};


