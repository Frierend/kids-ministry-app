// src/theme/index.ts
// Glassmorphism design system — cool blue-to-white palette, 8dp grid

export const Colors = {
  // Primary gradient stops
  gradientStart: '#C8D8F0',
  gradientMid: '#E4EEF9',
  gradientEnd: '#F5F8FF',

  // Glass surfaces
  cardBg: 'rgba(255,255,255,0.78)',
  cardBorder: 'rgba(255,255,255,0.55)',
  frostedTabBg: 'rgba(240,246,255,0.82)',

  // Brand
  primary: '#3B7DD8',
  primaryLight: '#5B9AE8',
  primaryDark: '#2560B0',

  // Semantic
  success: '#34C759',
  successLight: 'rgba(52,199,89,0.15)',
  warning: '#FF9500',
  warningLight: 'rgba(255,149,0,0.15)',
  danger: '#FF3B30',
  dangerLight: 'rgba(255,59,48,0.15)',

  // Points gold
  gold: '#F5A623',
  goldLight: 'rgba(245,166,35,0.15)',

  // Text
  textPrimary: '#1A2A4A',
  textSecondary: '#5A6A8A',
  textTertiary: '#8A9AB8',
  textOnPrimary: '#FFFFFF',

  // UI
  divider: 'rgba(90,106,138,0.12)',
  shadow: 'rgba(60,80,130,0.15)',
  overlay: 'rgba(20,40,80,0.45)',
  inputBg: 'rgba(255,255,255,0.6)',
  inputBorder: 'rgba(59,125,216,0.25)',

  // Attendance
  present: '#34C759',
  absent: '#FF3B30',
  presentBg: 'rgba(52,199,89,0.12)',
  absentBg: 'rgba(255,59,48,0.08)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Typography = {
  // Display
  display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  title1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  title2: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
  title3: { fontSize: 17, fontWeight: '600' as const },
  // Body
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const },
  bodySemiBold: { fontSize: 15, fontWeight: '600' as const },
  // Caption
  caption: { fontSize: 13, fontWeight: '400' as const },
  captionMedium: { fontSize: 13, fontWeight: '500' as const },
  // Label
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  // Numeric
  pointsLarge: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },
  pointsMedium: { fontSize: 22, fontWeight: '700' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  modal: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const Layout = {
  tabBarHeight: 56,
  headerHeight: 56,
  minTapTarget: 48,
  studentRowHeight: 72,
  cardPadding: Spacing.md,
};
