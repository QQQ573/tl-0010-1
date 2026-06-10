import { createSignal, onMount } from 'solid-js';
import CalendarView from './components/CalendarView';
import MemberList from './components/MemberList';
import RecommendedSlots from './components/RecommendedSlots';
import SlotDetailModal from './components/SlotDetailModal';
import AvailabilityEditor from './components/AvailabilityEditor';
import CreateSlotModal from './components/CreateSlotModal';
import UserSelector from './components/UserSelector';
import { api } from './services/api';
import { findOverlappingSlots, recommendTopSlots } from './utils/overlap';
import { exportSlotsToIcs, downloadIcsFile } from './utils/ical';
import { getCurrentUserId, setCurrentUserId as saveCurrentUserId } from './utils/storage';
import { getTimezoneDisplay } from './utils/timezone';
import type { 
  FamilyMember, 
  AdminTimeSlot, 
  Booking, 
  AvailabilityWindow,
  CreateSlotRequest 
} from './types';

export default function App() {
  const [members, setMembers] = createSignal<FamilyMember[]>([]);
  const [slots, setSlots] = createSignal<AdminTimeSlot[]>([]);
  const [bookings, setBookings] = createSignal<Booking[]>([]);
  const [availabilities, setAvailabilities] = createSignal<AvailabilityWindow[]>([]);
  
  const [currentUserId, setCurrentUserId] = createSignal(getCurrentUserId());
  const [selectedSlot, setSelectedSlot] = createSignal<AdminTimeSlot | null>(null);
  const [showAvailabilityEditor, setShowAvailabilityEditor] = createSignal(false);
  const [showCreateSlot, setShowCreateSlot] = createSignal(false);
  const [selectedMemberForAvailability, setSelectedMemberForAvailability] = createSignal<FamilyMember | null>(null);
  
  const currentUser = () => members().find(m => m.id === currentUserId()) || null;
  const selectedTimezone = () => currentUser()?.timezone || 'Asia/Shanghai';
  
  const overlapSlots = () => findOverlappingSlots(
    members().filter(m => m.role !== 'child'),
    availabilities(),
    { minDurationMinutes: 30, slotIntervalMinutes: 30 }
  );
  
  const recommendedSlots = () => recommendTopSlots(overlapSlots(), 3);
  
  const loadData = async () => {
    try {
      const [membersData, slotsData, bookingsData, availabilitiesData] = await Promise.all([
        api.members.getAll(),
        api.slots.getAll(),
        api.bookings.getAll(),
        api.availabilities.getAll(),
      ]);
      
      setMembers(membersData as FamilyMember[]);
      setSlots(slotsData as AdminTimeSlot[]);
      setBookings(bookingsData as Booking[]);
      setAvailabilities(availabilitiesData as AvailabilityWindow[]);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };
  
  onMount(() => {
    loadData();
  });
  
  const handleSelectUser = (userId: string) => {
    setCurrentUserId(userId);
    saveCurrentUserId(userId);
  };
  
  const handleSlotClick = (slot: AdminTimeSlot) => {
    setSelectedSlot(slot);
  };
  
  const handleBookSlot = async () => {
    if (!currentUser() || !selectedSlot()) return;
    
    try {
      await api.bookings.create({
        slotId: selectedSlot()!.id,
        memberId: currentUser()!.id,
      });
      await loadData();
    } catch (error) {
      console.error('Failed to book slot:', error);
    }
  };
  
  const handleCancelBooking = async () => {
    if (!currentUser() || !selectedSlot()) return;
    
    const userBooking = bookings().find(
      b => b.slotId === selectedSlot()!.id && b.memberId === currentUser()!.id && b.status !== 'cancelled'
    );
    
    if (userBooking) {
      try {
        await api.bookings.cancel(userBooking.id);
        await loadData();
      } catch (error) {
        console.error('Failed to cancel booking:', error);
      }
    }
  };
  
  const handleSelectMemberForAvailability = (memberId: string) => {
    const member = members().find(m => m.id === memberId);
    if (member) {
      setSelectedMemberForAvailability(member);
      setShowAvailabilityEditor(true);
    }
  };
  
  const handleSaveAvailability = (newAvailabilities: Omit<AvailabilityWindow, 'id'>[]) => {
    const memberAvails = availabilities().filter(
      a => !(a.memberId === selectedMemberForAvailability()?.id)
    );
    
    const newWithIds = newAvailabilities.map((a, i) => ({
      ...a,
      id: `a_new_${Date.now()}_${i}`,
    }));
    
    setAvailabilities([...memberAvails, ...newWithIds as AvailabilityWindow[]]);
    setShowAvailabilityEditor(false);
    setSelectedMemberForAvailability(null);
  };
  
  const handleCreateSlot = async (data: CreateSlotRequest) => {
    try {
      await api.slots.create({
        ...data,
        createdBy: currentUserId(),
        createdAt: new Date().toISOString(),
      });
      setShowCreateSlot(false);
      await loadData();
    } catch (error) {
      console.error('Failed to create slot:', error);
    }
  };
  
  const handleExportIcs = () => {
    const content = exportSlotsToIcs(slots(), members(), { timezone: selectedTimezone() });
    if (content) {
      downloadIcsFile(content, 'family-newyear-calendar.ics');
    }
  };
  
  const tzDisplay = () => getTimezoneDisplay(selectedTimezone());
  
  return (
    <div class="app-container">
      <header class="app-header">
        <h1>🧧 家族拜年排期日历</h1>
        <p class="subtitle">
          跨越时区，亲情不断 · 当前时区: {tzDisplay().cityName} ({tzDisplay().offset})
          {tzDisplay().isDST && ' · 夏令时'}
        </p>
        <div class="header-actions">
          <button class="btn btn-header" onClick={() => setShowCreateSlot(true)}>
            + 创建时段
          </button>
          <button class="btn btn-header" onClick={handleExportIcs}>
            📅 导出 iCal
          </button>
          <button 
            class="btn btn-header" 
            onClick={() => currentUser() && handleSelectMemberForAvailability(currentUser()!.id)}
          >
            ⏰ 我的可接听时间
          </button>
        </div>
      </header>
      
      <div class="app-main">
        <CalendarView
          slots={slots()}
          bookings={bookings()}
          members={members()}
          overlapSlots={overlapSlots()}
          currentUser={currentUser()}
          selectedTimezone={selectedTimezone()}
          onSlotClick={handleSlotClick}
        />
        
        <aside class="sidebar">
          <UserSelector
            members={members()}
            currentUserId={currentUserId()}
            onSelect={handleSelectUser}
          />
          
          <RecommendedSlots
            slots={recommendedSlots()}
            members={members()}
            selectedTimezone={selectedTimezone()}
          />
          
          <MemberList
            members={members()}
            currentUserId={currentUserId()}
            onSelectMember={handleSelectMemberForAvailability}
          />
        </aside>
      </div>
      
      {selectedSlot() && (
        <SlotDetailModal
          slot={selectedSlot()!}
          bookings={bookings()}
          members={members()}
          currentUser={currentUser()}
          selectedTimezone={selectedTimezone()}
          onClose={() => setSelectedSlot(null)}
          onBook={handleBookSlot}
          onCancelBooking={handleCancelBooking}
        />
      )}
      
      {showAvailabilityEditor() && selectedMemberForAvailability() && (
        <AvailabilityEditor
          member={selectedMemberForAvailability()!}
          availabilities={availabilities()}
          onSave={handleSaveAvailability}
          onClose={() => {
            setShowAvailabilityEditor(false);
            setSelectedMemberForAvailability(null);
          }}
        />
      )}
      
      {showCreateSlot() && (
        <CreateSlotModal
          onClose={() => setShowCreateSlot(false)}
          onCreate={handleCreateSlot}
          isAdmin={currentUser()?.isAdmin || false}
        />
      )}
    </div>
  );
}
