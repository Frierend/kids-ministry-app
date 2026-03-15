// ─── COLORS ───────────────────────────────────────────────────────────────────
export const Colors = {
  primary:       '#3B82F6',
  primaryDark:   '#2563EB',
  primaryLight:  '#DBEAFE',
  secondary:     '#6366F1',
  accent:        '#10B981',
  warning:       '#F59E0B',
  danger:        '#EF4444',
  dangerLight:   '#FEE2E2',
  dark:          '#1E293B',
  mid:           '#475569',
  light:         '#94A3B8',
  border:        '#E2E8F0',
  bg:            '#F8FAFC',
  white:         '#FFFFFF',
  cardBg:        '#FFFFFF',
  cardBorder:    '#E2E8F0',
  txAttendance:  '#3B82F6',
  txActivity:    '#10B981',
  txMarket:      '#EF4444',
  txManual:      '#F59E0B',
  tabActive:     '#3B82F6',
  tabInactive:   '#94A3B8',
  gradientBlue:   ['#3B82F6', '#2563EB'] as string[],
  gradientGreen:  ['#10B981', '#059669'] as string[],
  gradientPurple: ['#6366F1', '#4F46E5'] as string[],
  gradientHeader: ['#EFF6FF', '#DBEAFE'] as string[],
};

// ─── SPACING ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────
export const Typography = {
  xs:        11,
  sm:        13,
  md:        15,
  lg:        17,
  xl:        20,
  xxl:       24,
  hero:      30,
  regular:   '400' as const,
  medium:    '500' as const,
  semiBold:  '600' as const,
  bold:      '700' as const,
  extraBold: '800' as const,
};

// ─── BORDER RADIUS ────────────────────────────────────────────────────────────
export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
};

// ─── SHADOWS ──────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
export const Layout = {
  tabBarHeight:   56,
  headerHeight:   56,
  fabSize:        56,
  buttonHeight:   52,
  inputHeight:    52,
  rowHeight:      72,
  checkboxSize:   40,
  avatarSm:       36,
  avatarMd:       48,
  avatarLg:       72,
  avatarXl:       96,
  screenPadding:  16,
};

// ─── ANIMATION ────────────────────────────────────────────────────────────────
export const Animation = {
  fast:   150,
  normal: 250,
  slow:   400,
};

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────
export const QueryKeys = {
  students:        'students',
  student:         (id: number) => ['student', id] as const,
  studentBalance:  (id: number) => ['balance', id] as const,
  studentLedger:   (id: number) => ['ledger', id] as const,
  ministries:      'ministries',
  ministry:        (id: number) => ['ministry', id] as const,
  sessions:        'sessions',
  session:         (id: number) => ['session', id] as const,
  sessionStudents: (id: number) => ['sessionStudents', id] as const,
  marketItems:     'marketItems',
  settings:        'settings',
};

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
export const Defaults = {
  pageSize:        25,
  ledgerPageSize:  20,
  autolockMinutes: 5,
  undoGraceMs:     30_000,
  saturdayPoints:  20,
  sundayPoints:    50,
};

// ─── DEFAULT MINISTRIES ───────────────────────────────────────────────────────
export const DEFAULT_MINISTRIES = [
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
    description: 'Main Sunday Class',
    active_days: ['sunday'],
    points_config: { saturday: 20, sunday: 50 },
  },
];
