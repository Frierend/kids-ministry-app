// src/types/index.ts
// All domain types matching the database schema

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  photo_uri?: string | null;
  date_of_birth?: string | null;
  notes?: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Computed / joined
  balance?: number;
  ministry_names?: string[];
}

export interface Ministry {
  id: string;
  name: string;
  color: string;
  saturday_points: number;
  sunday_points: number;
  is_active: boolean;
  created_at: string;
  // Computed
  student_count?: number;
}

export interface Enrollment {
  id: string;
  student_id: string;
  ministry_id: string;
  enrolled_at: string;
  unenrolled_at?: string | null;
  // Joined
  ministry?: Ministry;
  student?: Student;
}

export type SessionStatus = 'draft' | 'committed';
export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceSession {
  id: string;
  ministry_id: string;
  session_date: string;
  status: SessionStatus;
  created_at: string;
  committed_at?: string | null;
  // Joined
  ministry?: Ministry;
  records?: AttendanceRecord[];
  present_count?: number;
  total_count?: number;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_at: string;
  // Joined
  student?: Student;
}

export type TransactionType = 'attendance' | 'activity' | 'bonus' | 'redemption' | 'adjustment';

export interface PointTransaction {
  id: string;
  student_id: string;
  points: number;
  type: TransactionType;
  description: string;
  session_id?: string | null;
  item_id?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface MarketItem {
  id: string;
  name: string;
  description?: string | null;
  point_cost: number;
  quantity: number; // -1 = unlimited
  is_available: boolean;
  image_uri?: string | null;
  created_at: string;
}

export interface AppSettings {
  auto_lock_minutes: number;
  biometrics_enabled: boolean;
  teacher_name: string;
  app_version: string;
  pin_hash?: string;
}

// ── Navigation param types ──────────────────────────────────
export type RootStackParamList = {
  Lock: undefined;
  Main: undefined;
  Setup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Attendance: undefined;
  Students: undefined;
  Market: undefined;
  Settings: undefined;
};

export type AttendanceStackParamList = {
  AttendanceHome: undefined;
  SessionDetail: { sessionId: string; ministryId: string; date: string };
  SessionHistory: { ministryId: string };
};

export type StudentsStackParamList = {
  StudentList: undefined;
  StudentDetail: { studentId: string };
  StudentAdd: undefined;
  StudentEdit: { studentId: string };
  PointsLedger: { studentId: string; studentName: string };
  AwardPoints: { studentId: string; studentName: string };
  EnrollStudent: { studentId: string };
};

export type MarketStackParamList = {
  MarketHome: undefined;
  ItemDetail: { itemId: string };
  ItemAdd: undefined;
  ItemEdit: { itemId: string };
  Checkout: { studentId: string; itemId: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Ministries: undefined;
  MinistryDetail: { ministryId: string };
  MinistryAdd: undefined;
  SecuritySettings: undefined;
  PinChange: undefined;
  BackupRestore: undefined;
  About: undefined;
};

// ── Utility types ──────────────────────────────────────────
export type DayOfWeek = 'saturday' | 'sunday' | 'weekday';

export function getDayOfWeek(dateStr: string): DayOfWeek {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  if (day === 6) return 'saturday';
  if (day === 0) return 'sunday';
  return 'weekday';
}

export function getPointsForDay(ministry: Ministry, date: string): number {
  const day = getDayOfWeek(date);
  if (day === 'saturday') return ministry.saturday_points;
  if (day === 'sunday') return ministry.sunday_points;
  return ministry.saturday_points; // weekday defaults to saturday rate
}
