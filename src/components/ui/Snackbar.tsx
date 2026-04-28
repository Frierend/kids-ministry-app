import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Colors, Typography, Radius, Shadows, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

interface SnackbarProps {
  message: string;
  type?: SnackbarType;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const TYPE_META: Record<SnackbarType, { icon: string; bg: string }> = {
  success: { icon: '✓', bg: Colors.accent },
  error:   { icon: '✕', bg: Colors.danger },
  info:    { icon: 'ℹ', bg: Colors.primary },
  warning: { icon: '!', bg: Colors.warning },
};

export function Snackbar({ message, type = 'info', visible, onDismiss, duration = 3000 }: SnackbarProps) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const meta = TYPE_META[type];

  useEffect(() => {
    if (visible) {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }).start();
      const t = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onDismiss);
      }, duration);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.snackbar,
      { backgroundColor: meta.bg, bottom: insets.bottom + 80 },
      { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }], opacity: anim },
    ]}>
      <View style={styles.iconBox}><Text style={styles.icon}>{meta.icon}</Text></View>
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute', left: 16, right: 16, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, ...Shadows.lg, zIndex: 9999,
  },
  iconBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  icon: { color: Colors.white, fontWeight: Typography.bold, fontSize: 14 },
  message: { flex: 1, color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.medium },
});
