export type MemberRole = 'elder' | 'adult' | 'child';
export type BookingStatus = 'confirmed' | 'waitlist' | 'cancelled';

export interface FamilyMember {
  id: string;
  name: string;
  role: MemberRole;
  timezone: string;
  avatar?: string;
  isAdmin: boolean;
  canViewPrivateNotes: boolean;
}

export interface AdminTimeSlot {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  maxParticipants: number;
  description?: string;
  privateNote?: string;
  createdBy: string;
  createdAt: string;
}

export interface AvailabilityWindow {
  id: string;
  memberId: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface Booking {
  id: string;
  slotId: string;
  memberId: string;
  status: BookingStatus;
  waitlistPosition?: number;
  bookedAt: string;
}

export interface OverlapSlot {
  startIso: string;
  endIso: string;
  durationMinutes: number;
  availableMemberIds: string[];
  score: number;
}

export interface LunarDateInfo {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLunarNewYearPeriod: boolean;
  lunarDayName: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateSlotRequest {
  title: string;
  startIso: string;
  endIso: string;
  maxParticipants: number;
  description?: string;
  privateNote?: string;
}

export interface UpdateSlotRequest extends Partial<CreateSlotRequest> {}

export interface CreateAvailabilityRequest {
  memberId: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface CreateBookingRequest {
  slotId: string;
  memberId: string;
}

export interface CancelBookingRequest {
  bookingId: string;
}

export interface TimezoneDisplay {
  timezone: string;
  offset: string;
  cityName: string;
  isDST: boolean;
}

export interface DaySlice {
  date: string;
  startTime: string;
  endTime: string;
}

export interface SlotWithBookings extends AdminTimeSlot {
  bookings: Booking[];
  confirmedCount: number;
  waitlistCount: number;
  isFull: boolean;
}

export interface AvailabilityWithMember extends AvailabilityWindow {
  member: FamilyMember;
}
