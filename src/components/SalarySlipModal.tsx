import React, { useState } from 'react';
import {
  Award,
  Banknote,
  Calendar,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  MinusCircle,
  PlusCircle,
  Printer,
  Receipt,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { MonthData, SalarySettings } from '../types';
import { calculateMonthlySalary } from '../utils/salaryCalculator';
import { exportSalarySlipPdf } from '../utils/pdfExporter';

interface SalarySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  monthData: MonthData;
  settings: SalarySettings;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  monthData,
  settings,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const salaryCalc = calculateMonthlySalary(selectedMonth, monthData, settings);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await exportSalarySlipPdf(selectedMonth, monthData, settings);
    } catch (err) {
      console.error('Failed to download salary slip PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL ACTION BAR (NOT VISIBLE WHEN PRINTED) */}
        <div className="px-4 sm:px-6 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Salary Payslip — {selectedMonth} {salaryCalc.year}
            </h2>
          </div>
          {/* HEADER BUTTONS: HIDDEN ON MOBILE, VISIBLE ON DESKTOP */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Download Salary Slip as a PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border border-neutral-700 items-center gap-1 cursor-pointer"
              title="Print this salary slip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SALARY SLIP CONTENT */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-5 text-neutral-900 flex-1 print:p-0 print:overflow-visible print:text-black">
          {/* SLIP HEADER */}
          <div className="text-center pb-4 border-b-2 border-neutral-900">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="w-6 h-6 rounded bg-neutral-900 text-white font-bold text-xs flex items-center justify-center">
                ⏱
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 uppercase">
                BroTime Salary Slip
              </h1>
            </div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
              Pay Period: {selectedMonth} {salaryCalc.year}
            </p>
          </div>

          {/* 1. ATTENDANCE SUMMARY */}
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 print:bg-transparent print:border-neutral-400">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2.5 pb-1 border-b border-neutral-200">
              ATTENDANCE SUMMARY
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono text-center">
              <div className="p-1.5 bg-white rounded border border-neutral-200/80">
                <span className="block text-[10px] text-neutral-500 font-bold uppercase">Working Days</span>
                <span className="font-bold text-sm text-neutral-900">{salaryCalc.workingDays}</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-neutral-200/80">
                <span className="block text-[10px] text-neutral-500 font-bold uppercase">Present</span>
                <span className="font-bold text-sm text-emerald-800">{salaryCalc.presentDays}</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-neutral-200/80">
                <span className="block text-[10px] text-neutral-500 font-bold uppercase">Leave</span>
                <span className="font-bold text-sm text-rose-700">{salaryCalc.leaveDays}</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-neutral-200/80">
                <span className="block text-[10px] text-neutral-500 font-bold uppercase">Half Days</span>
                <span className="font-bold text-sm text-neutral-800">{salaryCalc.halfDaysCount}</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-neutral-200/80 col-span-2 sm:col-span-1">
                <span className="block text-[10px] text-neutral-500 font-bold uppercase">OT Hours</span>
                <span className="font-bold text-sm text-indigo-700">{salaryCalc.totalOtFormatted}</span>
              </div>
            </div>
          </div>

          {/* 2. EARNINGS & DEDUCTIONS DUAL COLUMNS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* EARNINGS */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden print:border-neutral-400">
              <div className="bg-emerald-50 text-emerald-900 px-3 py-2 border-b border-emerald-200 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <span>EARNINGS</span>
                <span>AMOUNT</span>
              </div>
              <div className="p-3 space-y-2 text-xs divide-y divide-neutral-100">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700">Basic Salary</span>
                  <span className="font-mono font-bold text-neutral-900">
                    ₹{salaryCalc.earnedBasicSalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700">Early Incentive</span>
                  <span className="font-mono font-bold text-neutral-900">
                    ₹{salaryCalc.earlyIncentive.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700">
                    Bill Incentive{salaryCalc.billCount > 0 ? ` (${salaryCalc.billCount} bills × ₹30)` : ''}
                  </span>
                  <span className="font-mono font-bold text-neutral-900">
                    ₹{salaryCalc.billIncentive.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700">Leave Incentive</span>
                  <span className="font-mono font-bold text-emerald-800">
                    ₹{salaryCalc.leaveIncentive.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700">OT Incentive</span>
                  <span className="font-mono font-bold text-indigo-800">
                    ₹{salaryCalc.otIncentive.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t-2 border-neutral-200 font-bold text-neutral-900">
                  <span className="uppercase text-[11px]">TOTAL EARNINGS</span>
                  <span className="font-mono font-extrabold text-sm text-emerald-800">
                    ₹{salaryCalc.totalEarnings.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* DEDUCTIONS */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden print:border-neutral-400">
              <div className="bg-rose-50 text-rose-900 px-3 py-2 border-b border-rose-200 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <span>DEDUCTIONS</span>
                <span>AMOUNT</span>
              </div>
              <div className="p-3 space-y-2 text-xs divide-y divide-neutral-100">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700">PF</span>
                  <span className="font-mono font-bold text-neutral-900">
                    ₹{salaryCalc.pf.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700">ESI</span>
                  <span className="font-mono font-bold text-neutral-900">
                    ₹{salaryCalc.esi.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700">Advance</span>
                  <span className="font-mono font-bold text-neutral-900">
                    ₹{salaryCalc.advance.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700">Half Day Deduction</span>
                  <span className="font-mono font-bold text-rose-700">
                    ₹{salaryCalc.halfDayDeduction.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700">Other Deduction</span>
                  <span className="font-mono font-bold text-neutral-900">
                    ₹{salaryCalc.otherDeduction.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t-2 border-neutral-200 font-bold text-neutral-900">
                  <span className="uppercase text-[11px]">TOTAL DEDUCTIONS</span>
                  <span className="font-mono font-extrabold text-sm text-rose-800">
                    ₹{salaryCalc.totalDeductions.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. NET SALARY BOX */}
          <div className="bg-neutral-900 text-white p-4 rounded-xl flex items-center justify-between print:bg-neutral-100 print:text-black print:border print:border-neutral-900">
            <div>
              <span className="block text-xs uppercase tracking-widest text-neutral-400 font-bold print:text-neutral-700">
                NET PAYABLE SALARY
              </span>
              <span className="text-[10px] text-neutral-400 font-mono print:text-neutral-600">
                (Total Earnings − Total Deductions)
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-2xl sm:text-3xl text-emerald-400 tabular-nums print:text-neutral-950">
                ₹{salaryCalc.netSalary.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 3B. PAYOUT BREAKDOWN: BANK TRANSFER & CASH IN HAND */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-sky-50 border border-sky-200/90 rounded-xl p-3 flex items-center justify-between print:border-neutral-400">
              <div>
                <span className="block text-[10px] uppercase font-bold text-sky-900 tracking-wider">
                  🏦 Bank Transfer
                </span>
                <span className="text-[10px] text-sky-700">Direct Account Payout</span>
              </div>
              <span className="font-mono font-bold text-sm sm:text-base text-sky-950 tabular-nums">
                ₹{salaryCalc.bankTransferAmount.toLocaleString()}
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl p-3 flex items-center justify-between print:border-neutral-400">
              <div>
                <span className="block text-[10px] uppercase font-bold text-emerald-900 tracking-wider">
                  💵 Cash in Hand
                </span>
                <span className="text-[10px] text-emerald-700">Balance Cash Payout</span>
              </div>
              <span className="font-mono font-bold text-sm sm:text-base text-emerald-950 tabular-nums">
                ₹{salaryCalc.cashInHandAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* FOOTER SIGNATURES */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs text-neutral-500">
            <div className="border-t border-neutral-300 pt-2">
              <span className="font-semibold text-neutral-700">Employee Signature</span>
            </div>
            <div className="border-t border-neutral-300 pt-2">
              <span className="font-semibold text-neutral-700">HR / Employer Authorized Signature</span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER BUTTONS (HIDDEN ON PRINT) */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-200/80 bg-neutral-50 flex items-center justify-end sm:justify-between shrink-0 print:hidden">
          <span className="hidden sm:inline text-xs text-neutral-500 font-medium">
            Monthly Payslip
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-neutral-200 text-center"
            >
              CLOSE
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
