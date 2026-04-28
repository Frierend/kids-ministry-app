import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PointBreakdown } from '../../types';
import { Colors, Typography, Radius, Shadows, Spacing } from '../../constants';

interface PointsSummaryCardProps {
  balance: number;
  breakdown?: PointBreakdown;
}

export function PointsSummaryCard({ balance, breakdown }: PointsSummaryCardProps) {
  return (
    <LinearGradient colors={Colors.gradientBlue as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.card}>
      <Text style={styles.label}>Total Points Balance</Text>
      <Text style={styles.balance}>{balance.toLocaleString()}</Text>
      <Text style={styles.pts}>points</Text>

      {breakdown && (
        <View style={styles.breakdown}>
          {[
            { label: 'Attendance', value: breakdown.attendance, icon: '📅' },
            { label: 'Activity',   value: breakdown.activity,   icon: '⭐' },
            { label: 'Market',     value: breakdown.market_deductions, icon: '🛒' },
          ].map((item) => (
            <View key={item.label} style={styles.bItem}>
              <Text style={styles.bIcon}>{item.icon}</Text>
              <Text style={styles.bLabel}>{item.label}</Text>
              <Text style={styles.bValue}>{item.value >= 0 ? '+' : ''}{item.value}</Text>
            </View>
          ))}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.xl, padding: 24, ...Shadows.md },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm, marginBottom: 4 },
  balance: { color: Colors.white, fontSize: 56, fontWeight: Typography.extraBold, lineHeight: 64 },
  pts: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.md, marginBottom: 20 },
  breakdown: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 16 },
  bItem: { alignItems: 'center', flex: 1 },
  bIcon: { fontSize: 20, marginBottom: 4 },
  bLabel: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.xs, marginBottom: 2 },
  bValue: { color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.bold },
});
