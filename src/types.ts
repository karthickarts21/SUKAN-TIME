export type Period = 'AM' | 'PM';

export interface TimeEntry {
  startTime: string; // "HH:MM" format e.g. "09:00"
  startPeriod: Period;
  endTime: string;   // "HH:MM" format e.g. "06:30"
  endPeriod: Period;
}

export interface DayRecord {
  date: string;
  dayNumber: number;
  sections: [TimeEntry, TimeEntry, TimeEntry, TimeEntry];
  durations: [string, string, string, string];
  totalDuration: string;
  otDuration?: string;
  savedAt: string;
}

export interface MonthData {
  date: string;
  sections: [TimeEntry, TimeEntry, TimeEntry, TimeEntry];
  dailyEntries?: Record<number, DayRecord>; // 1 to 31
  lastSavedAt?: string;
}

export type AllMonthsData = Record<string, MonthData>;

export interface AppStorage {
  selectedMonth: string;
  months: AllMonthsData;
}
