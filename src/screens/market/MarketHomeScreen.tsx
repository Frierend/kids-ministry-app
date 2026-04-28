import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MarketStackParamList, MarketItem, Student } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { Avatar } from '../../components/ui/Avatar';
import { MarketItemCard } from '../../components/domain/MarketItemCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { marketService } from '../../services/MarketService';
import { studentService } from '../../services/StudentService';
import { transactionService } from '../../services/TransactionService';
import { Colors, Typography, Layout, Radius } from '../../constants';

type Nav = NativeStackNavigationProp<MarketStackParamList, 'MarketHome'>;

export function MarketHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();

  const [items, setItems] = useState<MarketItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ── LOAD ALL DATA ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    const [mItems, allStudents] = await Promise.all([
      marketService.getAll(),
      studentService.getAll({ includeArchived: false }),
    ]);
    setItems(mItems);
    setStudents(allStudents);
  }, []);

  // ── RELOAD BALANCE for selected student ────────────────────────────────────
  const reloadBalance = useCallback(async (id: number) => {
    const b = await transactionService.getBalance(id);
    setBalance(b);
  }, []);

  // Reload everything whenever screen comes into focus
  useEffect(() => {
    if (isFocused) {
      loadAll();
      // Re-fetch balance for currently selected student too
      if (selectedStudentId) reloadBalance(selectedStudentId);
    }
  }, [isFocused]);

  // Reload balance whenever selection changes
  useEffect(() => {
    if (selectedStudentId) {
      reloadBalance(selectedStudentId);
    } else {
      setBalance(0);
    }
  }, [selectedStudentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    if (selectedStudentId) await reloadBalance(selectedStudentId);
    setRefreshing(false);
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const filteredStudents = search.trim()
    ? students.filter((s) =>
        `${s.first_name} ${s.last_name} ${s.nickname ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : students;

  const studentDisplayName = (s: Student) =>
    s.nickname ? `${s.nickname} (${s.first_name} ${s.last_name})` : `${s.first_name} ${s.last_name}`;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>

      {/* ── NAVY HEADER ── */}
      <LinearGradient
        colors={Colors.gradientNavy as [string, string]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>🛒 Market Day</Text>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => navigation.navigate('ManageItems')}
          >
            <Text style={styles.manageBtnText}>⚙️ Manage</Text>
          </TouchableOpacity>
        </View>

        {/* ── STUDENT SELECTOR ── */}
        <TouchableOpacity
          style={styles.studentSelector}
          onPress={() => setShowStudentPicker((v) => !v)}
          activeOpacity={0.8}
        >
          {selectedStudent ? (
            <View style={styles.selectedRow}>
              <Avatar
                initials={(selectedStudent.first_name[0] + (selectedStudent.last_name[0] || '')).toUpperCase()}
                uri={selectedStudent.photo_uri}
                size={36}
              />
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName}>{studentDisplayName(selectedStudent)}</Text>
                <Text style={styles.selectedBalance}>
                  Balance: <Text style={styles.balanceNum}>{balance} pts</Text>
                </Text>
              </View>
              <Text style={styles.dropdownArrow}>
                {showStudentPicker ? '▲' : '▼'}
              </Text>
            </View>
          ) : (
            <View style={styles.placeholderRow}>
              <Text style={styles.placeholderText}>
                {students.length === 0
                  ? 'No students yet — add students first'
                  : 'Tap to select a student ▼'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* ── STUDENT DROPDOWN ── */}
      {showStudentPicker && (
        <AppCard style={{ ...styles.dropdown, top: insets.top + 180 }} noPadding elevated>
          <View style={styles.dropdownSearch}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.dropdownInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or nickname..."
              placeholderTextColor={Colors.muted}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredStudents.length === 0 ? (
            <View style={styles.dropdownEmpty}>
              <Text style={styles.dropdownEmptyText}>
                {students.length === 0
                  ? 'No students added yet.\nGo to Students → Add Student.'
                  : 'No students match your search.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 220 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    item.id === selectedStudentId && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedStudentId(item.id);
                    setShowStudentPicker(false);
                    setSearch('');
                  }}
                >
                  <Avatar
                    initials={(item.first_name[0] + (item.last_name[0] || '')).toUpperCase()}
                    uri={item.photo_uri}
                    size={32}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownName}>{studentDisplayName(item)}</Text>
                  </View>
                  {item.id === selectedStudentId && (
                    <Text style={{ color: Colors.primary, fontWeight: '700' }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </AppCard>
      )}

      {/* ── ITEMS GRID ── */}
      {!showStudentPicker && (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <MarketItemCard
                item={item}
                canAfford={selectedStudentId !== null && balance >= item.point_cost && item.stock !== 0}
                onRedeem={() => {
                  if (!selectedStudentId) {
                    setShowStudentPicker(true);
                    return;
                  }
                  navigation.navigate('RedeemConfirm', {
                    studentId: selectedStudentId,
                    itemId: item.id,
                  });
                }}
              />
            </View>
          )}
          ListHeaderComponent={
            !selectedStudentId ? (
              <View style={styles.noStudentBanner}>
                <Text style={styles.noStudentText}>
                  👆 Select a student above to see their balance and redeem items
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="🛒"
              title="No items available"
              subtitle="Add items in Manage Items"
              action={{ label: 'Manage Items', onPress: () => navigation.navigate('ManageItems') }}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  manageBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  manageBtnText: { fontSize: 12, color: Colors.white, fontWeight: '600' },

  // Student selector
  studentSelector: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 15, fontWeight: '700', color: Colors.white },
  selectedBalance: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  balanceNum: { fontWeight: '800', color: '#86EFAC' },
  dropdownArrow: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  placeholderRow: { alignItems: 'center', paddingVertical: 4 },
  placeholderText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center' },

  // Dropdown
  dropdown: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    elevation: 10,
  },
  dropdownSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  dropdownInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
    height: 36,
  },
  clearBtn: { color: Colors.muted, fontSize: 14, padding: 4 },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  dropdownItemSelected: { backgroundColor: Colors.primaryLight },
  dropdownName: { fontSize: 14, color: Colors.dark, fontWeight: '500' },
  dropdownEmpty: { padding: 20, alignItems: 'center' },
  dropdownEmptyText: { fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 20 },

  // Grid
  noStudentBanner: {
    margin: 16,
    backgroundColor: Colors.bgBlue,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  noStudentText: { fontSize: 13, color: Colors.primary, textAlign: 'center', lineHeight: 20 },
  grid: { padding: 12, paddingBottom: 40 },
  gridItem: { flex: 1, margin: 4 },
});