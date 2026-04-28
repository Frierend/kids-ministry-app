import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Radius } from '../../constants';

interface BadgeProps {
  value: string | number;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ value, color = Colors.primary, textColor = Colors.white, size = 'md', style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color, paddingHorizontal: size === 'sm' ? 6 : 10, paddingVertical: size === 'sm' ? 2 : 4 }, style]}>
      <Text style={[styles.text, { color: textColor, fontSize: size === 'sm' ? Typography.xs : Typography.sm }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: Radius.full, alignSelf: 'flex-start' },
  text: { fontWeight: Typography.bold },
});
