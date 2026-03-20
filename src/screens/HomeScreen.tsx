import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList, AttendanceSession } from '../types';
import { AppCard } from '../components/atoms/AppCard';
import { SectionHeader } from '../components/molecules/SectionHeader';
import { AttendanceSessionCard } from '../components/organisms/AttendanceSessionCard';
import { attendanceService } from '../services/AttendanceService';
import { securityService } from '../services/SecurityService';
import { studentService } from '../services/StudentService';
import { Colors, Typography, Spacing, Radius, Shadows, Layout } from '../constants';
import { format } from 'date-fns';

const QUICK_ACTIONS = [
  { icon: '📋', label: 'Take Attendance', tab: 'Attendance' as const, color: Colors.primary },
  { icon: '👥', label: 'View Students',   tab: 'Students'   as const, color: Colors.secondary },
  { icon: '🛒', label: 'Market Day',      tab: 'Market'     as const, color: Colors.warning },
  { icon: '⚙️', label: 'Settings',         tab: 'Settings'   as const, color: Colors.muted },
];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const isFocused = useIsFocused();
  const [teacherName, setTeacherName] = useState('Teacher');
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [name, sessions, students] = await Promise.all([
      securityService.getTeacherName(),
      attendanceService.getRecentSessions(undefined, 5),
      studentService.getAll({ includeArchived: false }),
    ]);
    setTeacherName(name);
    setRecentSessions(sessions);
    setStudentCount(students.length);
  }, []);

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');
  const todayShort = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = recentSessions.filter((s) => s.session_date === todayShort);
  const todayPresent = todaySessions.reduce((sum, s) => sum + (s.present_count ?? 0), 0);
  const committedToday = todaySessions.filter((s) => s.status === 'committed').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── NAVY HERO HEADER ── */}
      <LinearGradient
        colors={Colors.gradientNavy as [string, string]}
        style={[styles.hero, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.heroTop}>
          <View style={styles.greetingCol}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.teacherName}>{teacherName} 👋</Text>
            <Text style={styles.dateText}>{todayStr}</Text>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatNum}>{studentCount}</Text>
              <Text style={styles.heroStatLabel}>Students</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatNum}>{todaySessions.length}</Text>
              <Text style={styles.heroStatLabel}>Sessions</Text>
            </View>
          </View>
        </View>

        {/* Today banner */}
        <View style={styles.todayCard}>
          <View style={styles.todayLeft}>
            <Text style={styles.todayLabel}>Today's Check-ins</Text>
            <Text style={styles.todayNum}>{todayPresent}</Text>
            <Text style={styles.todaySub}>
              {committedToday > 0
                ? `${committedToday} session${committedToday !== 1 ? 's' : ''} completed`
                : 'No sessions completed yet'}
            </Text>
          </View>
          <Text style={styles.todayIcon}>📊</Text>
        </View>
      </LinearGradient>

      {/* ── QUICK ACTIONS ── */}
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickItem}
            onPress={() => navigation.navigate(action.tab)}
            activeOpacity={0.75}
          >
            <AppCard style={styles.quickCard} elevated>
              <View style={[styles.quickIconBox, { backgroundColor: action.color + '18' }]}>
                <Text style={styles.quickIcon}>{action.icon}</Text>
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </AppCard>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── RECENT SESSIONS ── */}
      <SectionHeader
        title="Recent Sessions"
        count={recentSessions.length}
        onSeeAll={() => navigation.navigate('Attendance')}
      />

      {recentSessions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No sessions yet.</Text>
          <Text style={styles.emptySub}>Start taking attendance!</Text>
        </View>
      ) : (
        recentSessions.map((session) => (
          <AttendanceSessionCard
            key={session.id}
            session={session}
            onPress={() => navigation.navigate('Attendance')}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Hero
  hero: { paddingHorizontal: 16, paddingBottom: 20 },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingCol: { flex: 1 },
  greetingText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.65)', marginBottom: 2 },
  teacherName: { fontSize: Typography.xxl, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  dateText: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.5)' },
  heroStats: { flexDirection: 'row', gap: 8 },
  heroStatCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 56,
  },
  heroStatNum: { fontSize: Typography.xl, fontWeight: '800', color: Colors.white },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Today card inside hero
  todayCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  todayLeft: { flex: 1 },
  todayLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  todayNum: { fontSize: 40, fontWeight: '800', color: Colors.white, lineHeight: 48 },
  todaySub: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  todayIcon: { fontSize: 44 },

  // Quick actions
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 8,
  },
  quickItem: { width: '47.5%' },
  quickCard: { alignItems: 'center', paddingVertical: 18 },
  quickIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickIcon: { fontSize: 26 },
  quickLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.dark,
    textAlign: 'center',
  },

  // Empty
  emptyBox: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: Typography.md, fontWeight: '600', color: Colors.mid },
  emptySub: { fontSize: Typography.sm, color: Colors.muted, marginTop: 4 },
});