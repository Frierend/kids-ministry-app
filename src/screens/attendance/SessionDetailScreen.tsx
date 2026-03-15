import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AttendanceStackParamList, SessionStudent } from '../../types';
import { AttendanceCheckbox } from '../../components/molecules/AttendanceCheckbox';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { ConfirmationDialog } from '../../components/organisms/ConfirmationDialog';
import { Snackbar } from '../../components/organisms/Snackbar';
import { attendanceService } from '../../services/AttendanceService';
import { Colors, Typography, Layout, Spacing } from '../../constants';

type Props = NativeStackScreenProps<AttendanceStackParamList, 'SessionDetail'>;

export function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId, ministryName, sessionDate } = route.params;
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<SessionStudent[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
  const [isCommitted, setIsCommitted] = useState(false);

  const load = useCallback(async () => {
    const s = await attendanceService.getSessionStudents(sessionId);
    setStudents(s);
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (studentId: number, present: boolean) => {
    // Optimistic update
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
  const filteredStudents = search.trim()
    ? students.filter((s) =>
        `${s.first_name} ${s.last_name} ${s.nickname ?? ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{ministryName}</Text>
          <Text style={styles.headerSub}>{sessionDate}</Text>
        </View>
        {!isCommitted && (
          <PrimaryButton label="Save" onPress={() => setShowConfirm(true)}
            size="sm" style={{ paddingHorizontal: 20 }} />
        )}
      </View>

      {/* STATS BAR */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>Present: <Text style={styles.statsNum}>{presentCount}</Text> / {students.length}</Text>
        <Text style={styles.statsText}>{students.length - presentCount} absent</Text>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Search students..." placeholderTextColor={Colors.light} />
      </View>

      {/* STUDENT LIST */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => String(item.id)}
        getItemLayout={(_, index) => ({ length: Layout.rowHeight, offset: Layout.rowHeight * index, index })}
        renderItem={({ item }) => (
          <AttendanceCheckbox student={item} onToggle={handleToggle} disabled={isCommitted} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>No students found</Text></View>
        }
      />

      {/* BULK ACTIONS */}
      {!isCommitted && (
        <View style={[styles.bulkBar, { paddingBottom: insets.bottom + 8 }]}>
          <PrimaryButton label="Mark All Present" onPress={() => handleMarkAll(true)}
            variant="outline" size="sm" style={{ flex: 1 }} />
          <PrimaryButton label="Clear All" onPress={() => handleMarkAll(false)}
            variant="ghost" size="sm" style={{ flex: 1 }} />
        </View>
      )}

      <ConfirmationDialog
        visible={showConfirm}
        title="Save Attendance?"
        message={`Award points to ${presentCount} present students?\n${students.length - presentCount} students will be marked absent.`}
        confirmLabel="Save & Award Points"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
        loading={saving}
      />

      <Snackbar visible={snackbar.visible} message={snackbar.message} type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: Colors.primary, fontWeight: Typography.bold },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.dark },
  headerSub: { fontSize: Typography.xs, color: Colors.light },
  statsBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.primaryLight },
  statsText: { fontSize: Typography.sm, color: Colors.mid },
  statsNum: { fontWeight: Typography.bold, color: Colors.primary },
  searchBox: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { backgroundColor: Colors.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: Typography.md, color: Colors.dark },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.light, fontSize: Typography.md },
  bulkBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
});
