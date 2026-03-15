import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants';

interface SectionHeaderProps {
  title: string;
  count?: number;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, count, onSeeAll }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {count !== undefined && <Text style={styles.count}>{count}</Text>}
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}><Text style={styles.link}>See All</Text></TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { flex: 1, fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.dark },
  count: { fontSize: Typography.sm, color: Colors.light, marginRight: 8 },
  link: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
});
