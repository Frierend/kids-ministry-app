import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity, RefreshControl, ActionSheetIOS, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
import { Colors, Typography, Spacing } from '../../constants';

type Nav = NativeStackNavigationProp<StudentsStackParamList, 'StudentList'>;

export function StudentListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [students, setStudents] = useState<Student[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [search, setSearch] = useState('');
  const [ministryId, setMinistryId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  const load = useCallback(async () => {
    const [s, m] = await Promise.all([
      studentService.getAll({ searchQuery: search, ministryId: ministryId ?? undefined, includeArchived: showArchived }),
      ministryService.getAll(),
    ]);
    setStudents(s);
    setMinistries(m);
  }, [search, ministryId, showArchived]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleLongPress = (student: Student) => {
    const options = ['View Profile', 'Award Points', 'Archive Student', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3, destructiveButtonIndex: 2 },
        (idx) => handleAction(idx, student)
      );
    } else {
      Alert.alert(student.first_name + ' ' + student.last_name, 'Select action', [
        { text: 'View Profile', onPress: () => navigation.push('StudentDetail', { studentId: student.id }) },
        { text: 'Award Points', onPress: () => navigation.push('AwardPoints', { studentId: student.id, studentName: student.first_name }) },
        { text: 'Archive', style: 'destructive', onPress: () => navigation.push('ArchiveStudent', { studentId: student.id, studentName: student.first_name + ' ' + student.last_name }) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleAction = (idx: number, student: Student) => {
    if (idx === 0) navigation.push('StudentDetail', { studentId: student.id });
    if (idx === 1) navigation.push('AwardPoints', { studentId: student.id, studentName: student.first_name });
    if (idx === 2) navigation.push('ArchiveStudent', { studentId: student.id, studentName: student.first_name + ' ' + student.last_name });
  };

  // Group by first letter
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

  // All ministries + "All" option
  const allMinistries = [{ id: null as any, name: 'All', student_count: students.length, uuid: '', description: null, active_days: [], points_config: { saturday: 20 as const, sunday: 50 as const }, is_archived: false, created_at: '', updated_at: '' }, ...ministries];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Students</Text>
        <TouchableOpacity onPress={() => setShowArchived((v) => !v)}>
          <Text style={[styles.archiveToggle, showArchived && styles.archiveToggleActive]}>
            {showArchived ? '🗃 Archived' : '🗃'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchRow}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {/* MINISTRY FILTER */}
      <MinistrySelector ministries={allMinistries} selectedId={ministryId} onChange={(id) => setMinistryId(id === null ? null : id)} />

      {/* STUDENT LIST */}
      <SectionList
        sections={grouped}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{title}</Text></View>
        )}
        renderItem={({ item }) => (
          <StudentRow
            student={item}
            onPress={() => navigation.push('StudentDetail', { studentId: item.id })}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState icon="👥" title="No students found"
            subtitle={search ? 'Try a different search term' : 'Add your first student with the + button'}
            action={{ label: 'Add Student', onPress: () => navigation.push('AddStudent') }} />
        }
      />

      <FAB onPress={() => navigation.push('AddStudent')} />

      <Snackbar visible={snackbar.visible} message={snackbar.message} type="success"
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.dark },
  archiveToggle: { fontSize: 20, color: Colors.light },
  archiveToggleActive: { color: Colors.primary },
  searchRow: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.white },
  sectionHeader: { backgroundColor: Colors.bg, paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.light, textTransform: 'uppercase', letterSpacing: 1 },
});
