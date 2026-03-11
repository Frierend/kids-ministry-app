// src/screens/attendance/AttendanceHomeScreen.tsx

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
} from 'react-native';
import { ScreenWrapper, StackHeader } from '../../components/navigation/ScreenWrapper';
import { GlassCard } from '../../components/atomic/GlassCard';
import { SectionHeader, PrimaryButton, EmptyState } from '../../components/atomic';
import { MinistrySelector } from '../../components/domain';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useMinistries } from '../../hooks/useData';
import { useMinistrySessionHistory } from '../../hooks/useAttendance';
import type { AttendanceStackParamList } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<AttendanceStackParamList, 'AttendanceHome'>;
}

export default function AttendanceHomeScreen({ navigation }: Props) {
  const { data: ministries = [] } = useMinistries();
  const [selectedMinistry, setSelectedMinistry] = useState<string | null>(ministries[0]?.id ?? null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: history = [] } = useMinistrySessionHistory(selectedMinistry ?? '');

  const handleTakeAttendance = () => {
    if (!selectedMinistry) return;
    navigation.navigate('SessionDetail', {
      sessionId: 'new',
      ministryId: selectedMinistry,
      date: selectedDate,
    });
  };

  const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // Increment/decrement date helpers
  const changeDate = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <ScreenWrapper>
      <StackHeader title="Attendance" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Ministry selector */}
        <SectionHeader title="SELECT MINISTRY" />
        <View style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.md }}>
          {ministries.length === 0 ? (
            <Text style={[Typography.body, { color: Colors.textTertiary }]}>
              No ministries yet. Add one in Settings.
            </Text>
          ) : (
            <MinistrySelector
              ministries={ministries}
              selected={selectedMinistry}
              onSelect={setSelectedMinistry}
            />
          )}
        </View>

        {/* Date picker */}
        <SectionHeader title="SESSION DATE" />
        <GlassCard style={styles.dateCard}>
          <View style={styles.dateRow}>
            <PrimaryButton
              label="‹"
              onPress={() => changeDate(-1)}
              variant="ghost"
              size="sm"
              style={styles.dateBtn}
            />
            <Text style={[Typography.bodySemiBold, { color: Colors.textPrimary }]}>{formattedDate}</Text>
            <PrimaryButton
              label="›"
              onPress={() => changeDate(1)}
              variant="ghost"
              size="sm"
              style={styles.dateBtn}
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}
            />
          </View>
        </GlassCard>

        {/* CTA */}
        <View style={styles.ctaRow}>
          <PrimaryButton
            label={selectedMinistry ? '📋  Take Attendance' : 'Select a Ministry First'}
            onPress={handleTakeAttendance}
            disabled={!selectedMinistry}
            size="lg"
            style={{ flex: 1 }}
          />
        </View>

        {/* Session history */}
        {selectedMinistry && (
          <>
            <SectionHeader title="RECENT SESSIONS" />
            {history.length === 0 ? (
              <GlassCard style={{ marginHorizontal: Spacing.md, padding: Spacing.md }}>
                <Text style={[Typography.body, { color: Colors.textTertiary, textAlign: 'center' }]}>
                  No sessions yet for this ministry.
                </Text>
              </GlassCard>
            ) : (
              history.map(session => (
                <GlassCard
                  key={session.id}
                  style={styles.historyRow}
                  onPress={() => navigation.navigate('SessionDetail', {
                    sessionId: session.id,
                    ministryId: session.ministry_id,
                    date: session.session_date,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.bodyMedium, { color: Colors.textPrimary }]}>
                      {new Date(session.session_date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', month: 'short', day: 'numeric',
                      })}
                    </Text>
                    <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
                      {session.present_count ?? 0} / {session.total_count ?? 0} present
                    </Text>
                  </View>
                  <View style={[styles.statusPill, {
                    backgroundColor: session.status === 'committed' ? Colors.successLight : Colors.warningLight,
                  }]}>
                    <Text style={[Typography.captionMedium, {
                      color: session.status === 'committed' ? Colors.success : Colors.warning,
                    }]}>
                      {session.status === 'committed' ? '✓ Committed' : '⏳ Draft'}
                    </Text>
                  </View>
                </GlassCard>
              ))
            )}
          </>
        )}

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxl },
  dateCard: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.md, padding: Spacing.sm,
  },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dateBtn: { minWidth: 44 },
  ctaRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.md, marginBottom: Spacing.xs,
    padding: Spacing.md,
  },
  statusPill: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
});
