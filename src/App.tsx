import React, { useState } from 'react';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DateSelector } from './components/DateSelector';
import { DayRecordsTable } from './components/DayRecordsTable';
import { Header } from './components/Header';
import { SavedSuccessAnimation } from './components/SavedSuccessAnimation';
import { TimeSection } from './components/TimeSection';
import { TotalSection } from './components/TotalSection';
import { DayRecord, TimeEntry } from './types';
import {
  clearCurrentMonthData,
  createEmptyTimeEntry,
  getCurrentMonthName,
  getLocalTodayDateString,
  loadStorage,
  MONTHS,
  saveStorage,
} from './utils/storage';
import { calculateTotalDuration } from './utils/timeCalculator';
import { exportMonthExcelReport } from './utils/excelExporter';
import { exportMonthPdfReport } from './utils/pdfExporter';
import { getYearFromDate, isSunday } from './utils/dateUtils';
import { Plus, X } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState(() => loadStorage());
  const [lastSavedNotice, setLastSavedNotice] = useState<string>('');

  // Saved animation state in center of screen (displays for 2 seconds)
  const [showSavedAnimation, setShowSavedAnimation] = useState<boolean>(false);
  const [savedAnimationData, setSavedAnimationData] = useState<{
    dayNumber: number;
    totalFormatted: string;
    otFormatted: string;
  }>({ dayNumber: 1, totalFormatted: '', otFormatted: '' });

  // In-app confirmation modal state for Clear Month action
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    isDanger: true,
    onConfirm: () => {},
  });

  const currentMonth = appState.selectedMonth || 'JUNE';
  const monthData = appState.months[currentMonth] || {
    date: new Date().toISOString().split('T')[0],
    sections: [createEmptyTimeEntry(0), createEmptyTimeEntry(1), createEmptyTimeEntry(2), createEmptyTimeEntry(3)],
    dailyEntries: {},
  };

  // Check if Section 4 has data to decide initial visibility
  const [showSection4, setShowSection4] = useState<boolean>(() => {
    const s4 = monthData.sections[3];
    return !!(s4?.startTime || s4?.endTime);
  });

  // Extract active day number (1-31) from date string
  const currentDayNumber = (() => {
    if (monthData.date) {
      const parts = monthData.date.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        if (d >= 1 && d <= 31) return d;
      }
    }
    return 1;
  })();

  const currentYear = getYearFromDate(monthData.date);
  const isCurrentSunday = isSunday(currentDayNumber, currentMonth, currentYear);

  const hasSavedDataForCurrentDay = !!monthData.dailyEntries?.[currentDayNumber];

  // Updates single section and auto-persists to localStorage
  const handleSectionChange = (sectionIndex: number, updated: TimeEntry) => {
    setAppState((prev) => {
      const existingMonth = prev.months[currentMonth] || {
        date: new Date().toISOString().split('T')[0],
        sections: [createEmptyTimeEntry(0), createEmptyTimeEntry(1), createEmptyTimeEntry(2), createEmptyTimeEntry(3)],
        dailyEntries: {},
      };

      const newSections = [...existingMonth.sections] as [TimeEntry, TimeEntry, TimeEntry, TimeEntry];
      newSections[sectionIndex] = updated;

      const nextState = {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: {
            ...existingMonth,
            sections: newSections,
          },
        },
      };

      saveStorage(nextState);
      return nextState;
    });
  };

  // Clear single section
  const handleClearSingleSection = (sectionIndex: number) => {
    const cleared = createEmptyTimeEntry(sectionIndex);
    handleSectionChange(sectionIndex, cleared);
  };

  // Change active date: syncs month if user picks a date with a different month
  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;

    let targetMonth = currentMonth;
    try {
      const parts = newDateStr.split('-');
      if (parts.length === 3) {
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < MONTHS.length) {
          targetMonth = MONTHS[mIdx];
        }
      }
    } catch {
      // keep currentMonth
    }

    setAppState((prev) => {
      const existingTarget = prev.months[targetMonth] || {
        date: newDateStr,
        sections: [createEmptyTimeEntry(0), createEmptyTimeEntry(1), createEmptyTimeEntry(2), createEmptyTimeEntry(3)],
        dailyEntries: {},
      };

      const nextState = {
        ...prev,
        selectedMonth: targetMonth,
        months: {
          ...prev.months,
          [targetMonth]: {
            ...existingTarget,
            date: newDateStr,
          },
        },
      };

      saveStorage(nextState);
      return nextState;
    });
  };

  // Change month from Dropdown or Prev/Next
  const handleSelectMonth = (monthName: string) => {
    const currentRealMonth = getCurrentMonthName();
    const isCurrentRealMonth = monthName === currentRealMonth;
    const mIndex = MONTHS.indexOf(monthName as any);
    const y = new Date().getFullYear();
    const mStr = (mIndex + 1).toString().padStart(2, '0');

    let newDate: string;
    let targetDayNum: number;

    if (isCurrentRealMonth) {
      // Current real-world month defaults to today's date
      newDate = getLocalTodayDateString();
      targetDayNum = new Date().getDate();
    } else {
      // Non-current month MUST always start on Date 1
      newDate = `${y}-${mStr}-01`;
      targetDayNum = 1;
    }

    setAppState((prev) => {
      const existing = prev.months[monthName];
      const savedForTargetDay = existing?.dailyEntries?.[targetDayNum];

      const sectionsToUse: [TimeEntry, TimeEntry, TimeEntry, TimeEntry] = savedForTargetDay
        ? JSON.parse(JSON.stringify(savedForTargetDay.sections))
        : [
            createEmptyTimeEntry(0),
            createEmptyTimeEntry(1),
            createEmptyTimeEntry(2),
            createEmptyTimeEntry(3),
          ];

      const nextState = {
        ...prev,
        selectedMonth: monthName,
        months: {
          ...prev.months,
          [monthName]: {
            date: newDate,
            sections: sectionsToUse,
            dailyEntries: existing?.dailyEntries || {},
            lastSavedAt: existing?.lastSavedAt,
          },
        },
      };

      saveStorage(nextState);
      return nextState;
    });

    // Check if target day has 4th session to update showSection4
    const existingTargetDay = appState.months[monthName]?.dailyEntries?.[targetDayNum];
    if (existingTargetDay?.sections[3]?.startTime || existingTargetDay?.sections[3]?.endTime) {
      setShowSection4(true);
    } else {
      setShowSection4(false);
    }
  };

  // Select day number (1-31) from date strip
  const handleSelectDayNumber = (dayNum: number) => {
    const mIdx = MONTHS.indexOf(currentMonth as any);
    const y = new Date().getFullYear();
    const mStr = (mIdx + 1).toString().padStart(2, '0');
    const dStr = dayNum.toString().padStart(2, '0');
    const newDateStr = `${y}-${mStr}-${dStr}`;

    const existingDayRecord = monthData.dailyEntries?.[dayNum];

    setAppState((prev) => {
      const currentM = prev.months[currentMonth] || {
        date: newDateStr,
        sections: [createEmptyTimeEntry(0), createEmptyTimeEntry(1), createEmptyTimeEntry(2), createEmptyTimeEntry(3)],
        dailyEntries: {},
      };

      const sectionsToUse = existingDayRecord
        ? JSON.parse(JSON.stringify(existingDayRecord.sections))
        : currentM.sections;

      const nextState = {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: {
            ...currentM,
            date: newDateStr,
            sections: sectionsToUse,
          },
        },
      };

      saveStorage(nextState);
      return nextState;
    });

    if (existingDayRecord?.sections[3]?.startTime || existingDayRecord?.sections[3]?.endTime) {
      setShowSection4(true);
    }
  };

  // Explicit Save Handler: saves current day and automatically moves to the next day
  const handleExplicitSave = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const calcResult = calculateTotalDuration(monthData.sections);

    const newDayRecord: DayRecord = {
      date: `${currentMonth} Date ${currentDayNumber}`,
      dayNumber: currentDayNumber,
      sections: JSON.parse(JSON.stringify(monthData.sections)),
      durations: calcResult.durations,
      totalDuration: calcResult.totalFormatted,
      otDuration: calcResult.otFormatted,
      savedAt: timeStr,
    };

    // Calculate next day number (advances to next day 1-31)
    const nextDayNumber = currentDayNumber < 31 ? currentDayNumber + 1 : 1;
    const mIdx = MONTHS.indexOf(currentMonth as any);
    const y = new Date().getFullYear();
    const mStr = (mIdx + 1).toString().padStart(2, '0');
    const nextDStr = nextDayNumber.toString().padStart(2, '0');
    const nextDateStr = `${y}-${mStr}-${nextDStr}`;

    setAppState((prev) => {
      const cur = prev.months[currentMonth] || {
        date: monthData.date,
        sections: monthData.sections,
        dailyEntries: {},
      };

      const updatedDailyEntries = {
        ...(cur.dailyEntries || {}),
        [currentDayNumber]: newDayRecord,
      };

      // Check if next day already has a saved record; if so, load it, otherwise fresh empty entries
      const existingNextDay = updatedDailyEntries[nextDayNumber];
      const nextSections: [TimeEntry, TimeEntry, TimeEntry, TimeEntry] = existingNextDay
        ? JSON.parse(JSON.stringify(existingNextDay.sections))
        : [
            createEmptyTimeEntry(0),
            createEmptyTimeEntry(1),
            createEmptyTimeEntry(2),
            createEmptyTimeEntry(3),
          ];

      const nextState = {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: {
            ...cur,
            date: nextDateStr,
            sections: nextSections,
            lastSavedAt: timeStr,
            dailyEntries: updatedDailyEntries,
          },
        },
      };

      saveStorage(nextState);
      return nextState;
    });

    // Check if next day's 4th session has data to toggle visibility
    const existingNextDay = monthData.dailyEntries?.[nextDayNumber];
    if (existingNextDay?.sections[3]?.startTime || existingNextDay?.sections[3]?.endTime) {
      setShowSection4(true);
    } else {
      setShowSection4(false);
    }

    // Show centered Saved animation
    setSavedAnimationData({
      dayNumber: currentDayNumber,
      totalFormatted: totalCalculation.totalFormatted,
      otFormatted: totalCalculation.otFormatted,
    });
    setShowSavedAnimation(true);

    setLastSavedNotice(`Day ${currentDayNumber} saved! Moved to Day ${nextDayNumber}`);
    setTimeout(() => {
      setLastSavedNotice('');
    }, 4500);
  };

  // Export current month report to Excel (.xlsx)
  const handleExportMonthExcel = async () => {
    await exportMonthExcelReport(currentMonth, monthData);
  };

  // Export current month report to PDF (.pdf)
  const handleExportMonthPdf = async () => {
    await exportMonthPdfReport(currentMonth, monthData);
  };

  // Clear current active month data with in-app confirmation modal
  const handleClearCurrentMonth = () => {
    setConfirmModal({
      isOpen: true,
      title: `Clear ${currentMonth} Data?`,
      message: `Are you sure you want to clear all 31-day records and current session times for ${currentMonth}? This action cannot be undone.`,
      confirmLabel: `Clear ${currentMonth}`,
      isDanger: true,
      onConfirm: () => {
        const nextState = clearCurrentMonthData(appState, currentMonth);
        setAppState(nextState);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setLastSavedNotice(`Cleared ${currentMonth}`);
        setTimeout(() => setLastSavedNotice(''), 3000);
      },
    });
  };

  // Save specific day record from DayRecordsTable
  const handleSaveDayRecord = (dayNumber: number, record: DayRecord) => {
    setAppState((prev) => {
      const curMonth = prev.months[currentMonth];
      const nextState = {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: {
            ...curMonth,
            dailyEntries: {
              ...curMonth.dailyEntries,
              [dayNumber]: record,
            },
          },
        },
      };
      saveStorage(nextState);
      return nextState;
    });

    // Show centered Saved animation
    setSavedAnimationData({
      dayNumber,
      totalFormatted: record.totalDuration,
      otFormatted: record.otDuration,
    });
    setShowSavedAnimation(true);

    setLastSavedNotice(`Logged Day ${dayNumber}`);
    setTimeout(() => setLastSavedNotice(''), 3000);
  };

  // Delete day record
  const handleDeleteDayRecord = (dayNumber: number) => {
    setAppState((prev) => {
      const curMonth = prev.months[currentMonth];
      const updatedEntries = { ...curMonth.dailyEntries };
      delete updatedEntries[dayNumber];

      const nextState = {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: {
            ...curMonth,
            dailyEntries: updatedEntries,
          },
        },
      };
      saveStorage(nextState);
      return nextState;
    });
  };

  // Load a saved day's entries into the main editor cards
  const handleLoadDayRecordToSheet = (record: DayRecord) => {
    const mIdx = MONTHS.indexOf(currentMonth as any);
    const y = new Date().getFullYear();
    const mStr = (mIdx + 1).toString().padStart(2, '0');
    const dStr = record.dayNumber.toString().padStart(2, '0');
    const newDateStr = `${y}-${mStr}-${dStr}`;

    setAppState((prev) => {
      const cur = prev.months[currentMonth];
      return {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: {
            ...cur,
            date: newDateStr,
            sections: JSON.parse(JSON.stringify(record.sections)),
          },
        },
      };
    });
    if (record.sections[3]?.startTime || record.sections[3]?.endTime) {
      setShowSection4(true);
    }
  };

  // Calculate total duration for current active month sections
  const totalCalculation = calculateTotalDuration(monthData.sections);

  return (
    <div className="min-h-screen xl:h-screen xl:overflow-hidden bg-[#F6F7F9] p-2 sm:p-2.5 xl:p-3 flex flex-col w-full">
      {/* 1. OVERALL APPLICATION CONTAINER: Fitted full height on desktop, no outer scroll */}
      <div className="w-full bg-white border border-neutral-200/80 rounded-2xl p-3 sm:p-3.5 xl:p-4 shadow-xs flex-1 flex flex-col h-full min-h-0 overflow-hidden">
        {/* 2. TOP HEADER (Branding, Date, Month with Dropdown, and Action Controls: REPORT, CLEAR) */}
        <Header
          date={monthData.date}
          onDateChange={handleDateChange}
          selectedMonth={currentMonth}
          onSelectMonth={handleSelectMonth}
          hasSavedData={hasSavedDataForCurrentDay}
          onExportExcel={handleExportMonthExcel}
          onExportPdf={handleExportMonthPdf}
          onClearCurrentMonth={handleClearCurrentMonth}
        />

        {/* 3. TWO-COLUMN LAYOUT: Left Calculator + Right Side Monthly Daily Logs (ONLY logs area scrolls) */}
        <div className="mt-2 grid grid-cols-1 xl:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden items-stretch">
          {/* LEFT COLUMN: Date Selector, Compact Sessions, Total Time (Self-contained, no scroll needed on desktop) */}
          <div className="xl:col-span-8 2xl:col-span-8 flex flex-col justify-between min-h-0 overflow-y-auto xl:overflow-hidden pr-0.5">
            {/* DATE SELECTOR (DAYS 1 TO 31) */}
            <DateSelector
              currentDate={monthData.date}
              selectedMonth={currentMonth}
              dailyEntries={monthData.dailyEntries || {}}
              onSelectDayNumber={handleSelectDayNumber}
            />

            {/* SESSIONS SECTION */}
            <div className="w-full my-1">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Daily Work Sessions
                  </span>
                  {isCurrentSunday && (
                    <>
                      <span className="text-neutral-300">·</span>
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Sunday — Holiday
                      </span>
                    </>
                  )}
                </div>

                {/* Optional Section 4 Toggle */}
                {!showSection4 ? (
                  <button
                    type="button"
                    onClick={() => setShowSection4(true)}
                    className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Session 4 (Overtime / Night)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleClearSingleSection(3);
                      setShowSection4(false);
                    }}
                    className="text-xs font-medium text-neutral-400 hover:text-neutral-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Hide Session 4</span>
                  </button>
                )}
              </div>

              {/* 3 EQUAL COMPACT CARDS IN A ROW (or 4 if expanded) */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${
                  showSection4 ? 'lg:grid-cols-2 2xl:grid-cols-4' : 'lg:grid-cols-3'
                } gap-2.5 w-full`}
              >
                {/* CARD 01: Morning / Session 1 */}
                <TimeSection
                  sectionIndex={0}
                  entry={monthData.sections[0]}
                  onChange={(updated) => handleSectionChange(0, updated)}
                  onClearSection={() => handleClearSingleSection(0)}
                  title="Morning"
                  subtitle="Session 1"
                />

                {/* CARD 02: Afternoon / Session 2 */}
                <TimeSection
                  sectionIndex={1}
                  entry={monthData.sections[1]}
                  onChange={(updated) => handleSectionChange(1, updated)}
                  onClearSection={() => handleClearSingleSection(1)}
                  title="Afternoon"
                  subtitle="Session 2"
                />

                {/* CARD 03: Evening / Session 3 */}
                <TimeSection
                  sectionIndex={2}
                  entry={monthData.sections[2]}
                  onChange={(updated) => handleSectionChange(2, updated)}
                  onClearSection={() => handleClearSingleSection(2)}
                  title="Evening"
                  subtitle="Session 3"
                />

                {/* OPTIONAL CARD 04: Overtime / Night */}
                {showSection4 && (
                  <TimeSection
                    sectionIndex={3}
                    entry={monthData.sections[3]}
                    onChange={(updated) => handleSectionChange(3, updated)}
                    onClearSection={() => handleClearSingleSection(3)}
                    title="Overtime"
                    subtitle="Night Session"
                  />
                )}
              </div>
            </div>

            {/* TOTAL WORKING TIME SECTION */}
            <TotalSection
              totalFormatted={totalCalculation.totalFormatted}
              otFormatted={totalCalculation.otFormatted}
              onSave={handleExplicitSave}
            />
          </div>

          {/* RIGHT COLUMN: Monthly Daily Logs (Reduced width: 4 columns out of 12, ONLY this container scrolls) */}
          <div className="xl:col-span-4 2xl:col-span-4 flex flex-col h-full min-h-0 overflow-hidden">
            <DayRecordsTable
              selectedMonth={currentMonth}
              dailyEntries={monthData.dailyEntries || {}}
              currentSections={monthData.sections}
              currentDate={monthData.date}
              onSaveDayRecord={handleSaveDayRecord}
              onDeleteDayRecord={handleDeleteDayRecord}
              onLoadDayRecordToSheet={handleLoadDayRecordToSheet}
            />
          </div>
        </div>

        {/* 4. FOOTER: Powered by Karthi Designer with clickable link opening in new tab */}
        <footer className="w-full mt-2 pt-2 pb-0.5 border-t border-neutral-200/80 flex items-center justify-center text-center text-xs text-neutral-500 font-medium tracking-wide shrink-0">
          <span>Time Calculator</span>
          <span className="mx-2 text-neutral-400 font-bold">*</span>
          <span>Powered by </span>
          <a
            href="https://karthickg.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 font-semibold text-neutral-900 hover:text-black underline underline-offset-2 transition-colors cursor-pointer"
          >
            Karthi Designer
          </a>
        </footer>
      </div>

      {/* IN-APP CONFIRMATION MODAL FOR CLEARING MONTH */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* CENTERED SAVED ANIMATION OVERLAY (2 seconds) */}
      <SavedSuccessAnimation
        show={showSavedAnimation}
        onDismiss={() => setShowSavedAnimation(false)}
        dayNumber={savedAnimationData.dayNumber}
        totalFormatted={savedAnimationData.totalFormatted}
        otFormatted={savedAnimationData.otFormatted}
      />
    </div>
  );
}
