import React, { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  testFirestoreConnection,
  getUserSalarySettings,
  saveUserSalarySettings,
  getUserAllMonthsData,
  saveUserMonthData,
  saveAllUserMonthsData,
  subscribeToSalarySettings,
  subscribeToAllMonths,
} from './services/firebase';
import { AuthModal } from './components/AuthModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DateSelector } from './components/DateSelector';
import { DayRecordsTable } from './components/DayRecordsTable';
import { Header } from './components/Header';
import { MonthlySalarySection } from './components/MonthlySalarySection';
import { SalarySettingsModal } from './components/SalarySettingsModal';
import { SalarySlipModal } from './components/SalarySlipModal';
import { SavedSuccessAnimation } from './components/SavedSuccessAnimation';
import { TimeSection } from './components/TimeSection';
import { TotalSection } from './components/TotalSection';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';
import { DayRecord, MonthData, MonthSalaryData, SalarySettings, TimeEntry } from './types';
import {
  clearCurrentMonthData,
  createDefaultMonthData,
  createEmptyTimeEntry,
  createInitialStorage,
  getCurrentMonthName,
  getLocalTodayDateString,
  loadStorage,
  MONTHS,
  saveStorage,
} from './utils/storage';
import {
  calculateBillIncentive,
  calculateEarlyIncentive,
  calculateTotalDuration,
} from './utils/timeCalculator';
import { DEFAULT_SALARY_SETTINGS, loadSalarySettings, saveSalarySettings } from './utils/salaryCalculator';
import { exportMonthExcelReport } from './utils/excelExporter';
import { exportMonthPdfReport } from './utils/pdfExporter';
import { getYearFromDate, isSunday } from './utils/dateUtils';
import { CalendarDays, Palmtree, Plus, X } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState(() => loadStorage());
  const [lastSavedNotice, setLastSavedNotice] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<MobileTab>('home');

  // Firebase Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedNotice, setLastSyncedNotice] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline' | 'error' | 'disconnected'>('disconnected');

  // Salary Settings & Modals state
  const [salarySettings, setSalarySettings] = useState<SalarySettings>(() => loadSalarySettings());
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState<boolean>(false);
  const [isSalarySlipOpen, setIsSalarySlipOpen] = useState<boolean>(false);

  // Saved animation state in center of screen (displays for 1 second)
  const [showSavedAnimation, setShowSavedAnimation] = useState<boolean>(false);
  const [savedAnimationData, setSavedAnimationData] = useState<{
    dayNumber: number;
    totalFormatted: string;
    otFormatted: string;
    earlyIncentive?: number;
    billIncentive?: number;
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

  // 1. Initial Firestore connection test
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // 2. Network Online/Offline status detection
  useEffect(() => {
    const handleOnline = () => {
      if (auth.currentUser) setSyncStatus('connected');
    };
    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 3. Firebase Auth State & TRUE REAL-TIME FIRESTORE SYNC
  useEffect(() => {
    let unsubSalaryListener: (() => void) | null = null;
    let unsubMonthsListener: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up previous listeners if auth user changes
      if (unsubSalaryListener) {
        unsubSalaryListener();
        unsubSalaryListener = null;
      }
      if (unsubMonthsListener) {
        unsubMonthsListener();
        unsubMonthsListener = null;
      }

      setCurrentUser(user);

      if (user && user.uid) {
        setSyncStatus('syncing');
        const uid = user.uid;

        try {
          // A. Initial check and fetch
          const [cloudSettings, cloudMonths] = await Promise.all([
            getUserSalarySettings(uid),
            getUserAllMonthsData(uid),
          ]);

          if (cloudSettings) {
            setSalarySettings(cloudSettings);
            saveSalarySettings(cloudSettings);
          } else {
            // First time seeding local settings to Firestore
            await saveUserSalarySettings(uid, salarySettings);
          }

          if (cloudMonths && Object.keys(cloudMonths).length > 0) {
            setAppState((prev) => {
              const mergedMonths = { ...prev.months, ...cloudMonths };
              const nextState = { ...prev, months: mergedMonths };
              saveStorage(nextState);
              return nextState;
            });
          } else {
            // First time seeding local months to Firestore
            await saveAllUserMonthsData(uid, appState.months);
          }

          setSyncStatus('connected');
          setLastSyncedNotice(`Real-time sync active (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
        } catch (err) {
          console.error('Error during initial cloud load:', err);
          setSyncStatus('error');
        }

        // B. Real-Time Salary Settings Listener
        unsubSalaryListener = subscribeToSalarySettings(
          uid,
          (remoteSettings) => {
            setSalarySettings((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(remoteSettings)) {
                return prev;
              }
              saveSalarySettings(remoteSettings);
              return remoteSettings;
            });
            setSyncStatus('connected');
            setLastSyncedNotice(`Salary settings synced in real-time (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
          },
          (err) => {
            console.error('Real-time salary settings subscription error:', err);
            setSyncStatus('error');
          }
        );

        // C. Real-Time All 12 Months Listener (Document-level, no unrestricted collection queries)
        unsubMonthsListener = subscribeToAllMonths(
          uid,
          (monthName, remoteMonthData) => {
            setAppState((prev) => {
              const currentLocalMonth = prev.months[monthName];
              if (!currentLocalMonth) {
                const nextState = {
                  ...prev,
                  months: {
                    ...prev.months,
                    [monthName]: remoteMonthData,
                  },
                };
                saveStorage(nextState);
                return nextState;
              }

              // Deep check to prevent redundant updates
              const localDailyEntriesJson = JSON.stringify(currentLocalMonth.dailyEntries || {});
              const remoteDailyEntriesJson = JSON.stringify(remoteMonthData.dailyEntries || {});
              const localHolidaysJson = JSON.stringify(currentLocalMonth.manualHolidays || []);
              const remoteHolidaysJson = JSON.stringify(remoteMonthData.manualHolidays || []);
              const localSalaryDataJson = JSON.stringify(currentLocalMonth.salaryData || {});
              const remoteSalaryDataJson = JSON.stringify(remoteMonthData.salaryData || {});
              const localBillCount = currentLocalMonth.billCount;
              const remoteBillCount = remoteMonthData.billCount;

              if (
                localDailyEntriesJson === remoteDailyEntriesJson &&
                localHolidaysJson === remoteHolidaysJson &&
                localSalaryDataJson === remoteSalaryDataJson &&
                localBillCount === remoteBillCount
              ) {
                return prev;
              }

              // If currently viewing this month and current day's record was updated remotely,
              // refresh the active sessions so the card editor displays the newly updated times
              let activeSections = currentLocalMonth.sections;
              const isViewingThisMonth = prev.selectedMonth === monthName;
              if (isViewingThisMonth && remoteMonthData.dailyEntries) {
                const curDay = parseInt(currentLocalMonth.date.split('-')[2] || '1', 10);
                const remoteRecord = remoteMonthData.dailyEntries[curDay];
                const localRecord = currentLocalMonth.dailyEntries?.[curDay];
                if (remoteRecord && JSON.stringify(remoteRecord) !== JSON.stringify(localRecord)) {
                  activeSections = JSON.parse(JSON.stringify(remoteRecord.sections));
                }
              }

              const updatedMonthObj: MonthData = {
                ...currentLocalMonth,
                sections: activeSections,
                dailyEntries: remoteMonthData.dailyEntries || {},
                manualHolidays: remoteMonthData.manualHolidays || [],
                billCount: remoteMonthData.billCount,
                salaryData: remoteMonthData.salaryData,
                lastSavedAt: remoteMonthData.lastSavedAt || currentLocalMonth.lastSavedAt,
              };

              const nextState = {
                ...prev,
                months: {
                  ...prev.months,
                  [monthName]: updatedMonthObj,
                },
              };

              saveStorage(nextState);
              return nextState;
            });

            setSyncStatus('connected');
            setLastSyncedNotice(`Real-time update: ${monthName} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
          },
          (err) => {
            console.error('Real-time month subscription error:', err);
            setSyncStatus('error');
          }
        );
      } else {
        setSyncStatus('disconnected');
        // Reset app state and clear previous user's private data from screen & local storage on logout
        const emptyStorage = createInitialStorage();
        setAppState(emptyStorage);
        saveStorage(emptyStorage);
        setSalarySettings(DEFAULT_SALARY_SETTINGS);
        saveSalarySettings(DEFAULT_SALARY_SETTINGS);
      }
    });

    return () => {
      if (unsubSalaryListener) unsubSalaryListener();
      if (unsubMonthsListener) unsubMonthsListener();
      unsubscribeAuth();
    };
  }, []);

  // Manual Cloud Sync handler (Kept as manual force-sync option per requirement)
  const handleSyncNow = async () => {
    const activeUid = auth.currentUser?.uid || currentUser?.uid;
    if (!activeUid) return;
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      await saveAllUserMonthsData(activeUid, appState.months);
      await saveUserSalarySettings(activeUid, salarySettings);
      setSyncStatus('connected');
      setLastSyncedNotice(`Manual sync completed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      console.error('Manual sync failed:', err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
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
  const isCurrentManualHoliday = (monthData.manualHolidays || []).includes(currentDayNumber);

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
            // Bill count is month-level, preserved across dates
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

  // Handle manual Bill Count change for Bill Incentive (Month-level)
  const handleBillCountChange = (count: number | '') => {
    setAppState((prev) => {
      const cur = prev.months[currentMonth];
      const updatedMonth: MonthData = {
        ...cur,
        billCount: count === '' ? undefined : count,
      };
      const nextState = {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: updatedMonth,
        },
      };
      saveStorage(nextState);
      const activeUid = auth.currentUser?.uid || currentUser?.uid;
      if (activeUid) {
        saveUserMonthData(activeUid, currentMonth, updatedMonth).catch((e) =>
          console.error('Firestore save bill count error:', e)
        );
      }
      return nextState;
    });
  };

  // Handle manual Holiday toggle for Day Selector
  const handleToggleHoliday = (dayNumber: number) => {
    setAppState((prev) => {
      const cur = prev.months[currentMonth] || {
        date: monthData.date,
        sections: monthData.sections,
        dailyEntries: {},
      };
      const currentHolidays = Array.isArray(cur.manualHolidays) ? [...cur.manualHolidays] : [];
      const idx = currentHolidays.indexOf(dayNumber);
      let updatedHolidays: number[];
      if (idx >= 0) {
        updatedHolidays = currentHolidays.filter((d) => d !== dayNumber);
      } else {
        updatedHolidays = [...currentHolidays, dayNumber].sort((a, b) => a - b);
      }

      // Also update isHoliday on dailyEntries if record exists
      const updatedDailyEntries = { ...(cur.dailyEntries || {}) };
      if (updatedDailyEntries[dayNumber]) {
        updatedDailyEntries[dayNumber] = {
          ...updatedDailyEntries[dayNumber],
          isHoliday: idx < 0,
        };
      }

      const updatedMonth: MonthData = {
        ...cur,
        manualHolidays: updatedHolidays,
        dailyEntries: updatedDailyEntries,
      };

      const nextState = {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: updatedMonth,
        },
      };

      saveStorage(nextState);
      const activeUid = auth.currentUser?.uid || currentUser?.uid;
      if (activeUid) {
        saveUserMonthData(activeUid, currentMonth, updatedMonth).catch((e) =>
          console.error('Firestore save holiday error:', e)
        );
      }
      return nextState;
    });
  };

  // Explicit Save Handler: saves current day and automatically moves to the next day
  const handleExplicitSave = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const calcResult = calculateTotalDuration(monthData.sections);
    const incentiveResult = calculateEarlyIncentive(monthData.sections);

    const isSun = isSunday(currentDayNumber, currentMonth, currentYear);
    const isManHol = (monthData.manualHolidays || []).includes(currentDayNumber);

    // Requirement: Bill Incentive "date" la add aaga kudathu "ore month" mattum thaa add aaganum
    const newDayRecord: DayRecord = {
      date: `${currentMonth} Date ${currentDayNumber}`,
      dayNumber: currentDayNumber,
      sections: JSON.parse(JSON.stringify(monthData.sections)),
      durations: calcResult.durations,
      totalDuration: calcResult.totalFormatted,
      otDuration: calcResult.otFormatted,
      savedAt: timeStr,
      earlyIncentive: incentiveResult.amount,
      isHoliday: isSun || isManHol,
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

      const updatedMonth: MonthData = {
        ...cur,
        date: nextDateStr,
        sections: nextSections,
        lastSavedAt: timeStr,
        dailyEntries: updatedDailyEntries,
      };

      const nextState = {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: updatedMonth,
        },
      };

      saveStorage(nextState);
      const activeUid = auth.currentUser?.uid || currentUser?.uid;
      if (activeUid) {
        saveUserMonthData(activeUid, currentMonth, updatedMonth).catch((e) =>
          console.error('Firestore save explicit day error:', e)
        );
      }
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
      totalFormatted: calcResult.totalFormatted,
      otFormatted: calcResult.otFormatted,
      earlyIncentive: incentiveResult.amount,
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
        const activeUid = auth.currentUser?.uid || currentUser?.uid;
        if (activeUid) {
          saveUserMonthData(activeUid, currentMonth, nextState.months[currentMonth]).catch((e) =>
            console.error('Firestore clear month error:', e)
          );
        }
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
      const updatedMonth: MonthData = {
        ...curMonth,
        dailyEntries: {
          ...curMonth.dailyEntries,
          [dayNumber]: record,
        },
      };
      const nextState = {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: updatedMonth,
        },
      };
      saveStorage(nextState);
      const activeUid = auth.currentUser?.uid || currentUser?.uid;
      if (activeUid) {
        saveUserMonthData(activeUid, currentMonth, updatedMonth).catch((e) =>
          console.error('Firestore save day record error:', e)
        );
      }
      return nextState;
    });

    // Show centered Saved animation
    setSavedAnimationData({
      dayNumber,
      totalFormatted: record.totalDuration,
      otFormatted: record.otDuration,
      earlyIncentive: record.earlyIncentive,
      billIncentive: record.billIncentive,
    });
    setShowSavedAnimation(true);

    setLastSavedNotice(`Logged Day ${dayNumber}`);
    setTimeout(() => setLastSavedNotice(''), 3000);
  };

  // Delete day record with Yes / No confirmation dialog
  const handleDeleteDayRecord = (dayNumber: number) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Day ${dayNumber} Log?`,
      message: `Are you sure you want to delete the time log for ${currentMonth} Day ${dayNumber}? This will remove the recorded hours and overtime for this day.`,
      confirmLabel: `Yes, Delete`,
      isDanger: true,
      onConfirm: () => {
        setAppState((prev) => {
          const curMonth = prev.months[currentMonth];
          const updatedEntries = { ...curMonth.dailyEntries };
          delete updatedEntries[dayNumber];

          const updatedMonth: MonthData = {
            ...curMonth,
            dailyEntries: updatedEntries,
          };

          const nextState = {
            ...prev,
            months: {
              ...prev.months,
              [currentMonth]: updatedMonth,
            },
          };
          saveStorage(nextState);
          const activeUid = auth.currentUser?.uid || currentUser?.uid;
          if (activeUid) {
            saveUserMonthData(activeUid, currentMonth, updatedMonth).catch((e) =>
              console.error('Firestore delete day record error:', e)
            );
          }
          return nextState;
        });

        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setLastSavedNotice(`Deleted Day ${dayNumber} record`);
        setTimeout(() => setLastSavedNotice(''), 3000);
      },
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

  // Save Salary Settings handler
  const handleSaveSalarySettings = (newSettings: SalarySettings) => {
    setSalarySettings(newSettings);
    saveSalarySettings(newSettings);
    const activeUid = auth.currentUser?.uid || currentUser?.uid;
    if (activeUid) {
      saveUserSalarySettings(activeUid, newSettings).catch((e) =>
        console.error('Firestore save salary settings error:', e)
      );
    }
  };

  // Update Month-wise Salary Data (Early/Bill Incentive Manual, PF, ESI, Advance, etc.)
  const handleUpdateSalaryData = (updatedSalaryData: MonthSalaryData) => {
    setAppState((prev) => {
      const curMonthObj = prev.months[currentMonth] || {
        date: new Date().toISOString().split('T')[0],
        sections: [createEmptyTimeEntry(0), createEmptyTimeEntry(1), createEmptyTimeEntry(2), createEmptyTimeEntry(3)],
        dailyEntries: {},
      };
      const updatedMonth: MonthData = {
        ...curMonthObj,
        salaryData: updatedSalaryData,
      };
      const nextState = {
        ...prev,
        months: {
          ...prev.months,
          [currentMonth]: updatedMonth,
        },
      };
      saveStorage(nextState);
      const activeUid = auth.currentUser?.uid || currentUser?.uid;
      if (activeUid) {
        saveUserMonthData(activeUid, currentMonth, updatedMonth).catch((e) =>
          console.error('Firestore update salary data error:', e)
        );
      }
      return nextState;
    });
  };

  // Calculate total duration & early incentive for current active month sections
  const totalCalculation = calculateTotalDuration(monthData.sections);
  const earlyIncentiveCalculation = calculateEarlyIncentive(monthData.sections);

  return (
    <div className="min-h-screen bg-[#F6F7F9] p-2 sm:p-2.5 xl:p-3 pb-20 xl:pb-3 flex flex-col w-full">
      {/* 1. OVERALL APPLICATION CONTAINER */}
      <div className="w-full bg-white border border-neutral-200/80 rounded-2xl p-3 sm:p-3.5 xl:p-4 shadow-xs flex-1 flex flex-col space-y-3.5">
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
          onOpenSalarySettings={() => setIsSalaryModalOpen(true)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          isSyncing={isSyncing}
          syncStatus={syncStatus}
        />

        {/* 3. MAIN WORKSPACE: RESPONSIVE TO MOBILE TABS (< xl) & TWO-COLUMN DESKTOP (xl+) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
          {/* LEFT COLUMN: Date Selector, Compact Sessions, Total Time (Visible on Desktop OR Home Tab on Mobile) */}
          <div
            className={`${
              mobileTab === 'home' ? 'flex' : 'hidden'
            } xl:flex xl:col-span-8 2xl:col-span-8 flex-col justify-start space-y-2 sm:space-y-2.5`}
          >
            {/* DATE SELECTOR (DAYS 1 TO 31) */}
            <DateSelector
              currentDate={monthData.date}
              selectedMonth={currentMonth}
              dailyEntries={monthData.dailyEntries || {}}
              manualHolidays={monthData.manualHolidays || []}
              onSelectDayNumber={handleSelectDayNumber}
              onToggleHoliday={handleToggleHoliday}
            />

            {/* SESSIONS SECTION */}
            <div className="w-full">
              <div className="flex items-start justify-between mb-2 px-1 gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 block">
                    Daily Work Sessions
                  </span>
                  {/* HOLIDAY BADGE BELOW DAILY WORK SESSIONS TEXT */}
                  {isCurrentSunday && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Sunday — Holiday
                      </span>
                    </div>
                  )}
                  {isCurrentManualHoliday && !isCurrentSunday && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md">
                        <Palmtree className="w-3 h-3 text-amber-600" />
                        Holiday (Off Day — Not Deducted)
                      </span>
                    </div>
                  )}
                </div>

                {/* Optional Section 4 Toggle: Icon button */}
                {!showSection4 ? (
                  <button
                    type="button"
                    onClick={() => setShowSection4(true)}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 border border-neutral-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs text-xs font-semibold shrink-0"
                    title="Add Session 4 (Overtime / Night)"
                    aria-label="Add Session 4 (Overtime / Night)"
                  >
                    <Plus className="w-3.5 h-3.5 text-neutral-600" />
                    <span className="hidden sm:inline">Add Session 4</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleClearSingleSection(3);
                      setShowSection4(false);
                    }}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 border border-neutral-200 transition-colors inline-flex items-center gap-1 cursor-pointer text-xs font-medium shrink-0"
                    title="Hide Session 4"
                    aria-label="Hide Session 4"
                  >
                    <X className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="hidden sm:inline">Hide S4</span>
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

            {/* TOTAL WORKING TIME SECTION WITH EARLY INCENTIVE */}
            <TotalSection
              totalFormatted={totalCalculation.totalFormatted}
              otFormatted={totalCalculation.otFormatted}
              earlyIncentive={earlyIncentiveCalculation}
              onSave={handleExplicitSave}
            />
          </div>

          {/* RIGHT COLUMN: Monthly Daily Logs (Visible on Desktop OR Month Log Tab on Mobile) */}
          <div
            className={`${
              mobileTab === 'monthLog' ? 'flex' : 'hidden'
            } xl:flex xl:col-span-4 2xl:col-span-4 flex-col h-full min-h-[420px]`}
          >
            <DayRecordsTable
              selectedMonth={currentMonth}
              dailyEntries={monthData.dailyEntries || {}}
              manualHolidays={monthData.manualHolidays || []}
              onToggleHoliday={handleToggleHoliday}
              currentSections={monthData.sections}
              currentDate={monthData.date}
              onSaveDayRecord={handleSaveDayRecord}
              onDeleteDayRecord={handleDeleteDayRecord}
              onLoadDayRecordToSheet={handleLoadDayRecordToSheet}
            />
          </div>
        </div>

        {/* 4. MONTHLY SALARY SUMMARY & MANAGEMENT SECTION (Visible on Desktop OR Salary Tab on Mobile) */}
        <div className={`${mobileTab === 'salary' ? 'block' : 'hidden'} xl:block`}>
          <MonthlySalarySection
            selectedMonth={currentMonth}
            monthData={monthData}
            settings={salarySettings}
            onUpdateSalaryData={handleUpdateSalaryData}
            onOpenSalarySlip={() => setIsSalarySlipOpen(true)}
            onOpenSettings={() => setIsSalaryModalOpen(true)}
          />
        </div>

        {/* 5. FOOTER: Powered by Karthi Designer with clickable link opening in new tab */}
        <footer className="w-full pt-2 pb-0.5 border-t border-neutral-200/80 flex items-center justify-center text-center text-xs text-neutral-500 font-medium tracking-wide shrink-0">
          <span>Salary Calculator</span>
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

      {/* MOBILE BOTTOM NAVIGATION (Home, Attendance, Monthly Log, Salary) */}
      <MobileBottomNav
        activeTab={mobileTab}
        onChangeTab={(tab) => setMobileTab(tab)}
        loggedDaysCount={Object.keys(monthData.dailyEntries || {}).length}
      />

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

      {/* CENTERED SAVED ANIMATION OVERLAY (1 second) */}
      <SavedSuccessAnimation
        show={showSavedAnimation}
        onDismiss={() => setShowSavedAnimation(false)}
        dayNumber={savedAnimationData.dayNumber}
        totalFormatted={savedAnimationData.totalFormatted}
        otFormatted={savedAnimationData.otFormatted}
        earlyIncentive={savedAnimationData.earlyIncentive}
        billIncentive={savedAnimationData.billIncentive}
      />

      {/* SALARY SETTINGS & HR MANAGEMENT MODAL */}
      <SalarySettingsModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        selectedMonth={currentMonth}
        monthData={monthData}
        settings={salarySettings}
        onSaveSettings={handleSaveSalarySettings}
      />

      {/* VIEW SALARY SLIP MODAL */}
      <SalarySlipModal
        isOpen={isSalarySlipOpen}
        onClose={() => setIsSalarySlipOpen(false)}
        selectedMonth={currentMonth}
        monthData={monthData}
        settings={salarySettings}
      />

      {/* CLOUD AUTH & FIRESTORE SYNC MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
        lastSyncedNotice={lastSyncedNotice}
        syncStatus={syncStatus}
      />
    </div>
  );
}
