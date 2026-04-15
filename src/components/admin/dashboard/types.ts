export type AdminRequestItem = {
  id: number;
  user_id: number;
  user_full_name: string;
  user_username?: string | null;
  request_type: string;
  content: string;
  status: string;
  created_at: string;
};

export type AdminUserItem = {
  telegram_id: number;
  username?: string | null;
  full_name: string;
  joined_at: string;
  is_blocked: boolean;
};

export type MeetingBookingRow = {
  id: number;
  student_user_id: number;
  student_full_name: string;
  student_username?: string | null;
  start_at: string;
  end_at: string;
  start_local_label: string;
  status: string;
  topic?: string | null;
  request_id?: number | null;
};

export type DaySchedule = { enabled: boolean; start: string; end: string };
export type WeeklyHoursState = Record<string, DaySchedule>;

export type TabId = 'requests' | 'meetings' | 'event' | 'users' | 'broadcast';
