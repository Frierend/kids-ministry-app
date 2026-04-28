import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MarketStackParamList } from '../../types';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Snackbar } from '../../components/ui/Snackbar';
import { marketService } from '../../services/MarketService';
import { Colors, Typography, Radius, Layout } from '../../constants';

type Props = NativeStackScreenProps<MarketStackParamList, 'AddEditItem'>;

export function AddEditItemScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const itemId = route.params?.itemId;
  const isEdit = !!itemId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pointCost, setPointCost] = useState('');
  const [stock, setStock] = useState('-1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  useEffect(() => {
    if (itemId) {
      marketService.getById(itemId).then((item) => {
        if (!item) return;
        setName(item.name);
        setDescription(item.description ?? '');
        setPointCost(String(item.point_cost));
        setStock(String(item.stock));
      });
    }
  }, [itemId]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    const cost = parseInt(pointCost, 10);
    if (isNaN(cost) || cost <= 0) { setError('Point cost must be a positive number'); return; }
    setSaving(true);
    try {
      const data = { name: name.trim(), description: description.trim() || undefined, point_cost: cost, stock: parseInt(stock, 10) || -1 };
      if (isEdit) await marketService.update(itemId!, data);
      else await marketService.create(data);
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Edit Item' : 'Add Item'}</Text>
          <PrimaryButton label="Save" onPress={handleSave} loading={saving} size="sm" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {[
            { label: 'Item Name *', value: name, setter: setName, placeholder: 'e.g. Candy Bar' },
            { label: 'Description', value: description, setter: setDescription, placeholder: 'Optional description' },
          ].map((f) => (
            <View key={f.label} style={styles.field}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput style={styles.input} value={f.value} onChangeText={f.setter} placeholder={f.placeholder} placeholderTextColor={Colors.light} />
            </View>
          ))}

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Point Cost *</Text>
              <TextInput style={styles.input} value={pointCost} onChangeText={setPointCost}
                keyboardType="number-pad" placeholder="50" placeholderTextColor={Colors.light} />
            </View>
            <View style={{ width: 12 }} />
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Stock (-1 = unlimited)</Text>
              <TextInput style={styles.input} value={stock} onChangeText={setStock}
                keyboardType="numbers-and-punctuation" placeholder="-1" placeholderTextColor={Colors.light} />
            </View>
          </View>
        </ScrollView>
        <Snackbar visible={snackbar.visible} message={snackbar.message} type="success"
          onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { color: Colors.mid, fontSize: 15 },
  title: { fontSize: 17, fontWeight: '600', color: Colors.dark },
  error: { backgroundColor: '#FEE2E2', color: Colors.danger, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.mid, marginBottom: 6 },
  input: { height: Layout.inputHeight, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, fontSize: 15, color: Colors.dark, backgroundColor: Colors.white },
  row: { flexDirection: 'row' },
});
