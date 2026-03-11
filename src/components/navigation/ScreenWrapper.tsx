// src/components/navigation/ScreenWrapper.tsx
// Gradient background + safe area wrapper used by every screen

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Layout, Shadows } from '../../theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
}

export function GradientBackground({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFillObject, style]}
    >
      {children}
    </LinearGradient>
  );
}

export function ScreenWrapper({ children, style }: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, style]}>
      <GradientBackground>
        <View style={[styles.inner, { paddingTop: insets.top }]}>
          {children}
        </View>
      </GradientBackground>
    </View>
  );
}

// ── StackHeader ───────────────────────────────────────────

interface StackHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: { icon: React.ReactNode; onPress: () => void };
  subtitle?: string;
}

export function StackHeader({ title, onBack, rightAction, subtitle }: StackHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {onBack && (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={8}
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
        )}
        <View>
          <Text style={[Typography.title2, { color: Colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[Typography.caption, { color: Colors.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightAction && (
        <Pressable
          onPress={rightAction.onPress}
          style={({ pressed }) => [styles.rightBtn, { opacity: pressed ? 0.7 : 1 }]}
          hitSlop={8}
        >
          {rightAction.icon}
        </Pressable>
      )}
    </View>
  );
}

// ── FloatingActionButton ──────────────────────────────────

interface FABProps {
  onPress: () => void;
  icon?: string;
  label?: string;
  bottom?: number;
}

export function FAB({ onPress, icon = '+', label, bottom = 24 }: FABProps) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom: bottom + insets.bottom, opacity: pressed ? 0.85 : 1 },
        label ? styles.fabExtended : {},
      ]}
    >
      <Text style={styles.fabIcon}>{icon}</Text>
      {label && <Text style={[Typography.bodySemiBold, { color: Colors.white, marginLeft: Spacing.xs }]}>{label}</Text>}
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    minHeight: Layout.headerHeight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 },
  backBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    marginLeft: -Spacing.sm,
  },
  backArrow: { fontSize: 32, color: Colors.primary, fontWeight: '300', lineHeight: 36 },
  rightBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  fab: {
    position: 'absolute', right: Spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
    ...Shadows.modal,
  },
  fabExtended: { width: 'auto', paddingHorizontal: Spacing.lg, borderRadius: 28 },
  fabIcon: { fontSize: 26, color: Colors.white, fontWeight: '300', lineHeight: 30 },
});
