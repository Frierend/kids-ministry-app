import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabParamList, AttendanceStackParamList, StudentsStackParamList } from '../types';
import { AppCard } from '../components/atoms/AppCard';
import { SectionHeader } from '../components/molecules/SectionHeader';
import { AttendanceSessionCard } from '../components/organisms/AttendanceSessionCard';
import { attendanceService } from '../services/AttendanceService';
import { securityService } from '../services/SecurityService';
import { studentService } from '../services/StudentService';
import { AttendanceSession } from '../types';
import { Colors, Typography, Spacing, Layout } from '../constants';
import { format } from 'date-fns';

const QUICK_ACTIONS = [
  { icon: '📋', label: 'Take\nAttendance', tab: 'Attendance' as const },
  { icon: '👥', label: 'View\nStudents',   tab: 'Students'   as const },
  { icon: '🛒', label: 'Market\nDay',      tab: 'Market'     as const },
  { icon: '⚙️', label: 'Settings',          tab: 'Settings'   as const },
];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [teacherName, setTeacherName] = useState('Teacher');
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [name, sessions, students] = await Promise.all([
      securityService.getTeacherName(),
      attendanceService.getRecentSessions(undefined, 5),
      studentService.getAll({ includeArchived: false }),
    ]);
    setTeacherName(name);
    setRecentSessions(sessions);
    setStudentCount(students.length);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');
  const todayShort = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = recentSessions.filter((s) => s.session_date === todayShort);
  const todayPresent = todaySessions.reduce((sum, s) => sum + (s.present_count ?? 0), 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* HEADER */}
      <LinearGradient colors={Colors.gradientHeader} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.teacherName}>{teacherName}! 👋</Text>
          </View>
          <View style={styles.statsBox}>
            <Text style={styles.statsNum}>{studentCount}</Text>
            <Text style={styles.statsLabel}>Students</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{todayStr}</Text>
      </LinearGradient>

      {/* TODAY BANNER */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <LinearGradient colors={Colors.gradientBlue} style={styles.todayBanner}>
          <View>
            <Text style={styles.bannerLabel}>Today's Attendance</Text>
            <Text style={styles.bannerNum}>{todayPresent}</Text>
            <Text style={styles.bannerSub}>students checked in across {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}</Text>
          </View>
          <Text style={styles.bannerIcon}>📊</Text>
        </LinearGradient>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity key={action.label} style={styles.quickItem}
            onPress={() => navigation.navigate(action.tab)} activeOpacity={0.7}>
            <AppCard style={{ alignItems: 'center', flex: 1 }} padding={16}>
              <Text style={styles.quickIcon}>{action.icon}</Text>
              <Text style={styles.quickLabel}>{action.label.replace('\n', '\n')}</Text>
            </AppCard>
          </TouchableOpacity>
        ))}
      </View>

      {/* RECENT SESSIONS */}
      <SectionHeader title="Recent Sessions" count={recentSessions.length}
        onSeeAll={() => navigation.navigate('Attendance')} />
      {recentSessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No sessions yet. Start taking attendance!</Text>
        </View>
      ) : (
        recentSessions.map((session) => (
          <AttendanceSessionCard key={session.id} session={session}
            onPress={() => navigation.navigate('Attendance')} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  greeting: { fontSize: Typography.sm, color: Colors.mid },
  teacherName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.dark },
  dateText: { fontSize: Typography.xs, color: Colors.light },
  statsBox: { alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 12 },
  statsNum: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.primary },
  statsLabel: { fontSize: Typography.xs, color: Colors.light },
  todayBanner: { borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm, marginBottom: 4 },
  bannerNum: { color: Colors.white, fontSize: 40, fontWeight: Typography.extraBold, lineHeight: 48 },
  bannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.xs, marginTop: 4 },
  bannerIcon: { fontSize: 48 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 16, gap: 8 },
  quickItem: { width: '47%' },
  quickIcon: { fontSize: 32, marginBottom: 8 },
  quickLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.dark, textAlign: 'center' },
  empty: { paddingHorizontal: 16, paddingVertical: 20 },
  emptyText: { color: Colors.light, fontSize: Typography.sm, textAlign: 'center' },
});
