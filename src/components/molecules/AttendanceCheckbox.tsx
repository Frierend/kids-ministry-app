import React, { useCallback } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SessionStudent } from '../../types';
import { Avatar } from '../atoms/Avatar';
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
    <TouchableOpacity style={styles.row} onPress={handleToggle} activeOpacity={0.7}
      accessibilityRole="checkbox" accessibilityState={{ checked: student.is_present }}>
      <Avatar initials={initials} uri={student.photo_uri} size={Layout.avatarSm} />
      <Text style={[styles.name, student.is_present && styles.namePresent]} numberOfLines={1}>
        {displayName}
      </Text>
      <View style={[styles.checkbox, student.is_present && styles.checkboxActive]}>
        {student.is_present && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    minHeight: Layout.rowHeight, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12,
  },
  name: { flex: 1, fontSize: Typography.md, color: Colors.mid },
  namePresent: { color: Colors.dark, fontWeight: Typography.semiBold },
  checkbox: {
    width: Layout.checkboxSize, height: Layout.checkboxSize,
    borderRadius: Radius.sm, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.white, fontSize: 20, fontWeight: Typography.bold },
});
