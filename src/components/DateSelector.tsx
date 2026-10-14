import React from 'react';
import { DayRecord, TimeEntry } from '../types';
import { getDayOfWeekName, getDaysInMonth, getMonthIndex, getYearFromDate, isPastOrToday, isSunday } from '../utils/dateUtils';
import { Palmtree, UserX, ClockAlert } from 'lucide-react';
import { calculateTotalDuration, isLateArrivalAfter940 } from '../utils/timeCalculator';
import { parseDutyHoursToMinutes } from '../utils/salaryCalculator';

interface DateSelectorProps {
  currentDate: string;
  selectedMonth: string;
  dailyEntries: Record<number, DayRecord>;
  manualHolidays?: number[];
  manualLeaves?: number[];
  manualHalfDays?: number[];
  dailyDutyHours?: string;
  activeSections?: TimeEntry[];
  onSelectDayNumber: (dayNumber: number) => void;
  onToggleHoliday?: (dayNumber: number) => void;
  onToggleLeave?: (dayNumber: number) => void;
  onToggleHalfDay?: (dayNumber: number) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  currentDate,
  selectedMonth,
  dailyEntries,
  manualHolidays = [],
  manualLeaves = [],
  manualHalfDays = [],
  dailyDutyHours = '08:30',
  activeSections,
  onSelectDayNumber,
  onToggleHoliday,
  onToggleLeave,
  onToggleHalfDay,
}) => {
  const currentYear = getYearFromDate(currentDate);
  const totalDaysInMonth = getDaysInMonth(selectedMonth, currentYear);
  const monthIdx = getMonthIndex(selectedMonth);
  const firstDayOfWeekIndex = new Date(currentYear, monthIdx, 1).getDay(); // 0 = Sunday, 1 = Monday...
  const dutyMins = parseDutyHoursToMinutes(dailyDutyHours);
  const halfDutyMinsThreshold = Math.floor(dutyMins / 2); // 255 mins = 4h 15m for 8.5h duty

  // Determine current active day number (clamped to month's total days)
  const currentDayNum = (() => {
    if (currentDate) {
      const parts = currentDate.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        if (d >= 1 && d <= totalDaysInMonth) return d;
        if (d > totalDaysInMonth) return totalDaysInMonth;
      }
    }
    return 1;
  })();

  const isCurrentSunday = isSunday(currentDayNum, selectedMonth, currentYear);
  const isCurrentManualHoliday = manualHolidays.includes(currentDayNum);
  const isCurrentManualLeave = manualLeaves.includes(currentDayNum);
  const isCurrentManualHalf = manualHalfDays.includes(currentDayNum);

  const currentDayRecord = dailyEntries[currentDayNum];
  const currentSectionsToUse = currentDayRecord?.sections || activeSections;

  const isCurrentHalfDay = !isCurrentSunday && !isCurrentManualHoliday && !isCurrentManualLeave && (
    isCurrentManualHalf || (!!currentSectionsToUse && (() => {
      const totals = calculateTotalDuration(currentSectionsToUse);
      return totals.totalMinutes > 0 && totals.totalMinutes <= halfDutyMinsThreshold;
    })())
  );

  const isCurrentLate = !isCurrentSunday && !isCurrentManualHoliday && !isCurrentManualLeave && (
    !!currentSectionsToUse && isLateArrivalAfter940(currentSectionsToUse)
  );

  const savedCount = Object.keys(dailyEntries).length;

  return (
    <div className="w-full p-2.5 sm:p-3 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
      <div className="flex items-center justify-between mb-2 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
            Day Selector
          </span>
          {isCurrentSunday && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 uppercase tracking-tight">
              Sunday (Holiday)
            </span>
          )}
          {isCurrentManualHoliday && !isCurrentSunday && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-tight flex items-center gap-1">
              <Palmtree className="w-2.5 h-2.5 text-amber-700" />
              <span>Manual Holiday</span>
            </span>
          )}
          {isCurrentManualLeave && !isCurrentSunday && !isCurrentManualHoliday && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-900 border border-rose-300 uppercase tracking-tight flex items-center gap-1">
              <UserX className="w-2.5 h-2.5 text-rose-700" />
              <span>Unpaid Leave</span>
            </span>
          )}
          {isCurrentHalfDay && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-950 border border-orange-400 uppercase tracking-tight flex items-center gap-1">
              <span>½ Half Day</span>
            </span>
          )}
          {isCurrentLate && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-300 uppercase tracking-tight flex items-center gap-1">
              <ClockAlert className="w-2.5 h-2.5 text-purple-700" />
              <span>Late (&gt;9:40 AM)</span>
            </span>
          )}
        </div>

        {/* Action buttons for Selected Day: Mark Holiday, Add Leave & Half Day */}
        <div className="flex items-center gap-1.5">
          {/* Mark Holiday */}
          {!isCurrentSunday && onToggleHoliday && (
            <button
              type="button"
              onClick={() => onToggleHoliday(currentDayNum)}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
                isCurrentManualHoliday
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-neutral-100 hover:bg-amber-50 text-neutral-600 hover:text-amber-800 border border-neutral-200 hover:border-amber-300'
              }`}
              title={
                isCurrentManualHoliday
                  ? `Day ${currentDayNum}: Holiday Marked (Click to Remove)`
                  : `Day ${currentDayNum}: Mark as Holiday`
              }
              aria-label={
                isCurrentManualHoliday
                  ? `Remove Day ${currentDayNum} from holidays`
                  : `Mark Day ${currentDayNum} as a Holiday`
              }
            >
              <Palmtree
                className={`w-4 h-4 ${
                  isCurrentManualHoliday ? 'text-amber-700' : 'text-neutral-500'
                }`}
              />
            </button>
          )}

          {/* Add Leave (Manual Unpaid Leave) */}
          {!isCurrentSunday && onToggleLeave && (
            <button
              type="button"
              onClick={() => onToggleLeave(currentDayNum)}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
                isCurrentManualLeave
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                  : 'bg-neutral-100 hover:bg-rose-50 text-neutral-600 hover:text-rose-800 border border-neutral-200 hover:border-rose-300'
              }`}
              title={
                isCurrentManualLeave
                  ? `Day ${currentDayNum}: Unpaid Leave Marked (Click to Remove)`
                  : `Day ${currentDayNum}: Add Leave (Unpaid Leave)`
              }
              aria-label={
                isCurrentManualLeave
                  ? `Remove Day ${currentDayNum} from leaves`
                  : `Mark Day ${currentDayNum} as Unpaid Leave`
              }
            >
              <UserX
                className={`w-4 h-4 ${
                  isCurrentManualLeave ? 'text-rose-700' : 'text-neutral-500'
                }`}
              />
            </button>
          )}

          <span className="text-[10px] font-mono text-neutral-400 font-bold ml-1 hidden sm:inline">
            {savedCount}/{totalDaysInMonth}
          </span>
        </div>
      </div>

      {/* Mobile View Top Header Box for Weekdays (Starting from SUN) */}
      <div className="grid grid-cols-7 gap-1 mb-1.5 sm:hidden text-center">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((dayName, idx) => (
          <div
            key={dayName}
            className={`py-1 text-[10px] font-extrabold tracking-wider rounded-md border ${
              idx === 0
                ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                : 'bg-neutral-100/80 text-neutral-600 border-neutral-200/60'
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Grid of Day buttons: 1 to 31 */}
      <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-16 lg:grid-cols-31 gap-1">
        {/* Empty offset slots on mobile view so Day 1 aligns under its actual weekday column */}
        {Array.from({ length: firstDayOfWeekIndex }).map((_, idx) => (
          <div
            key={`empty-offset-${idx}`}
            className="sm:hidden min-h-[44px] rounded-md border border-neutral-100/50 bg-neutral-50/20"
          />
        ))}

        {Array.from({ length: totalDaysInMonth }, (_, i) => i + 1).map((day) => {
          const isSelected = day === currentDayNum;
          const entry = dailyEntries[day];
          const hasSavedData = !!entry;
          const isSun = isSunday(day, selectedMonth, currentYear);
          const isManualHol = manualHolidays.includes(day);
          const sectionsToUse = entry ? entry.sections : (isSelected && activeSections ? activeSections : undefined);
          const hasTime = !!sectionsToUse && sectionsToUse.some(
            (s) => (typeof s.startTime === 'string' && s.startTime.trim() !== '') || (typeof s.endTime === 'string' && s.endTime.trim() !== '')
          );

          const isPastOrCurr = isPastOrToday(day, selectedMonth, currentYear);
          const isManualLev = !isSun && !isManualHol && isPastOrCurr && (manualLeaves.includes(day) || !hasTime);
          const isManualHalf = manualHalfDays.includes(day) || !!entry?.isHalfDay;

          // Calculate if this day is Half Day or Late
          let isHalfDay = false;
          let isLate = false;
          if (!isSun && !isManualHol && !isManualLev) {
            if (sectionsToUse) {
              const totals = calculateTotalDuration(sectionsToUse);
              isHalfDay = isManualHalf || (totals.totalMinutes > 0 && totals.totalMinutes <= halfDutyMinsThreshold);
              isLate = isLateArrivalAfter940(sectionsToUse);
            } else if (isManualHalf) {
              isHalfDay = true;
            }
          }

          // Distinct color logic for Day Selector:
          // Half Day has a distinct rich orange color
          // Late (>9:40 AM) has purple background with "Late" badge
          // Selected days keep distinct color styling with ring highlight
          const colorClasses = (() => {
            if (isSelected) {
              if (isSun) return 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-500 ring-offset-1';
              if (isManualHol) return 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500 ring-offset-1';
              if (isManualLev) return 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500 ring-offset-1';
              if (isHalfDay) return 'bg-orange-500 text-white shadow-xs ring-2 ring-orange-500 ring-offset-1';
              if (isLate) return 'bg-purple-700 text-white shadow-xs ring-2 ring-purple-600 ring-offset-1';
              if (hasSavedData) return 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-600 ring-offset-1';
              return 'bg-neutral-900 text-white shadow-xs ring-2 ring-neutral-900 ring-offset-1';
            }

            if (isSun) {
              return hasSavedData
                ? 'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100'
                : 'bg-rose-50/50 text-rose-700 border border-rose-200/80 hover:bg-rose-100 hover:text-rose-900';
            }
            if (isManualHol) {
              return hasSavedData
                ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                : 'bg-amber-50/60 text-amber-800 border border-amber-300 hover:bg-amber-100 hover:text-amber-950';
            }
            if (isManualLev) {
              return hasSavedData
                ? 'bg-rose-100 text-rose-950 border border-rose-300 hover:bg-rose-200'
                : 'bg-rose-50/70 text-rose-800 border border-rose-300 hover:bg-rose-100 hover:text-rose-950';
            }
            if (isHalfDay) {
              return 'bg-orange-100 text-orange-950 border-2 border-orange-400 hover:bg-orange-200 shadow-2xs';
            }
            if (isLate) {
              return 'bg-purple-100 text-purple-950 border-2 border-purple-400 hover:bg-purple-200 shadow-2xs';
            }
            if (hasSavedData) {
              return 'bg-emerald-50/90 text-emerald-900 border border-emerald-300 hover:bg-emerald-100';
            }
            return 'bg-neutral-50 text-neutral-600 border border-neutral-200/70 hover:bg-neutral-100 hover:text-neutral-900';
          })();

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDayNumber(day)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!isSun && onToggleHoliday) {
                  onToggleHoliday(day);
                }
              }}
              className={`relative py-1 px-0.5 min-h-[46px] text-xs font-mono font-semibold rounded-md transition-all flex flex-col items-center justify-center cursor-pointer ${colorClasses}`}
              title={
                isSun
                  ? `Day ${day}: Sunday (Holiday)${hasSavedData ? ` - Logged (${entry.totalDuration})` : ''}`
                  : isManualHol
                  ? `Day ${day}: Manual Holiday${hasSavedData ? ` - Logged (${entry.totalDuration})` : ''}`
                  : isManualLev
                  ? `Day ${day}: Unpaid Leave Marked${hasSavedData ? ` - Logged (${entry.totalDuration})` : ''}`
                  : isHalfDay
                  ? `Day ${day}: Half Day Shift${hasSavedData ? ` (${entry.totalDuration})` : ''}${isLate ? ' - Late Arrival' : ''}`
                  : isLate
                  ? `Day ${day}: Late Arrival (Started after 9:40 AM)${hasSavedData ? ` - Logged (${entry.totalDuration})` : ''}`
                  : hasSavedData
                  ? `Day ${day}: Logged (${entry.totalDuration})`
                  : `Day ${day}: No record`
              }
            >
              <span className="font-bold text-xs leading-none">{day}</span>
              <span
                className={`hidden sm:inline text-[9px] leading-none font-sans font-semibold uppercase tracking-tighter mt-0.5 ${
                  isSelected
                    ? 'text-white/90'
                    : isSun
                    ? 'text-rose-700 font-bold'
                    : 'text-neutral-500'
                }`}
              >
                {getDayOfWeekName(day, selectedMonth, currentYear)}
              </span>

              {/* Manual Holiday tag */}
              {!isSun && isManualHol && (
                <span
                  className={`text-[8px] leading-tight font-sans font-bold uppercase tracking-tighter ${
                    isSelected ? 'text-amber-200' : 'text-amber-800'
                  }`}
                >
                  Hol
                </span>
              )}

              {/* Manual Leave tag */}
              {!isSun && !isManualHol && isManualLev && (
                <span
                  className={`text-[8px] leading-tight font-sans font-bold uppercase tracking-tighter ${
                    isSelected ? 'text-rose-200' : 'text-rose-800'
                  }`}
                >
                  Leave
                </span>
              )}

              {/* Half Day tag - distinct badge */}
              {!isSun && !isManualHol && !isManualLev && isHalfDay && !isLate && (
                <span
                  className={`text-[8px] leading-tight font-sans font-bold uppercase tracking-tighter ${
                    isSelected ? 'text-orange-100' : 'text-orange-900 font-extrabold'
                  }`}
                >
                  Half
                </span>
              )}

              {/* Late arrival tag (> 9:40 AM) */}
              {!isSun && !isManualHol && !isManualLev && !isHalfDay && isLate && (
                <span
                  className={`text-[8px] leading-tight font-sans font-bold uppercase tracking-tighter ${
                    isSelected ? 'text-purple-200' : 'text-purple-800 font-extrabold'
                  }`}
                >
                  Late
                </span>
              )}

              {/* Both Half Day and Late */}
              {!isSun && !isManualHol && !isManualLev && isHalfDay && isLate && (
                <span
                  className={`text-[7px] leading-tight font-sans font-bold uppercase tracking-tighter ${
                    isSelected ? 'text-orange-100' : 'text-orange-950 font-extrabold'
                  }`}
                >
                  ½ Late
                </span>
              )}

              {/* Saved indicator dot for normal saved days */}
              {hasSavedData && !isSun && !isManualHol && !isManualLev && !isHalfDay && !isLate && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? 'bg-emerald-300' : 'bg-emerald-600'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Manual Holidays, Leaves & Half Days Quick Chips if any are marked */}
      {(manualHolidays.length > 0 || manualLeaves.length > 0 || manualHalfDays.length > 0) && (
        <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-3 flex-wrap">
          {manualHolidays.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <Palmtree className="w-3 h-3 text-amber-600" />
                <span>Holidays:</span>
              </span>
              {manualHolidays.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onToggleHoliday && onToggleHoliday(d)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 hover:bg-rose-50 text-amber-900 hover:text-rose-700 border border-amber-300 hover:border-rose-300 transition-colors cursor-pointer"
                  title={`Click to unmark Day ${d} as Holiday`}
                >
                  <span>Day {d}</span>
                  <span className="text-[9px] text-neutral-400">×</span>
                </button>
              ))}
            </div>
          )}

          {manualLeaves.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1">
                <UserX className="w-3 h-3 text-rose-600" />
                <span>Unpaid Leaves:</span>
              </span>
              {manualLeaves.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onToggleLeave && onToggleLeave(d)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-50 hover:bg-neutral-100 text-rose-900 hover:text-neutral-700 border border-rose-300 hover:border-neutral-300 transition-colors cursor-pointer"
                  title={`Click to unmark Day ${d} as Leave`}
                >
                  <span>Day {d}</span>
                  <span className="text-[9px] text-neutral-400">×</span>
                </button>
              ))}
            </div>
          )}

          {manualHalfDays.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1">
                <span className="font-mono text-orange-600">½</span>
                <span>Half Days:</span>
              </span>
              {manualHalfDays.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onToggleHalfDay && onToggleHalfDay(d)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-orange-50 hover:bg-neutral-100 text-orange-950 hover:text-neutral-700 border border-orange-300 hover:border-neutral-300 transition-colors cursor-pointer"
                  title={`Click to unmark Day ${d} as Half Day`}
                >
                  <span>Day {d}</span>
                  <span className="text-[9px] text-neutral-400">×</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
