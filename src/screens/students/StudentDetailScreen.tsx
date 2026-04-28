import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Student, AttendanceSummary, PointBreakdown } from '../../types';
import { StudentsStackParamList } from '../../navigation/navigation.types';
import { Avatar } from '../../components/ui/Avatar';
import { AppCard } from '../../components/ui/AppCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { PointsSummaryCard } from '../../components/domain/PointsSummaryCard';
import { TransactionItem } from '../../components/domain/TransactionItem';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Snackbar } from '../../components/ui/Snackbar';
import { studentService } from '../../services/StudentService';
import { transactionService } from '../../services/TransactionService';
import { Colors, Typography, Layout } from '../../constants';

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

  // Restore confirmation
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [snackbar, setSnackbar] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error',
  });

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

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await studentService.restore(studentId);
      setSnackbar({
        visible: true,
        message: `${student?.first_name} has been restored to active students!`,
        type: 'success',
      });
      await load(); // Refresh to show non-archived state
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message ?? 'Restore failed', type: 'error' });
    } finally {
      setRestoring(false);
      setShowRestoreConfirm(false);
    }
  };

  if (!student) return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;

  const initials = (student.first_name[0] + (student.last_name[0] ?? '')).toUpperCase();
  const displayName = student.nickname || `${student.first_name} ${student.last_name}`;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── NAVY HERO ── */}
        <LinearGradient
          colors={Colors.gradientNavy as [string, string]}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.heroHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            {!student.is_archived && (
              <TouchableOpacity
                onPress={() => navigation.push('EditStudent', { studentId })}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.heroBody}>
            <Avatar
              initials={initials}
              uri={student.photo_uri}
              size={Layout.avatarXl}
              style={styles.avatar}
            />
            <Text style={styles.heroName}>{displayName}</Text>
            {student.nickname && (
              <Text style={styles.heroRealName}>
                {student.first_name} {student.last_name}
              </Text>
            )}
            {student.is_archived && (
              <View style={styles.archivedPill}>
                <Text style={styles.archivedText}>📦 Archived</Text>
              </View>
            )}
          </View>

          {/* Stats strip */}
          <View style={styles.statsStrip}>
            {[
              { label: 'Points',   value: balance.toLocaleString() },
              { label: 'Present',  value: String(attendance?.present_count ?? 0) },
              { label: 'Rate',     value: `${attendance?.attendance_percentage ?? 0}%` },
              { label: 'Streak',   value: `${attendance?.streak ?? 0}🔥` },
            ].map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <View style={styles.statsDivider} />}
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        {/* ── RESTORE BANNER (archived only) ── */}
        {student.is_archived && (
          <View style={styles.restoreBanner}>
            <View style={styles.restoreInfo}>
              <Text style={styles.restoreTitle}>This student is archived</Text>
              <Text style={styles.restoreSub}>
                {student.archived_reason
                  ? `Reason: ${student.archived_reason}`
                  : 'Tap Restore to reactivate them'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={() => setShowRestoreConfirm(true)}
            >
              <Text style={styles.restoreBtnText}>Restore</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── QUICK ACTIONS (active only) ── */}
        {!student.is_archived && (
          <View style={styles.quickRow}>
            {[
              {
                label: 'Award Points', icon: '⭐',
                onPress: () => navigation.push('AwardPoints', {
                  studentId, studentName: student.first_name,
                }),
              },
              {
                label: 'Full Ledger', icon: '📊',
                onPress: () => navigation.push('PointsLedger', {
                  studentId, studentName: displayName,
                }),
              },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.quickBtn}
                onPress={a.onPress}
                activeOpacity={0.7}
              >
                <AppCard style={styles.quickCard} elevated>
                  <Text style={styles.quickIcon}>{a.icon}</Text>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </AppCard>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── POINTS BREAKDOWN ── */}
        {breakdown && (
          <View style={styles.section}>
            <AppCard elevated>
              <Text style={styles.cardTitle}>Points Breakdown</Text>
              <View style={styles.breakdownRow}>
                {[
                  { label: 'Attendance', value: breakdown.attendance,        icon: '📅', color: Colors.txAttendance },
                  { label: 'Activity',   value: breakdown.activity,          icon: '⭐', color: Colors.txActivity },
                  { label: 'Market',     value: breakdown.market_deductions, icon: '🛒', color: Colors.txMarket },
                ].map((item) => (
                  <View key={item.label} style={styles.breakdownItem}>
                    <View style={[styles.breakdownIconBox, { backgroundColor: item.color + '18' }]}>
                      <Text style={styles.breakdownEmoji}>{item.icon}</Text>
                    </View>
                    <Text style={[styles.breakdownNum, { color: item.color }]}>
                      {item.value >= 0 ? '+' : ''}{item.value}
                    </Text>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </AppCard>
          </View>
        )}

        {/* ── ATTENDANCE OVERVIEW ── */}
        {attendance && (
          <View style={styles.section}>
            <AppCard elevated>
              <Text style={styles.cardTitle}>Attendance Overview</Text>
              <View style={styles.attRow}>
                {[
                  { label: 'Present', value: attendance.present_count,        color: Colors.accent },
                  { label: 'Absent',  value: attendance.absent_count,         color: Colors.danger },
                  { label: 'Rate',    value: `${attendance.attendance_percentage}%`, color: Colors.primary },
                  { label: 'Streak',  value: `${attendance.streak}🔥`,        color: Colors.warning },
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

        {/* ── RECENT TRANSACTIONS ── */}
        <SectionHeader
          title="Recent Transactions"
          onSeeAll={() => navigation.push('PointsLedger', { studentId, studentName: displayName })}
        />
        <AppCard style={{ marginHorizontal: 16 }} noPadding>
          {recentTx.length === 0 ? (
            <Text style={styles.noTx}>No transactions yet</Text>
          ) : (
            recentTx.map((tx) => <TransactionItem key={tx.id} tx={tx} />)
          )}
        </AppCard>

        {/* ── DANGER ZONE ── */}
        <View style={styles.section}>
          {!student.is_archived ? (
            <>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <PrimaryButton
                label="Archive Student"
                variant="danger"
                onPress={() => navigation.push('ArchiveStudent', {
                  studentId,
                  studentName: `${student.first_name} ${student.last_name}`,
                })}
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.dangerHint}>
                Archiving hides the student but preserves all their data.
                They can be restored at any time.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <PrimaryButton
                label="Permanently Delete"
                variant="danger"
                onPress={() => navigation.push('ArchiveStudent', {
                  studentId,
                  studentName: `${student.first_name} ${student.last_name}`,
                })}
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.dangerHint}>
                Permanently deletes all data for this student. Cannot be undone.
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── RESTORE CONFIRMATION ── */}
      <ConfirmationDialog
        visible={showRestoreConfirm}
        title="Restore Student?"
        message={`Restore ${displayName} to the active students list?\n\nAll their attendance history and points are already preserved — nothing will change except their archived status.`}
        confirmLabel="Restore"
        cancelLabel="Cancel"
        onConfirm={handleRestore}
        onCancel={() => setShowRestoreConfirm(false)}
        loading={restoring}
      />

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 16, paddingBottom: 20 },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 30, color: Colors.white, fontWeight: '300', lineHeight: 34 },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  editBtnText: { color: Colors.white, fontSize: Typography.sm, fontWeight: '600' },
  heroBody: { alignItems: 'center', marginBottom: 20 },
  avatar: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  heroName: { fontSize: Typography.xxl, fontWeight: '800', color: Colors.white },
  heroRealName: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  archivedPill: {
    marginTop: 8,
    backgroundColor: Colors.warningLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  archivedText: { fontSize: Typography.sm, color: Colors.warning, fontWeight: '700' },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: Typography.lg, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '500' },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Restore banner
  restoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  restoreInfo: { flex: 1 },
  restoreTitle: { fontSize: Typography.sm, fontWeight: '700', color: '#92400E' },
  restoreSub: { fontSize: Typography.xs, color: '#78350F', marginTop: 2 },
  restoreBtn: {
    backgroundColor: Colors.warning,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  restoreBtnText: { color: Colors.white, fontSize: Typography.sm, fontWeight: '700' },

  // Quick actions
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 16,
  },
  quickBtn: { flex: 1 },
  quickCard: { alignItems: 'center', paddingVertical: 16 },
  quickIcon: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.dark },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  cardTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 14,
  },

  // Breakdown
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownItem: { alignItems: 'center', flex: 1 },
  breakdownIconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  breakdownEmoji: { fontSize: 18 },
  breakdownNum: { fontSize: Typography.md, fontWeight: '800', marginBottom: 2 },
  breakdownLabel: { fontSize: Typography.xs, color: Colors.muted },

  // Attendance
  attRow: { flexDirection: 'row', justifyContent: 'space-between' },
  attStat: { alignItems: 'center', flex: 1 },
  attValue: { fontSize: Typography.xl, fontWeight: '800' },
  attLabel: { fontSize: Typography.xs, color: Colors.muted, marginTop: 4 },

  noTx: { padding: 20, textAlign: 'center', color: Colors.muted, fontSize: Typography.sm },

  // Danger zone
  dangerTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.danger,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dangerHint: {
    fontSize: Typography.xs,
    color: Colors.muted,
    lineHeight: 18,
  },
});
