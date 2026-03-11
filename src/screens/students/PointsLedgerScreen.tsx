// src/screens/students/PointsLedgerScreen.tsx

import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { ScreenWrapper, StackHeader } from '../../components/navigation/ScreenWrapper';
import { GlassCard } from '../../components/atomic/GlassCard';
import { TransactionItem, PointsSummaryCard } from '../../components/domain';
import { Divider, EmptyState } from '../../components/atomic';
import { Colors, Spacing } from '../../theme';
import { useTransactions } from '../../hooks/useData';
import { useStudentBalance } from '../../hooks/useStudents';
import type { StudentsStackParamList } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

interface Props {
  navigation: NativeStackNavigationProp<StudentsStackParamList, 'PointsLedger'>;
  route: RouteProp<StudentsStackParamList, 'PointsLedger'>;
}

export default function PointsLedgerScreen({ navigation, route }: Props) {
  const { studentId, studentName } = route.params;
  const { data: transactions = [] } = useTransactions(studentId);
  const { data: balance = 0 } = useStudentBalance(studentId);

  const totalEarned = transactions.filter(t => t.points > 0).reduce((s, t) => s + t.points, 0);
  const totalRedeemed = Math.abs(transactions.filter(t => t.points < 0).reduce((s, t) => s + t.points, 0));

  return (
    <ScreenWrapper>
      <StackHeader title="Points Ledger" subtitle={studentName} onBack={() => navigation.goBack()} />
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <GlassCard style={styles.header}>
            <PointsSummaryCard balance={balance} totalEarned={totalEarned} totalRedeemed={totalRedeemed} />
          </GlassCard>
        }
        renderItem={({ item, index }) => (
          <View>
            {index > 0 && <Divider style={{ marginHorizontal: Spacing.md }} />}
            <View style={styles.txItem}>
              <TransactionItem transaction={item} />
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon={<Text style={{ fontSize: 40 }}>📊</Text>}
            title="No transactions"
            message="Points will appear here when awarded."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { margin: Spacing.md },
  list: { paddingBottom: Spacing.xxl },
  txItem: { paddingHorizontal: Spacing.md },
});


// ── AwardPointsScreen ─────────────────────────────────────

import { useState, Alert as RNAlert } from 'react';
import { TextInput, ScrollView, Pressable } from 'react-native';
import { PrimaryButton } from '../../components/atomic';
import { Typography, Radius } from '../../theme';
import { useAwardPoints } from '../../hooks/useData';

interface AwardProps {
  navigation: NativeStackNavigationProp<StudentsStackParamList, 'AwardPoints'>;
  route: RouteProp<StudentsStackParamList, 'AwardPoints'>;
}

const QUICK_AMOUNTS = [5, 10, 15, 20, 25, 50];
const TX_TYPES = [
  { value: 'activity', label: '⭐ Activity' },
  { value: 'bonus', label: '🎁 Bonus' },
  { value: 'adjustment', label: '✏️ Adjustment' },
];

export function AwardPointsScreen({ navigation, route }: AwardProps) {
  const { studentId, studentName } = route.params;
  const [points, setPoints] = useState('');
  const [type, setType] = useState('activity');
  const [description, setDescription] = useState('');
  const awardMutation = useAwardPoints();

  const handleAward = async () => {
    const pts = parseInt(points, 10);
    if (!pts || pts === 0) { RNAlert.alert('Invalid', 'Enter a non-zero point amount.'); return; }
    if (!description.trim()) { RNAlert.alert('Required', 'Enter a description.'); return; }
    try {
      await awardMutation.mutateAsync({
        student_id: studentId,
        points: pts,
        type: type as any,
        description: description.trim(),
      });
      RNAlert.alert('✅ Points Awarded', `${pts > 0 ? '+' : ''}${pts} points added to ${studentName}.`);
      navigation.goBack();
    } catch (e: any) {
      RNAlert.alert('Error', e.message);
    }
  };

  return (
    <ScreenWrapper>
      <StackHeader title="Award Points" subtitle={studentName} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <GlassCard style={{ padding: Spacing.md, gap: Spacing.md }}>
          {/* Quick amounts */}
          <Text style={[Typography.label, { color: Colors.textSecondary }]}>QUICK SELECT</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {QUICK_AMOUNTS.map(amt => (
              <Pressable
                key={amt}
                onPress={() => setPoints(amt.toString())}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8,
                  borderRadius: Radius.full, borderWidth: 1.5,
                  borderColor: points === amt.toString() ? Colors.primary : Colors.divider,
                  backgroundColor: points === amt.toString() ? Colors.primary + '15' : Colors.cardBg,
                }}
              >
                <Text style={[Typography.bodyMedium, {
                  color: points === amt.toString() ? Colors.primary : Colors.textSecondary,
                }]}>
                  +{amt}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Custom amount */}
          <Text style={[Typography.label, { color: Colors.textSecondary }]}>CUSTOM AMOUNT</Text>
          <TextInput
            value={points}
            onChangeText={setPoints}
            placeholder="Enter points (negative to deduct)"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="numbers-and-punctuation"
            style={[Typography.body, {
              backgroundColor: Colors.inputBg, borderRadius: Radius.md,
              borderWidth: 1, borderColor: Colors.inputBorder,
              padding: Spacing.md, color: Colors.textPrimary,
            }]}
          />

          {/* Type */}
          <Text style={[Typography.label, { color: Colors.textSecondary }]}>TYPE</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {TX_TYPES.map(t => (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: Radius.md,
                  borderWidth: 1.5,
                  borderColor: type === t.value ? Colors.primary : Colors.divider,
                  backgroundColor: type === t.value ? Colors.primary + '12' : Colors.cardBg,
                  alignItems: 'center',
                }}
              >
                <Text style={[Typography.captionMedium, {
                  color: type === t.value ? Colors.primary : Colors.textSecondary,
                }]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Description */}
          <Text style={[Typography.label, { color: Colors.textSecondary }]}>DESCRIPTION</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Reason for award…"
            placeholderTextColor={Colors.textTertiary}
            style={[Typography.body, {
              backgroundColor: Colors.inputBg, borderRadius: Radius.md,
              borderWidth: 1, borderColor: Colors.inputBorder,
              padding: Spacing.md, color: Colors.textPrimary,
            }]}
          />
        </GlassCard>

        <PrimaryButton
          label={awardMutation.isPending ? 'Saving…' : `Award ${points ? points + ' ' : ''}Points`}
          onPress={handleAward}
          loading={awardMutation.isPending}
          size="lg"
          style={{ marginTop: Spacing.md }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
