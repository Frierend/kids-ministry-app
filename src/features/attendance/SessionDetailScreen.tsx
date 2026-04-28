import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SessionStudent } from '../../types';
import { AttendanceStackParamList } from '../../navigation/navigation.types';
import { AttendanceCheckbox } from '../../components/domain/AttendanceCheckbox';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Snackbar } from '../../components/ui/Snackbar';
import { attendanceService } from './attendance.service';
import { getDatabase } from '../../database/client';
import { Colors, Typography, Layout, Radius } from '../../constants';
import { format } from 'date-fns';

type Props = NativeStackScreenProps<AttendanceStackParamList, 'SessionDetail'>;

export function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId, ministryName, sessionDate } = route.params;
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<SessionStudent[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    visible: boolean; message: string; type: 'success' | 'error';
  }>({ visible: false, message: '', type: 'success' });
  const [isCommitted, setIsCommitted] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);

  const load = useCallback(async () => {
    const db = await getDatabase();
    const [sessionStudents, session] = await Promise.all([
      attendanceService.getSessionStudents(sessionId),
      db.getFirstAsync<{ points_awarded: number; status: string }>(
        'SELECT points_awarded, status FROM attendance_sessions WHERE id = ?',
        [sessionId]
      ),
    ]);
    setStudents(sessionStudents);
    if (session) {
      setSessionPoints(session.points_awarded);
      setIsCommitted(session.status === 'committed');
    }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (studentId: number, present: boolean) => {
    setStudents((prev) =>
      prev.map((s) => s.id === studentId ? { ...s, is_present: present } : s)
    );
    if (present) {
      await attendanceService.markPresent(sessionId, studentId);
    } else {
      await attendanceService.markAbsent(sessionId, studentId);
    }
  };

  const handleMarkAll = async (present: boolean) => {
    const records = students.map((s) => ({ student_id: s.id, is_present: present }));
    setStudents((prev) => prev.map((s) => ({ ...s, is_present: present })));
    await attendanceService.markBulk(sessionId, records);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await attendanceService.commitSession(sessionId);
      setIsCommitted(true);
      navigation.replace('SessionSummary', { result });
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message ?? 'Save failed', type: 'error' });
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  const presentCount = students.filter((s) => s.is_present).length;
  const absentCount = students.length - presentCount;
  const filteredStudents = search.trim()
    ? students.filter((s) =>
        `${s.first_name} ${s.last_name} ${s.nickname ?? ''}`
          .toLowerCase().includes(search.toLowerCase())
      )
    : students;

  const dateLabel = (() => {
    try { return format(new Date(sessionDate + 'T00:00:00'), 'EEE, MMM d, yyyy'); }
    catch { return sessionDate; }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>

      {/* ── NAVY HEADER ── */}
      <LinearGradient
        colors={Colors.gradientNavy as [string, string]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{ministryName}</Text>
            <Text style={styles.headerSub}>{dateLabel}</Text>
          </View>
          {!isCommitted ? (
            <PrimaryButton
              label="Save"
              onPress={() => setShowConfirm(true)}
              size="sm"
              disabled={students.length === 0}
              fullWidth={false}
              style={{ paddingHorizontal: 20 }}
            />
          ) : (
            <View style={styles.savedBadge}>
              <Text style={styles.savedText}>Saved</Text>
            </View>
          )}
        </View>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{presentCount}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#FCA5A5' }]}>{absentCount}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{students.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          {sessionPoints > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#86EFAC' }]}>+{sessionPoints}</Text>
                <Text style={styles.statLabel}>pts each</Text>
              </View>
            </>
          )}
        </View>
      </LinearGradient>

      {/* ── SEARCH ── */}
      {students.length > 0 && (
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search students..."
            placeholderTextColor={Colors.muted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── STUDENT LIST ── */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => String(item.id)}
        getItemLayout={(_, index) => ({
          length: Layout.rowHeight,
          offset: Layout.rowHeight * index,
          index,
        })}
        renderItem={({ item }) => (
          <AttendanceCheckbox
            student={item}
            onToggle={handleToggle}
            disabled={isCommitted}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>
              {search.trim() ? 'No students match search' : 'No students enrolled'}
            </Text>
            <Text style={styles.emptySub}>
              {!search.trim()
                ? 'Go to Students, tap a student, then Edit to enroll them in this ministry'
                : 'Try a different name'}
            </Text>
          </View>
        }
        contentContainerStyle={students.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
      />

      {/* ── BULK ACTIONS ── */}
      {!isCommitted && students.length > 0 && (
        <View style={[styles.bulkBar, { paddingBottom: insets.bottom + 8 }]}>
          <PrimaryButton
            label="Mark All Present"
            onPress={() => handleMarkAll(true)}
            variant="outline"
            size="sm"
            style={{ flex: 1 }}
          />
          <PrimaryButton
            label="Clear All"
            onPress={() => handleMarkAll(false)}
            variant="ghost"
            size="sm"
            style={{ flex: 1 }}
          />
        </View>
      )}

      <ConfirmationDialog
        visible={showConfirm}
        title="Save Attendance?"
        message={`Award +${sessionPoints} pts to ${presentCount} present student${presentCount !== 1 ? 's' : ''}?\n${absentCount} student${absentCount !== 1 ? 's' : ''} will be marked absent.`}
        confirmLabel="Save & Award Points"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
        loading={saving}
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
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 30, color: Colors.white, fontWeight: '300', lineHeight: 34 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.white },
  headerSub: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  savedBadge: {
    backgroundColor: Colors.accentLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  savedText: { fontSize: Typography.sm, color: Colors.accent, fontWeight: '700' },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: Typography.xl, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: Typography.md,
    color: Colors.dark,
    height: 36,
  },
  clearBtn: { fontSize: 16, color: Colors.muted, padding: 4 },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: Typography.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Bulk actions
  bulkBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
