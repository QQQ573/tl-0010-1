import { onMount, onCleanup } from 'solid-js';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { getLunarDateInfo, getLunarFestivalName } from '../utils/lunar';
import type { AdminTimeSlot, Booking, FamilyMember, OverlapSlot } from '../types';

interface CalendarViewProps {
  slots: AdminTimeSlot[];
  bookings: Booking[];
  members: FamilyMember[];
  overlapSlots: OverlapSlot[];
  currentUser: FamilyMember | null;
  selectedTimezone: string;
  onSlotClick?: (slot: AdminTimeSlot) => void;
  onDateClick?: (date: string) => void;
}

export default function CalendarView(props: CalendarViewProps) {
  let calendarEl: HTMLDivElement | undefined;
  let calendar: Calendar | null = null;
  
  const buildEvents = () => {
    const events: any[] = [];
    
    for (const slot of props.slots) {
      const confirmedBookings = props.bookings.filter(
        b => b.slotId === slot.id && b.status === 'confirmed'
      );
      
      const isFull = confirmedBookings.length >= slot.maxParticipants;
      
      events.push({
        id: slot.id,
        title: `${slot.title} (${confirmedBookings.length}/${slot.maxParticipants})`,
        start: slot.startIso,
        end: slot.endIso,
        backgroundColor: isFull ? '#c41e3a' : '#2e8b57',
        borderColor: isFull ? '#8b0000' : '#1e6b47',
        extendedProps: {
          type: 'slot',
          slot,
          confirmedCount: confirmedBookings.length,
          isFull,
        },
      });
    }
    
    for (const overlap of props.overlapSlots) {
      events.push({
        id: `overlap-${overlap.startIso}`,
        title: `可通话 (${overlap.availableMemberIds.length}人)`,
        start: overlap.startIso,
        end: overlap.endIso,
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        borderColor: '#ffd700',
        textColor: '#8b4513',
        extendedProps: {
          type: 'overlap',
          overlap,
        },
      });
    }
    
    return events;
  };
  
  const addLunarDayNumbers = () => {
    if (!calendarEl) return;
    
    const dayCells = calendarEl.querySelectorAll('.fc-daygrid-day-number');
    dayCells.forEach(cell => {
      const dateStr = cell.getAttribute('data-date');
      if (!dateStr) return;
      
      const lunarInfo = getLunarDateInfo(dateStr);
      const festival = getLunarFestivalName(dateStr);
      
      let lunarEl = cell.querySelector('.lunar-day-label') as HTMLElement;
      if (!lunarEl) {
        lunarEl = document.createElement('div');
        lunarEl.className = 'lunar-day-label';
        lunarEl.style.fontSize = '10px';
        lunarEl.style.color = lunarInfo.isLunarNewYearPeriod ? '#c41e3a' : '#999';
        lunarEl.style.fontWeight = lunarInfo.isLunarNewYearPeriod ? 'bold' : 'normal';
        cell.parentNode?.insertBefore(lunarEl, cell.nextSibling);
      }
      
      if (festival) {
        lunarEl.textContent = festival;
        lunarEl.style.color = '#c41e3a';
        lunarEl.style.fontWeight = 'bold';
      } else if (lunarInfo.lunarMonth === 1) {
        lunarEl.textContent = lunarInfo.lunarDayName.replace('正月', '');
      } else {
        lunarEl.textContent = '';
      }
    });
    
    const allDayCells = calendarEl.querySelectorAll('.fc-daygrid-day');
    allDayCells.forEach(cell => {
      const dateStr = cell.getAttribute('data-date');
      if (!dateStr) return;
      
      const lunarInfo = getLunarDateInfo(dateStr);
      
      if (lunarInfo.isLunarNewYearPeriod) {
        cell.classList.add('lunar-highlight');
      } else {
        cell.classList.remove('lunar-highlight');
      }
    });
  };
  
  onMount(() => {
    if (!calendarEl) return;
    
    calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      initialView: 'dayGridMonth',
      locale: 'zh-cn',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
      },
      buttonText: {
        today: '今天',
        month: '月',
        week: '周',
        day: '日',
        list: '列表',
      },
      events: buildEvents(),
      eventClick: (info) => {
        const type = info.event.extendedProps.type;
        if (type === 'slot' && props.onSlotClick) {
          props.onSlotClick(info.event.extendedProps.slot);
        }
      },
      dateClick: (info) => {
        if (props.onDateClick) {
          props.onDateClick(info.dateStr);
        }
      },
      datesSet: () => {
        setTimeout(addLunarDayNumbers, 50);
      },
      viewDidMount: () => {
        setTimeout(addLunarDayNumbers, 50);
      },
      eventDidMount: (info) => {
        const type = info.event.extendedProps.type;
        if (type === 'overlap') {
          info.el.style.opacity = '0.6';
          info.el.style.borderStyle = 'dashed';
        }
      },
      height: 'auto',
      firstDay: 1,
      slotMinTime: '06:00:00',
      slotMaxTime: '24:00:00',
      allDaySlot: false,
      scrollTime: '08:00:00',
    });
    
    calendar.render();
  });
  
  onCleanup(() => {
    if (calendar) {
      calendar.destroy();
    }
  });
  
  return (
    <div class="calendar-section">
      <div ref={calendarEl}></div>
    </div>
  );
}
