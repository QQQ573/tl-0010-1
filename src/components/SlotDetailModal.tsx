import type { AdminTimeSlot, Booking, FamilyMember } from '../types';
import { formatDateTimeInTimezone, getTimezoneDisplay } from '../utils/timezone';

interface SlotDetailModalProps {
  slot: AdminTimeSlot;
  bookings: Booking[];
  members: FamilyMember[];
  currentUser: FamilyMember | null;
  selectedTimezone: string;
  onClose: () => void;
  onBook: () => void;
  onCancelBooking: () => void;
}

export default function SlotDetailModal(props: SlotDetailModalProps) {
  const confirmedBookings = () => props.bookings.filter(
    b => b.slotId === props.slot.id && b.status === 'confirmed'
  );
  
  const waitlistBookings = () => props.bookings.filter(
    b => b.slotId === props.slot.id && b.status === 'waitlist'
  ).sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));
  
  const userBooking = () => {
    if (!props.currentUser) return null;
    return props.bookings.find(
      b => b.slotId === props.slot.id && b.memberId === props.currentUser?.id && b.status !== 'cancelled'
    );
  };
  
  const isFull = () => confirmedBookings().length >= props.slot.maxParticipants;
  
  const getMemberById = (id: string) => props.members.find(m => m.id === id);
  
  const tzDisplay = () => getTimezoneDisplay(props.selectedTimezone);
  
  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content" onClick={e => e.stopPropagation()}>
        <div class="modal-header">
          <h2 class="modal-title">{props.slot.title}</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        
        <div class="slot-detail-time">
          <p class="slot-detail-time-main">
            <strong>时间:</strong> {formatDateTimeInTimezone(props.slot.startIso, props.selectedTimezone)} - 
            {formatDateTimeInTimezone(props.slot.endIso, props.selectedTimezone, 'HH:mm')}
          </p>
          <p class="slot-detail-time-sub">
            ({tzDisplay().cityName}时间，{tzDisplay().offset})
          </p>
        </div>
        
        {props.slot.description && (
          <div class="slot-detail-description">
            <p>{props.slot.description}</p>
          </div>
        )}
        
        {props.slot.privateNote && props.currentUser?.canViewPrivateNotes && (
          <div class="private-note">
            <strong>私密备注 (仅长辈可见):</strong>
            <p class="private-note-content">{props.slot.privateNote}</p>
          </div>
        )}
        
        <div class="slot-detail-bookings">
          <div class="slot-detail-bookings-header">
            <strong>报名情况</strong>
            <span class={`slot-status ${isFull() ? 'full' : 'available'}`}>
              {confirmedBookings().length}/{props.slot.maxParticipants} 人
              {isFull() && ' (已满)'}
            </span>
          </div>
          
          <div class="booking-list confirmed">
            <p class="booking-list-title">
              已确认 ({confirmedBookings().length}):
            </p>
            <div class="booking-chips">
              {confirmedBookings().map(booking => {
                const member = getMemberById(booking.memberId);
                return (
                  <span class="booking-chip confirmed-chip">
                    {member?.name || '未知'}
                  </span>
                );
              })}
              {confirmedBookings().length === 0 && (
                <span class="booking-empty">暂无</span>
              )}
            </div>
          </div>
          
          {waitlistBookings().length > 0 && (
            <div class="booking-list waitlist">
              <p class="booking-list-title">
                候补队列 ({waitlistBookings().length}):
              </p>
              <div class="booking-chips">
                {waitlistBookings().map((booking, index) => {
                  const member = getMemberById(booking.memberId);
                  return (
                    <span class="booking-chip waitlist-chip">
                      #{index + 1} {member?.name || '未知'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div class="modal-actions">
          {userBooking() ? (
            <button 
              class="btn btn-secondary btn-large" 
              onClick={props.onCancelBooking}
            >
              取消报名
            </button>
          ) : (
            <button 
              class="btn btn-primary btn-large" 
              onClick={props.onBook}
              disabled={!props.currentUser}
            >
              {isFull() ? '加入候补' : '立即报名'}
            </button>
          )}
          <button class="btn btn-secondary btn-large" onClick={props.onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
