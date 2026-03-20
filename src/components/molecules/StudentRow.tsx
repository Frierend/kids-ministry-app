import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Student } from '../../types';
import { Avatar } from '../atoms/Avatar';
import { Colors, Typography, Layout, Radius, Shadows } from '../../constants';

interface StudentRowProps {
  student: Student;
  points?: number;
  onPress: () => void;
  onLongPress?: () => void;
  showPoints?: boolean;
  rightContent?: React.ReactNode;
}

export function StudentRow({
  student, points, onPress, onLongPress, showPoints, rightContent,
}: StudentRowProps) {
  const initials = (student.first_name[0] + (student.last_name[0] || '')).toUpperCase();
  const displayName = student.nickname || `${student.first_name} ${student.last_name}`;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Avatar initials={initials} uri={student.photo_uri} size={Layout.avatarSm} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          {student.is_archived && (
            <View style={styles.archivedBadge}>
              <Text style={styles.archivedText}>Archived</Text>
            </View>
          )}
        </View>
        {student.nickname && (
          <Text style={styles.realName} numberOfLines={1}>
            {student.first_name} {student.last_name}
          </Text>
        )}
      </View>
      {showPoints && points !== undefined && (
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{points}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      )}
      {rightContent}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: Layout.rowHeight,
    backgroundColor: Colors.white,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: {
    fontSize: Typography.md,
    fontWeight: '600',
    color: Colors.dark,
    flex: 1,
  },
  realName: {
    fontSize: Typography.sm,
    color: Colors.muted,
    marginTop: 1,
  },
  archivedBadge: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  archivedText: {
    fontSize: 10,
    color: Colors.warning,
    fontWeight: '600',
  },
  pointsBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  pointsText: {
    fontSize: Typography.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  pointsLabel: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '500',
  },
  chevron: { fontSize: 20, color: Colors.light, marginLeft: 4 },
});