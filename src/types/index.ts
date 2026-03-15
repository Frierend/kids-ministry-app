// ─── STUDENT ──────────────────────────────────────────────────────────────────
export interface Student {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  birth_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  photo_uri: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateStudentInput = {
  first_name: string;
  last_name: string;
  nickname?: string;
  birth_date?: string;
  guardian_name?: string;
  guardian_contact?: string;
  photo_uri?: string;
  ministry_ids?: number[];
};

export type UpdateStudentInput = Partial<Omit<CreateStudentInput, 'ministry_ids'>>;

export interface StudentFilters {
  searchQuery?: string;
  ministryId?: number;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AttendanceSummary {
  total_sessions: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
  last_attended: string | null;
  streak: number;
}

// ─── MINISTRY ─────────────────────────────────────────────────────────────────
export type DayOfWeek =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  | 'saturday' | 'sunday';

export interface PointsConfig {
  monday?: number;
  tuesday?: number;
  wednesday?: number;
  thursday?: number;
  friday?: number;
  saturday: 20;
  sunday: 50;
}

export interface Ministry {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  active_days: DayOfWeek[];
  points_config: PointsConfig;
  is_archived: boolean;
  student_count?: number;
  created_at: string;
  updated_at: string;
}

export type CreateMinistryInput = {
  name: string;
  description?: string;
  active_days: DayOfWeek[];
  points_config: Partial<PointsConfig>;
};

export interface Enrollment {
  id: number;
  student_id: number;
  ministry_id: number;
  enrolled_at: string;
  unenrolled_at: string | null;
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
export type SessionStatus = 'draft' | 'committed';

export interface AttendanceSession {
  id: number;
  uuid: string;
  ministry_id: number;
  ministry_name?: string;
  session_date: string;
  day_of_week: DayOfWeek;
  points_awarded: number;
  status: SessionStatus;
  committed_at: string | null;
  created_at: string;
  present_count?: number;
  total_count?: number;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  is_present: boolean;
  marked_at: string | null;
  note: string | null;
}

export interface SessionStudent extends Student {
  is_present: boolean;
  marked_at: string | null;
  note: string | null;
}

export interface BulkAttendanceRecord {
  student_id: number;
  is_present: boolean;
  note?: string;
}

export interface CommitResult {
  session: AttendanceSession;
  awarded_count: number;
  total_students: number;
  points_per_student: number;
  total_points_awarded: number;
}

export interface CalendarDay {
  date: string;
  status: 'present' | 'absent' | 'none';
  sessions: { ministry_name: string; is_present: boolean }[];
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
export type TransactionType =
  | 'attendance' | 'activity' | 'market_deduction' | 'manual_adjustment';

export interface PointTransaction {
  id: number;
  uuid: string;
  student_id: number;
  type: TransactionType;
  points: number;
  reason: string;
  reference_id: string | null;
  reference_type: 'session' | 'market_item' | null;
  awarded_by: string | null;
  created_at: string;
  running_balance?: number;
}

export interface PointBreakdown {
  attendance: number;
  activity: number;
  market_deductions: number;
  manual_adjustments: number;
  total: number;
}

export interface TxPage {
  transactions: PointTransaction[];
  hasMore: boolean;
  nextPage: number;
  total: number;
}

export interface TxFilters {
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ─── MARKET ───────────────────────────────────────────────────────────────────
export interface MarketItem {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  point_cost: number;
  stock: number;
  photo_uri: string | null;
  is_active: boolean;
  created_at: string;
}

export type CreateMarketItemInput = {
  name: string;
  description?: string;
  point_cost: number;
  stock?: number;
  photo_uri?: string;
};

// ─── SECURITY ─────────────────────────────────────────────────────────────────
export interface SecurityState {
  is_locked: boolean;
  biometrics_enabled: boolean;
  has_pin: boolean;
  auto_lock_minutes: number;
}

export type BiometricResult = { success: true } | { success: false; error: string };

// ─── APP SETTINGS ─────────────────────────────────────────────────────────────
export interface AppSettings {
  teacher_name: string;
  auto_lock_minutes: number;
  biometrics_enabled: boolean;
  theme: 'light' | 'dark';
  app_version: string;
}

// ─── NAVIGATION PARAM LISTS ───────────────────────────────────────────────────
export type RootStackParamList = {
  Lock: undefined;
  Main: undefined;
  Setup: undefined;
};

export type TabParamList = {
  Home: undefined;
  Attendance: undefined;
  Students: undefined;
  Market: undefined;
  Settings: undefined;
};

export type AttendanceStackParamList = {
  AttendanceHome: undefined;
  SessionDetail: { sessionId: number; ministryName: string; sessionDate: string };
  AttendanceHistory: { ministryId?: number; studentId?: number };
  SessionSummary: { result: CommitResult };
};

export type StudentsStackParamList = {
  StudentList: undefined;
  StudentDetail: { studentId: number };
  AddStudent: undefined;
  EditStudent: { studentId: number };
  PointsLedger: { studentId: number; studentName: string };
  AwardPoints: { studentId: number; studentName: string };
  ArchiveStudent: { studentId: number; studentName: string };
};

export type MarketStackParamList = {
  MarketHome: undefined;
  RedeemConfirm: { studentId: number; itemId: number };
  MarketHistory: { studentId?: number };
  ManageItems: undefined;
  AddEditItem: { itemId?: number };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Ministries: undefined;
  MinistryDetail: { ministryId?: number };
  Security: undefined;
  Backup: undefined;
  About: undefined;
};
