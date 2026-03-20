import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SectionList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Platform, ActionSheetIOS,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StudentsStackParamList, Student, Ministry } from '../../types';
import { StudentRow } from '../../components/molecules/StudentRow';
import { MinistrySelector } from '../../components/molecules/MinistrySelector';
import { SearchBar } from '../../components/atoms/SearchBar';
import { EmptyState } from '../../components/atoms/EmptyState';
import { FAB } from '../../components/organisms/FAB';
import { Snackbar } from '../../components/organisms/Snackbar';
import { studentService } from '../../services/StudentService';
import { ministryService } from '../../services/MinistryService';
import { Colors, Typography } from '../../constants';

type Nav = NativeStackNavigationProp<StudentsStackParamList, 'StudentList'>;

const ALL_MINISTRY_ID = 0;

export function StudentListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [students, setStudents] = useState<Student[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [search, setSearch] = useState('');
  const [ministryId, setMinistryId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const load = useCallback(async () => {
    const [s, m] = await Promise.all([
      studentService.getAll({
        searchQuery: search,
        ministryId: ministryId ?? undefined,
        includeArchived: showArchived,
      }),
      ministryService.getAll(),
    ]);
    setStudents(s);
    setMinistries(m);
  }, [search, ministryId, showArchived]);

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleLongPress = (student: Student) => {
    const options = ['View Profile', 'Award Points', 'Archive Student', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3, destructiveButtonIndex: 2 },
        (idx) => handleAction(idx, student)
      );
    } else {
      Alert.alert(`${student.first_name} ${student.last_name}`, 'Select action', [
        { text: 'View Profile', onPress: () => navigation.push('StudentDetail', { studentId: student.id }) },
        { text: 'Award Points', onPress: () => navigation.push('AwardPoints', { studentId: student.id, studentName: student.first_name }) },
        { text: 'Archive', style: 'destructive', onPress: () => navigation.push('ArchiveStudent', { studentId: student.id, studentName: `${student.first_name} ${student.last_name}` }) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleAction = (idx: number, student: Student) => {
    if (idx === 0) navigation.push('StudentDetail', { studentId: student.id });
    if (idx === 1) navigation.push('AwardPoints', { studentId: student.id, studentName: student.first_name });
    if (idx === 2) navigation.push('ArchiveStudent', { studentId: student.id, studentName: `${student.first_name} ${student.last_name}` });
  };

  // Group by first letter of last name
  const grouped: { title: string; data: Student[] }[] = [];
  const letterMap: Record<string, Student[]> = {};
  for (const s of students) {
    const letter = s.last_name[0]?.toUpperCase() ?? '#';
    if (!letterMap[letter]) letterMap[letter] = [];
    letterMap[letter].push(s);
  }
  for (const letter of Object.keys(letterMap).sort()) {
    grouped.push({ title: letter, data: letterMap[letter] });
  }

  const allMinistries: Ministry[] = [
    {
      id: ALL_MINISTRY_ID,
      name: 'All',
      student_count: students.length,
      uuid: '', description: null, active_days: [],
      points_config: { saturday: 20 as const, sunday: 50 as const },
      is_archived: false, created_at: '', updated_at: '',
    },
    ...ministries,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* ── NAVY HEADER ── */}
      <LinearGradient
        colors={Colors.gradientNavy as [string, string]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Students</Text>
            <Text style={styles.headerSub}>
              {students.length} student{students.length !== 1 ? 's' : ''}
              {showArchived ? ' (incl. archived)' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowArchived((v) => !v)}
            style={[styles.archiveBtn, showArchived && styles.archiveBtnActive]}
          >
            <Text style={styles.archiveBtnText}>
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH inside header */}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search students..."
          transparent
        />
      </LinearGradient>

      {/* ── MINISTRY FILTER ── */}
      <View style={styles.selectorWrap}>
        <MinistrySelector
          ministries={allMinistries}
          selectedId={ministryId ?? ALL_MINISTRY_ID}
          onChange={(id) => setMinistryId(id === ALL_MINISTRY_ID ? null : id)}
        />
      </View>

      {/* ── STUDENT LIST ── */}
      <SectionList
        sections={grouped}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{title}</Text>
          </View>
        )}
        renderItem={({ item }: { item: Student }) => (
          <StudentRow
            student={item}
            onPress={() => navigation.push('StudentDetail', { studentId: item.id })}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title={
              search ? 'No students found' :
              showArchived ? 'No archived students' :
              'No students yet'
            }
            subtitle={
              search
                ? 'Try a different name'
                : 'Tap the + button to add your first student'
            }
            action={
              !search
                ? { label: 'Add Student', onPress: () => navigation.push('AddStudent') }
                : undefined
            }
          />
        }
      />

      <FAB onPress={() => navigation.push('AddStudent')} />

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type="success"
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { fontSize: Typography.xxl, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  archiveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: 4,
  },
  archiveBtnActive: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  archiveBtnText: {
    fontSize: Typography.xs,
    color: Colors.white,
    fontWeight: '600',
  },

  selectorWrap: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionHeader: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});