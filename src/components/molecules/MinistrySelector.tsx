import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ministry } from '../../types';
import { Colors, Typography, Radius } from '../../constants';

interface MinistrySelectorProps {
  ministries: Ministry[];
  selectedId: number | null;
  onChange: (id: number) => void;
}

export function MinistrySelector({ ministries, selectedId, onChange }: MinistrySelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {ministries.map((m) => {
        const selected = m.id === selectedId;
        return (
          <TouchableOpacity
            key={m.id}
            onPress={() => onChange(m.id)}
            style={[styles.chip, selected && styles.chipSelected]}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {m.name}
            </Text>
            {m.student_count !== undefined && (
              <View style={[styles.badge, selected && styles.badgeSelected]}>
                <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
                  {m.student_count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 5,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  label: {
    fontSize: Typography.sm,
    color: Colors.mid,
    fontWeight: '500',
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.border,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeSelected: {
    backgroundColor: Colors.primary,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.mid,
    fontWeight: '700',
  },
  badgeTextSelected: {
    color: Colors.white,
  },
});