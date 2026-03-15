import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MarketStackParamList, MarketItem, Student } from '../../types';
import { AppCard } from '../../components/atoms/AppCard';
import { MarketItemCard } from '../../components/organisms/MarketItemCard';
import { EmptyState } from '../../components/atoms/EmptyState';
import { marketService } from '../../services/MarketService';
import { studentService } from '../../services/StudentService';
import { transactionService } from '../../services/TransactionService';
import { Colors, Typography } from '../../constants';

type Nav = NativeStackNavigationProp<MarketStackParamList, 'MarketHome'>;

export function MarketHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [mItems, allStudents] = await Promise.all([
      marketService.getAll(),
      studentService.getAll({ includeArchived: false }),
    ]);
    setItems(mItems);
    setStudents(allStudents);
  }, []);

  const loadBalance = useCallback(async (id: number) => {
    const b = await transactionService.getBalance(id);
    setBalance(b);
  }, []);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (selectedStudentId) loadBalance(selectedStudentId);
    else setBalance(0);
  }, [selectedStudentId]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const filteredStudents = search.trim()
    ? students.filter((s) => `${s.first_name} ${s.last_name} ${s.nickname ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    : students;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>🛒 Market Day</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ManageItems')}>
          <Text style={styles.manageIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* STUDENT SELECTOR */}
      <TouchableOpacity style={styles.studentSelector}
        onPress={() => setShowStudentPicker((v) => !v)}>
        {selectedStudent ? (
          <View style={styles.selectedStudentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedName}>
                {selectedStudent.nickname || `${selectedStudent.first_name} ${selectedStudent.last_name}`}
              </Text>
              <Text style={styles.balanceText}>Balance: <Text style={styles.balanceNum}>{balance} pts</Text></Text>
            </View>
            <Text style={{ color: Colors.light, fontSize: 20 }}>▾</Text>
          </View>
        ) : (
          <Text style={styles.selectPrompt}>Tap to select a student ▾</Text>
        )}
      </TouchableOpacity>

      {/* STUDENT DROPDOWN */}
      {showStudentPicker && (
        <AppCard style={styles.dropdown} padding={0} elevated>
          <View style={styles.dropdownSearch}>
            <TextInput style={styles.dropdownInput} value={search} onChangeText={setSearch}
              placeholder="Search student..." placeholderTextColor={Colors.light} autoFocus />
          </View>
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => String(item.id)}
            style={{ maxHeight: 200 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.dropdownItem} onPress={() => {
                setSelectedStudentId(item.id);
                setShowStudentPicker(false);
                setSearch('');
              }}>
                <Text style={styles.dropdownName}>
                  {item.nickname || `${item.first_name} ${item.last_name}`}
                </Text>
              </TouchableOpacity>
            )}
          />
        </AppCard>
      )}

      {/* ITEMS GRID */}
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
                  if (!selectedStudentId) return;
                  navigation.navigate('RedeemConfirm', { studentId: selectedStudentId, itemId: item.id });
                }}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="🛒" title="No items available"
              subtitle="Add items in Manage Items"
              action={{ label: 'Manage Items', onPress: () => navigation.navigate('ManageItems') }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 22, fontWeight: '700', color: Colors.dark },
  manageIcon: { fontSize: 22 },
  studentSelector: { margin: 16, backgroundColor: Colors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  selectedStudentRow: { flexDirection: 'row', alignItems: 'center' },
  selectedName: { fontSize: 16, fontWeight: '600', color: Colors.dark },
  balanceText: { fontSize: 13, color: Colors.mid, marginTop: 2 },
  balanceNum: { fontWeight: '700', color: Colors.accent },
  selectPrompt: { color: Colors.light, fontSize: 15, textAlign: 'center' },
  dropdown: { position: 'absolute', top: 180, left: 16, right: 16, zIndex: 100 },
  dropdownSearch: { padding: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropdownInput: { height: 40, backgroundColor: Colors.bg, borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: Colors.dark },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropdownName: { fontSize: 15, color: Colors.dark },
  grid: { padding: 12, paddingBottom: 40 },
  gridItem: { flex: 1, margin: 4 },
});
