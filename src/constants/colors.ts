export const Colors = {
  // Brand
  primary: '#3B82F6',
  primaryLight: '#BFDBFE',
  primaryDark: '#1D4ED8',
  secondary: '#6366F1',
  accent: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Neutrals
  dark: '#1E293B',
  mid: '#475569',
  light: '#94A3B8',
  border: '#CBD5E1',
  borderLight: '#E2E8F0',

  // Backgrounds
  bg: '#F8FAFC',
  bgBlue: '#EFF6FF',
  bgGreen: '#F0FDF4',
  bgAmber: '#FFF7ED',
  white: '#FFFFFF',
  cardBg: 'rgba(255,255,255,0.92)',

  // Tabs
  tabActive: '#3B82F6',
  tabInactive: '#94A3B8',

  // Transaction type colors
  txAttendance: '#10B981',
  txActivity: '#6366F1',
  txMarket: '#EF4444',
  txManual: '#F59E0B',

  // Status
  present: '#10B981',
  absent: '#EF4444',
  partial: '#F59E0B',
} as const;

export const Gradients = {
  primary: ['#3B82F6', '#6366F1'] as [string, string],
  hero: ['#1D4ED8', '#3B82F6'] as [string, string],
  card: ['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.95)'] as [string, string],
  success: ['#059669', '#10B981'] as [string, string],
  danger: ['#DC2626', '#EF4444'] as [string, string],
  lock: ['#1E3A5F', '#3B82F6'] as [string, string],
} as const;
