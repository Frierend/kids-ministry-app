import { CreateMinistryInput } from '../types';

export const DEFAULT_MINISTRIES: CreateMinistryInput[] = [
  {
    name: 'Bamboo Extension',
    description: 'Bamboo Extension Ministry',
    active_days: ['saturday', 'sunday'],
    points_config: { saturday: 20, sunday: 50 },
  },
  {
    name: 'Tugbok Extension',
    description: 'Tugbok Extension Ministry',
    active_days: ['saturday', 'sunday'],
    points_config: { saturday: 20, sunday: 50 },
  },
  {
    name: 'Sunday Class',
    description: 'Sunday School Class',
    active_days: ['sunday'],
    points_config: { sunday: 50 },
  },
];

export const FIXED_DAY_POINTS: Record<string, number> = {
  saturday: 20,
  sunday: 50,
};

export const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
] as const;

export const AUTO_LOCK_OPTIONS = [
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '30 minutes', value: 30 },
  { label: 'Never', value: 0 },
];

export const TX_TYPE_LABELS: Record<string, string> = {
  attendance: 'Attendance',
  activity: 'Activity',
  market_deduction: 'Market',
  manual_adjustment: 'Manual',
};

export const DB_NAME = 'kidsministry.db';
export const DB_VERSION = 1;

export const QUERY_KEYS = {
  students: 'students',
  student: (id: number) => ['student', id],
  studentBalance: (id: number) => ['student-balance', id],
  studentAttendance: (id: number) => ['student-attendance', id],
  ministries: 'ministries',
  ministry: (id: number) => ['ministry', id],
  sessions: 'sessions',
  session: (id: number) => ['session', id],
  sessionStudents: (id: number) => ['session-students', id],
  transactions: (studentId: number) => ['transactions', studentId],
  marketItems: 'market-items',
  security: 'security',
} as const;
