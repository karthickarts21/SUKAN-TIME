import { MONTHS } from './storage';

export function getYearFromDate(dateStr?: string): number {
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length >= 1 && parts[0]) {
      const y = parseInt(parts[0], 10);
      if (!isNaN(y) && y > 2000) return y;
    }
  }
  return new Date().getFullYear();
}

export function getMonthIndex(monthName: string): number {
  const idx = MONTHS.indexOf(monthName as any);
  return idx >= 0 ? idx : new Date().getMonth();
}

/**
 * Returns true if the day of the given month & year is a Sunday.
 */
export function isSunday(dayNumber: number, monthName: string, year?: number): boolean {
  const y = year || new Date().getFullYear();
  const mIdx = getMonthIndex(monthName);
  const date = new Date(y, mIdx, dayNumber);
  return date.getDay() === 0;
}

/**
 * Returns the short day-of-week string (e.g., 'Sun', 'Mon', 'Tue', etc.)
 */
export function getDayOfWeekName(dayNumber: number, monthName: string, year?: number): string {
  const y = year || new Date().getFullYear();
  const mIdx = getMonthIndex(monthName);
  const date = new Date(y, mIdx, dayNumber);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()] || '';
}

/**
 * Returns the total number of days in the specified month (e.g. 28, 30, 31).
 */
export function getDaysInMonth(monthName: string, year?: number): number {
  const y = year || new Date().getFullYear();
  const mIdx = getMonthIndex(monthName);
  return new Date(y, mIdx + 1, 0).getDate();
}
