import ics from 'ics';
import { DateTime } from 'luxon';
import type { AdminTimeSlot, FamilyMember } from '../types';

interface ExportOptions {
  timezone?: string;
  organizer?: string;
  description?: string;
}

export function exportSlotsToIcs(
  slots: AdminTimeSlot[],
  members: FamilyMember[],
  options: ExportOptions = {}
): string {
  const { timezone = 'Asia/Shanghai' } = options;
  
  const events: any[] = slots.map(slot => {
    const start = DateTime.fromISO(slot.startIso).setZone(timezone);
    const end = DateTime.fromISO(slot.endIso).setZone(timezone);
    
    const attendees = members
      .filter(m => m.isAdmin || m.role === 'elder')
      .map(m => ({ name: m.name, email: `${m.id}@family.local` }));
    
    return {
      start: [start.year, start.month, start.day, start.hour, start.minute],
      end: [end.year, end.month, end.day, end.hour, end.minute],
      title: slot.title,
      description: slot.description || '',
      location: '视频通话',
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: '家族日历', email: 'calendar@family.local' },
      attendees,
    };
  });
  
  const { error, value } = ics.createEvents(events);
  
  if (error) {
    console.error('ICS export error:', error);
    return '';
  }
  
  return value || '';
}

export function downloadIcsFile(content: string, filename: string = 'family-newyear-calendar.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function exportSingleSlotToIcs(
  slot: AdminTimeSlot,
  members: FamilyMember[],
  options: ExportOptions = {}
): string {
  return exportSlotsToIcs([slot], members, options);
}

export function createSingleSlotIcs(
  slot: AdminTimeSlot,
  timezone: string = 'Asia/Shanghai'
): { error?: Error | null; value?: string } {
  const start = DateTime.fromISO(slot.startIso).setZone(timezone);
  const end = DateTime.fromISO(slot.endIso).setZone(timezone);
  
  return ics.createEvent({
    start: [start.year, start.month, start.day, start.hour, start.minute],
    end: [end.year, end.month, end.day, end.hour, end.minute],
    title: slot.title,
    description: slot.description || '',
    location: '视频通话',
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: '家族日历', email: 'calendar@family.local' },
  }) as { error?: Error | null; value?: string };
}
