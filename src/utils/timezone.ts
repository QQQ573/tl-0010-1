import { DateTime } from 'luxon';
import type { DaySlice, TimezoneDisplay } from '../types';

export function getTimezoneDisplay(timezone: string): TimezoneDisplay {
  const now = DateTime.now().setZone(timezone);
  const offset = now.toFormat('ZZ');
  const isDST = now.isInDST;
  
  const cityNames: Record<string, string> = {
    'Asia/Shanghai': '上海/北京',
    'Asia/Hong_Kong': '香港',
    'Asia/Taipei': '台北',
    'Asia/Tokyo': '东京',
    'Asia/Seoul': '首尔',
    'Asia/Singapore': '新加坡',
    'America/New_York': '纽约',
    'America/Los_Angeles': '洛杉矶',
    'America/Chicago': '芝加哥',
    'America/Denver': '丹佛',
    'America/Phoenix': '凤凰城',
    'Pacific/Auckland': '奥克兰',
    'Pacific/Honolulu': '檀香山',
    'Europe/London': '伦敦',
    'Europe/Paris': '巴黎',
    'Europe/Berlin': '柏林',
  };
  
  return {
    timezone,
    offset,
    cityName: cityNames[timezone] || timezone.split('/')[1]?.replace(/_/g, ' ') || timezone,
    isDST,
  };
}

export function convertTime(
  isoString: string,
  targetTimezone: string
): DateTime {
  return DateTime.fromISO(isoString).setZone(targetTimezone);
}

export function formatDateTimeInTimezone(
  isoString: string,
  timezone: string,
  format: string = 'yyyy-MM-dd HH:mm'
): string {
  const dt = DateTime.fromISO(isoString).setZone(timezone);
  return dt.isValid ? dt.toFormat(format) : 'Invalid date';
}

export function formatDateInTimezone(
  isoString: string,
  timezone: string
): string {
  return formatDateTimeInTimezone(isoString, timezone, 'yyyy-MM-dd');
}

export function formatTimeInTimezone(
  isoString: string,
  timezone: string
): string {
  return formatDateTimeInTimezone(isoString, timezone, 'HH:mm');
}

export function getTimeDifference(targetTimezone: string, baseTimezone: string = 'Asia/Shanghai'): string {
  const now = DateTime.now();
  const targetOffset = now.setZone(targetTimezone).offset;
  const baseOffset = now.setZone(baseTimezone).offset;
  const diffHours = (targetOffset - baseOffset) / 60;
  
  if (diffHours === 0) return '与北京时间相同';
  const sign = diffHours > 0 ? '+' : '';
  return `${sign}${diffHours}小时`;
}

export function isDSTTransitionDay(date: string, timezone: string): boolean {
  const startOfDay = DateTime.fromISO(date + 'T00:00:00').setZone(timezone);
  const endOfDay = DateTime.fromISO(date + 'T23:59:59').setZone(timezone);
  
  return startOfDay.isInDST !== endOfDay.isInDST;
}

export function getDSTTransitionInfo(date: string, timezone: string): {
  isTransitionDay: boolean;
  transitionType?: 'spring-forward' | 'fall-back';
  transitionTime?: string;
  offsetChange?: number;
} {
  if (!isDSTTransitionDay(date, timezone)) {
    return { isTransitionDay: false };
  }
  
  const startOfDay = DateTime.fromISO(date + 'T00:00:00').setZone(timezone);
  const wasDST = startOfDay.isInDST;
  
  let transitionHour = 2;
  for (let hour = 0; hour < 24; hour++) {
    const time = DateTime.fromISO(`${date}T${String(hour).padStart(2, '0')}:30:00`).setZone(timezone);
    if (time.isInDST !== wasDST) {
      transitionHour = hour;
      break;
    }
  }
  
  const transitionType = wasDST ? 'fall-back' : 'spring-forward';
  const offsetChange = wasDST ? -60 : 60;
  
  return {
    isTransitionDay: true,
    transitionType,
    transitionTime: `${String(transitionHour).padStart(2, '0')}:00`,
    offsetChange,
  };
}

export function sliceTimeToDays(
  startIso: string,
  endIso: string,
  timezone: string
): DaySlice[] {
  const slices: DaySlice[] = [];
  
  let currentStart = DateTime.fromISO(startIso).setZone(timezone);
  const finalEnd = DateTime.fromISO(endIso).setZone(timezone);
  
  if (!currentStart.isValid || !finalEnd.isValid) {
    return [];
  }
  
  while (currentStart < finalEnd) {
    const dayStart = currentStart.startOf('day');
    const dayEnd = currentStart.endOf('day');
    
    const sliceStart = currentStart > dayStart ? currentStart : dayStart;
    const sliceEnd = finalEnd < dayEnd ? finalEnd : dayEnd;
    
    slices.push({
      date: sliceStart.toFormat('yyyy-MM-dd'),
      startTime: sliceStart.toFormat('HH:mm'),
      endTime: sliceEnd.toFormat('HH:mm'),
    });
    
    currentStart = dayEnd.plus({ milliseconds: 1 }).startOf('day');
  }
  
  return slices;
}

const REFERENCE_TIMEZONE = 'Asia/Shanghai';

export function availabilityToUtcRange(
  date: string,
  startTime: string,
  endTime: string,
  timezone: string
): { startIso: string; endIso: string } {
  const refDayStart = DateTime.fromFormat(
    `${date} 00:00`,
    'yyyy-MM-dd HH:mm',
    { zone: REFERENCE_TIMEZONE }
  ).toUTC();
  
  const refDayEnd = DateTime.fromFormat(
    `${date} 23:59`,
    'yyyy-MM-dd HH:mm',
    { zone: REFERENCE_TIMEZONE }
  ).toUTC();

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let utcStart: DateTime | null = null;
  let utcEnd: DateTime | null = null;
  
  let cursor = refDayStart;
  while (cursor <= refDayEnd) {
    const localTime = cursor.setZone(timezone);
    const localMinutes = localTime.hour * 60 + localTime.minute;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const isInRange = endMinutes > startMinutes
      ? (localMinutes >= startMinutes && localMinutes < endMinutes)
      : (localMinutes >= startMinutes || localMinutes < endMinutes);
    
    if (isInRange) {
      if (!utcStart) {
        utcStart = cursor;
      }
      utcEnd = cursor.plus({ minutes: 30 });
    }
    
    cursor = cursor.plus({ minutes: 30 });
  }
  
  if (!utcStart || !utcEnd) {
    const fallbackStart = DateTime.fromFormat(
      `${date} ${startTime}`,
      'yyyy-MM-dd HH:mm',
      { zone: timezone }
    );
    let fallbackEnd = DateTime.fromFormat(
      `${date} ${endTime}`,
      'yyyy-MM-dd HH:mm',
      { zone: timezone }
    );
    if (fallbackEnd <= fallbackStart) {
      fallbackEnd = fallbackEnd.plus({ days: 1 });
    }
    return {
      startIso: fallbackStart.toUTC().toISO() || '',
      endIso: fallbackEnd.toUTC().toISO() || '',
    };
  }
  
  return {
    startIso: utcStart.toUTC().toISO() || '',
    endIso: utcEnd.toUTC().toISO() || '',
  };
}

export function getLocalTimeRangeForDate(
  utcStartIso: string,
  utcEndIso: string,
  timezone: string,
  localDate: string
): { startTime: string; endTime: string } | null {
  const slices = sliceTimeToDays(utcStartIso, utcEndIso, timezone);
  const daySlice = slices.find(s => s.date === localDate);
  
  if (!daySlice) return null;
  
  return {
    startTime: daySlice.startTime,
    endTime: daySlice.endTime,
  };
}

export function isTimeOverlapping(
  start1: DateTime,
  end1: DateTime,
  start2: DateTime,
  end2: DateTime
): boolean {
  return start1 < end2 && start2 < end1;
}

export function getOverlapDuration(
  start1: DateTime,
  end1: DateTime,
  start2: DateTime,
  end2: DateTime
): number {
  const overlapStart = start1 > start2 ? start1 : start2;
  const overlapEnd = end1 < end2 ? end1 : end2;
  
  if (overlapStart >= overlapEnd) return 0;
  
  return overlapEnd.diff(overlapStart, 'minutes').minutes;
}

export function generateTimeSlots(
  startIso: string,
  endIso: string,
  intervalMinutes: number
): { startIso: string; endIso: string }[] {
  const slots: { startIso: string; endIso: string }[] = [];
  
  let current = DateTime.fromISO(startIso);
  const end = DateTime.fromISO(endIso);
  
  while (current.plus({ minutes: intervalMinutes }) <= end) {
    slots.push({
      startIso: current.toISO() || '',
      endIso: current.plus({ minutes: intervalMinutes }).toISO() || '',
    });
    current = current.plus({ minutes: intervalMinutes });
  }
  
  return slots;
}

export function getLunarNewYearDates(year: number): { start: string; end: string } {
  const lunarNewYearDates: Record<number, { month: number; day: number }> = {
    2025: { month: 1, day: 29 },
    2026: { month: 2, day: 17 },
    2027: { month: 2, day: 6 },
    2028: { month: 1, day: 26 },
    2029: { month: 2, day: 13 },
    2030: { month: 2, day: 3 },
  };
  
  const newYear = lunarNewYearDates[year] || { month: 2, day: 17 };
  const start = DateTime.fromObject({ year, month: newYear.month, day: newYear.day });
  const end = start.plus({ days: 14 });
  
  return {
    start: start.toFormat('yyyy-MM-dd'),
    end: end.toFormat('yyyy-MM-dd'),
  };
}

export function isWithinLunarNewYearPeriod(dateIso: string, year?: number): boolean {
  const dt = DateTime.fromISO(dateIso);
  const checkYear = year || dt.year;
  
  const { start, end } = getLunarNewYearDates(checkYear);
  const startDate = DateTime.fromISO(start);
  const endDate = DateTime.fromISO(end);
  
  return dt >= startDate.startOf('day') && dt <= endDate.endOf('day');
}
