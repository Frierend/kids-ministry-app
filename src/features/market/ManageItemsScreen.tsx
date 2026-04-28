import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MarketItem } from '../../types';
import { MarketStackParamList } from '../../navigation/navigation.types';
import { AppCard } from '../../components/ui/AppCard';
import { Badge } from '../../components/ui/Badge';
import { FAB } from '../../components/ui/FAB';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Snackbar } from '../../components/ui/Snackbar';
import { marketService } from './market.service';
import { Colors, Typography } from '../../constants';

type Nav = NativeStackNavigationProp<MarketStackParamList, 'ManageItems'>;

export function ManageItemsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [items, setItems] = useState<MarketItem[]>([]);

  // Toggle confirm
  const [pendingToggle, setPendingToggle] = useState<MarketItem | null>(null);
  const [toggling, setToggling] = useState(false);

  const [snackbar, setSnackbar] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error',
  });

  const load = useCallback(() => {
    marketService.getAll(true).then(setItems);
  }, []);

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused, load]);

  const handleToggleConfirmed = async () => {
    if (!pendingToggle) return;
    setToggling(true);
    try {
      if (pendingToggle.is_active) {
        await marketService.deactivate(pendingToggle.id);
        setSnackbar({ visible: true, message: `"${pendingToggle.name}" deactivated`, type: 'success' });
      } else {
        await marketService.activate(pendingToggle.id);
        setSnackbar({ visible: true, message: `"${pendingToggle.name}" is now active`, type: 'success' });
      }
      load();
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message ?? 'Failed', type: 'error' });
    } finally {
      setToggling(false);
      setPendingToggle(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient
        colors={Colors.gradientNavy as [string, string]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Manage Items</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <AppCard style={styles.itemCard} elevated>
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  ⭐ {item.point_cost} pts
                  {item.stock !== -1 ? `  ·  ${item.stock} in stock` : '  ·  Unlimited'}
                </Text>
              </View>
              <Badge
                value={item.is_active ? 'Active' : 'Inactive'}
                color={item.is_active ? Colors.accent : Colors.muted}
              />
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('AddEditItem', { itemId: item.id })}
              >
                <Text style={styles.editText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, item.is_active ? styles.deactivateBtn : styles.activateBtn]}
                onPress={() => setPendingToggle(item)}
              >
                <Text style={[
                  styles.toggleText,
                  { color: item.is_active ? Colors.danger : Colors.accent },
                ]}>
                  {item.is_active ? '🔕 Deactivate' : '✓ Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title="No items yet"
            subtitle="Add your first market item"
            action={{ label: 'Add Item', onPress: () => navigation.navigate('AddEditItem', {}) }}
          />
        }
      />

      <FAB onPress={() => navigation.navigate('AddEditItem', {})} icon="+" />

      {/* TOGGLE CONFIRM */}
      <ConfirmationDialog
        visible={!!pendingToggle}
        title={pendingToggle?.is_active ? 'Deactivate Item?' : 'Activate Item?'}
        message={
          pendingToggle?.is_active
            ? `"${pendingToggle?.name}" will be hidden from students in the market.`
            : `"${pendingToggle?.name}" will be visible again in the market.`
        }
        confirmLabel={pendingToggle?.is_active ? 'Deactivate' : 'Activate'}
        cancelLabel="Cancel"
        onConfirm={handleToggleConfirmed}
        onCancel={() => setPendingToggle(null)}
        loading={toggling}
        destructive={pendingToggle?.is_active}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 30, color: Colors.white, fontWeight: '300', lineHeight: 34 },
  title: { fontSize: Typography.lg, fontWeight: '700', color: Colors.white },
  itemCard: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  itemName: { fontSize: Typography.md, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  itemMeta: { fontSize: Typography.sm, color: Colors.muted },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.bg,
  },
  deactivateBtn: { backgroundColor: Colors.dangerLight },
  activateBtn: { backgroundColor: Colors.accentLight },
  editText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
  toggleText: { fontSize: Typography.sm, fontWeight: '600' },
});
