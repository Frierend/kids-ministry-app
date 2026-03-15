import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MarketStackParamList, MarketItem } from '../../types';
import { AppCard } from '../../components/atoms/AppCard';
import { Badge } from '../../components/atoms/Badge';
import { FAB } from '../../components/organisms/FAB';
import { EmptyState } from '../../components/atoms/EmptyState';
import { marketService } from '../../services/MarketService';
import { Colors, Typography } from '../../constants';

type Nav = NativeStackNavigationProp<MarketStackParamList, 'ManageItems'>;

export function ManageItemsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<MarketItem[]>([]);

  const load = () => marketService.getAll(true).then(setItems);
  useEffect(() => { load(); }, []);

  const toggleActive = async (item: MarketItem) => {
    if (item.is_active) {
      await marketService.deactivate(item.id);
    } else {
      await marketService.activate(item.id);
    }
    load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Items</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <AppCard style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCost}>⭐ {item.point_cost} pts · Stock: {item.stock === -1 ? '∞' : item.stock}</Text>
              </View>
              <Badge value={item.is_active ? 'Active' : 'Inactive'}
                color={item.is_active ? Colors.accent : Colors.light} />
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => navigation.navigate('AddEditItem', { itemId: item.id })}
                style={styles.actionBtn}>
                <Text style={styles.actionText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleActive(item)} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: item.is_active ? Colors.warning : Colors.accent }]}>
                  {item.is_active ? '🔕 Deactivate' : '✓ Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        )}
        ListEmptyComponent={<EmptyState icon="🛒" title="No items yet" subtitle="Add your first market item" />}
      />
      <FAB onPress={() => navigation.navigate('AddEditItem', {})} icon="+" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  back: { fontSize: 28, color: Colors.primary, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '600', color: Colors.dark },
  itemCard: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: Colors.dark, marginBottom: 4 },
  itemCost: { fontSize: 13, color: Colors.light },
  itemActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.bg },
  actionText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
});
