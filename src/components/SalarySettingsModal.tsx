import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Building,
  Calendar,
  Check,
  Clock,
  Coins,
  DollarSign,
  HelpCircle,
  IndianRupee,
  MinusCircle,
  Receipt,
  Save,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { MonthData, SalarySettings } from '../types';
import { calculateMonthlySalary, parseDutyHoursToDecimal } from '../utils/salaryCalculator';

interface SalarySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  monthData: MonthData;
  settings: SalarySettings;
  onSaveSettings: (newSettings: SalarySettings) => void;
}

const WEEKLY_OFF_OPTIONS = [
  { value: 'Sunday', label: 'Sunday (Standard)' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Monday', label: 'Monday' },
  { value: 'Friday', label: 'Friday' },
];

const PRESET_SALARIES = [20000, 25000, 30000, 35000, 40000, 50000];
const PRESET_DUTY_HOURS = ['08:00', '08:30', '09:00', '09:30'];

export const SalarySettingsModal: React.FC<SalarySettingsModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  monthData,
  settings,
  onSaveSettings,
}) => {
  const [basicSalaryInput, setBasicSalaryInput] = useState<string>(
    settings.basicSalary ? settings.basicSalary.toString() : ''
  );
  const [dutyHoursInput, setDutyHoursInput] = useState<string>(
    settings.dailyDutyHours || '08:30'
  );
  const [weeklyOffInput, setWeeklyOffInput] = useState<string>(
    settings.weeklyOff || 'Sunday'
  );

  // Default Deductions settings state
  const [defaultPfInput, setDefaultPfInput] = useState<string>(
    (settings.defaultPf ?? 0).toString()
  );
  const [defaultEsiInput, setDefaultEsiInput] = useState<string>(
    (settings.defaultEsi ?? 0).toString()
  );
  const [defaultAdvanceInput, setDefaultAdvanceInput] = useState<string>(
    (settings.defaultAdvance ?? 0).toString()
  );
  const [defaultOtherDeductionInput, setDefaultOtherDeductionInput] = useState<string>(
    (settings.defaultOtherDeduction ?? 0).toString()
  );

  // Bank Transfer one-time setting
  const [bankTransferInput, setBankTransferInput] = useState<string>(
    settings.bankTransferAmount !== undefined && settings.bankTransferAmount > 0
      ? settings.bankTransferAmount.toString()
      : (settings.basicSalary ? settings.basicSalary.toString() : '')
  );

  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);
  const [initialSnapshot, setInitialSnapshot] = useState({
    basicSalary: '',
    dutyHours: '08:30',
    weeklyOff: 'Sunday',
    defaultPf: '0',
    defaultEsi: '0',
    defaultAdvance: '0',
    defaultOtherDeduction: '0',
    bankTransfer: '',
  });

  // Sync state when props change
  useEffect(() => {
    if (isOpen) {
      const basicVal = settings.basicSalary ? settings.basicSalary.toString() : '';
      const dutyVal = settings.dailyDutyHours || '08:30';
      const offVal = settings.weeklyOff || 'Sunday';
      const pfVal = (settings.defaultPf ?? 0).toString();
      const esiVal = (settings.defaultEsi ?? 0).toString();
      const advVal = (settings.defaultAdvance ?? 0).toString();
      const otherVal = (settings.defaultOtherDeduction ?? 0).toString();
      const bankVal =
        settings.bankTransferAmount !== undefined && settings.bankTransferAmount > 0
          ? settings.bankTransferAmount.toString()
          : (settings.basicSalary ? settings.basicSalary.toString() : '');

      setBasicSalaryInput(basicVal);
      setDutyHoursInput(dutyVal);
      setWeeklyOffInput(offVal);
      setDefaultPfInput(pfVal);
      setDefaultEsiInput(esiVal);
      setDefaultAdvanceInput(advVal);
      setDefaultOtherDeductionInput(otherVal);
      setBankTransferInput(bankVal);

      setInitialSnapshot({
        basicSalary: basicVal,
        dutyHours: dutyVal,
        weeklyOff: offVal,
        defaultPf: pfVal,
        defaultEsi: esiVal,
        defaultAdvance: advVal,
        defaultOtherDeduction: otherVal,
        bankTransfer: bankVal,
      });

      setSavedNotice(false);
      setShowDiscardConfirm(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const isDirty =
    basicSalaryInput !== initialSnapshot.basicSalary ||
    dutyHoursInput !== initialSnapshot.dutyHours ||
    weeklyOffInput !== initialSnapshot.weeklyOff ||
    defaultPfInput !== initialSnapshot.defaultPf ||
    defaultEsiInput !== initialSnapshot.defaultEsi ||
    defaultAdvanceInput !== initialSnapshot.defaultAdvance ||
    defaultOtherDeductionInput !== initialSnapshot.defaultOtherDeduction ||
    bankTransferInput !== initialSnapshot.bankTransfer;

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const currentNumericSalary = Math.max(0, parseInt(basicSalaryInput, 10) || 0);

  const previewSettings: SalarySettings = {
    basicSalary: currentNumericSalary,
    dailyDutyHours: dutyHoursInput.trim() || '08:30',
    weeklyOff: weeklyOffInput,
    overtimeMultiplier: 1,
    defaultPf: Math.max(0, parseInt(defaultPfInput, 10) || 0),
    defaultEsi: Math.max(0, parseInt(defaultEsiInput, 10) || 0),
    defaultAdvance: Math.max(0, parseInt(defaultAdvanceInput, 10) || 0),
    defaultOtherDeduction: Math.max(0, parseInt(defaultOtherDeductionInput, 10) || 0),
    bankTransferAmount: Math.max(0, parseInt(bankTransferInput, 10) || 0),
  };

  const salaryCalc = calculateMonthlySalary(selectedMonth, monthData, previewSettings);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: SalarySettings = {
      basicSalary: currentNumericSalary,
      dailyDutyHours: dutyHoursInput.trim() || '08:30',
      weeklyOff: weeklyOffInput || 'Sunday',
      overtimeMultiplier: 1,
      defaultPf: Math.max(0, parseInt(defaultPfInput, 10) || 0),
      defaultEsi: Math.max(0, parseInt(defaultEsiInput, 10) || 0),
      defaultAdvance: Math.max(0, parseInt(defaultAdvanceInput, 10) || 0),
      defaultOtherDeduction: Math.max(0, parseInt(defaultOtherDeductionInput, 10) || 0),
      bankTransferAmount: Math.max(0, parseInt(bankTransferInput, 10) || 0),
    };
    onSaveSettings(updated);
    setInitialSnapshot({
      basicSalary: basicSalaryInput,
      dutyHours: dutyHoursInput,
      weeklyOff: weeklyOffInput,
      defaultPf: defaultPfInput,
      defaultEsi: defaultEsiInput,
      defaultAdvance: defaultAdvanceInput,
      defaultOtherDeduction: defaultOtherDeductionInput,
      bankTransfer: bankTransferInput,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F6F7F9] sm:bg-neutral-900/60 sm:backdrop-blur-xs flex sm:items-center sm:justify-center overflow-y-auto sm:overflow-hidden sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl bg-white sm:border sm:border-neutral-200/90 sm:rounded-2xl sm:shadow-2xl flex flex-col overflow-hidden animate-in sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* TOP MODAL HEADER BAR */}
        <header className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shadow-2xs shrink-0 text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleRequestClose}
              className="p-1.5 sm:hidden bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-700"
              title="Back to Calculator"
              aria-label="Back to Calculator"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex w-7 h-7 rounded-lg bg-neutral-800 text-emerald-400 items-center justify-center font-bold text-sm shadow-xs shrink-0 border border-neutral-700">
                ₹
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none flex items-center gap-1.5">
                <span>Salary Settings</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  {selectedMonth}
                </span>
              </h1>
            </div>
          </div>

          {/* TOP ACTIONS: VISIBLE CLOSE BUTTON */}
          <div className="flex items-center gap-2">
            {savedNotice && (
              <span className="px-2.5 py-1 bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-semibold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleRequestClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              title="Close"
              aria-label="Close Salary Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* MODAL BODY CONTENT - SCROLLABLE ON OVERFLOW */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F6F7F9]/50 sm:bg-neutral-50/30">
        {/* SECTION 1: SETTINGS FORM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-xs">
          {/* 1. BASIC SALARY */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              <span>Monthly Basic Salary</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-neutral-500 text-sm">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="500"
                value={basicSalaryInput}
                onChange={(e) => setBasicSalaryInput(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full pl-7 pr-3 py-2 bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg font-mono font-bold text-sm text-neutral-900 outline-none shadow-2xs"
              />
            </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {PRESET_SALARIES.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBasicSalaryInput(amt.toString())}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                      currentNumericSalary === amt
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
                    }`}
                  >
                    ₹{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* 2. DAILY DUTY HOURS */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Daily Duty Hours</span>
              </label>
              <input
                type="text"
                value={dutyHoursInput}
                onChange={(e) => setDutyHoursInput(e.target.value)}
                placeholder="08:30"
                className="w-full px-3 py-2 bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg font-mono font-bold text-sm text-neutral-900 text-center outline-none shadow-2xs"
              />
              <span className="block text-[10px] text-neutral-500 leading-tight">
                {dutyHoursInput} = {parseDutyHoursToDecimal(dutyHoursInput)} Hours / day
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {PRESET_DUTY_HOURS.map((dh) => (
                  <button
                    key={dh}
                    type="button"
                    onClick={() => setDutyHoursInput(dh)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                      dutyHoursInput === dh
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
                    }`}
                  >
                    {dh}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. WEEKLY OFF */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                <span>Weekly Off Day</span>
              </label>
              <select
                value={weeklyOffInput}
                onChange={(e) => setWeeklyOffInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg font-semibold text-xs text-neutral-900 outline-none shadow-2xs cursor-pointer"
              >
                {WEEKLY_OFF_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="block text-[10px] text-neutral-500 leading-tight">
                {weeklyOffInput}s are excluded from working days.
              </span>
            </div>
          </div>

          {/* SECTION 1B: DEFAULT DEDUCTIONS SETTINGS (SETTINGS LA DEDUCTIONS KKU THANIYA "Default" SETTING) */}
          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/90 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-rose-200/70">
              <div className="flex items-center gap-1.5">
                <MinusCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                  Deductions Settings
                </h3>
              </div>
            </div>
            <p className="text-[11px] text-neutral-600">
              Set standard default monthly deductions here. They automatically apply to calculations for every month.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Default PF */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                  Default PF
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={defaultPfInput}
                    onChange={(e) => setDefaultPfInput(e.target.value)}
                    placeholder="1800"
                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg font-mono font-bold text-xs text-neutral-900 outline-none shadow-2xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[0, 1800, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDefaultPfInput(amt.toString())}
                      className="px-1 py-0.2 rounded text-[9px] font-mono font-semibold bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200 cursor-pointer"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default ESI */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                  Default ESI
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={defaultEsiInput}
                    onChange={(e) => setDefaultEsiInput(e.target.value)}
                    placeholder="500"
                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg font-mono font-bold text-xs text-neutral-900 outline-none shadow-2xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[0, 500, 750].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDefaultEsiInput(amt.toString())}
                      className="px-1 py-0.2 rounded text-[9px] font-mono font-semibold bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200 cursor-pointer"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Advance */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                  Default Advance
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={defaultAdvanceInput}
                    onChange={(e) => setDefaultAdvanceInput(e.target.value)}
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg font-mono font-bold text-xs text-neutral-900 outline-none shadow-2xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[0, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDefaultAdvanceInput(amt.toString())}
                      className="px-1 py-0.2 rounded text-[9px] font-mono font-semibold bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200 cursor-pointer"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Other Deduction */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                  Default Other Ded.
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={defaultOtherDeductionInput}
                    onChange={(e) => setDefaultOtherDeductionInput(e.target.value)}
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg font-mono font-bold text-xs text-neutral-900 outline-none shadow-2xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[0, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDefaultOtherDeductionInput(amt.toString())}
                      className="px-1 py-0.2 rounded text-[9px] font-mono font-semibold bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200 cursor-pointer"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1C: BANK TRANSFER SETTING (PAYOUT SPLIT: BANK TRANSFER & CASH IN HAND) */}
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200/90 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-sky-200/70">
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-sky-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-950">
                  Bank Transfer Setting (Payout Split)
                </h3>
              </div>
            </div>
            <p className="text-[11px] text-neutral-600">
              Type the standard <strong>Bank Transfer amount</strong> once (e.g. Basic Salary). The remaining balance of Net Salary is automatically paid as <strong>Cash in Hand</strong>.
            </p>

            <div className="max-w-md space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                Bank Transfer Amount
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={bankTransferInput}
                  onChange={(e) => setBankTransferInput(e.target.value)}
                  placeholder="25000"
                  className="w-full pl-6 pr-3 py-2 bg-white border border-neutral-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded-lg font-mono font-bold text-sm text-neutral-900 outline-none shadow-2xs"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => setBankTransferInput(basicSalaryInput)}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 transition-colors cursor-pointer"
                  title="Match Basic Salary"
                >
                  = Basic Salary (₹{parseInt(basicSalaryInput, 10) ? parseInt(basicSalaryInput, 10).toLocaleString() : '0'})
                </button>
                {[20000, 25000, 30000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBankTransferInput(amt.toString())}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200 cursor-pointer"
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: LIVE SALARY BREAKDOWN & PAYSLIP FOR SELECTED MONTH */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="bg-neutral-900 text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Monthly Payslip — {selectedMonth} {salaryCalc.year}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* METRICS SUMMARY GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. TOTAL DAYS & WORKING DAYS */}
                <div className="p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Month Days
                  </span>
                  <span className="font-mono font-bold text-sm text-neutral-900">
                    {salaryCalc.totalDays} Days
                  </span>
                  <span className="block text-[9px] text-neutral-400 mt-0.5">
                    ({salaryCalc.weeklyOffCount} {previewSettings.weeklyOff}s Off)
                  </span>
                </div>

                {/* 2. WORKING DAYS */}
                <div className="p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Working Days
                  </span>
                  <span className="font-mono font-bold text-sm text-neutral-900">
                    {salaryCalc.workingDays} Days
                  </span>
                  <span className="block text-[9px] text-neutral-400 mt-0.5">
                    {salaryCalc.totalDays} - {salaryCalc.weeklyOffCount}
                  </span>
                </div>

                {/* 3. PER DAY SALARY */}
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Per Day Salary
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-950">
                    ₹{salaryCalc.perDaySalary.toLocaleString()}
                  </span>
                  <span className="block text-[9px] text-emerald-700 mt-0.5">
                    ₹{salaryCalc.basicSalary.toLocaleString()} ÷ {salaryCalc.workingDays}d
                  </span>
                </div>

                {/* 4. PER HOUR RATE */}
                <div className="p-2.5 bg-indigo-50/60 border border-indigo-200/80 rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                    Per Hour Rate
                  </span>
                  <span className="font-mono font-bold text-sm text-indigo-950">
                    ₹{salaryCalc.perHourRate.toLocaleString()}
                  </span>
                  <span className="block text-[9px] text-indigo-700 mt-0.5">
                    Per Day ÷ {salaryCalc.dailyDutyHoursDecimal}h
                  </span>
                </div>
              </div>

              {/* MOBILE ONLY: SALARY COMPONENTS IN CARD TYPE */}
              <div className="sm:hidden space-y-2.5">
                {/* 1. Basic Salary Card */}
                <div className="p-3 bg-neutral-50/80 border border-neutral-200/90 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-neutral-900 block">
                      Basic Salary (Earned)
                    </span>
                    <span className="text-[10px] text-neutral-500 block mt-0.5">
                      {salaryCalc.loggedDaysCount >= salaryCalc.workingDays
                        ? `Full Month (${salaryCalc.workingDays} Days)`
                        : `${salaryCalc.loggedDaysCount}d worked @ ₹${salaryCalc.perDaySalary}/day`}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-neutral-900 shrink-0 tabular-nums">
                    ₹{salaryCalc.earnedBasicSalary.toLocaleString()}
                  </span>
                </div>

                {/* 2. Overtime (OT) Pay Card */}
                <div className="p-3 bg-emerald-50/30 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-emerald-950 block">
                      Overtime (OT) Pay
                    </span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">
                      {salaryCalc.totalOtFormatted} ({((salaryCalc.totalOtMinutes / 60)).toFixed(2)}h) @ ₹{salaryCalc.perHourRate}/hr
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-800 shrink-0 tabular-nums">
                    + ₹{salaryCalc.otIncentive.toLocaleString()}
                  </span>
                </div>

                {/* 3. Early Incentive Card */}
                {salaryCalc.earlyIncentive !== 0 && (
                  <div className="p-3 bg-neutral-50/80 border border-neutral-200/90 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-neutral-900 block">
                        Early Incentive
                      </span>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        Manual Monthly Incentive
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold text-sm shrink-0 tabular-nums ${
                        salaryCalc.earlyIncentive > 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {salaryCalc.earlyIncentive > 0
                        ? `+ ₹${salaryCalc.earlyIncentive}`
                        : `- ₹${Math.abs(salaryCalc.earlyIncentive)}`}
                    </span>
                  </div>
                )}

                {/* 4. Bill Incentive Card */}
                {salaryCalc.billIncentive > 0 && (
                  <div className="p-3 bg-indigo-50/30 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-indigo-950 block">
                        Bill Incentive
                      </span>
                      <span className="text-[10px] text-indigo-700 block mt-0.5">
                        {salaryCalc.billCount} bills × ₹30
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-indigo-800 shrink-0 tabular-nums">
                      + ₹{salaryCalc.billIncentive.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* 5. Leave + Holiday Incentive Card */}
                {salaryCalc.leaveIncentive > 0 && (
                  <div className="p-3 bg-emerald-50/30 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-emerald-950 block">
                        Leave + Holiday Incentive
                      </span>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">
                        Bonus ({salaryCalc.leaveBonusDays || 0}d) + Sunday/Holiday ({salaryCalc.holidayWorkedDays || 0}d) = {(salaryCalc.totalLeaveHolidayDays || 0)} Days
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-emerald-800 shrink-0 tabular-nums">
                      + ₹{salaryCalc.leaveIncentive.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* 6. Deductions Card */}
                {salaryCalc.totalDeductions > 0 && (
                  <div className="p-3 bg-rose-50/30 border border-rose-200/80 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-rose-950 block">
                        Total Deductions
                      </span>
                      <span className="text-[10px] text-rose-700 block mt-0.5 truncate">
                        PF ₹{salaryCalc.pf} · ESI ₹{salaryCalc.esi} · Adv ₹{salaryCalc.advance} · Leave Inc ₹{salaryCalc.otherDeduction}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-rose-800 shrink-0 tabular-nums">
                      − ₹{salaryCalc.totalDeductions.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* 7. Net Payable Salary Prominent Card */}
                <div className="p-3.5 bg-neutral-900 text-white rounded-xl shadow-xs border border-neutral-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                        NET PAYABLE SALARY
                      </span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        Total Earnings − Total Deductions
                      </span>
                    </div>
                    <span className="font-mono font-black text-xl text-emerald-400 tabular-nums">
                      ₹{salaryCalc.netSalary.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 8. Payout Split: Bank Transfer & Cash in Hand Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl">
                    <span className="font-bold text-[11px] text-sky-950 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                      <span>Bank Transfer</span>
                    </span>
                    <span className="block font-mono font-bold text-sm text-sky-900 mt-1 tabular-nums">
                      ₹{salaryCalc.bankTransferAmount.toLocaleString()}
                    </span>
                    <span className="block text-[9px] text-sky-600 mt-0.5">
                      Direct Account
                    </span>
                  </div>

                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="font-bold text-[11px] text-emerald-950 flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Cash in Hand</span>
                    </span>
                    <span className="block font-mono font-bold text-sm text-emerald-900 mt-1 tabular-nums">
                      ₹{salaryCalc.cashInHandAmount.toLocaleString()}
                    </span>
                    <span className="block text-[9px] text-emerald-600 mt-0.5">
                      Balance Cash
                    </span>
                  </div>
                </div>
              </div>

              {/* DESKTOP ONLY: EARNINGS & DEDUCTIONS DETAILED TABLE */}
              <div className="hidden sm:block border border-neutral-200/90 rounded-xl overflow-x-auto text-xs">
                <table className="w-full min-w-[500px] sm:min-w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                      <th className="p-2 sm:p-2.5 whitespace-nowrap">Salary Component</th>
                      <th className="p-2 sm:p-2.5 text-center whitespace-nowrap">Basis / Calculation</th>
                      <th className="p-2 sm:p-2.5 text-right whitespace-nowrap">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium">
                    {/* Basic Pay Earned */}
                    <tr className="hover:bg-neutral-50/70">
                      <td className="p-2 sm:p-2.5">
                        <span className="font-bold text-neutral-900 block whitespace-nowrap">
                          Basic Salary (Earned)
                        </span>
                        <span className="text-[10px] text-neutral-500 block whitespace-nowrap">
                          {salaryCalc.loggedDaysCount} days worked @ ₹{salaryCalc.perDaySalary}/day
                        </span>
                      </td>
                      <td className="p-2 sm:p-2.5 text-center font-mono text-neutral-600 text-[11px] whitespace-nowrap">
                        {salaryCalc.loggedDaysCount >= salaryCalc.workingDays
                          ? `Full Month (${salaryCalc.workingDays} Days)`
                          : `${salaryCalc.loggedDaysCount}d × ₹${salaryCalc.perDaySalary}`}
                      </td>
                      <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-neutral-900 tabular-nums whitespace-nowrap">
                        ₹{salaryCalc.earnedBasicSalary.toLocaleString()}
                      </td>
                    </tr>

                    {/* Overtime (OT) Pay */}
                    <tr className="hover:bg-neutral-50/70 bg-emerald-50/20">
                      <td className="p-2 sm:p-2.5">
                        <span className="font-bold text-emerald-900 block whitespace-nowrap">
                          Overtime (OT) Pay
                        </span>
                        <span className="text-[10px] text-emerald-700 block whitespace-nowrap">
                          Total OT: {salaryCalc.totalOtFormatted} ({((salaryCalc.totalOtMinutes / 60)).toFixed(2)} Hours)
                        </span>
                      </td>
                      <td className="p-2 sm:p-2.5 text-center font-mono text-emerald-800 text-[11px] whitespace-nowrap">
                        {((salaryCalc.totalOtMinutes / 60)).toFixed(2)} hrs × ₹{salaryCalc.perHourRate}/hr
                      </td>
                      <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-emerald-800 tabular-nums whitespace-nowrap">
                        + ₹{salaryCalc.otIncentive.toLocaleString()}
                      </td>
                    </tr>

                    {/* Early Incentive */}
                    {salaryCalc.earlyIncentive !== 0 && (
                      <tr className="hover:bg-neutral-50/70">
                        <td className="p-2 sm:p-2.5">
                          <span className="font-bold text-neutral-900 block whitespace-nowrap">
                            Early Incentive
                          </span>
                          <span className="text-[10px] text-neutral-500 block whitespace-nowrap">
                            Manual Monthly Incentive
                          </span>
                        </td>
                        <td className="p-2 sm:p-2.5 text-center font-mono text-neutral-600 text-[11px] whitespace-nowrap">
                          Monthly Total
                        </td>
                        <td
                          className={`p-2 sm:p-2.5 text-right font-mono font-bold tabular-nums whitespace-nowrap ${
                            salaryCalc.earlyIncentive > 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {salaryCalc.earlyIncentive > 0
                            ? `+ ₹${salaryCalc.earlyIncentive}`
                            : `- ₹${Math.abs(salaryCalc.earlyIncentive)}`}
                        </td>
                      </tr>
                    )}

                    {/* Bill Incentive */}
                    {salaryCalc.billIncentive > 0 && (
                      <tr className="hover:bg-neutral-50/70 bg-indigo-50/20">
                        <td className="p-2 sm:p-2.5">
                          <span className="font-bold text-indigo-950 block whitespace-nowrap">
                            Bill Incentive
                          </span>
                          <span className="text-[10px] text-indigo-700 block whitespace-nowrap">
                            Manual Monthly Incentive
                          </span>
                        </td>
                        <td className="p-2 sm:p-2.5 text-center font-mono text-indigo-800 text-[11px] whitespace-nowrap">
                          Monthly Total
                        </td>
                        <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-indigo-800 tabular-nums whitespace-nowrap">
                          + ₹{salaryCalc.billIncentive.toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {/* Leave + Holiday Incentive */}
                    {salaryCalc.leaveIncentive > 0 && (
                      <tr className="hover:bg-neutral-50/70 bg-emerald-50/20">
                        <td className="p-2 sm:p-2.5">
                          <span className="font-bold text-emerald-950 block whitespace-nowrap">
                            Leave + Holiday Incentive
                          </span>
                          <span className="text-[10px] text-emerald-700 block whitespace-nowrap">
                            Bonus ({salaryCalc.leaveBonusDays || 0}d) + Sunday/Holiday ({salaryCalc.holidayWorkedDays || 0}d) = {(salaryCalc.totalLeaveHolidayDays || 0)} Days
                          </span>
                        </td>
                        <td className="p-2 sm:p-2.5 text-center font-mono text-emerald-800 text-[11px] whitespace-nowrap">
                          {(salaryCalc.totalLeaveHolidayDays || 0)} × ₹{salaryCalc.perDaySalary}
                        </td>
                        <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-emerald-800 tabular-nums whitespace-nowrap">
                          + ₹{salaryCalc.leaveIncentive.toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {/* Deductions Subtotal in Table */}
                    {salaryCalc.totalDeductions > 0 && (
                      <tr className="hover:bg-neutral-50/70 bg-rose-50/20">
                        <td className="p-2 sm:p-2.5">
                          <span className="font-bold text-rose-950 block whitespace-nowrap">
                            Deductions (PF, ESI, Adv, Leave Inc)
                          </span>
                          <span className="text-[10px] text-rose-700 block whitespace-nowrap">
                            PF ₹{salaryCalc.pf} · ESI ₹{salaryCalc.esi} · Adv ₹{salaryCalc.advance} · Leave Inc ₹{salaryCalc.otherDeduction}
                          </span>
                        </td>
                        <td className="p-2 sm:p-2.5 text-center font-mono text-rose-800 text-[11px] whitespace-nowrap">
                          Total Deductions
                        </td>
                        <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-rose-800 tabular-nums whitespace-nowrap">
                          − ₹{salaryCalc.totalDeductions.toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {/* NET PAYABLE SALARY ROW */}
                    <tr className="bg-neutral-900 text-white font-bold border-t-2 border-neutral-950">
                      <td className="p-2 sm:p-3">
                        <span className="text-xs sm:text-sm uppercase tracking-wider block whitespace-nowrap">
                          NET PAYABLE SALARY
                        </span>
                        <span className="text-[10px] text-neutral-400 font-normal block whitespace-nowrap">
                          Total Earnings − Total Deductions
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-center font-mono text-xs text-neutral-300 whitespace-nowrap">
                        <span>
                          {selectedMonth} {salaryCalc.year} Total
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-right font-mono text-base sm:text-xl font-extrabold text-emerald-400 tabular-nums whitespace-nowrap">
                        ₹{salaryCalc.netSalary.toLocaleString()}
                      </td>
                    </tr>

                    {/* PAYOUT SPLIT: BANK TRANSFER & CASH IN HAND */}
                    <tr className="bg-sky-50/70 text-sky-950 font-semibold border-t border-sky-200">
                      <td className="p-2 sm:p-2.5">
                        <span className="font-bold flex items-center gap-1.5 text-xs text-sky-900 whitespace-nowrap">
                          <Building className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                          <span>Bank Transfer</span>
                        </span>
                        <span className="text-[10px] text-sky-600 block whitespace-nowrap">
                          Direct Account Transfer (Basic Salary)
                        </span>
                      </td>
                      <td className="p-2 sm:p-2.5 text-center font-mono text-xs text-sky-800 whitespace-nowrap">
                        <span>
                          Bank Payout
                        </span>
                      </td>
                      <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-sky-900 text-xs sm:text-sm tabular-nums whitespace-nowrap">
                        ₹{salaryCalc.bankTransferAmount.toLocaleString()}
                      </td>
                    </tr>

                    <tr className="bg-emerald-50/60 text-emerald-950 font-semibold border-t border-emerald-200">
                      <td className="p-2 sm:p-2.5">
                        <span className="font-bold flex items-center gap-1.5 text-xs text-emerald-900 whitespace-nowrap">
                          <Banknote className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Cash in Hand</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 block whitespace-nowrap">
                          Balance Paid in Cash (Net Salary − Bank Transfer)
                        </span>
                      </td>
                      <td className="p-2 sm:p-2.5 text-center font-mono text-xs text-emerald-800 whitespace-nowrap">
                        <span>
                          Balance Cash
                        </span>
                      </td>
                      <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-emerald-800 text-xs sm:text-sm tabular-nums whitespace-nowrap">
                        ₹{salaryCalc.cashInHandAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        {/* MODAL BOTTOM ACTION BAR */}
        <footer className="sticky bottom-0 z-20 bg-white border-t border-neutral-200/90 px-4 sm:px-6 py-3 flex items-center justify-end sm:justify-between shadow-xs shrink-0">
          <span className="hidden sm:inline text-xs text-neutral-500 font-medium">
            Salary Calculator · HR Configuration
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleRequestClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-neutral-200 text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs text-center flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </footer>
      </div>

      {/* UNSAVED CHANGES CONFIRMATION MODAL */}
      {showDiscardConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowDiscardConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Discard Changes?</h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  You have unsaved changes in Salary Settings. Are you sure you want to discard them?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors cursor-pointer text-center"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
                className="flex-1 py-2 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors cursor-pointer shadow-xs text-center"
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
