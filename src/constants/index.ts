// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
// Inspired by the reference: dark navy headers, white cards, blue accents

export const Colors = {
  // Brand
  primary:       '#3B6CF6',
  primaryDark:   '#1E3A8A',
  primaryLight:  '#EFF6FF',
  primaryMid:    '#BFDBFE',
  secondary:     '#6366F1',
  accent:        '#10B981',
  accentLight:   '#D1FAE5',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  danger:        '#EF4444',
  dangerLight:   '#FEE2E2',

  // Navy (header / hero backgrounds)
  navy:          '#0F2544',
  navyMid:       '#1E3A5F',
  navyLight:     '#2D5186',

  // Neutrals
  dark:          '#111827',
  mid:           '#4B5563',
  muted:         '#9CA3AF',
  light:         '#D1D5DB',
  border:        '#E5E7EB',
  borderLight:   '#F3F4F6',

  // Backgrounds
  bg:            '#F9FAFB',
  bgBlue:        '#EFF6FF',
  white:         '#FFFFFF',
  cardBg:        '#FFFFFF',

  // Status
  present:       '#10B981',
  absent:        '#EF4444',
  draft:         '#F59E0B',

  // Transaction types
  txAttendance:  '#3B6CF6',
  txActivity:    '#10B981',
  txMarket:      '#EF4444',
  txManual:      '#F59E0B',

  // Tab bar
  tabActive:     '#3B6CF6',
  tabInactive:   '#9CA3AF',

  // Gradients
  gradientNavy:  ['#0F2544', '#1E3A8A'] as string[],
  gradientBlue:  ['#3B6CF6', '#6366F1'] as string[],
  gradientGreen: ['#059669', '#10B981'] as string[],
  gradientCard:  ['#FFFFFF', '#F9FAFB'] as string[],
  gradientHeader:['#EFF6FF', '#DBEAFE'] as string[],
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
};

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

export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 999,
};

export const Shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Layout = {
  tabBarHeight:   60,
  headerHeight:   56,
  fabSize:        56,
  buttonHeight:   52,
  inputHeight:    52,
  rowHeight:      72,
  checkboxSize:   42,
  avatarXs:       28,
  avatarSm:       40,
  avatarMd:       52,
  avatarLg:       72,
  avatarXl:       96,
  screenPadding:  16,
  cardPadding:    16,
};

export const Animation = {
  fast:   150,
  normal: 250,
  slow:   400,
};

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

export const Defaults = {
  pageSize:        25,
  ledgerPageSize:  20,
  autolockMinutes: 5,
  undoGraceMs:     30_000,
  saturdayPoints:  20,
  sundayPoints:    50,
};

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