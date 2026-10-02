import { Period, TimeEntry } from '../types';

/**
 * Pad a number with leading zero to ensure 2 digits (e.g., 9 -> "09")
 */
export function pad2(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * Converts HH:MM string + AM/PM period into total minutes from midnight (0 to 1439).
 * Returns null if the input string is invalid.
 */
export function parseTimeToMinutes(timeStr: string, period: Period): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;

  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;
  if (hours < 0 || hours > 12 || minutes < 0 || minutes > 59) return null;

  // Convert to 24-hour format
  if (hours === 12) {
    hours = period === 'AM' ? 0 : 12;
  } else {
    if (period === 'PM') {
      hours += 12;
    }
  }

  return hours * 60 + minutes;
}

/**
 * Calculates duration between start and end time.
 * If end time is earlier than start time, assumes overnight (end time is next day).
 * Returns duration formatted as "XX H YY M" and total minutes.
 */
export function calculateDuration(entry: TimeEntry): { formatted: string; minutes: number } {
  if (!entry.startTime || !entry.endTime) {
    return { formatted: '00 H 00 M', minutes: 0 };
  }

  const startMin = parseTimeToMinutes(entry.startTime, entry.startPeriod);
  const endMin = parseTimeToMinutes(entry.endTime, entry.endPeriod);

  if (startMin === null || endMin === null) {
    return { formatted: '00 H 00 M', minutes: 0 };
  }

  let diff = endMin - startMin;

  // Handle overnight / next day
  if (diff < 0) {
    diff += 24 * 60;
  }

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  return {
    formatted: `${pad2(hours)} H ${pad2(minutes)} M`,
    minutes: diff,
  };
}

/**
 * Formats a total duration in minutes into "XX H YY M"
 */
export function formatTotalMinutes(totalMinutes: number): string {
  if (isNaN(totalMinutes) || totalMinutes <= 0) {
    return '00 H 00 M';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${pad2(hours)} H ${pad2(minutes)} M`;
}

/**
 * Calculates Overtime (OT) by subtracting 8 Hours 30 Minutes (510 mins) from total minutes.
 */
export function calculateOvertime(totalMinutes: number, standardMinutes = 510): { formatted: string; minutes: number } {
  const otMinutes = totalMinutes - standardMinutes;
  if (otMinutes <= 0) {
    return { formatted: '00 H 00 M', minutes: 0 };
  }
  const hours = Math.floor(otMinutes / 60);
  const minutes = otMinutes % 60;
  return {
    formatted: `${pad2(hours)} H ${pad2(minutes)} M`,
    minutes: otMinutes,
  };
}

/**
 * Sums the durations of all 4 sections and calculates OT (deducting 8.30 hours).
 */
export function calculateTotalDuration(sections: [TimeEntry, TimeEntry, TimeEntry, TimeEntry]): {
  durations: [string, string, string, string];
  totalFormatted: string;
  totalMinutes: number;
  otFormatted: string;
  otMinutes: number;
} {
  const sec1 = calculateDuration(sections[0] || { startTime: '', startPeriod: 'AM', endTime: '', endPeriod: 'PM' });
  const sec2 = calculateDuration(sections[1] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' });
  const sec3 = calculateDuration(sections[2] || { startTime: '', startPeriod: 'AM', endTime: '', endPeriod: 'PM' });
  const sec4 = calculateDuration(sections[3] || { startTime: '', startPeriod: 'PM', endTime: '', endPeriod: 'PM' });

  const totalMin = sec1.minutes + sec2.minutes + sec3.minutes + sec4.minutes;
  const ot = calculateOvertime(totalMin, 510); // Deduct 8 Hours 30 Minutes (510 minutes)

  return {
    durations: [sec1.formatted, sec2.formatted, sec3.formatted, sec4.formatted],
    totalFormatted: formatTotalMinutes(totalMin),
    totalMinutes: totalMin,
    otFormatted: ot.formatted,
    otMinutes: ot.minutes,
  };
}

/**
 * Validates a time input string (e.g. "09:00" or "9:30")
 */
export function formatTimeInput(input: string): string {
  // Replace non-numeric and non-colon characters
  const clean = input.replace(/[^\d:]/g, '');
  return clean;
}
