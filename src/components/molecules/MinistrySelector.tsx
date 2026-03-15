import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ministry } from '../../types';
import { Colors, Typography, Radius, Spacing } from '../../constants';

interface MinistrySelectorProps {
  ministries: Ministry[];
  selectedId: number | null;
  onChange: (id: number) => void;
}

export function MinistrySelector({ ministries, selectedId, onChange }: MinistrySelectorProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {ministries.map((m) => {
        const selected = m.id === selectedId;
        return (
          <TouchableOpacity key={m.id} onPress={() => onChange(m.id)}
            style={[styles.chip, selected && styles.chipActive]} activeOpacity={0.7}>
            <Text style={[styles.label, selected && styles.labelActive]}>{m.name}</Text>
            {m.student_count !== undefined && (
              <Text style={[styles.count, selected && styles.countActive]}>
                {' '}({m.student_count})
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  label: { fontSize: Typography.sm, color: Colors.mid, fontWeight: Typography.medium },
  labelActive: { color: Colors.primary, fontWeight: Typography.semiBold },
  count: { fontSize: Typography.xs, color: Colors.light },
  countActive: { color: Colors.primary },
});
