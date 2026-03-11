// src/screens/students/StudentDetailScreen.tsx

import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, Pressable,
} from 'react-native';
import { ScreenWrapper, StackHeader } from '../../components/navigation/ScreenWrapper';
import { GlassCard } from '../../components/atomic/GlassCard';
import { Avatar, Badge, PrimaryButton, SectionHeader, Divider } from '../../components/atomic';
import { PointsSummaryCard, TransactionItem } from '../../components/domain';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useStudent, useStudentEnrollments, useArchiveStudent } from '../../hooks/useStudents';
import { useTransactions } from '../../hooks/useData';
import type { StudentsStackParamList } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

interface Props {
  navigation: NativeStackNavigationProp<StudentsStackParamList, 'StudentDetail'>;
  route: RouteProp<StudentsStackParamList, 'StudentDetail'>;
}

export default function StudentDetailScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const { data: student, isLoading } = useStudent(studentId);
  const { data: enrollments = [] } = useStudentEnrollments(studentId);
  const { data: transactions = [] } = useTransactions(studentId);
  const archiveMutation = useArchiveStudent();

  const handleArchive = () => {
    Alert.alert(
      'Archive Student',
      `Archive ${student?.first_name} ${student?.last_name}? They will be unenrolled from all ministries and hidden from active lists.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            await archiveMutation.mutateAsync(studentId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (isLoading || !student) return null;

  const totalEarned = transactions
    .filter(t => t.points > 0)
    .reduce((sum, t) => sum + t.points, 0);
  const totalRedeemed = Math.abs(transactions
    .filter(t => t.points < 0)
    .reduce((sum, t) => sum + t.points, 0));

  return (
    <ScreenWrapper>
      <StackHeader
        title={`${student.first_name} ${student.last_name}`}
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: <Text style={{ fontSize: 18 }}>✏️</Text>,
          onPress: () => navigation.navigate('StudentEdit', { studentId }),
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <GlassCard style={styles.profileCard}>
          <Avatar
            firstName={student.first_name}
            lastName={student.last_name}
            photoUri={student.photo_uri}
            size={80}
          />
          <View style={styles.profileInfo}>
            <Text style={[Typography.title2, { color: Colors.textPrimary }]}>
              {student.first_name} {student.last_name}
            </Text>
            {student.is_archived && (
              <Badge label="Archived" color={Colors.textTertiary} size="sm" />
            )}
            {student.notes && (
              <Text style={[Typography.caption, { color: Colors.textTertiary }]} numberOfLines={2}>
                {student.notes}
              </Text>
            )}
          </View>
        </GlassCard>

        {/* Points summary */}
        <GlassCard style={styles.card}>
          <PointsSummaryCard
            balance={student.balance ?? 0}
            totalEarned={totalEarned}
            totalRedeemed={totalRedeemed}
          />
        </GlassCard>

        {/* Quick actions */}
        {!student.is_archived && (
          <View style={styles.actionsRow}>
            <PrimaryButton
              label="Award Points"
              onPress={() => navigation.navigate('AwardPoints', {
                studentId,
                studentName: `${student.first_name} ${student.last_name}`,
              })}
              size="sm"
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label="Full Ledger"
              variant="secondary"
              onPress={() => navigation.navigate('PointsLedger', {
                studentId,
                studentName: `${student.first_name} ${student.last_name}`,
              })}
              size="sm"
              style={{ flex: 1 }}
            />
          </View>
        )}

        {/* Enrollments */}
        <SectionHeader
          title="MINISTRIES"
          action={!student.is_archived ? { label: 'Manage', onPress: () => navigation.navigate('EnrollStudent', { studentId }) } : undefined}
        />
        <GlassCard style={styles.card}>
          {enrollments.length === 0 ? (
            <Text style={[Typography.body, { color: Colors.textTertiary, textAlign: 'center' }]}>
              Not enrolled in any ministry.
            </Text>
          ) : (
            enrollments.map((e, i) => (
              <View key={e.id}>
                {i > 0 && <Divider />}
                <View style={styles.enrollmentRow}>
                  <View style={[styles.ministryDot, { backgroundColor: e.ministry.color }]} />
                  <Text style={[Typography.bodyMedium, { color: Colors.textPrimary, flex: 1 }]}>
                    {e.ministry.name}
                  </Text>
                  <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
                    Sat {e.ministry.saturday_points}pts · Sun {e.ministry.sunday_points}pts
                  </Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>

        {/* Recent transactions */}
        <SectionHeader
          title="RECENT POINTS"
          action={{
            label: 'See All',
            onPress: () => navigation.navigate('PointsLedger', {
              studentId,
              studentName: `${student.first_name} ${student.last_name}`,
            }),
          }}
        />
        <GlassCard style={styles.card}>
          {transactions.length === 0 ? (
            <Text style={[Typography.body, { color: Colors.textTertiary, textAlign: 'center' }]}>
              No transactions yet.
            </Text>
          ) : (
            transactions.slice(0, 5).map((tx, i) => (
              <View key={tx.id}>
                {i > 0 && <Divider />}
                <TransactionItem transaction={tx} />
              </View>
            ))
          )}
        </GlassCard>

        {/* Archive */}
        {!student.is_archived && (
          <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.xl }}>
            <PrimaryButton
              label="Archive Student"
              variant="danger"
              onPress={handleArchive}
              loading={archiveMutation.isPending}
            />
          </View>
        )}

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxl },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  profileInfo: { flex: 1, gap: 4 },
  card: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, padding: Spacing.md },
  actionsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  enrollmentRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  ministryDot: { width: 10, height: 10, borderRadius: 5 },
});
