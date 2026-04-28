import React, { useCallback } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SessionStudent } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Colors, Typography, Layout, Radius } from '../../constants';

interface AttendanceCheckboxProps {
  student: SessionStudent;
  onToggle: (studentId: number, present: boolean) => void;
  disabled?: boolean;
}

export function AttendanceCheckbox({ student, onToggle, disabled }: AttendanceCheckboxProps) {
  const initials = (student.first_name[0] + (student.last_name[0] || '')).toUpperCase();
  const displayName = student.nickname || `${student.first_name} ${student.last_name}`;

  const handleToggle = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(student.id, !student.is_present);
  }, [student.id, student.is_present, onToggle, disabled]);

  return (
    <TouchableOpacity
      style={[styles.row, student.is_present && styles.rowPresent]}
      onPress={handleToggle}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: student.is_present }}
    >
      <Avatar initials={initials} uri={student.photo_uri} size={Layout.avatarSm} />
      <View style={styles.info}>
        <Text
          style={[styles.name, student.is_present && styles.namePresent]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        {student.nickname && (
          <Text style={styles.realName}>
            {student.first_name} {student.last_name}
          </Text>
        )}
      </View>

      {/* Status pill */}
      <View style={[styles.statusPill, student.is_present ? styles.pillPresent : styles.pillAbsent]}>
        <Text style={[styles.statusText, student.is_present ? styles.textPresent : styles.textAbsent]}>
          {student.is_present ? 'Present' : 'Absent'}
        </Text>
      </View>

      {/* Checkbox */}
      <View style={[styles.checkbox, student.is_present && styles.checkboxActive]}>
        {student.is_present && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: Layout.rowHeight,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  rowPresent: {
    backgroundColor: '#F0FDF4',
  },
  info: { flex: 1 },
  name: {
    fontSize: Typography.md,
    color: Colors.mid,
    fontWeight: '500',
  },
  namePresent: {
    color: Colors.dark,
    fontWeight: '600',
  },
  realName: {
    fontSize: Typography.xs,
    color: Colors.muted,
    marginTop: 1,
  },
  statusPill: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  pillPresent: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  pillAbsent: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textPresent: { color: Colors.accent },
  textAbsent:  { color: Colors.danger },
  checkbox: {
    width: Layout.checkboxSize,
    height: Layout.checkboxSize,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});