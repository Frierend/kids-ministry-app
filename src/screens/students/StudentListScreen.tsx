// src/screens/students/StudentListScreen.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet,
} from 'react-native';
import { ScreenWrapper, StackHeader, FAB } from '../../components/navigation/ScreenWrapper';
import { StudentRow } from '../../components/domain';
import { SkeletonRow, EmptyState, SectionHeader } from '../../components/atomic';
import { Colors, Typography, Spacing, Radius, Layout } from '../../theme';
import { useStudents } from '../../hooks/useStudents';
import type { StudentsStackParamList } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<StudentsStackParamList, 'StudentList'>;
}

export default function StudentListScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const { data: students = [], isLoading } = useStudents(showArchived);

  const filtered = useMemo(() => {
    if (!query) return students;
    const q = query.toLowerCase();
    return students.filter(s =>
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q)
    );
  }, [students, query]);

  const renderItem = useCallback(({ item }: any) => (
    <StudentRow
      student={item}
      onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })}
    />
  ), [navigation]);

  return (
    <ScreenWrapper>
      <StackHeader
        title="Students"
        subtitle={`${students.length} enrolled`}
        rightAction={{
          icon: <Text style={{ fontSize: 18 }}>{showArchived ? '👁' : '👁‍🗨'}</Text>,
          onPress: () => setShowArchived(v => !v),
        }}
      />

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search students…"
            placeholderTextColor={Colors.textTertiary}
            style={[Typography.body, styles.searchInput]}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Text
              onPress={() => setQuery('')}
              style={styles.clearBtn}
            >✕</Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <>{[0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}</>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({
            length: Layout.studentRowHeight,
            offset: Layout.studentRowHeight * index,
            index,
          })}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={<Text style={{ fontSize: 40 }}>👦</Text>}
              title={query ? 'No results' : 'No students yet'}
              message={query ? `No students match "${query}"` : 'Tap + to add your first student.'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        onPress={() => navigation.navigate('StudentAdd')}
        label="Add Student"
        icon="+"
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchRow: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md, height: 44,
    gap: Spacing.xs,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.textPrimary },
  clearBtn: { color: Colors.textTertiary, fontSize: 16, padding: 4 },
  list: { paddingBottom: 100 },
});
