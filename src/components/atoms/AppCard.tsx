import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows } from '../../constants';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevated?: boolean;
  noPadding?: boolean;
}

export function AppCard({
  children,
  style,
  padding = 16,
  elevated = false,
  noPadding = false,
}: AppCardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        !noPadding && { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  elevated: {
    ...Shadows.md,
    borderColor: Colors.borderLight,
  },
});