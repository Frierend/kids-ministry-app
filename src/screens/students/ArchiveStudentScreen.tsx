import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudentsStackParamList } from '../../types';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { ConfirmationDialog } from '../../components/organisms/ConfirmationDialog';
import { Snackbar } from '../../components/organisms/Snackbar';
import { studentService } from '../../services/StudentService';
import { Colors, Typography, Radius } from '../../constants';

type Props = NativeStackScreenProps<StudentsStackParamList, 'ArchiveStudent'>;

const PRESET_REASONS = ['Transferred', 'Graduated', 'Inactive', 'Family Relocated', 'Other'];

export function ArchiveStudentScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { studentId, studentName } = route.params;

  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Archive confirm
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Permanent delete — double confirm
  const [showDeleteConfirm1, setShowDeleteConfirm1] = useState(false);
  const [showDeleteConfirm2, setShowDeleteConfirm2] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error',
  });

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await studentService.archive(studentId, reason.trim());
      setSnackbar({
        visible: true,
        message: `${studentName} has been archived. All data preserved.`,
        type: 'success',
      });
      setTimeout(() => navigation.navigate('StudentList'), 1800);
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message ?? 'Archive failed', type: 'error' });
    } finally {
      setArchiving(false);
      setShowArchiveConfirm(false);
    }
  };

  const handlePermanentDelete = async () => {
    setDeleting(true);
    try {
      await studentService.permanentDelete(studentId);
      setSnackbar({
        visible: true,
        message: `${studentName} and all their data have been permanently deleted.`,
        type: 'success',
      });
      setTimeout(() => navigation.navigate('StudentList'), 2000);
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message ?? 'Delete failed', type: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm2(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* HEADER */}
      <LinearGradient
        colors={Colors.gradientNavy as [string, string]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Archive Student</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

        {/* WARNING CARD */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>📦</Text>
          <Text style={styles.warningTitle}>Archive {studentName}?</Text>
          <Text style={styles.warningText}>
            This student will be hidden from all active lists. Their attendance history
            and points are fully preserved and can be restored anytime from the
            Students screen.
          </Text>
        </View>

        {/* REASON */}
        <Text style={styles.fieldLabel}>
          Reason for archiving <Text style={{ color: Colors.danger }}>*</Text>
        </Text>
        <View style={styles.presetGrid}>
          {PRESET_REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.presetChip, reason === r && styles.presetChipActive]}
              onPress={() => setReason(r)}
            >
              <Text style={[styles.presetText, reason === r && styles.presetTextActive]}>
                {reason === r ? '✓ ' : ''}{r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[styles.customInput, error && styles.inputError]}
          value={reason}
          onChangeText={(v) => { setReason(v); setError(''); }}
          placeholder="Or type a custom reason..."
          placeholderTextColor={Colors.muted}
          multiline
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* ARCHIVE BUTTON */}
        <PrimaryButton
          label="Archive Student"
          onPress={() => {
            if (!reason.trim()) { setError('Please provide a reason'); return; }
            setError('');
            setShowArchiveConfirm(true);
          }}
          variant="danger"
          style={{ marginTop: 20 }}
        />
        <PrimaryButton
          label="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          style={{ marginTop: 8 }}
        />

        {/* DIVIDER */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* PERMANENT DELETE SECTION */}
        <View style={styles.deleteCard}>
          <Text style={styles.deleteIcon}>⚠️</Text>
          <Text style={styles.deleteTitle}>Permanent Delete</Text>
          <Text style={styles.deleteText}>
            This will <Text style={{ fontWeight: '800', color: Colors.danger }}>permanently erase</Text> this
            student and ALL their data — attendance records, points, transactions.
            {'\n\n'}
            <Text style={{ fontWeight: '700' }}>This cannot be undone.</Text>
          </Text>
          <PrimaryButton
            label="Permanently Delete"
            onPress={() => setShowDeleteConfirm1(true)}
            variant="danger"
            style={{ marginTop: 14 }}
          />
        </View>

      </ScrollView>

      {/* ── ARCHIVE CONFIRMATION ── */}
      <ConfirmationDialog
        visible={showArchiveConfirm}
        title="Archive Student?"
        message={`Archive ${studentName}?\n\nReason: "${reason}"\n\nAll data is preserved. You can restore this student anytime.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveConfirm(false)}
        loading={archiving}
        destructive
      />

      {/* ── PERMANENT DELETE — FIRST WARNING ── */}
      <ConfirmationDialog
        visible={showDeleteConfirm1}
        title="Are you sure?"
        message={`You are about to permanently delete ${studentName}.\n\nThis will erase:\n• All attendance records\n• All points and transactions\n• The student profile\n\nThis CANNOT be undone. Continue?`}
        confirmLabel="Yes, I understand"
        cancelLabel="Cancel"
        onConfirm={() => { setShowDeleteConfirm1(false); setShowDeleteConfirm2(true); }}
        onCancel={() => setShowDeleteConfirm1(false)}
        destructive
      />

      {/* ── PERMANENT DELETE — FINAL CONFIRMATION ── */}
      <ConfirmationDialog
        visible={showDeleteConfirm2}
        title="Final Confirmation"
        message={`LAST WARNING:\n\nPermanently delete ${studentName} and all their data forever?\n\nThere is NO way to recover this.`}
        confirmLabel="Delete Forever"
        cancelLabel="Cancel"
        onConfirm={handlePermanentDelete}
        onCancel={() => setShowDeleteConfirm2(false)}
        loading={deleting}
        destructive
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 30, color: Colors.white, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.white },

  warningCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  warningIcon: { fontSize: 40, marginBottom: 10 },
  warningTitle: { fontSize: Typography.lg, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  warningText: {
    fontSize: Typography.sm,
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 22,
  },

  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.mid,
    marginBottom: 10,
  },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  presetChipActive: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  presetText: { fontSize: Typography.sm, color: Colors.mid },
  presetTextActive: { color: Colors.danger, fontWeight: '600' },
  customInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: Typography.md,
    color: Colors.dark,
    backgroundColor: Colors.white,
    minHeight: 60,
  },
  inputError: { borderColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: Typography.sm, marginTop: 6 },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: Typography.sm, color: Colors.muted, fontWeight: '500' },

  deleteCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  deleteIcon: { fontSize: 36, marginBottom: 8 },
  deleteTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.danger,
    marginBottom: 8,
  },
  deleteText: {
    fontSize: Typography.sm,
    color: '#7F1D1D',
    lineHeight: 22,
  },
});