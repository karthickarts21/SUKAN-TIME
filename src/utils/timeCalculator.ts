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

export interface EarlyIncentiveResult {
  amount: number; // 150, -150, or 0
  formatted: string; // "+150", "-150", "0"
  reason: string;
  hasEntries: boolean;
}

/**
 * Calculates Early Incentive:
 * 1. Start <= 9:30 AM and End >= 6:30 PM -> +150
 * 2. Start >= 9:31 AM and End >= 6:30 PM -> -150
 * 3. Start <= 9:30 AM and End < 6:30 PM -> -150
 * 4. Start >= 9:31 AM and End < 6:30 PM -> -300
 */
export function calculateEarlyIncentive(sections: TimeEntry[]): EarlyIncentiveResult {
  let firstStartMinutes: number | null = null;
  let latestEndMinutes: number | null = null;
  let hasEntries = false;

  for (const s of sections) {
    if (s.startTime) {
      hasEntries = true;
      const m = parseTimeToMinutes(s.startTime, s.startPeriod);
      if (m !== null && (firstStartMinutes === null || m < firstStartMinutes)) {
        firstStartMinutes = m;
      }
    }
    if (s.endTime) {
      hasEntries = true;
      const m = parseTimeToMinutes(s.endTime, s.endPeriod);
      if (m !== null && (latestEndMinutes === null || m > latestEndMinutes)) {
        latestEndMinutes = m;
      }
    }
  }

  if (!hasEntries || firstStartMinutes === null) {
    return {
      amount: 0,
      formatted: '0',
      reason: 'Enter shift start & end times',
      hasEntries: false,
    };
  }

  // 9:30 AM = 570 mins (or 9:30 PM / 1290 mins)
  const isStartBy930 = firstStartMinutes <= 570 || firstStartMinutes === 1290;
  // 9:31 AM - 9:40 AM (571 to 580 mins)
  const isStartBetween931And940 = firstStartMinutes > 570 && firstStartMinutes <= 580;
  // After 9:40 AM (> 580 mins)
  const isStartAfter940 = firstStartMinutes > 580 && firstStartMinutes !== 1290;
  const isStartAfter930 = !isStartBy930;

  // 6:30 PM = 18:30 = 1110 mins
  const isEndAtOrAfter630 = latestEndMinutes !== null && latestEndMinutes >= 1110;
  const isEndBefore630 = latestEndMinutes !== null && latestEndMinutes < 1110;

  // 1. 9.30 am vanthuttu, 6.30 pm kku mela iruntha -> +150
  if (isStartBy930 && isEndAtOrAfter630) {
    return {
      amount: 150,
      formatted: '+150',
      reason: 'Reported by 9:30 AM & worked until 6:30 PM (+150)',
      hasEntries: true,
    };
  }

  // 2. 9.40 am kku mela vanthu, 6.30 pm kku mela iruntha -> -300
  if (isStartAfter940 && isEndAtOrAfter630) {
    return {
      amount: -300,
      formatted: '-300',
      reason: 'Late arrival after 9:40 AM (-300)',
      hasEntries: true,
    };
  }

  // 3. 9.31 am to 9.40 am vanthu, 6.30 pm kku mela iruntha -> -150
  if (isStartBetween931And940 && isEndAtOrAfter630) {
    return {
      amount: -150,
      formatted: '-150',
      reason: 'Late arrival (9:31–9:40 AM) & worked until 6:30 PM (-150)',
      hasEntries: true,
    };
  }

  // 4. 9.30 am kku vanthuttu 6.30 pm munnadiye time iruntha -> -150
  if (isStartBy930 && isEndBefore630) {
    return {
      amount: -150,
      formatted: '-150',
      reason: 'Shift ended before 6:30 PM (-150)',
      hasEntries: true,
    };
  }

  // 5. 9.30 am kku mela 6.30 pm kkum ulla time iruntha -> -300
  if (isStartAfter930 && isEndBefore630) {
    return {
      amount: -300,
      formatted: '-300',
      reason: 'Late arrival after 9:30 AM & left before 6:30 PM (-300)',
      hasEntries: true,
    };
  }

  // Only start time entered so far:
  if (isStartBy930 && latestEndMinutes === null) {
    return {
      amount: 150,
      formatted: '+150',
      reason: 'Started by 9:30 AM (+150 pending end time)',
      hasEntries: true,
    };
  }

  if (isStartBetween931And940 && latestEndMinutes === null) {
    return {
      amount: -150,
      formatted: '-150',
      reason: 'Started between 9:31–9:40 AM (-150)',
      hasEntries: true,
    };
  }

  if (isStartAfter940 && latestEndMinutes === null) {
    return {
      amount: -300,
      formatted: '-300',
      reason: 'Started after 9:40 AM (-300)',
      hasEntries: true,
    };
  }

  return {
    amount: 0,
    formatted: '0',
    reason: 'Standard shift',
    hasEntries: true,
  };
}

/**
 * Calculates Bill Incentive: billCount * 30
 */
export function calculateBillIncentive(billCount: number): number {
  if (isNaN(billCount) || billCount <= 0) return 0;
  return Math.round(billCount * 30);
}
