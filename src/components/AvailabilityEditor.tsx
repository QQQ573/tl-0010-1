import { createSignal, For } from 'solid-js';
import type { AvailabilityWindow, FamilyMember } from '../types';

interface AvailabilityEditorProps {
  member: FamilyMember;
  availabilities: AvailabilityWindow[];
  onSave: (availabilities: Omit<AvailabilityWindow, 'id'>[]) => void;
  onClose: () => void;
}

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '23:59'
];

const DEFAULT_DATES = [
  '2026-02-17',
  '2026-02-18', 
  '2026-02-19',
  '2026-02-20',
  '2026-02-21',
  '2026-02-22',
  '2026-02-23',
  '2026-02-24',
  '2026-03-03',
];

const LUNAR_DAY_MAP: Record<string, string> = {
  '2026-02-17': '初一',
  '2026-02-18': '初二',
  '2026-02-19': '初三',
  '2026-02-20': '初四',
  '2026-02-21': '初五',
  '2026-02-22': '初六',
  '2026-02-23': '初七',
  '2026-02-24': '初八',
  '2026-03-03': '十五',
};

export default function AvailabilityEditor(props: AvailabilityEditorProps) {
  const [selectedDate, setSelectedDate] = createSignal(DEFAULT_DATES[0]);
  const [startTime, setStartTime] = createSignal('09:00');
  const [endTime, setEndTime] = createSignal('21:00');
  
  const addAvailability = () => {
    const newAvail = {
      memberId: props.member.id,
      date: selectedDate(),
      startTime: startTime(),
      endTime: endTime(),
      timezone: props.member.timezone,
    };
    
    const currentMemberAvails = memberAvailabilities().filter(
      a => !(a.memberId === props.member.id && a.date === selectedDate())
    );
    
    props.onSave([...currentMemberAvails, newAvail]);
  };
  
  const removeAvailability = (date: string) => {
    props.onSave(memberAvailabilities().filter(
      a => !(a.memberId === props.member.id && a.date === date)
    ));
  };
  
  const memberAvailabilities = () => props.availabilities.filter(
    a => a.memberId === props.member.id
  );
  
  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content" onClick={e => e.stopPropagation()}>
        <div class="modal-header">
          <h2 class="modal-title">标记可接听时间 - {props.member.name}</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        
        <p class="modal-subtitle">
          时区: {props.member.timezone} (当地时间)
        </p>
        
        <div class="form-group">
          <label>选择日期</label>
          <div class="date-picker-grid">
            <For each={DEFAULT_DATES}>
              {date => (
                <button
                  type="button"
                  class={`date-picker-btn ${selectedDate() === date ? 'active' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  {LUNAR_DAY_MAP[date] || date.slice(5)}
                </button>
              )}
            </For>
          </div>
        </div>
        
        <div class="time-picker-row">
          <div class="form-group">
            <label>开始时间</label>
            <select value={startTime()} onChange={e => setStartTime(e.target.value)}>
              <For each={TIME_OPTIONS}>
                {time => <option value={time}>{time}</option>}
              </For>
            </select>
          </div>
          
          <div class="form-group">
            <label>结束时间</label>
            <select value={endTime()} onChange={e => setEndTime(e.target.value)}>
              <For each={TIME_OPTIONS}>
                {time => <option value={time}>{time}</option>}
              </For>
            </select>
          </div>
        </div>
        
        <button class="btn btn-primary btn-block" onClick={addAvailability}>
          添加/更新此日期的可接听时段
        </button>
        
        <div class="saved-availabilities">
          <p class="saved-availabilities-title">
            已标记的日期 ({memberAvailabilities().length})
          </p>
          <div class="saved-availabilities-list">
            <For each={memberAvailabilities()}>
              {avail => (
                <div class="saved-avail-item">
                  <span class="saved-avail-date">
                    {LUNAR_DAY_MAP[avail.date] || avail.date}
                  </span>
                  <span class="saved-avail-time">
                    {avail.startTime}-{avail.endTime}
                  </span>
                  <button 
                    type="button"
                    class="saved-avail-remove"
                    onClick={() => removeAvailability(avail.date)}
                  >
                    ×
                  </button>
                </div>
              )}
            </For>
            {memberAvailabilities().length === 0 && (
              <span class="saved-avail-empty">暂无</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
