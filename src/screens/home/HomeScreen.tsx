// src/screens/home/HomeScreen.tsx

import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
} from 'react-native';
import { ScreenWrapper, StackHeader } from '../../components/navigation/ScreenWrapper';
import { GlassCard } from '../../components/atomic/GlassCard';
import { SectionHeader, SkeletonRow } from '../../components/atomic';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useStudents } from '../../hooks/useStudents';
import { useRecentSessions } from '../../hooks/useAttendance';
import { useMinistries } from '../../hooks/useData';

export default function HomeScreen() {
  const { data: students, isLoading: studentsLoading, refetch: refetchStudents } = useStudents();
  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useRecentSessions();
  const { data: ministries } = useMinistries();

  const isLoading = studentsLoading || sessionsLoading;
  const refreshing = false;

  const stats = useMemo(() => {
    const totalStudents = students?.length ?? 0;
    const totalPoints = students?.reduce((sum, s) => sum + (s.balance ?? 0), 0) ?? 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySession = sessions?.find(s => s.session_date === todayStr);
    const todayPresent = todaySession?.present_count ?? 0;
    const todayTotal = todaySession?.total_count ?? 0;
    return { totalStudents, totalPoints, todayPresent, todayTotal, todaySession };
  }, [students, sessions]);

  const onRefresh = async () => {
    await Promise.all([refetchStudents(), refetchSessions()]);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <ScreenWrapper>
      <StackHeader title="Kids Ministry" subtitle={today} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero stats row */}
        <View style={styles.statsGrid}>
          <StatCard
            emoji="👨‍👩‍👧‍👦"
            label="Students"
            value={stats.totalStudents.toString()}
            color={Colors.primary}
          />
          <StatCard
            emoji="⭐"
            label="Total Points"
            value={stats.totalPoints.toLocaleString()}
            color={Colors.gold}
          />
        </View>

        {/* Today's attendance */}
        {stats.todaySession && (
          <>
            <SectionHeader title="TODAY'S ATTENDANCE" />
            <GlassCard style={styles.card}>
              <View style={styles.attendanceSummary}>
                <View style={styles.progressOuter}>
                  <View
                    style={[
                      styles.progressInner,
                      {
                        width: stats.todayTotal > 0
                          ? `${(stats.todayPresent / stats.todayTotal) * 100}%` as any
                          : '0%',
                        backgroundColor: Colors.success,
                      },
                    ]}
                  />
                </View>
                <Text style={[Typography.body, { color: Colors.textSecondary }]}>
                  <Text style={[Typography.bodySemiBold, { color: Colors.textPrimary }]}>
                    {stats.todayPresent}
                  </Text>
                  /{stats.todayTotal} present
                </Text>
              </View>
            </GlassCard>
          </>
        )}

        {/* Ministries overview */}
        {ministries && ministries.length > 0 && (
          <>
            <SectionHeader title="MINISTRIES" />
            <View style={styles.ministriesGrid}>
              {ministries.map(m => (
                <GlassCard key={m.id} style={[styles.ministryCard, { borderLeftColor: m.color, borderLeftWidth: 4 }]}>
                  <View style={[styles.ministryDot, { backgroundColor: m.color }]} />
                  <Text style={[Typography.bodyMedium, { color: Colors.textPrimary }]}>{m.name}</Text>
                  <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
                    {m.student_count ?? 0} students
                  </Text>
                </GlassCard>
              ))}
            </View>
          </>
        )}

        {/* Recent sessions */}
        <SectionHeader title="RECENT SESSIONS" />
        {isLoading
          ? [0, 1, 2].map(i => <SkeletonRow key={i} height={60} />)
          : sessions?.length === 0
            ? (
              <GlassCard style={styles.card}>
                <Text style={[Typography.body, { color: Colors.textTertiary, textAlign: 'center' }]}>
                  No sessions yet. Take attendance to get started.
                </Text>
              </GlassCard>
            )
            : sessions?.slice(0, 5).map(session => (
              <GlassCard key={session.id} style={styles.sessionRow}>
                <View style={[styles.sessionDot, { backgroundColor: session.ministry?.color ?? Colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodyMedium, { color: Colors.textPrimary }]}>
                    {session.ministry?.name ?? 'Ministry'}
                  </Text>
                  <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
                    {new Date(session.session_date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.sessionBadge}>
                  <Text style={[Typography.captionMedium, { color: session.status === 'committed' ? Colors.success : Colors.warning }]}>
                    {session.status === 'committed' ? '✓ Done' : '⏳ Draft'}
                  </Text>
                  <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
                    {session.present_count ?? 0}/{session.total_count ?? 0}
                  </Text>
                </View>
              </GlassCard>
            ))
        }

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <GlassCard style={styles.statCard}>
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
      <Text style={[Typography.pointsMedium, { color }]}>{value}</Text>
      <Text style={[Typography.caption, { color: Colors.textTertiary }]}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxl },
  statsGrid: {
    flexDirection: 'row', gap: Spacing.md,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1, alignItems: 'center', padding: Spacing.md, gap: 4,
  },
  card: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  attendanceSummary: { gap: Spacing.sm },
  progressOuter: {
    height: 8, backgroundColor: Colors.divider,
    borderRadius: 4, overflow: 'hidden',
  },
  progressInner: { height: '100%', borderRadius: 4 },

  ministriesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  ministryCard: {
    flex: 1, minWidth: 140, padding: Spacing.sm, gap: 2,
  },
  ministryDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.md, marginBottom: Spacing.xs, padding: Spacing.sm,
  },
  sessionDot: { width: 10, height: 10, borderRadius: 5 },
  sessionBadge: { alignItems: 'flex-end', gap: 2 },
});
