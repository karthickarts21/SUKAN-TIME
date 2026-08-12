import { AllMonthsData, AppStorage, MonthData, TimeEntry } from '../types';

export const STORAGE_KEY = 'TIME_CALCULATOR_DATA';

export const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
] as const;

export function createEmptyTimeEntry(index: number = 0): TimeEntry {
  return {
    startTime: '',
    startPeriod: index === 1 ? 'PM' : 'AM',
    endTime: '',
    endPeriod: 'PM',
  };
}

export function createSampleTimeEntry(index: number): TimeEntry {
  if (index === 0) {
    return { startTime: '09:00', startPeriod: 'AM', endTime: '06:30', endPeriod: 'PM' };
  }
  return createEmptyTimeEntry(index);
}

export function createDefaultMonthData(): MonthData {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    sections: [
      createSampleTimeEntry(0),
      createEmptyTimeEntry(1),
      createEmptyTimeEntry(2),
      createEmptyTimeEntry(3),
    ],
    dailyEntries: {},
    lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export function createInitialStorage(): AppStorage {
  const months: AllMonthsData = {};
  MONTHS.forEach((month) => {
    months[month] = createDefaultMonthData();
  });

  // Default to current month or JUNE as in template
  const currentMonthIdx = new Date().getMonth(); // 0 - 11
  const defaultMonth = MONTHS[currentMonthIdx] || 'JUNE';

  return {
    selectedMonth: defaultMonth,
    months,
  };
}

export function loadStorage(): AppStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialStorage();
      saveStorage(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as AppStorage;

    // Sanity check to ensure all 12 months exist
    const initial = createInitialStorage();
    if (!parsed.months) {
      parsed.months = initial.months;
    }

    MONTHS.forEach((m) => {
      if (!parsed.months[m]) {
        parsed.months[m] = createDefaultMonthData();
      } else {
        // ensure sections array has 4 elements
        if (!parsed.months[m].sections || parsed.months[m].sections.length < 4) {
          const current = parsed.months[m].sections || [];
          parsed.months[m].sections = [
            current[0] || createEmptyTimeEntry(0),
            current[1] || createEmptyTimeEntry(1),
            current[2] || createEmptyTimeEntry(2),
            current[3] || createEmptyTimeEntry(3),
          ];
        } else {
          // Ensure Section 2 (index 1) startPeriod defaults to PM if not set or empty
          if (parsed.months[m].sections[1] && parsed.months[m].sections[1].startPeriod === 'AM' && !parsed.months[m].sections[1].startTime) {
            parsed.months[m].sections[1].startPeriod = 'PM';
          }
        }
        // Check daily entries sections
        if (parsed.months[m].dailyEntries) {
          Object.keys(parsed.months[m].dailyEntries).forEach((dayKey) => {
            const entry = parsed.months[m].dailyEntries[dayKey];
            if (entry && entry.sections) {
              if (entry.sections.length < 4) {
                const s = entry.sections;
                entry.sections = [
                  s[0] || createEmptyTimeEntry(0),
                  s[1] || createEmptyTimeEntry(1),
                  s[2] || createEmptyTimeEntry(2),
                  s[3] || createEmptyTimeEntry(3),
                ];
              }
              if (entry.sections[1] && entry.sections[1].startPeriod === 'AM' && !entry.sections[1].startTime) {
                entry.sections[1].startPeriod = 'PM';
              }
            }
          });
        }
      }
    });

    if (!parsed.selectedMonth || !MONTHS.includes(parsed.selectedMonth as any)) {
      parsed.selectedMonth = initial.selectedMonth;
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load from localStorage', err);
    const fallback = createInitialStorage();
    return fallback;
  }
}

export function saveStorage(data: AppStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export function clearCurrentMonthData(data: AppStorage, month: string): AppStorage {
  const updated = { ...data };
  const today = new Date().toISOString().split('T')[0];
  
  updated.months = {
    ...updated.months,
    [month]: {
      date: today,
      sections: [
        createEmptyTimeEntry(0),
        createEmptyTimeEntry(1),
        createEmptyTimeEntry(2),
        createEmptyTimeEntry(3),
      ],
      dailyEntries: {},
      lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  };

  saveStorage(updated);
  return updated;
}

export function resetAllStorageData(): AppStorage {
  const fresh = createInitialStorage();
  saveStorage(fresh);
  return fresh;
}
