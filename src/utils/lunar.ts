import { DateTime } from 'luxon';
import { Solar, Lunar } from 'lunar-javascript';
import type { LunarDateInfo } from '../types';

export function getLunarDateInfo(isoDate: string): LunarDateInfo {
  const dt = DateTime.fromISO(isoDate);
  const solar = Solar.fromYmd(dt.year, dt.month, dt.day);
  const lunar = solar.getLunar();
  
  const lunarYear = lunar.getYear();
  const lunarMonth = lunar.getMonth();
  const lunarDay = lunar.getDay();
  
  const isFirstMonth = lunarMonth === 1;
  const isWithinFirstFifteen = lunarDay >= 1 && lunarDay <= 15;
  const isLunarNewYearPeriod = isFirstMonth && isWithinFirstFifteen;
  
  const dayNames = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ];
  
  const lunarDayName = dayNames[lunarDay - 1] || `${lunarDay}日`;
  
  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLunarNewYearPeriod,
    lunarDayName: `正月${lunarDayName}`,
  };
}

export function getLunarDayName(isoDate: string): string {
  const info = getLunarDateInfo(isoDate);
  return info.lunarDayName;
}

export function isLunarNewYearDay(isoDate: string): boolean {
  const info = getLunarDateInfo(isoDate);
  return info.lunarMonth === 1 && info.lunarDay === 1;
}

export function getLunarNewYearSolarDate(lunarYear: number): DateTime {
  const lunar = Lunar.fromYmd(lunarYear, 1, 1);
  const solar = lunar.getSolar();
  return DateTime.fromObject({
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay(),
  });
}

export function getLanternFestivalDate(lunarYear: number): DateTime {
  const lunar = Lunar.fromYmd(lunarYear, 1, 15);
  const solar = lunar.getSolar();
  return DateTime.fromObject({
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay(),
  });
}

export function generateLunarNewYearDates(year: number): string[] {
  const dates: string[] = [];
  const newYear = getLunarNewYearSolarDate(year);
  
  for (let i = 0; i < 15; i++) {
    const date = newYear.plus({ days: i });
    dates.push(date.toFormat('yyyy-MM-dd'));
  }
  
  return dates;
}

export function getLunarFestivalName(isoDate: string): string | null {
  const info = getLunarDateInfo(isoDate);
  
  if (info.lunarMonth === 1 && info.lunarDay === 1) return '春节';
  if (info.lunarMonth === 1 && info.lunarDay === 2) return '初二';
  if (info.lunarMonth === 1 && info.lunarDay === 3) return '初三';
  if (info.lunarMonth === 1 && info.lunarDay === 4) return '初四';
  if (info.lunarMonth === 1 && info.lunarDay === 5) return '初五（迎财神）';
  if (info.lunarMonth === 1 && info.lunarDay === 7) return '人日';
  if (info.lunarMonth === 1 && info.lunarDay === 15) return '元宵节';
  if (info.lunarMonth === 2 && info.lunarDay === 2) return '龙抬头';
  if (info.lunarMonth === 5 && info.lunarDay === 5) return '端午节';
  if (info.lunarMonth === 7 && info.lunarDay === 7) return '七夕';
  if (info.lunarMonth === 8 && info.lunarDay === 15) return '中秋节';
  if (info.lunarMonth === 9 && info.lunarDay === 9) return '重阳节';
  
  return null;
}
