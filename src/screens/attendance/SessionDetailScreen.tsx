// src/screens/attendance/SessionDetailScreen.tsx

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenWrapper, StackHeader } from '../../components/navigation/ScreenWrapper';
import { PrimaryButton, SectionHeader } from '../../components/atomic';
import { AttendanceCheckbox } from '../../components/domain';
import { GlassCard } from '../../components/atomic/GlassCard';
import { Colors, Typography, Spacing, Layout } from '../../theme';
import { useOrCreateSession } from '../../hooks/useAttendance';
import { useMarkAttendance, useCommitSession } from '../../hooks/useAttendance';
import type { AttendanceStackParamList, AttendanceRecord } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

interface Props {
  navigation: NativeStackNavigationProp<AttendanceStackParamList, 'SessionDetail'>;
  route: RouteProp<AttendanceStackParamList, 'SessionDetail'>;
}

export default function SessionDetailScreen({ navigation, route }: Props) {
  const { ministryId, date } = route.params;
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, 'present' | 'absent'>>({});

  const { data: session, isLoading, refetch } = useOrCreateSession(ministryId, date);
  const markMutation = useMarkAttendance();
  const commitMutation = useCommitSession();

  const isCommitted = session?.status === 'committed';

  const handleToggle = useCallback(async (studentId: string, newStatus: 'present' | 'absent') => {
    if (isCommitted) return;
    // Optimistic update
    setOptimisticStatuses(prev => ({ ...prev, [studentId]: newStatus }));
    Haptics.impactAsync(newStatus === 'present'
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Light
    );
    try {
      await markMutation.mutateAsync({ sessionId: session!.id, studentId, status: newStatus });
    } catch (e) {
      // Revert optimistic on error
      setOptimisticStatuses(prev => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
    }
    await refetch();
  }, [session, isCommitted, markMutation, refetch]);

  const handleCommit = async () => {
    if (!session) return;
    const presentCount = mergedRecords.filter(r => r.status === 'present').length;
    Alert.alert(
      'Commit Session',
      `Mark ${presentCount} students present and award points?\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Commit & Award Points',
          style: 'default',
          onPress: async () => {
            try {
              const result = await commitMutation.mutateAsync(session.id);
              Alert.alert(
                '✅ Session Committed',
                `${result.presentCount} students marked present.\n${result.pointsAwarded} points awarded total.`
              );
              await refetch();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to commit session');
            }
          },
        },
      ]
    );
  };

  // Merge server records with optimistic updates
  const mergedRecords: AttendanceRecord[] = useMemo(() => {
    if (!session?.records) return [];
    return session.records.map(r => ({
      ...r,
      status: optimisticStatuses[r.student_id] ?? r.status,
    }));
  }, [session?.records, optimisticStatuses]);

  const presentCount = mergedRecords.filter(r => r.status === 'present').length;
  const totalCount = mergedRecords.length;
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  if (isLoading || !session) {
    return (
      <ScreenWrapper>
        <StackHeader title="Loading…" onBack={() => navigation.goBack()} />
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <StackHeader
        title={session.ministry?.name ?? 'Attendance'}
        subtitle={formattedDate}
        onBack={() => navigation.goBack()}
      />

      {/* Summary bar */}
      <GlassCard style={styles.summaryBar}>
        <View style={styles.summaryLeft}>
          <Text style={[Typography.pointsMedium, { color: Colors.primary }]}>{presentCount}</Text>
          <Text style={[Typography.caption, { color: Colors.textTertiary }]}>present</Text>
        </View>
        <View style={styles.progressCol}>
          <View style={styles.progressOuter}>
            <View style={[
              styles.progressInner,
              { width: totalCount > 0 ? `${(presentCount / totalCount) * 100}%` as any : '0%' },
            ]} />
          </View>
          <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
            {totalCount - presentCount} absent
          </Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={[Typography.pointsMedium, { color: Colors.textTertiary }]}>{totalCount - presentCount}</Text>
          <Text style={[Typography.caption, { color: Colors.textTertiary }]}>absent</Text>
        </View>
      </GlassCard>

      {/* Select all / none */}
      {!isCommitted && (
        <View style={styles.bulkRow}>
          <PrimaryButton
            label="All Present"
            variant="secondary"
            size="sm"
            onPress={async () => {
              for (const r of mergedRecords) {
                if (r.status !== 'present') {
                  await handleToggle(r.student_id, 'present');
                }
              }
            }}
          />
          <PrimaryButton
            label="All Absent"
            variant="ghost"
            size="sm"
            onPress={async () => {
              for (const r of mergedRecords) {
                if (r.status !== 'absent') {
                  await handleToggle(r.student_id, 'absent');
                }
              }
            }}
          />
        </View>
      )}

      {/* Student list */}
      <FlatList
        data={mergedRecords}
        keyExtractor={item => item.student_id}
        getItemLayout={(_, index) => ({
          length: Layout.studentRowHeight,
          offset: Layout.studentRowHeight * index,
          index,
        })}
        renderItem={({ item }) => (
          <AttendanceCheckbox
            record={item}
            onToggle={handleToggle}
            disabled={isCommitted}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[Typography.body, { color: Colors.textTertiary, textAlign: 'center', margin: Spacing.xl }]}>
            No students enrolled in this ministry.
          </Text>
        }
      />

      {/* Commit button */}
      {!isCommitted && (
        <View style={styles.commitRow}>
          <PrimaryButton
            label={commitMutation.isPending ? 'Committing…' : `✓ Commit & Award Points (${presentCount})`}
            onPress={handleCommit}
            loading={commitMutation.isPending}
            disabled={presentCount === 0}
            size="lg"
            style={{ flex: 1 }}
          />
        </View>
      )}

      {isCommitted && (
        <View style={styles.committedBanner}>
          <Text style={[Typography.bodySemiBold, { color: Colors.success }]}>
            ✅ Session committed — points awarded
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  summaryBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    padding: Spacing.md, gap: Spacing.md,
  },
  summaryLeft: { alignItems: 'center', minWidth: 44 },
  summaryRight: { alignItems: 'center', minWidth: 44 },
  progressCol: { flex: 1, gap: 4 },
  progressOuter: {
    height: 8, backgroundColor: Colors.divider,
    borderRadius: 4, overflow: 'hidden',
  },
  progressInner: {
    height: '100%', borderRadius: 4,
    backgroundColor: Colors.success,
  },
  bulkRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
  commitRow: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: Spacing.md,
    backgroundColor: Colors.frostedTabBg,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  committedBanner: {
    padding: Spacing.md,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.success + '30',
  },
});
