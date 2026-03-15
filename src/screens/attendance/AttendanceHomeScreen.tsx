import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AttendanceStackParamList, Ministry, AttendanceSession } from '../../types';
import { AppCard } from '../../components/atoms/AppCard';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { MinistrySelector } from '../../components/molecules/MinistrySelector';
import { SectionHeader } from '../../components/molecules/SectionHeader';
import { AttendanceSessionCard } from '../../components/organisms/AttendanceSessionCard';
import { ministryService } from '../../services/MinistryService';
import { attendanceService } from '../../services/AttendanceService';
import { Colors, Typography, Spacing } from '../../constants';
import { format, addDays, subDays } from 'date-fns';

type Nav = NativeStackNavigationProp<AttendanceStackParamList, 'AttendanceHome'>;

function toYYYYMMDD(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function AttendanceHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(toYYYYMMDD(new Date()));
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [mins, sessions] = await Promise.all([
      ministryService.getAll(),
      attendanceService.getRecentSessions(undefined, 10),
    ]);
    setMinistries(mins);
    if (mins.length && !selectedMinistryId) setSelectedMinistryId(mins[0].id);
    setRecentSessions(sessions);
  }, [selectedMinistryId]);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleStartSession = async () => {
    if (!selectedMinistryId) return;
    setLoading(true);
    try {
      const session = await attendanceService.getOrCreateSession(selectedMinistryId, selectedDate);
      const ministry = ministries.find((m) => m.id === selectedMinistryId);
      navigation.push('SessionDetail', {
        sessionId: session.id,
        ministryName: ministry?.name ?? 'Session',
        sessionDate: selectedDate,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedMinistry = ministries.find((m) => m.id === selectedMinistryId);
  const pointsForDay = selectedMinistry
    ? (selectedMinistry.points_config as any)[format(new Date(selectedDate + 'T00:00:00'), 'EEEE').toLowerCase()] ?? 0
    : 0;

  // Date strip: -3 to +3 from today
  const today = new Date();
  const dates = [-3, -2, -1, 0, 1, 2, 3].map((d) => addDays(today, d));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Attendance</Text>
        <TouchableOpacity onPress={() => navigation.push('AttendanceHistory', {})}>
          <Text style={styles.historyIcon}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* DATE STRIP */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateStrip}>
        {dates.map((d) => {
          const str = toYYYYMMDD(d);
          const selected = str === selectedDate;
          const isToday = str === toYYYYMMDD(today);
          return (
            <TouchableOpacity key={str} onPress={() => setSelectedDate(str)}
              style={[styles.dateChip, selected && styles.dateChipActive]}>
              <Text style={[styles.dayLabel, selected && styles.dateLabelActive]}>
                {format(d, 'EEE')}
              </Text>
              <Text style={[styles.dateNum, selected && styles.dateLabelActive]}>
                {format(d, 'd')}
              </Text>
              {isToday && <View style={[styles.todayDot, selected && styles.todayDotActive]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* MINISTRY SELECTOR */}
      <MinistrySelector
        ministries={ministries}
        selectedId={selectedMinistryId}
        onChange={setSelectedMinistryId}
      />

      {/* SESSION CARD */}
      {selectedMinistry && (
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <AppCard elevated>
            <Text style={styles.sessionMinistry}>{selectedMinistry.name}</Text>
            <Text style={styles.sessionDate}>{format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</Text>
            {pointsForDay > 0 && (
              <View style={styles.pointsRow}>
                <Text style={styles.pointsLabel}>Points per student:</Text>
                <Text style={styles.pointsValue}>+{pointsForDay} pts</Text>
              </View>
            )}
            <PrimaryButton
              label={pointsForDay === 0 ? 'Not an active day' : 'Start Session'}
              onPress={handleStartSession}
              loading={loading}
              disabled={pointsForDay === 0}
              style={{ marginTop: 16 }}
            />
          </AppCard>
        </View>
      )}

      {/* RECENT SESSIONS */}
      <SectionHeader title="Recent Sessions" count={recentSessions.length}
        onSeeAll={() => navigation.push('AttendanceHistory', {})} />
      {recentSessions.map((session) => (
        <AttendanceSessionCard key={session.id} session={session}
          onPress={() => navigation.push('SessionDetail', {
            sessionId: session.id,
            ministryName: session.ministry_name ?? '',
            sessionDate: session.session_date,
          })} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.dark },
  historyIcon: { fontSize: 24 },
  dateStrip: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  dateChip: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, minWidth: 52 },
  dateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayLabel: { fontSize: Typography.xs, color: Colors.light, marginBottom: 4 },
  dateNum: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.dark },
  dateLabelActive: { color: Colors.white },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 4 },
  todayDotActive: { backgroundColor: Colors.white },
  sessionMinistry: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.dark, marginBottom: 4 },
  sessionDate: { fontSize: Typography.sm, color: Colors.mid, marginBottom: 12 },
  pointsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primaryLight, borderRadius: 8, padding: 12 },
  pointsLabel: { fontSize: Typography.sm, color: Colors.mid },
  pointsValue: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.primary },
});
