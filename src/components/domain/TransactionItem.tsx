import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PointTransaction } from '../../types';
import { Colors, Typography, Spacing } from '../../constants';
import { format } from 'date-fns';

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  attendance:       { icon: '📅', color: Colors.txAttendance, label: 'Attendance' },
  activity:         { icon: '⭐', color: Colors.txActivity,   label: 'Activity' },
  market_deduction: { icon: '🛒', color: Colors.txMarket,    label: 'Market' },
  manual_adjustment:{ icon: '✏️', color: Colors.txManual,    label: 'Manual' },
};

interface TransactionItemProps {
  tx: PointTransaction;
  showRunningBalance?: boolean;
}

export function TransactionItem({ tx, showRunningBalance }: TransactionItemProps) {
  const meta = TYPE_META[tx.type] ?? { icon: '•', color: Colors.light, label: tx.type };
  const isPositive = tx.points >= 0;
  const date = (() => {
    try { return format(new Date(tx.created_at), 'MMM d, yyyy'); } catch { return tx.created_at; }
  })();

  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: meta.color + '20' }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.reason} numberOfLines={2}>{tx.reason}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.points, { color: isPositive ? Colors.accent : Colors.danger }]}>
          {isPositive ? '+' : ''}{tx.points}
        </Text>
        {showRunningBalance && tx.running_balance !== undefined && (
          <Text style={styles.balance}>{tx.running_balance} pts</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12,
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  info: { flex: 1 },
  reason: { fontSize: Typography.sm, color: Colors.dark, marginBottom: 2 },
  date: { fontSize: Typography.xs, color: Colors.light },
  right: { alignItems: 'flex-end' },
  points: { fontSize: Typography.md, fontWeight: Typography.bold },
  balance: { fontSize: Typography.xs, color: Colors.light, marginTop: 2 },
});
