import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Student } from '../../types';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Colors, Typography, Layout, Spacing } from '../../constants';

interface StudentRowProps {
  student: Student;
  points?: number;
  onPress: () => void;
  onLongPress?: () => void;
  showPoints?: boolean;
  rightContent?: React.ReactNode;
}

export function StudentRow({ student, points, onPress, onLongPress, showPoints, rightContent }: StudentRowProps) {
  const initials = (student.first_name[0] + (student.last_name[0] || '')).toUpperCase();
  const displayName = student.nickname || `${student.first_name} ${student.last_name}`;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <Avatar initials={initials} uri={student.photo_uri} size={Layout.avatarSm} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        {student.nickname && (
          <Text style={styles.realName} numberOfLines={1}>{student.first_name} {student.last_name}</Text>
        )}
      </View>
      {showPoints && points !== undefined && (
        <Badge value={`${points} pts`} color={Colors.primaryLight} textColor={Colors.primary} />
      )}
      {rightContent}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    minHeight: Layout.rowHeight, backgroundColor: Colors.white, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  info: { flex: 1 },
  name: { fontSize: Typography.md, fontWeight: Typography.medium, color: Colors.dark },
  realName: { fontSize: Typography.sm, color: Colors.light, marginTop: 2 },
  chevron: { fontSize: 20, color: Colors.light, marginLeft: 4 },
});
