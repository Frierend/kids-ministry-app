import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudentsStackParamList } from '../../types';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { ConfirmationDialog } from '../../components/organisms/ConfirmationDialog';
import { Snackbar } from '../../components/organisms/Snackbar';
import { transactionService } from '../../services/TransactionService';
import { Colors, Typography, Radius, Layout } from '../../constants';

type Props = NativeStackScreenProps<StudentsStackParamList, 'AwardPoints'>;

const QUICK_REASONS = [
  'Scripture Recitation', 'Perfect Attendance', 'Helping Others',
  'Memory Verse', 'Good Behavior', 'Participation',
];

export function AwardPointsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { studentId, studentName } = route.params;
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'activity' | 'manual_adjustment'>('activity');
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', isError: false });
  const [error, setError] = useState('');

  const validate = (): boolean => {
    const p = parseInt(points, 10);
    if (!points || isNaN(p)) { setError('Enter a valid number'); return false; }
    if (type === 'activity' && p <= 0) { setError('Activity points must be positive'); return false; }
    if (!reason.trim()) { setError('Reason is required'); return false; }
    setError('');
    return true;
  };

  const handleConfirm = async () => {
    const p = parseInt(points, 10);
    setSaving(true);
    try {
      if (type === 'activity') {
        await transactionService.awardActivity(studentId, p, reason.trim());
      } else {
        await transactionService.adjustManual(studentId, p, reason.trim());
      }
      setSnackbar({ visible: true, message: (p > 0 ? '+' : '') + p + ' pts awarded to ' + studentName + '!', isError: false });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message ?? 'Failed', isError: true });
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  const ptNum = parseInt(points, 10) || 0;
  const confirmMessage = 'Award ' + (ptNum > 0 ? '+' : '') + ptNum + ' pts to ' + studentName + ' for ' + reason + '?';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Award Points</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={styles.studentBanner}>
            <Text style={styles.studentLabel}>For student</Text>
            <Text style={styles.studentName}>{studentName}</Text>
          </View>

          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.typeRow}>
            {(['activity', 'manual_adjustment'] as const).map((val) => (
              <TouchableOpacity key={val} style={[styles.typeBtn, type === val && styles.typeBtnActive]}
                onPress={() => setType(val)}>
                <Text style={[styles.typeBtnText, type === val && styles.typeBtnTextActive]}>
                  {val === 'activity' ? 'Activity' : 'Manual'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>
            {type === 'manual_adjustment' ? 'Points (negative to deduct)' : 'Points'}
          </Text>
          <TextInput
            style={[styles.largeInput, error.includes('point') && styles.inputError]}
            value={points}
            onChangeText={setPoints}
            keyboardType="numbers-and-punctuation"
            placeholder={type === 'manual_adjustment' ? 'e.g. 10 or -5' : 'e.g. 15'}
            placeholderTextColor={Colors.light}
          />

          <Text style={styles.fieldLabel}>Reason</Text>
          <View style={styles.quickReasons}>
            {QUICK_REASONS.map((r) => (
              <TouchableOpacity key={r} style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                onPress={() => setReason(r)}>
                <Text style={[styles.reasonChipText, reason === r && styles.reasonChipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.reasonInput, error.includes('Reason') && styles.inputError]}
            value={reason}
            onChangeText={setReason}
            placeholder="Or type a custom reason..."
            placeholderTextColor={Colors.light}
            multiline
            numberOfLines={2}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {ptNum !== 0 && reason.trim().length > 0 && (
            <View style={styles.preview}>
              <Text style={styles.previewText}>
                {'Award '}
                <Text style={{ color: ptNum > 0 ? Colors.accent : Colors.danger, fontWeight: '700' }}>
                  {(ptNum > 0 ? '+' : '') + ptNum + ' pts'}
                </Text>
                {' to ' + studentName + ' for "' + reason + '"'}
              </Text>
            </View>
          )}

          <PrimaryButton
            label="Award Points"
            onPress={() => { if (validate()) setShowConfirm(true); }}
            style={{ marginTop: 16 }}
            variant={type === 'manual_adjustment' && ptNum < 0 ? 'danger' : 'filled'}
          />
        </ScrollView>

        <ConfirmationDialog
          visible={showConfirm}
          title="Confirm Award"
          message={confirmMessage}
          confirmLabel="Yes, Award"
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          loading={saving}
          destructive={ptNum < 0}
        />

        <Snackbar
          visible={snackbar.visible}
          message={snackbar.message}
          type={snackbar.isError ? 'error' : 'success'}
          onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back: { fontSize: 28, color: Colors.primary, fontWeight: '700', marginRight: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.dark },
  studentBanner: { backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 16, marginBottom: 20, alignItems: 'center' },
  studentLabel: { fontSize: 12, color: Colors.primary, marginBottom: 4 },
  studentName: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.mid, marginBottom: 8, marginTop: 16 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeBtnText: { fontSize: 14, color: Colors.mid, fontWeight: '500' },
  typeBtnTextActive: { color: Colors.primary, fontWeight: '700' },
  largeInput: { height: 64, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 16, fontSize: 28, fontWeight: '700', color: Colors.dark, backgroundColor: Colors.white, textAlign: 'center' },
  inputError: { borderColor: Colors.danger },
  quickReasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  reasonChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  reasonChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  reasonChipText: { fontSize: 12, color: Colors.mid },
  reasonChipTextActive: { color: Colors.primary, fontWeight: '600' },
  reasonInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 14, color: Colors.dark, backgroundColor: Colors.white, minHeight: 60 },
  error: { color: Colors.danger, fontSize: 13, marginTop: 8 },
  preview: { backgroundColor: Colors.bg, borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: Colors.border },
  previewText: { fontSize: 14, color: Colors.dark, lineHeight: 22, textAlign: 'center' },
});
