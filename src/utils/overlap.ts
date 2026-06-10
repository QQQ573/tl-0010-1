import { DateTime } from 'luxon';
import type { FamilyMember, AvailabilityWindow, OverlapSlot } from '../types';
import { availabilityToUtcRange, generateTimeSlots } from './timezone';

interface AvailabilityRange {
  memberId: string;
  start: DateTime;
  end: DateTime;
}

function convertAvailabilitiesToRanges(
  availabilities: AvailabilityWindow[]
): AvailabilityRange[] {
  const ranges: AvailabilityRange[] = [];
  
  for (const avail of availabilities) {
    const { startIso, endIso } = availabilityToUtcRange(
      avail.date,
      avail.startTime,
      avail.endTime,
      avail.timezone
    );
    
    if (startIso && endIso) {
      ranges.push({
        memberId: avail.memberId,
        start: DateTime.fromISO(startIso),
        end: DateTime.fromISO(endIso),
      });
    }
  }
  
  return ranges;
}

export function findOverlappingSlots(
  members: FamilyMember[],
  availabilities: AvailabilityWindow[],
  options: {
    minDurationMinutes?: number;
    slotIntervalMinutes?: number;
    startDate?: string;
    endDate?: string;
  } = {}
): OverlapSlot[] {
  const {
    minDurationMinutes = 30,
    slotIntervalMinutes = 15,
  } = options;
  
  if (members.length === 0 || availabilities.length === 0) {
    return [];
  }
  
  const ranges = convertAvailabilitiesToRanges(availabilities);
  
  if (ranges.length === 0) return [];
  
  const allStartTimes: DateTime[] = [];
  const allEndTimes: DateTime[] = [];
  
  for (const range of ranges) {
    allStartTimes.push(range.start);
    allEndTimes.push(range.end);
  }
  
  const earliest = allStartTimes.reduce((a, b) => (a < b ? a : b));
  const latest = allEndTimes.reduce((a, b) => (a > b ? a : b));
  
  const candidateSlots = generateTimeSlots(
    earliest.toISO() || '',
    latest.toISO() || '',
    slotIntervalMinutes
  );
  
  const overlapSlots: OverlapSlot[] = [];
  
  for (const slot of candidateSlots) {
    const slotStart = DateTime.fromISO(slot.startIso);
    const slotEnd = DateTime.fromISO(slot.endIso);
    
    const availableMemberIds: string[] = [];
    
    for (const member of members) {
      const memberRanges = ranges.filter(r => r.memberId === member.id);
      let isAvailable = false;
      
      for (const range of memberRanges) {
        if (slotStart >= range.start && slotEnd <= range.end) {
          isAvailable = true;
          break;
        }
      }
      
      if (isAvailable) {
        availableMemberIds.push(member.id);
      }
    }
    
    if (availableMemberIds.length >= 2) {
      const duration = slotEnd.diff(slotStart, 'minutes').minutes;
      
      if (duration >= minDurationMinutes) {
        const score = calculateSlotScore(slotStart, slotEnd, availableMemberIds, members);
        
        overlapSlots.push({
          startIso: slot.startIso,
          endIso: slot.endIso,
          durationMinutes: duration,
          availableMemberIds,
          score,
        });
      }
    }
  }
  
  return mergeConsecutiveSlots(overlapSlots);
}

function mergeConsecutiveSlots(slots: OverlapSlot[]): OverlapSlot[] {
  if (slots.length <= 1) return slots;
  
  const sorted = [...slots].sort((a, b) => 
    DateTime.fromISO(a.startIso).toMillis() - DateTime.fromISO(b.startIso).toMillis()
  );
  
  const merged: OverlapSlot[] = [];
  let current = { ...sorted[0], memberIds: new Set(sorted[0].availableMemberIds) };
  
  for (let i = 1; i < sorted.length; i++) {
    const slot = sorted[i];
    const currentEnd = DateTime.fromISO(current.endIso);
    const slotStart = DateTime.fromISO(slot.startIso);
    
    const sameMembers = 
      current.availableMemberIds.length === slot.availableMemberIds.length &&
      current.availableMemberIds.every(id => slot.availableMemberIds.includes(id));
    
    if (slotStart <= currentEnd && sameMembers) {
      current.endIso = slot.endIso;
      current.durationMinutes += slot.durationMinutes;
    } else {
      merged.push({
        startIso: current.startIso,
        endIso: current.endIso,
        durationMinutes: current.durationMinutes,
        availableMemberIds: current.availableMemberIds,
        score: current.score,
      });
      current = { ...slot, memberIds: new Set(slot.availableMemberIds) };
    }
  }
  
  merged.push({
    startIso: current.startIso,
    endIso: current.endIso,
    durationMinutes: current.durationMinutes,
    availableMemberIds: current.availableMemberIds,
    score: current.score,
  });
  
  return merged;
}

function calculateSlotScore(
  start: DateTime,
  end: DateTime,
  availableMemberIds: string[],
  allMembers: FamilyMember[]
): number {
  let score = 0;
  
  score += availableMemberIds.length * 100;
  
  const duration = end.diff(start, 'minutes').minutes;
  score += Math.min(duration, 120) * 2;
  
  for (const memberId of availableMemberIds) {
    const member = allMembers.find(m => m.id === memberId);
    if (member) {
      const localTime = start.setZone(member.timezone);
      const hour = localTime.hour;
      
      if (hour >= 9 && hour <= 12) {
        score += 30;
      } else if (hour >= 14 && hour <= 20) {
        score += 25;
      } else if (hour >= 8 && hour < 9) {
        score += 15;
      } else if (hour > 20 && hour <= 22) {
        score += 10;
      } else if (hour >= 22 || hour < 7) {
        score -= 50;
      }
      
      if (member.role === 'elder') {
        const elderLocalHour = start.setZone(member.timezone).hour;
        if (elderLocalHour >= 9 && elderLocalHour <= 18) {
          score += 40;
        }
      }
    }
  }
  
  const hasElders = availableMemberIds.some(id => 
    allMembers.find(m => m.id === id)?.role === 'elder'
  );
  if (hasElders) {
    score += 50;
  }
  
  return score;
}

export function recommendTopSlots(
  overlapSlots: OverlapSlot[],
  count: number = 3
): OverlapSlot[] {
  return [...overlapSlots]
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function formatSlotDisplay(
  slot: OverlapSlot,
  timezone: string,
  members: FamilyMember[]
): { time: string; duration: string; memberNames: string[]; isGoodTime: boolean } {
  const start = DateTime.fromISO(slot.startIso).setZone(timezone);
  const end = DateTime.fromISO(slot.endIso).setZone(timezone);
  
  const time = `${start.toFormat('MM/dd HH:mm')} - ${end.toFormat('HH:mm')}`;
  
  const hours = Math.floor(slot.durationMinutes / 60);
  const mins = slot.durationMinutes % 60;
  const duration = hours > 0 
    ? `${hours}小时${mins > 0 ? mins + '分钟' : ''}` 
    : `${mins}分钟`;
  
  const memberNames = slot.availableMemberIds
    .map(id => members.find(m => m.id === id)?.name || '未知')
    .filter(Boolean);
  
  const localHour = start.hour;
  const isGoodTime = localHour >= 9 && localHour <= 21;
  
  return { time, duration, memberNames, isGoodTime };
}

export function getSlotsForDate(
  slots: OverlapSlot[],
  date: string,
  timezone: string
): OverlapSlot[] {
  const targetDate = DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: timezone });
  
  return slots.filter(slot => {
    const start = DateTime.fromISO(slot.startIso).setZone(timezone);
    const end = DateTime.fromISO(slot.endIso).setZone(timezone);
    
    return start.hasSame(targetDate, 'day') || end.hasSame(targetDate, 'day');
  });
}
