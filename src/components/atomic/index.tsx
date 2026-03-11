// src/components/atomic/index.tsx
// All atomic components in one file for easy import

import React from 'react';
import {
  View, Text, StyleSheet, Image, Pressable,
  ActivityIndicator, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';

// ── Avatar ────────────────────────────────────────────────

interface AvatarProps {
  firstName: string;
  lastName: string;
  photoUri?: string | null;
  size?: number;
  color?: string;
}

export function Avatar({ firstName, lastName, photoUri, size = 48, color = Colors.primary }: AvatarProps) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const fontSize = size * 0.36;

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22' }]}>
      <Text style={[styles.avatarText, { fontSize, color }]}>{initials}</Text>
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color = Colors.primary, textColor, size = 'md' }: BadgeProps) {
  const bg = color + '20';
  const tc = textColor ?? color;
  return (
    <View style={[styles.badge, size === 'sm' && styles.badgeSm, { backgroundColor: bg, borderColor: color + '40' }]}>
      <Text style={[styles.badgeText, size === 'sm' && styles.badgeTextSm, { color: tc }]}>{label}</Text>
    </View>
  );
}

// ── PointsBadge ───────────────────────────────────────────

interface PointsBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PointsBadge({ points, size = 'md' }: PointsBadgeProps) {
  const isPositive = points >= 0;
  const color = isPositive ? Colors.gold : Colors.danger;
  const prefix = points > 0 ? '+' : '';
  const textStyles = {
    sm: Typography.captionMedium,
    md: Typography.bodyMedium,
    lg: Typography.pointsMedium,
  }[size];
  return (
    <View style={[styles.pointsBadge, { backgroundColor: color + '18', borderColor: color + '30' }]}>
      <Text style={[textStyles, { color }]}>{prefix}{points} pts</Text>
    </View>
  );
}

// ── PrimaryButton ─────────────────────────────────────────

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function PrimaryButton({
  label, onPress, loading = false, disabled = false,
  variant = 'primary', size = 'md', style, icon,
}: PrimaryButtonProps) {
  const btnStyle = {
    primary: { bg: Colors.primary, border: Colors.primary, text: Colors.white },
    secondary: { bg: Colors.cardBg, border: Colors.primary, text: Colors.primary },
    danger: { bg: Colors.dangerLight, border: Colors.danger, text: Colors.danger },
    ghost: { bg: Colors.transparent, border: Colors.transparent, text: Colors.primary },
  }[variant];

  const heights = { sm: 36, md: 48, lg: 56 };
  const textStyles = {
    sm: Typography.captionMedium,
    md: Typography.bodySemiBold,
    lg: Typography.title3,
  }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          height: heights[size],
          backgroundColor: btnStyle.bg,
          borderColor: btnStyle.border,
          opacity: pressed ? 0.82 : disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={btnStyle.text} size="small" />
        : <>
            {icon && <View style={{ marginRight: Spacing.xs }}>{icon}</View>}
            <Text style={[textStyles, { color: btnStyle.text }]}>{label}</Text>
          </>
      }
    </Pressable>
  );
}

// ── IconButton ────────────────────────────────────────────

interface IconButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  size?: number;
  style?: ViewStyle;
}

export function IconButton({ onPress, children, size = 44, style }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2, opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

// ── Divider ───────────────────────────────────────────────

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ── EmptyState ────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      {icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text style={[Typography.title3, { color: Colors.textSecondary, textAlign: 'center' }]}>{title}</Text>
      {message && (
        <Text style={[Typography.body, styles.emptyMsg]}>{message}</Text>
      )}
      {action && (
        <PrimaryButton label={action.label} onPress={action.onPress} style={{ marginTop: Spacing.md }} />
      )}
    </View>
  );
}

// ── SkeletonRow ───────────────────────────────────────────

export function SkeletonRow({ height = 72 }: { height?: number }) {
  return (
    <View style={[styles.skeleton, { height }]} />
  );
}

// ── SectionHeader ─────────────────────────────────────────

export function SectionHeader({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[Typography.label, { color: Colors.textSecondary }]}>{title}</Text>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text style={[Typography.captionMedium, { color: Colors.primary }]}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  avatar: { resizeMode: 'cover' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },

  badge: {
    borderRadius: Radius.full, borderWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { ...Typography.captionMedium },
  badgeTextSm: { fontSize: 11, fontWeight: '500' },

  pointsBadge: {
    borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    alignSelf: 'flex-start',
  },

  button: {
    borderRadius: Radius.lg, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: Spacing.lg,
    ...Shadows.card,
  },

  iconButton: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.cardBg,
  },

  divider: {
    height: 1, backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emptyIcon: { marginBottom: Spacing.md },
  emptyMsg: {
    color: Colors.textTertiary, textAlign: 'center',
    marginTop: Spacing.xs,
  },

  skeleton: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.md,
  },
});
