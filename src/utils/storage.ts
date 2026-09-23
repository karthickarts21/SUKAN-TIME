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

/**
 * Creates an empty time entry for a specific session index:
 * - Index 0 (Morning): AM -> PM (Empty times)
 * - Index 1 (Afternoon): PM -> PM (Empty times)
 * - Index 2 (Evening): PM -> PM (Empty times)
 * - Index 3 (Overtime): PM -> PM (Empty times)
 */
export function createEmptyTimeEntry(index: number = 0): TimeEntry {
  const isPM = index === 1 || index === 2 || index === 3;
  return {
    startTime: '',
    startPeriod: isPM ? 'PM' : 'AM',
    endTime: '',
    endPeriod: 'PM',
  };
}

export function createDefaultMonthData(): MonthData {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    sections: [
      createEmptyTimeEntry(0),
      createEmptyTimeEntry(1),
      createEmptyTimeEntry(2),
      createEmptyTimeEntry(3),
    ],
    dailyEntries: {},
    lastSavedAt: undefined,
  };
}

export function createInitialStorage(): AppStorage {
  const months: AllMonthsData = {};
  MONTHS.forEach((month) => {
    months[month] = createDefaultMonthData();
  });

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
        }

        // Remove old default sample 09:00 - 06:30 if present in morning session
        if (
          parsed.months[m].sections[0]?.startTime === '09:00' &&
          parsed.months[m].sections[0]?.endTime === '06:30'
        ) {
          parsed.months[m].sections[0].startTime = '';
          parsed.months[m].sections[0].endTime = '';
        }

        // Ensure Afternoon (index 1) and Evening (index 2) default to PM for both start and end
        if (parsed.months[m].sections[1]) {
          if (!parsed.months[m].sections[1].startTime) {
            parsed.months[m].sections[1].startPeriod = 'PM';
          }
          if (!parsed.months[m].sections[1].endTime) {
            parsed.months[m].sections[1].endPeriod = 'PM';
          }
        }

        if (parsed.months[m].sections[2]) {
          if (!parsed.months[m].sections[2].startTime) {
            parsed.months[m].sections[2].startPeriod = 'PM';
          }
          if (!parsed.months[m].sections[2].endTime) {
            parsed.months[m].sections[2].endPeriod = 'PM';
          }
        }

        // Ensure Overtime (index 3) defaults to PM for both start and end
        if (parsed.months[m].sections[3]) {
          if (!parsed.months[m].sections[3].startTime) {
            parsed.months[m].sections[3].startPeriod = 'PM';
          }
          if (!parsed.months[m].sections[3].endTime) {
            parsed.months[m].sections[3].endPeriod = 'PM';
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
      lastSavedAt: undefined,
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
