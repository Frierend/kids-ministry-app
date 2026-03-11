// src/components/domain/index.tsx
// Domain-specific composite components

import React from 'react';
import {
  View, Text, StyleSheet, Pressable, Switch, ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Layout, Shadows } from '../../theme';
import { Avatar, Badge, PointsBadge } from '../atomic';
import type { Student, AttendanceRecord, PointTransaction, Ministry } from '../../types';

// ── StudentRow ────────────────────────────────────────────

interface StudentRowProps {
  student: Student;
  onPress: () => void;
  showBalance?: boolean;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export function StudentRow({ student, onPress, showBalance = true, rightElement, style }: StudentRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.studentRow, { opacity: pressed ? 0.88 : 1 }, style]}
    >
      <Avatar
        firstName={student.first_name}
        lastName={student.last_name}
        photoUri={student.photo_uri}
        size={48}
      />
      <View style={styles.studentInfo}>
        <Text style={[Typography.bodyMedium, { color: Colors.textPrimary }]} numberOfLines={1}>
          {student.first_name} {student.last_name}
        </Text>
        {showBalance && (
          <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
            {student.balance ?? 0} points
          </Text>
        )}
      </View>
      {rightElement ?? (
        showBalance && (student.balance ?? 0) > 0 ? (
          <PointsBadge points={student.balance ?? 0} size="sm" />
        ) : null
      )}
    </Pressable>
  );
}

// ── AttendanceCheckbox ────────────────────────────────────

interface AttendanceCheckboxProps {
  record: AttendanceRecord;
  onToggle: (studentId: string, newStatus: 'present' | 'absent') => void;
  disabled?: boolean;
}

export function AttendanceCheckbox({ record, onToggle, disabled = false }: AttendanceCheckboxProps) {
  const isPresent = record.status === 'present';
  const student = record.student!;

  return (
    <Pressable
      onPress={() => !disabled && onToggle(record.student_id, isPresent ? 'absent' : 'present')}
      style={[
        styles.attendanceRow,
        isPresent ? styles.attendancePresent : styles.attendanceAbsent,
      ]}
    >
      {/* Checkmark box */}
      <View style={[styles.checkbox, isPresent && styles.checkboxChecked]}>
        {isPresent && <Text style={styles.checkmark}>✓</Text>}
      </View>

      <Avatar
        firstName={student.first_name}
        lastName={student.last_name}
        photoUri={student.photo_uri}
        size={44}
      />

      <View style={styles.studentInfo}>
        <Text style={[Typography.bodyMedium, { color: Colors.textPrimary }]}>
          {student.first_name} {student.last_name}
        </Text>
        <Text style={[Typography.caption, {
          color: isPresent ? Colors.success : Colors.textTertiary,
          fontWeight: isPresent ? '600' : '400',
        }]}>
          {isPresent ? 'Present' : 'Absent'}
        </Text>
      </View>

      {/* Status pill */}
      <View style={[
        styles.statusPill,
        { backgroundColor: isPresent ? Colors.successLight : Colors.absentBg },
      ]}>
        <Text style={[
          Typography.captionMedium,
          { color: isPresent ? Colors.success : Colors.absent },
        ]}>
          {isPresent ? '✓ Here' : '✗ Out'}
        </Text>
      </View>
    </Pressable>
  );
}

// ── TransactionItem ───────────────────────────────────────

interface TransactionItemProps {
  transaction: PointTransaction;
}

const TX_ICONS: Record<string, string> = {
  attendance: '📅',
  activity: '⭐',
  bonus: '🎁',
  redemption: '🛒',
  adjustment: '✏️',
};

export function TransactionItem({ transaction: tx }: TransactionItemProps) {
  const isPositive = tx.points > 0;
  const icon = TX_ICONS[tx.type] ?? '•';
  const date = new Date(tx.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: isPositive ? Colors.goldLight : Colors.dangerLight }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={[Typography.bodyMedium, { color: Colors.textPrimary }]} numberOfLines={1}>
          {tx.description}
        </Text>
        <Text style={[Typography.caption, { color: Colors.textTertiary }]}>{date}</Text>
      </View>
      <Text style={[
        Typography.bodySemiBold,
        { color: isPositive ? Colors.gold : Colors.danger, minWidth: 56, textAlign: 'right' },
      ]}>
        {isPositive ? '+' : ''}{tx.points}
      </Text>
    </View>
  );
}

// ── MinistrySelector ──────────────────────────────────────

interface MinistrySelectorProps {
  ministries: Ministry[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function MinistrySelector({ ministries, selected, onSelect }: MinistrySelectorProps) {
  return (
    <View style={styles.ministrySelector}>
      {ministries.map(m => (
        <Pressable
          key={m.id}
          onPress={() => onSelect(m.id)}
          style={[
            styles.ministryChip,
            selected === m.id && { backgroundColor: m.color + '22', borderColor: m.color },
          ]}
        >
          <View style={[styles.ministryDot, { backgroundColor: m.color }]} />
          <Text style={[
            Typography.captionMedium,
            { color: selected === m.id ? m.color : Colors.textSecondary },
          ]}>
            {m.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── PointsSummaryCard ─────────────────────────────────────

interface PointsSummaryCardProps {
  balance: number;
  totalEarned?: number;
  totalRedeemed?: number;
}

export function PointsSummaryCard({ balance, totalEarned, totalRedeemed }: PointsSummaryCardProps) {
  return (
    <View style={styles.pointsSummary}>
      <View style={styles.balanceRow}>
        <Text style={[Typography.label, { color: Colors.textTertiary }]}>BALANCE</Text>
        <Text style={[Typography.pointsLarge, { color: Colors.gold }]}>{balance}</Text>
        <Text style={[Typography.caption, { color: Colors.textTertiary }]}>points</Text>
      </View>
      {(totalEarned !== undefined || totalRedeemed !== undefined) && (
        <View style={styles.statsRow}>
          {totalEarned !== undefined && (
            <View style={styles.statItem}>
              <Text style={[Typography.captionMedium, { color: Colors.success }]}>+{totalEarned}</Text>
              <Text style={[Typography.caption, { color: Colors.textTertiary }]}>earned</Text>
            </View>
          )}
          {totalRedeemed !== undefined && (
            <View style={styles.statItem}>
              <Text style={[Typography.captionMedium, { color: Colors.danger }]}>-{totalRedeemed}</Text>
              <Text style={[Typography.caption, { color: Colors.textTertiary }]}>redeemed</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── MarketItemCard ────────────────────────────────────────

interface MarketItemCardProps {
  item: import('../../types').MarketItem;
  studentBalance?: number;
  onPress: () => void;
}

export function MarketItemCard({ item, studentBalance, onPress }: MarketItemCardProps) {
  const canAfford = studentBalance === undefined || studentBalance >= item.point_cost;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.marketCard,
        !canAfford && styles.marketCardDisabled,
        { opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <View style={styles.marketItemIcon}>
        <Text style={{ fontSize: 32 }}>🎁</Text>
      </View>
      <Text style={[Typography.bodyMedium, { color: Colors.textPrimary, marginTop: Spacing.xs }]} numberOfLines={2}>
        {item.name}
      </Text>
      {item.quantity !== -1 && (
        <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
          {item.quantity} left
        </Text>
      )}
      <View style={[styles.costBadge, { backgroundColor: canAfford ? Colors.goldLight : Colors.divider }]}>
        <Text style={[Typography.captionMedium, { color: canAfford ? Colors.gold : Colors.textTertiary }]}>
          {item.point_cost} pts
        </Text>
      </View>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  studentRow: {
    flexDirection: 'row', alignItems: 'center',
    height: Layout.studentRowHeight,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    gap: Spacing.md,
  },
  studentInfo: { flex: 1 },

  attendanceRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: Radius.lg, marginVertical: 3,
    gap: Spacing.sm,
  },
  attendancePresent: { backgroundColor: Colors.presentBg },
  attendanceAbsent: { backgroundColor: 'rgba(255,255,255,0.5)' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: Colors.white, fontSize: 14, fontWeight: '800' },
  statusPill: {
    borderRadius: Radius.full, paddingHorizontal: 10,
    paddingVertical: 4,
  },

  txRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  txIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  txInfo: { flex: 1 },

  ministrySelector: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs,
  },
  ministryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.cardBg,
  },
  ministryDot: { width: 8, height: 8, borderRadius: 4 },

  pointsSummary: { alignItems: 'center', padding: Spacing.md },
  balanceRow: { alignItems: 'center', gap: 2 },
  statsRow: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.md },
  statItem: { alignItems: 'center', gap: 2 },

  marketCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl, borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md, alignItems: 'center',
    ...Shadows.card, minWidth: 130,
  },
  marketCardDisabled: { opacity: 0.5 },
  marketItemIcon: {
    width: 64, height: 64, borderRadius: Radius.lg,
    backgroundColor: Colors.goldLight,
    alignItems: 'center', justifyContent: 'center',
  },
  costBadge: {
    marginTop: Spacing.xs, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
});
