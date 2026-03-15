import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudentsStackParamList, Student, AttendanceSummary, PointBreakdown } from '../../types';
import { Avatar } from '../../components/atoms/Avatar';
import { Badge } from '../../components/atoms/Badge';
import { AppCard } from '../../components/atoms/AppCard';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { PointsSummaryCard } from '../../components/molecules/PointsSummaryCard';
import { TransactionItem } from '../../components/molecules/TransactionItem';
import { SectionHeader } from '../../components/molecules/SectionHeader';
import { studentService } from '../../services/StudentService';
import { transactionService } from '../../services/TransactionService';
import { Colors, Typography, Spacing } from '../../constants';

type Props = NativeStackScreenProps<StudentsStackParamList, 'StudentDetail'>;

export function StudentDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { studentId } = route.params;
  const [student, setStudent] = useState<Student | null>(null);
  const [balance, setBalance] = useState(0);
  const [breakdown, setBreakdown] = useState<PointBreakdown | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, bal, bd, att, tx] = await Promise.all([
      studentService.getById(studentId),
      transactionService.getBalance(studentId),
      transactionService.getBreakdown(studentId),
      studentService.getAttendanceSummary(studentId),
      transactionService.getLedger(studentId, { pageSize: 5 }),
    ]);
    setStudent(s);
    setBalance(bal);
    setBreakdown(bd);
    setAttendance(att);
    setRecentTx(tx.transactions);
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!student) return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;

  const initials = (student.first_name[0] + (student.last_name[0] ?? '')).toUpperCase();
  const displayName = student.nickname || `${student.first_name} ${student.last_name}`;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.push('EditStudent', { studentId })}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* PROFILE HERO */}
      <View style={styles.hero}>
        <Avatar initials={initials} uri={student.photo_uri} size={96} />
        <Text style={styles.name}>{displayName}</Text>
        {student.nickname && (
          <Text style={styles.realName}>{student.first_name} {student.last_name}</Text>
        )}
        {student.is_archived && (
          <Badge value="Archived" color={Colors.warning} style={{ marginTop: 8 }} />
        )}
      </View>

      {/* POINTS SUMMARY */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <PointsSummaryCard balance={balance} breakdown={breakdown ?? undefined} />
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.quickActions}>
        {[
          { label: 'Award Points', icon: '⭐', onPress: () => navigation.push('AwardPoints', { studentId, studentName: student.first_name }) },
          { label: 'Full Ledger',  icon: '📊', onPress: () => navigation.push('PointsLedger', { studentId, studentName: displayName }) },
        ].map((a) => (
          <TouchableOpacity key={a.label} style={styles.quickBtn} onPress={a.onPress} activeOpacity={0.7}>
            <AppCard style={{ alignItems: 'center' }} padding={14}>
              <Text style={styles.quickIcon}>{a.icon}</Text>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </AppCard>
          </TouchableOpacity>
        ))}
      </View>

      {/* ATTENDANCE */}
      {attendance && (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <AppCard>
            <Text style={styles.cardTitle}>Attendance Overview</Text>
            <View style={styles.attRow}>
              {[
                { label: 'Present', value: attendance.present_count, color: Colors.accent },
                { label: 'Absent',  value: attendance.absent_count,  color: Colors.danger },
                { label: 'Rate',    value: `${attendance.attendance_percentage}%`, color: Colors.primary },
                { label: 'Streak',  value: `${attendance.streak}🔥`,  color: Colors.warning },
              ].map((stat) => (
                <View key={stat.label} style={styles.attStat}>
                  <Text style={[styles.attValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.attLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </AppCard>
        </View>
      )}

      {/* RECENT TRANSACTIONS */}
      <SectionHeader title="Recent Transactions"
        onSeeAll={() => navigation.push('PointsLedger', { studentId, studentName: displayName })} />
      <AppCard style={{ marginHorizontal: 16 }} padding={0}>
        {recentTx.length === 0 ? (
          <Text style={styles.noTx}>No transactions yet</Text>
        ) : (
          recentTx.map((tx) => <TransactionItem key={tx.id} tx={tx} />)
        )}
      </AppCard>

      {/* DANGER ZONE */}
      {!student.is_archived && (
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <PrimaryButton label="Archive Student" variant="danger"
            onPress={() => navigation.push('ArchiveStudent', { studentId, studentName: `${student.first_name} ${student.last_name}` })} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 4 },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: Colors.primary, fontWeight: Typography.bold },
  editIcon: { fontSize: 22 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  name: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.dark, marginTop: 12 },
  realName: { fontSize: Typography.sm, color: Colors.light, marginTop: 4 },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  quickBtn: { flex: 1 },
  quickIcon: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontSize: Typography.xs, fontWeight: Typography.medium, color: Colors.dark },
  cardTitle: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.dark, marginBottom: 16 },
  attRow: { flexDirection: 'row', justifyContent: 'space-between' },
  attStat: { alignItems: 'center', flex: 1 },
  attValue: { fontSize: Typography.xl, fontWeight: Typography.bold },
  attLabel: { fontSize: Typography.xs, color: Colors.light, marginTop: 4 },
  noTx: { padding: 20, textAlign: 'center', color: Colors.light, fontSize: Typography.sm },
});
