import React, { useEffect, useState } from 'react';
import { ActionControls } from './components/ActionControls';
import { DateSelector } from './components/DateSelector';
import { DayRecordsTable } from './components/DayRecordsTable';
import { Header } from './components/Header';
import { MonthSelector } from './components/MonthSelector';
import { TimeSection } from './components/TimeSection';
import { TotalSection } from './components/TotalSection';
import { DayRecord, TimeEntry } from './types';
import {
  clearCurrentMonthData,
  createEmptyTimeEntry,
  loadStorage,
  MONTHS,
  resetAllStorageData,
  saveStorage,
} from './utils/storage';
import { calculateTotalDuration } from './utils/timeCalculator';
import { exportMonthExcelReport, exportOverallExcelReport } from './utils/excelExporter';

export default function App() {
  const [appState, setAppState] = useState(() => loadStorage());
  const [lastSavedNotice, setLastSavedNotice] = useState<string>('');

  const currentMonth = appState.selectedMonth || 'JUNE';
  const monthData = appState.months[currentMonth] || {
    date: new Date().toISOString().split('T')[0],
    sections: [createEmptyTimeEntry(0), createEmptyTimeEntry(1), createEmptyTimeEntry(2), createEmptyTimeEntry(3)],
    dailyEntries: {},
  };

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

  // Helper to persist state to local storage and update state
  const updateAndPersistState = (updater: (prev: typeof appState) => typeof appState) => {
    setAppState((prev) => {
      const next = updater(prev);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (next.months[next.selectedMonth]) {
        next.months[next.selectedMonth].lastSavedAt = timestamp;
      }
      saveStorage(next);
      setLastSavedNotice(timestamp);
      return next;
    });
  };

  // Handle month selection change
  const handleSelectMonth = (newMonth: string) => {
    updateAndPersistState((prev) => ({
      ...prev,
      selectedMonth: newMonth,
    }));
  };

  // Handle date picker change (e.g. 2026-06-15)
  const handleDateChange = (newDate: string) => {
    updateAndPersistState((prev) => {
      const targetMonth = prev.selectedMonth;
      const parts = newDate.split('-');
      let dayNum = 1;
      if (parts.length === 3) {
        dayNum = parseInt(parts[2], 10) || 1;
      }

      const existingRecord = prev.months[targetMonth].dailyEntries?.[dayNum];

      return {
        ...prev,
        months: {
          ...prev.months,
          [targetMonth]: {
            ...prev.months[targetMonth],
            date: newDate,
            sections: existingRecord
              ? JSON.parse(JSON.stringify(existingRecord.sections))
              : prev.months[targetMonth].sections,
          },
        },
      };
    });
  };

  // Handle clicking Day 1..31 from Date Selector
  const handleSelectDayNumber = (dayNum: number) => {
    updateAndPersistState((prev) => {
      const targetMonth = prev.selectedMonth;
      const currentFullDate = prev.months[targetMonth].date || new Date().toISOString().split('T')[0];
      const parts = currentFullDate.split('-');
      const year = parts[0] || new Date().getFullYear().toString();
      const monthIdx = (MONTHS.indexOf(targetMonth as any) + 1).toString().padStart(2, '0');
      const formattedDay = dayNum.toString().padStart(2, '0');
      const constructedDate = `${year}-${monthIdx}-${formattedDay}`;

      const existingRecord = prev.months[targetMonth].dailyEntries?.[dayNum];

      return {
        ...prev,
        months: {
          ...prev.months,
          [targetMonth]: {
            ...prev.months[targetMonth],
            date: constructedDate,
            sections: existingRecord
              ? JSON.parse(JSON.stringify(existingRecord.sections))
              : [createEmptyTimeEntry(0), createEmptyTimeEntry(1), createEmptyTimeEntry(2), createEmptyTimeEntry(3)],
          },
        },
      };
    });
  };

  // Handle single section time entry change
  const handleSectionChange = (index: number, updatedEntry: TimeEntry) => {
    updateAndPersistState((prev) => {
      const targetMonth = prev.selectedMonth;
      const currentSections = [...prev.months[targetMonth].sections] as [
        TimeEntry,
        TimeEntry,
        TimeEntry,
        TimeEntry
      ];
      currentSections[index] = updatedEntry;

      // Auto-update daily entries record if it exists
      const existingEntries = { ...(prev.months[targetMonth].dailyEntries || {}) };
      if (existingEntries[currentDayNumber]) {
        const totals = calculateTotalDuration(currentSections);
        existingEntries[currentDayNumber] = {
          ...existingEntries[currentDayNumber],
          sections: currentSections,
          durations: totals.durations,
          totalDuration: totals.totalFormatted,
          savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }

      return {
        ...prev,
        months: {
          ...prev.months,
          [targetMonth]: {
            ...prev.months[targetMonth],
            sections: currentSections,
            dailyEntries: existingEntries,
          },
        },
      };
    });
  };

  // Clear a single section
  const handleClearSingleSection = (index: number) => {
    handleSectionChange(index, createEmptyTimeEntry(index));
  };

  // Explicit SAVE button action - Saves current calculation date-wise and auto-moves to next date
  const handleExplicitSave = () => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let savedDay = 1;
    let nextDay = 1;
    
    updateAndPersistState((prev) => {
      const targetMonth = prev.selectedMonth;
      const currentSections = prev.months[targetMonth].sections;
      const totals = calculateTotalDuration(currentSections);
      savedDay = currentDayNumber;
      nextDay = savedDay < 31 ? savedDay + 1 : 31;
      const existingEntries = { ...(prev.months[targetMonth].dailyEntries || {}) };

      const dayRecord: DayRecord = {
        date: prev.months[targetMonth].date || `${targetMonth} Date ${savedDay}`,
        dayNumber: savedDay,
        sections: JSON.parse(JSON.stringify(currentSections)),
        durations: totals.durations,
        totalDuration: totals.totalFormatted,
        otDuration: totals.otFormatted,
        savedAt: timestamp,
      };

      existingEntries[savedDay] = dayRecord;

      const currentFullDate = prev.months[targetMonth].date || new Date().toISOString().split('T')[0];
      const parts = currentFullDate.split('-');
      const year = parts[0] || new Date().getFullYear().toString();
      const monthIdx = (MONTHS.indexOf(targetMonth as any) + 1).toString().padStart(2, '0');
      const formattedDay = nextDay.toString().padStart(2, '0');
      const constructedDate = `${year}-${monthIdx}-${formattedDay}`;

      const existingNextRecord = existingEntries[nextDay];

      return {
        ...prev,
        months: {
          ...prev.months,
          [targetMonth]: {
            ...prev.months[targetMonth],
            date: constructedDate,
            sections: existingNextRecord
              ? JSON.parse(JSON.stringify(existingNextRecord.sections))
              : [createEmptyTimeEntry(0), createEmptyTimeEntry(1), createEmptyTimeEntry(2), createEmptyTimeEntry(3)],
            dailyEntries: existingEntries,
            lastSavedAt: timestamp,
          },
        },
      };
    });

    setLastSavedNotice(`Date ${savedDay} saved successfully! Moved to Date ${nextDay}.`);
  };

  // Clear current month
  const handleClearCurrentMonth = () => {
    const confirmed = window.confirm(
      `Are you sure you want to clear all saved data for ${currentMonth}?`
    );
    if (!confirmed) return;

    setAppState((prev) => {
      const updated = clearCurrentMonthData(prev, currentMonth);
      setLastSavedNotice(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return updated;
    });
  };

  // Reset all 12 months
  const handleResetAllData = () => {
    const confirmed = window.confirm(
      'This will permanently delete saved time data for all 12 months. Continue?'
    );
    if (!confirmed) return;

    const fresh = resetAllStorageData();
    setAppState(fresh);
    setLastSavedNotice('');
  };

  // Export Overall Excel Report across all 12 months
  const handleExportOverallExcel = () => {
    exportOverallExcelReport(appState.months);
  };

  // Export Selected Month Excel Report
  const handleExportMonthExcel = () => {
    exportMonthExcelReport(currentMonth, monthData);
  };

  // Save entry to daily records table (Dates 1 to 31)
  const handleSaveDayRecord = (dayNumber: number, record: DayRecord) => {
    updateAndPersistState((prev) => {
      const targetMonth = prev.selectedMonth;
      const existingEntries = prev.months[targetMonth].dailyEntries || {};

      return {
        ...prev,
        months: {
          ...prev.months,
          [targetMonth]: {
            ...prev.months[targetMonth],
            dailyEntries: {
              ...existingEntries,
              [dayNumber]: record,
            },
          },
        },
      };
    });
  };

  // Delete single day record from table
  const handleDeleteDayRecord = (dayNumber: number) => {
    updateAndPersistState((prev) => {
      const targetMonth = prev.selectedMonth;
      const existingEntries = { ...(prev.months[targetMonth].dailyEntries || {}) };
      delete existingEntries[dayNumber];

      return {
        ...prev,
        months: {
          ...prev.months,
          [targetMonth]: {
            ...prev.months[targetMonth],
            dailyEntries: existingEntries,
          },
        },
      };
    });
  };

  // Load a saved day record back into the 3 calculation sections
  const handleLoadDayRecordToSheet = (record: DayRecord) => {
    updateAndPersistState((prev) => {
      const targetMonth = prev.selectedMonth;
      return {
        ...prev,
        months: {
          ...prev.months,
          [targetMonth]: {
            ...prev.months[targetMonth],
            date: record.date || prev.months[targetMonth].date,
            sections: JSON.parse(JSON.stringify(record.sections)),
          },
        },
      };
    });
  };

  // Calculate total duration for current active month sections
  const totalCalculation = calculateTotalDuration(monthData.sections);

  return (
    <div className="min-h-screen bg-white text-black font-sans p-4 sm:p-6 lg:p-10 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto bg-white">
        {/* 1. HEADER */}
        <Header
          date={monthData.date}
          onDateChange={handleDateChange}
          selectedMonth={currentMonth}
        />

        {/* 2. MONTH SELECTION */}
        <MonthSelector
          selectedMonth={currentMonth}
          onSelectMonth={handleSelectMonth}
        />

        {/* 3. DATE SELECTION (DATE 1 TO 31) */}
        <DateSelector
          currentDate={monthData.date}
          selectedMonth={currentMonth}
          dailyEntries={monthData.dailyEntries || {}}
          onSelectDayNumber={handleSelectDayNumber}
        />

        {/* 4. FOUR TIME CALCULATION SECTIONS (SECTION 1 TO 4 IN A SINGLE LINE) */}
        <main className="w-full my-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            <TimeSection
              sectionIndex={0}
              entry={monthData.sections[0]}
              onChange={(updated) => handleSectionChange(0, updated)}
              onClearSection={() => handleClearSingleSection(0)}
            />
            <TimeSection
              sectionIndex={1}
              entry={monthData.sections[1]}
              onChange={(updated) => handleSectionChange(1, updated)}
              onClearSection={() => handleClearSingleSection(1)}
            />
            <TimeSection
              sectionIndex={2}
              entry={monthData.sections[2]}
              onChange={(updated) => handleSectionChange(2, updated)}
              onClearSection={() => handleClearSingleSection(2)}
            />
            <TimeSection
              sectionIndex={3}
              entry={monthData.sections[3]}
              onChange={(updated) => handleSectionChange(3, updated)}
              onClearSection={() => handleClearSingleSection(3)}
            />
          </div>

          {/* 5. TOTAL CALCULATE & BALANCE OT */}
          <TotalSection
            totalFormatted={totalCalculation.totalFormatted}
            otFormatted={totalCalculation.otFormatted}
          />

          {/* 6. ACTION CONTROLS (SAVE, EXCEL EXPORT, CLEAR, RESET ALL DATA) */}
          <ActionControls
            onSave={handleExplicitSave}
            onExportMonthExcel={handleExportMonthExcel}
            onClearCurrentMonth={handleClearCurrentMonth}
            onResetAllData={handleResetAllData}
            lastSavedAt={lastSavedNotice || monthData.lastSavedAt}
            selectedMonth={currentMonth}
          />

          {/* 7. MONTHLY DAY-BY-DAY RECORDS TABLE (DATES 1 TO 31) */}
          <DayRecordsTable
            selectedMonth={currentMonth}
            dailyEntries={monthData.dailyEntries || {}}
            currentSections={monthData.sections}
            currentDate={monthData.date}
            onSaveDayRecord={handleSaveDayRecord}
            onDeleteDayRecord={handleDeleteDayRecord}
            onLoadDayRecordToSheet={handleLoadDayRecordToSheet}
          />
        </main>
      </div>
    </div>
  );
}

