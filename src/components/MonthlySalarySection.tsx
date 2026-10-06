import React from 'react';
import {
  Award,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Edit3,
  FileCheck,
  FileText,
  HelpCircle,
  IndianRupee,
  MinusCircle,
  PieChart,
  PlusCircle,
  Receipt,
  RotateCcw,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';
import { MonthData, MonthSalaryData, SalarySettings } from '../types';
import { calculateMonthlySalary } from '../utils/salaryCalculator';

interface MonthlySalarySectionProps {
  selectedMonth: string;
  monthData: MonthData;
  settings: SalarySettings;
  onUpdateSalaryData: (updatedSalaryData: MonthSalaryData) => void;
  onOpenSalarySlip: () => void;
  onOpenSettings: () => void;
}

export const MonthlySalarySection: React.FC<MonthlySalarySectionProps> = ({
  selectedMonth,
  monthData,
  settings,
  onUpdateSalaryData,
  onOpenSalarySlip,
  onOpenSettings,
}) => {
  const salaryCalc = calculateMonthlySalary(selectedMonth, monthData, settings);
  const salaryData = monthData.salaryData || {};

  const [isEditingEarlyInc, setIsEditingEarlyInc] = React.useState<boolean>(
    salaryData.earlyIncentiveManual !== undefined
  );
  const [isEditingBillInc, setIsEditingBillInc] = React.useState<boolean>(
    salaryData.billIncentiveManual !== undefined
  );
  const [mobileBreakdownTab, setMobileBreakdownTab] = React.useState<'earnings' | 'deductions'>('earnings');

  const handleFieldChange = (field: keyof MonthSalaryData, val: string) => {
    if (val === '') {
      const copy = { ...salaryData };
      delete copy[field];
      onUpdateSalaryData(copy);
    } else {
      const num = Math.max(0, parseFloat(val) || 0);
      onUpdateSalaryData({
        ...salaryData,
        [field]: num,
      });
    }
  };

  const handleResetEarlyIncToAuto = () => {
    const copy = { ...salaryData };
    delete copy.earlyIncentiveManual;
    onUpdateSalaryData(copy);
    setIsEditingEarlyInc(false);
  };

  const handleResetBillIncToAuto = () => {
    const copy = { ...salaryData };
    delete copy.billIncentiveManual;
    onUpdateSalaryData(copy);
    setIsEditingBillInc(false);
  };

  const handleResetDeductionToDefault = (field: keyof MonthSalaryData) => {
    const copy = { ...salaryData };
    delete copy[field];
    onUpdateSalaryData(copy);
  };

  const handleResetAllDeductionsToDefault = () => {
    const copy = { ...salaryData };
    delete copy.pf;
    delete copy.esi;
    delete copy.advance;
    delete copy.otherDeduction;
    onUpdateSalaryData(copy);
  };

  return (
    <div className="w-full space-y-3.5 sm:space-y-4">
      {/* SECTION HEADER WITH TITLE & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-emerald-400 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-none">
                Monthly Salary Management
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Live automated HR earnings, incentives, leave bonuses, and deductions.
            </p>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSalarySlip}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Generate and view printable salary slip"
          >
            <Receipt className="w-4 h-4 text-white" />
            <span>VIEW SALARY SLIP</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3 py-1.5 sm:px-3 sm:py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold uppercase tracking-wider border border-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="Configure Basic Salary, Duty Hours, and Weekly Off"
          >
            <span>SETTINGS</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MOBILE ONLY: SINGLE CONSOLIDATED CARD (BASIC SALARY, TOTAL EARNINGS, TOTAL DEDUCTIONS) */}
      {/* ==================================================== */}
      <div className="lg:hidden space-y-2.5">
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-3 shadow-2xs">
          <div className="grid grid-cols-3 divide-x divide-neutral-200/80">
            {/* 1. BASIC SALARY */}
            <div className="px-2 first:pl-0 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Basic Pay
              </span>
              <span className="block font-mono font-extrabold text-sm sm:text-base text-neutral-900 mt-0.5 tabular-nums">
                ₹{salaryCalc.basicSalary.toLocaleString()}
              </span>
              <span className="block text-[9px] text-neutral-400 font-mono mt-0.5">
                ₹{salaryCalc.perDaySalary}/day
              </span>
            </div>

            {/* 2. TOTAL EARNINGS */}
            <div className="px-2 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Earnings
              </span>
              <span className="block font-mono font-extrabold text-sm sm:text-base text-emerald-700 mt-0.5 tabular-nums">
                ₹{salaryCalc.totalEarnings.toLocaleString()}
              </span>
              <span className="block text-[9px] text-emerald-600 font-medium mt-0.5">
                Basic+OT+Inc
              </span>
            </div>

            {/* 3. TOTAL DEDUCTIONS */}
            <div className="px-2 last:pr-0 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Deductions
              </span>
              <span className="block font-mono font-extrabold text-sm sm:text-base text-rose-700 mt-0.5 tabular-nums">
                ₹{salaryCalc.totalDeductions.toLocaleString()}
              </span>
              <span className="block text-[9px] text-rose-500 font-medium mt-0.5">
                PF+ESI+Adv
              </span>
            </div>
          </div>
        </div>

        {/* MOBILE ONLY: NET SALARY PROMINENT CARD */}
        <div className="bg-neutral-900 border border-neutral-900 rounded-2xl p-3 shadow-xs text-white">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              NET SALARY
            </span>
            <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-500/30">
              PAYABLE
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono font-black text-xl sm:text-2xl text-emerald-400 tabular-nums">
              ₹{salaryCalc.netSalary.toLocaleString()}
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">
              Earnings − Deductions
            </span>
          </div>

          {/* PAYOUT SPLIT: BANK TRANSFER & CASH IN HAND */}
          <div className="mt-2 pt-2 border-t border-neutral-800 grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            <div className="bg-neutral-800/90 px-2 py-1.5 rounded-lg border border-neutral-700/60">
              <span className="text-sky-300/80 block text-[8px] font-bold uppercase tracking-wider">🏦 Bank Transfer</span>
              <span className="text-sky-300 font-extrabold text-xs tabular-nums">
                ₹{salaryCalc.bankTransferAmount.toLocaleString()}
              </span>
            </div>
            <div className="bg-neutral-800/90 px-2 py-1.5 rounded-lg border border-neutral-700/60">
              <span className="text-emerald-300/80 block text-[8px] font-bold uppercase tracking-wider">💵 Cash in Hand</span>
              <span className="text-emerald-300 font-extrabold text-xs tabular-nums">
                ₹{salaryCalc.cashInHandAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* DESKTOP ONLY: 4 SEPARATE SUMMARY METRIC CARDS */}
      {/* ==================================================== */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* CARD 1: BASIC SALARY */}
        <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 truncate">
                BASIC SALARY
              </span>
              <Banknote className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            </div>
            <div className="mt-1">
              <span className="font-mono font-extrabold text-base sm:text-lg lg:text-xl text-neutral-900 tabular-nums">
                ₹{salaryCalc.basicSalary.toLocaleString()}
              </span>
              <span className="block text-[10px] text-neutral-500 font-medium">
                ₹{salaryCalc.perDaySalary}/day (@ {salaryCalc.workingDays}d)
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-neutral-200/60 flex items-center justify-between text-[10px] font-mono text-neutral-500">
            <span>Fixed Monthly</span>
            <span className="font-semibold text-neutral-700">{salaryCalc.workingDays} Work Days</span>
          </div>
        </div>

        {/* CARD 2: TOTAL EARNINGS */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 truncate">
                TOTAL EARNINGS
              </span>
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>
            <div className="mt-1">
              <span className="font-mono font-extrabold text-base sm:text-lg lg:text-xl text-emerald-950 tabular-nums">
                ₹{salaryCalc.totalEarnings.toLocaleString()}
              </span>
              <span className="block text-[10px] text-emerald-700 font-medium">
                Basic + OT + Incentives
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-emerald-200/60 flex items-center justify-between text-[10px] font-mono text-emerald-700">
            <span>Gross Earned</span>
            <span className="font-semibold text-emerald-800">
              +{salaryCalc.totalEarnings - salaryCalc.earnedBasicSalary >= 0 ? `₹${(salaryCalc.totalEarnings - salaryCalc.earnedBasicSalary).toLocaleString()} extra` : '₹0'}
            </span>
          </div>
        </div>

        {/* CARD 3: TOTAL DEDUCTIONS */}
        <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-800 truncate">
                TOTAL DEDUCTIONS
              </span>
              <MinusCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            </div>
            <div className="mt-1">
              <span className="font-mono font-extrabold text-base sm:text-lg lg:text-xl text-rose-950 tabular-nums">
                ₹{salaryCalc.totalDeductions.toLocaleString()}
              </span>
              <span className="block text-[10px] text-rose-700 font-medium">
                PF + ESI + Adv + Half Days
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-rose-200/60 flex items-center justify-between text-[10px] font-mono text-rose-700">
            <span>PF+ESI: ₹{(salaryCalc.pf + salaryCalc.esi).toLocaleString()}</span>
            <span className="font-semibold text-rose-800">Total: ₹{salaryCalc.totalDeductions.toLocaleString()}</span>
          </div>
        </div>

        {/* CARD 4: NET SALARY */}
        <div className="bg-neutral-900 border border-neutral-900 rounded-xl p-3 flex flex-col justify-between shadow-sm text-white">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400 truncate flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              NET SALARY
            </span>
            <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-500/30">
              PAYABLE
            </span>
          </div>
          <div className="mt-1.5">
            <span className="font-mono font-black text-xl sm:text-2xl text-emerald-400 tabular-nums">
              ₹{salaryCalc.netSalary.toLocaleString()}
            </span>
            <span className="block text-[10px] text-neutral-300 font-medium">
              Total Earnings − Total Deductions
            </span>
          </div>

          {/* PAYOUT SPLIT: BANK TRANSFER & CASH IN HAND */}
          <div className="mt-2 pt-1.5 border-t border-neutral-800 grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            <div className="bg-neutral-800/90 px-2 py-1 rounded border border-neutral-700/60">
              <span className="text-sky-300/80 block text-[8px] font-bold uppercase tracking-wider">🏦 Bank Transfer</span>
              <span className="text-sky-300 font-extrabold text-xs tabular-nums">
                ₹{salaryCalc.bankTransferAmount.toLocaleString()}
              </span>
            </div>
            <div className="bg-neutral-800/90 px-2 py-1 rounded border border-neutral-700/60">
              <span className="text-emerald-300/80 block text-[8px] font-bold uppercase tracking-wider">💵 Cash in Hand</span>
              <span className="text-emerald-300 font-extrabold text-xs tabular-nums">
                ₹{salaryCalc.cashInHandAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ATTENDANCE & INCENTIVE STATS STRIP BELOW CARDS */}
      <div className="bg-neutral-100/80 border border-neutral-200/80 rounded-xl px-3 py-2 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">WORKING DAYS:</span>
          <span className="font-bold text-neutral-900">{salaryCalc.workingDays}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">PRESENT:</span>
          <span className="font-bold text-emerald-800">{salaryCalc.presentDays}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">LEAVE:</span>
          <span className={`font-bold ${salaryCalc.leaveDays > 0 ? 'text-rose-700' : 'text-neutral-700'}`}>
            {salaryCalc.leaveDays}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">HALF DAYS:</span>
          <span className="font-bold text-neutral-700">{salaryCalc.halfDaysCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">OT:</span>
          <span className="font-bold text-indigo-700">{salaryCalc.totalOtFormatted}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">LEAVE INCENTIVE:</span>
          <span className={`font-bold ${salaryCalc.leaveIncentive > 0 ? 'text-emerald-700' : 'text-neutral-400'}`}>
            ₹{salaryCalc.leaveIncentive.toLocaleString()}
          </span>
        </div>
      </div>

      {/* MOBILE ONLY: 2 BUTTONS FOR EARNINGS & DEDUCTIONS */}
      <div className="lg:hidden flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 gap-1 mb-1">
        <button
          type="button"
          onClick={() => setMobileBreakdownTab('earnings')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
            mobileBreakdownTab === 'earnings'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 bg-transparent'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>EARNINGS</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileBreakdownTab('deductions')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
            mobileBreakdownTab === 'deductions'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 bg-transparent'
          }`}
        >
          <MinusCircle className="w-3.5 h-3.5" />
          <span>DEDUCTIONS</span>
        </button>
      </div>

      {/* 3 DETAILED CARDS: 1. EARNINGS | 2. LEAVE INCENTIVE | 3. DEDUCTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* ==================================================== */}
        {/* CARD 1: EARNINGS */}
        {/* ==================================================== */}
        <div
          className={`${
            mobileBreakdownTab === 'earnings' ? 'flex' : 'hidden'
          } lg:flex bg-white border border-neutral-200/90 rounded-xl p-3.5 flex-col justify-between shadow-2xs`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-100">
              <div className="flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  EARNINGS
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded font-bold">
                + Additions
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* 1. Basic Salary */}
              <div className="flex items-center justify-between py-0.5">
                <div>
                  <span className="font-semibold text-neutral-800 block">Basic Salary</span>
                  <span className="text-[10px] text-neutral-400">Fixed Monthly</span>
                </div>
                <span className="font-mono font-bold text-neutral-900 tabular-nums">
                  ₹{salaryCalc.earnedBasicSalary.toLocaleString()}
                </span>
              </div>

              {/* 2. Early Incentive (Auto from Monthly Daily Logs, with optional manual override) */}
              <div className="flex items-center justify-between py-1 border-b border-neutral-100/60">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-neutral-800">Early Incentive</span>
                    {salaryCalc.isEarlyIncentiveAuto ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Zap className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Auto (Daily Logs)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <span>Manual Override</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 block truncate">
                    {salaryCalc.isEarlyIncentiveAuto
                      ? 'Calculated from daily arrival & departure times'
                      : 'Manually entered for this month'}
                  </span>
                </div>

                {salaryCalc.isEarlyIncentiveAuto && !isEditingEarlyInc ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`font-mono font-bold text-xs tabular-nums ${
                        salaryCalc.earlyIncentive > 0
                          ? 'text-emerald-700'
                          : salaryCalc.earlyIncentive < 0
                          ? 'text-rose-700'
                          : 'text-neutral-500'
                      }`}
                    >
                      {salaryCalc.earlyIncentive > 0
                        ? `+ ₹${salaryCalc.earlyIncentive.toLocaleString()}`
                        : salaryCalc.earlyIncentive < 0
                        ? `- ₹${Math.abs(salaryCalc.earlyIncentive).toLocaleString()}`
                        : '₹0'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingEarlyInc(true)}
                      className="p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                      title="Override Early Incentive manually"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="relative w-22">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder={salaryCalc.autoEarlyIncentive.toString()}
                        value={salaryData.earlyIncentiveManual ?? ''}
                        onChange={(e) => handleFieldChange('earlyIncentiveManual', e.target.value)}
                        autoFocus
                        className="w-full pl-5 pr-1.5 py-1 bg-white border border-amber-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded font-mono font-bold text-xs text-right outline-none tabular-nums"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleResetEarlyIncToAuto}
                      className="px-1.5 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-emerald-50 text-neutral-700 hover:text-emerald-700 rounded border border-neutral-200 transition-colors flex items-center gap-0.5 cursor-pointer"
                      title="Reset to automatic calculation from Monthly Daily Logs"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Auto</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Bill Incentive: Number of bills x 30 = Total */}
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100/60">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-neutral-800">Bill Incentive</span>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      ₹30 / bill
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block truncate">
                    Type bills count: bills × ₹30
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-200 shadow-2xs">
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      placeholder="0"
                      value={
                        salaryData.billCount !== undefined
                          ? salaryData.billCount
                          : salaryCalc.billCount > 0
                          ? salaryCalc.billCount
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = val === '' ? undefined : Math.max(0, parseInt(val, 10) || 0);
                        const copy = { ...salaryData };
                        if (num === undefined) {
                          delete copy.billCount;
                          delete copy.billIncentiveManual;
                        } else {
                          copy.billCount = num;
                          copy.billIncentiveManual = num * 30;
                        }
                        onUpdateSalaryData(copy);
                      }}
                      className="w-14 sm:w-16 px-1.5 py-0.5 bg-white border border-neutral-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded font-mono font-bold text-xs text-center outline-none shadow-2xs"
                      aria-label="Number of bills"
                    />
                    <span className="text-[11px] font-mono font-bold text-neutral-500">
                      × 30 =
                    </span>
                    <span className="font-mono font-bold text-xs text-indigo-900 tabular-nums min-w-[55px] text-right">
                      ₹{salaryCalc.billIncentive.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Leave Incentive */}
              <div className="flex items-center justify-between py-0.5">
                <div>
                  <span className="font-semibold text-neutral-800 block">Leave Incentive</span>
                  <span className="text-[10px] text-neutral-400">2 Days Salary Bonus</span>
                </div>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    salaryCalc.leaveIncentive > 0 ? 'text-emerald-700' : 'text-neutral-400'
                  }`}
                >
                  ₹{salaryCalc.leaveIncentive.toLocaleString()}
                </span>
              </div>

              {/* 5. OT Incentive */}
              <div className="flex items-center justify-between py-0.5">
                <div>
                  <span className="font-semibold text-neutral-800 block">OT Incentive</span>
                  <span className="text-[10px] text-neutral-400">
                    {salaryCalc.totalOtFormatted} @ ₹{salaryCalc.perHourRate}/hr
                  </span>
                </div>
                <span className="font-mono font-bold text-indigo-700 tabular-nums">
                  ₹{salaryCalc.otIncentive.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* TOTAL EARNINGS FOOTER */}
          <div className="mt-3 pt-2.5 border-t border-neutral-200/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              TOTAL EARNINGS
            </span>
            <span className="font-mono font-extrabold text-sm sm:text-base text-emerald-800 tabular-nums">
              ₹{salaryCalc.totalEarnings.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CARD 2: LEAVE INCENTIVE CARD UI */}
        {/* ==================================================== */}
        <div
          className={`${
            mobileBreakdownTab === 'earnings' ? 'flex' : 'hidden'
          } lg:flex bg-white border border-neutral-200/90 rounded-xl p-3.5 flex-col justify-between shadow-2xs`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-100">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  LEAVE INCENTIVE
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                  salaryCalc.isLeaveIncentiveEligible
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                }`}
              >
                {salaryCalc.isLeaveIncentiveEligible ? 'Eligible' : 'Not Eligible'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-neutral-600">Working Days</span>
                <span className="font-mono font-bold text-neutral-900">{salaryCalc.workingDays}</span>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span className="text-neutral-600">Present</span>
                <span className="font-mono font-bold text-emerald-800">{salaryCalc.presentDays}</span>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span className="text-neutral-600">Leave</span>
                <span
                  className={`font-mono font-bold ${
                    salaryCalc.leaveDays > 0 ? 'text-rose-700' : 'text-neutral-900'
                  }`}
                >
                  {salaryCalc.leaveDays}
                </span>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span className="text-neutral-600">Eligibility</span>
                {salaryCalc.isLeaveIncentiveEligible ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✓ Eligible</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>✕ Not Eligible</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span className="text-neutral-600">Incentive Rule</span>
                <span className="font-mono font-bold text-neutral-800">
                  {salaryCalc.isLeaveIncentiveEligible ? '2 Days Salary' : 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* LEAVE INCENTIVE AMOUNT FOOTER */}
          <div className="mt-3 pt-2.5 border-t border-neutral-200/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Amount
            </span>
            <span
              className={`font-mono font-extrabold text-sm sm:text-base tabular-nums ${
                salaryCalc.leaveIncentive > 0 ? 'text-emerald-800' : 'text-neutral-400'
              }`}
            >
              ₹{salaryCalc.leaveIncentive.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CARD 3: DEDUCTIONS */}
        {/* ==================================================== */}
        <div
          className={`${
            mobileBreakdownTab === 'deductions' ? 'flex' : 'hidden'
          } lg:flex bg-white border border-neutral-200/90 rounded-xl p-3.5 flex-col justify-between shadow-2xs`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-100">
              <div className="flex items-center gap-1.5">
                <MinusCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  DEDUCTIONS
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-[10px] font-mono text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 rounded border border-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Configure Default Deductions in Settings"
                >
                  <Sliders className="w-2.5 h-2.5 text-neutral-500" />
                  <span>Defaults ⚙</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* 1. PF (Settings Only) */}
              <div className="flex items-center justify-between py-1 border-b border-neutral-100/60">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-neutral-800">PF</span>
                    <span className="text-[9px] font-mono font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                      Settings Only
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block">Provident Fund (Editable in Settings only)</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-xs text-neutral-900 tabular-nums">
                    ₹{salaryCalc.pf.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg border border-neutral-300 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Edit PF in Salary Settings"
                    aria-label="Edit PF in Salary Settings"
                  >
                    <Sliders className="w-3 h-3 text-neutral-600" />
                  </button>
                </div>
              </div>

              {/* 2. ESI (Settings Only) */}
              <div className="flex items-center justify-between py-1 border-b border-neutral-100/60">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-neutral-800">ESI</span>
                    <span className="text-[9px] font-mono font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                      Settings Only
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block">Employee State Ins. (Editable in Settings only)</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-xs text-neutral-900 tabular-nums">
                    ₹{salaryCalc.esi.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg border border-neutral-300 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Edit ESI in Salary Settings"
                    aria-label="Edit ESI in Salary Settings"
                  >
                    <Sliders className="w-3 h-3 text-neutral-600" />
                  </button>
                </div>
              </div>

              {/* 3. ADVANCE */}
              <div className="flex items-center justify-between py-0.5">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-neutral-800">ADVANCE</span>
                    {salaryCalc.isAdvanceDefault ? (
                      <span className="text-[9px] font-mono font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                        Default: ₹{salaryCalc.defaultAdvance.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Custom
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 block">Salary Advance</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="relative w-22">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder={salaryCalc.defaultAdvance.toString()}
                      value={salaryData.advance ?? ''}
                      onChange={(e) => handleFieldChange('advance', e.target.value)}
                      className={`w-full pl-5 pr-1.5 py-1 bg-neutral-50 hover:bg-white focus:bg-white border rounded font-mono font-bold text-xs text-right outline-none tabular-nums ${
                        !salaryCalc.isAdvanceDefault
                          ? 'border-amber-400 bg-amber-50/20'
                          : 'border-neutral-200 focus:border-neutral-900'
                      }`}
                    />
                  </div>
                  {!salaryCalc.isAdvanceDefault && (
                    <button
                      type="button"
                      onClick={() => handleResetDeductionToDefault('advance')}
                      className="p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                      title={`Reset Advance to Settings default (₹${salaryCalc.defaultAdvance})`}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* 4. HALF DAY DEDUCTION (Automatic) */}
              <div className="flex items-center justify-between py-0.5">
                <div>
                  <span className="font-semibold text-neutral-800 block">HALF DAY DEDUCTION</span>
                  <span className="text-[10px] text-neutral-400">
                    {salaryCalc.halfDaysCount} half day(s) × (Per Day ÷ 2)
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-700 tabular-nums">
                  ₹{salaryCalc.halfDayDeduction.toLocaleString()}
                </span>
              </div>

              {/* 5. OTHER DEDUCTION */}
              <div className="flex items-center justify-between py-0.5">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-neutral-800">OTHER DEDUCTION</span>
                    {salaryCalc.isOtherDeductionDefault ? (
                      <span className="text-[9px] font-mono font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                        Default: ₹{salaryCalc.defaultOtherDeduction.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Custom
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 block">Misc Deductions</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="relative w-22">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder={salaryCalc.defaultOtherDeduction.toString()}
                      value={salaryData.otherDeduction ?? ''}
                      onChange={(e) => handleFieldChange('otherDeduction', e.target.value)}
                      className={`w-full pl-5 pr-1.5 py-1 bg-neutral-50 hover:bg-white focus:bg-white border rounded font-mono font-bold text-xs text-right outline-none tabular-nums ${
                        !salaryCalc.isOtherDeductionDefault
                          ? 'border-amber-400 bg-amber-50/20'
                          : 'border-neutral-200 focus:border-neutral-900'
                      }`}
                    />
                  </div>
                  {!salaryCalc.isOtherDeductionDefault && (
                    <button
                      type="button"
                      onClick={() => handleResetDeductionToDefault('otherDeduction')}
                      className="p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                      title={`Reset Other Deduction to Settings default (₹${salaryCalc.defaultOtherDeduction})`}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RESET ALL DEDUCTIONS TO DEFAULT BUTTON */}
            {(!salaryCalc.isPfDefault ||
              !salaryCalc.isEsiDefault ||
              !salaryCalc.isAdvanceDefault ||
              !salaryCalc.isOtherDeductionDefault) && (
              <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetAllDeductionsToDefault}
                  className="text-[10px] font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                  title="Reset all deductions for this month to Settings defaults"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset All to Settings Default</span>
                </button>
              </div>
            )}
          </div>

          {/* TOTAL DEDUCTIONS FOOTER */}
          <div className="mt-3 pt-2.5 border-t border-neutral-200/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              TOTAL DEDUCTIONS
            </span>
            <span className="font-mono font-extrabold text-sm sm:text-base text-rose-800 tabular-nums">
              ₹{salaryCalc.totalDeductions.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
