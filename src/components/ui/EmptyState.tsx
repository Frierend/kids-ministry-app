import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon = '📭', title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && (
        <PrimaryButton label={action.label} onPress={action.onPress} size="sm" style={{ marginTop: Spacing.md }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.dark, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: Typography.sm, color: Colors.light, textAlign: 'center', lineHeight: 22 },
});
