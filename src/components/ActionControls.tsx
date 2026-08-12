import React from 'react';

interface ActionControlsProps {
  onSave: () => void;
  onClearCurrentMonth: () => void;
  onResetAllData: () => void;
  onExportMonthExcel: () => void;
  onLogCurrentDayRecord?: () => void;
  lastSavedAt?: string;
  selectedMonth: string;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  onSave,
  onClearCurrentMonth,
  onResetAllData,
  onExportMonthExcel,
  onLogCurrentDayRecord,
  lastSavedAt,
  selectedMonth,
}) => {
  return (
    <div className="w-full mt-6 space-y-4">
      {/* Primary Action Row */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onSave}
          className="px-8 py-2.5 bg-black text-white font-black text-sm uppercase tracking-widest border-2 border-black hover:bg-gray-800 transition-colors shadow-md active:translate-y-0.5"
        >
          SAVE
        </button>

        {onLogCurrentDayRecord && (
          <button
            type="button"
            onClick={onLogCurrentDayRecord}
            className="px-6 py-2.5 bg-white text-black font-black text-sm uppercase tracking-widest border-2 border-black hover:bg-gray-100 transition-colors active:translate-y-0.5"
            title="Log these times to the monthly day-by-day record table (Dates 1 to 31)"
          >
            LOG ENTRY TO DAY TABLE
          </button>
        )}

        <button
          type="button"
          onClick={onExportMonthExcel}
          className="px-6 py-2.5 bg-green-700 text-white font-black text-sm uppercase tracking-wider border-2 border-green-900 hover:bg-green-800 transition-colors shadow-sm active:translate-y-0.5 flex items-center gap-1.5"
          title={`Download ${selectedMonth} monthly report in Excel (.xlsx) format`}
        >
          <span>📊</span> EXCEL REPORT ({selectedMonth})
        </button>

        <button
          type="button"
          onClick={onClearCurrentMonth}
          className="px-5 py-2.5 bg-white text-gray-800 font-bold text-sm uppercase tracking-wider border border-black hover:bg-gray-100 transition-colors active:translate-y-0.5"
        >
          CLEAR ({selectedMonth})
        </button>

        <button
          type="button"
          onClick={onResetAllData}
          className="px-4 py-2.5 text-xs font-bold text-red-700 uppercase tracking-wider hover:underline"
          title="Delete saved data for all 12 months"
        >
          RESET ALL DATA
        </button>
      </div>

      {/* Save Status Banner */}
      <div className="text-center text-xs font-mono text-gray-600">
        {lastSavedAt ? (
          <span className="inline-block bg-gray-100 border border-gray-300 px-3 py-1 font-semibold">
            Status: <strong className="text-black">Saved</strong> ({lastSavedAt})
          </span>
        ) : (
          <span className="text-gray-500">Auto-save enabled</span>
        )}
      </div>

      {/* Reference note matching sketch */}
      <div className="text-center pt-2 border-t border-dashed border-gray-300">
        <p className="text-xs font-black uppercase tracking-widest text-black">
          SAVE AAGANUM DATE 1 LA IRUNTHU 31 VARAI
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          (Monthly Time Sheet — Save daily logs from Date 1 to 31 for {selectedMonth})
        </p>
      </div>
    </div>
  );
};
