import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudentsStackParamList } from '../../types';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { ConfirmationDialog } from '../../components/organisms/ConfirmationDialog';
import { studentService } from '../../services/StudentService';
import { Colors, Typography, Radius } from '../../constants';

type Props = NativeStackScreenProps<StudentsStackParamList, 'ArchiveStudent'>;

const PRESET_REASONS = ['Transferred', 'Graduated', 'Inactive', 'Family Relocated', 'Other'];

export function ArchiveStudentScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { studentId, studentName } = route.params;
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleArchive = async () => {
    setSaving(true);
    try {
      await studentService.archive(studentId, reason.trim());
      navigation.navigate('StudentList');
    } catch (e: any) {
      setError(e.message ?? 'Archive failed');
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Archive Student</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* WARNING CARD */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>Archive {studentName}?</Text>
          <Text style={styles.warningText}>
            This student will be hidden from all active lists. Their attendance history and points are fully preserved and can be restored anytime.
          </Text>
        </View>

        {/* REASON */}
        <Text style={styles.fieldLabel}>Reason for archiving <Text style={{ color: Colors.danger }}>*</Text></Text>
        <View style={styles.presetGrid}>
          {PRESET_REASONS.map((r) => (
            <TouchableOpacity key={r}
              style={[styles.presetChip, reason === r && styles.presetChipActive]}
              onPress={() => setReason(r)}>
              <Text style={[styles.presetText, reason === r && styles.presetTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.customInput}
          value={reason}
          onChangeText={setReason}
          placeholder="Or type a custom reason..."
          placeholderTextColor={Colors.light}
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label="Archive Student"
          onPress={() => {
            if (!reason.trim()) { setError('Please provide a reason'); return; }
            setError('');
            setShowConfirm(true);
          }}
          variant="danger"
          style={{ marginTop: 24 }}
        />
        <PrimaryButton label="Cancel" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: 8 }} />
      </ScrollView>

      <ConfirmationDialog
        visible={showConfirm}
        title="Confirm Archive"
        message={`Archive ${studentName}? Reason: "${reason}"

All data is preserved. You can restore this student later.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setShowConfirm(false)}
        loading={saving}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back: { fontSize: 28, color: Colors.primary, fontWeight: '700', marginRight: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.dark },
  warningCard: { backgroundColor: '#FEF9C3', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#FDE047' },
  warningIcon: { fontSize: 40, marginBottom: 12 },
  warningTitle: { fontSize: 18, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  warningText: { fontSize: 14, color: '#78350F', textAlign: 'center', lineHeight: 22 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.mid, marginBottom: 10 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  presetChipActive: { borderColor: Colors.danger, backgroundColor: '#FEE2E2' },
  presetText: { fontSize: 13, color: Colors.mid },
  presetTextActive: { color: Colors.danger, fontWeight: '600' },
  customInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 14, color: Colors.dark, backgroundColor: Colors.white, minHeight: 60 },
  error: { color: Colors.danger, fontSize: 13, marginTop: 8 },
});
