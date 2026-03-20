import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TextInput, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudentsStackParamList, Ministry } from '../../types';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { ConfirmationDialog } from '../../components/organisms/ConfirmationDialog';
import { Snackbar } from '../../components/organisms/Snackbar';
import { studentService } from '../../services/StudentService';
import { ministryService } from '../../services/MinistryService';
import { Colors, Typography, Radius, Layout } from '../../constants';

type Props = NativeStackScreenProps<StudentsStackParamList, 'AddStudent'>;

export function AddStudentScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistries, setSelectedMinistries] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    ministryService.getAll().then(setMinistries);
  }, []);

  const toggleMinistry = (id: number) => {
    setSelectedMinistries((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const validate = (): boolean => {
    if (!firstName.trim()) { setError('First name is required'); return false; }
    if (!lastName.trim()) { setError('Last name is required'); return false; }
    setError('');
    return true;
  };

  const handleSaveConfirmed = async () => {
    setSaving(true);
    try {
      await studentService.create({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: nickname.trim() || undefined,
        ministry_ids: selectedMinistries,
      });
      setSnackbar({
        visible: true,
        message: `${firstName.trim()} ${lastName.trim()} added successfully!`,
        type: 'success',
      });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message ?? 'Failed to save student', type: 'error' });
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  const selectedMinistryNames = ministries
    .filter((m) => selectedMinistries.includes(m.id))
    .map((m) => m.name)
    .join(', ');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        {/* HEADER */}
        <LinearGradient
          colors={Colors.gradientNavy as [string, string]}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Student</Text>
            <PrimaryButton
              label="Save"
              onPress={() => { if (validate()) setShowConfirm(true); }}
              size="sm"
              fullWidth={false}
              style={{ paddingHorizontal: 16 }}
            />
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.sectionTitle}>Student Name</Text>

          <View style={styles.field}>
            <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={(v) => { setFirstName(v); setError(''); }}
              placeholder="e.g. Maria"
              placeholderTextColor={Colors.muted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={(v) => { setLastName(v); setError(''); }}
              placeholder="e.g. Santos"
              placeholderTextColor={Colors.muted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Nickname <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g. Ria"
              placeholderTextColor={Colors.muted}
              autoCapitalize="words"
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
            Enroll in Ministries <Text style={styles.optional}>(optional)</Text>
          </Text>
          <Text style={styles.sectionSub}>Tap to enroll in one or more ministries.</Text>

          <View style={styles.ministryGrid}>
            {ministries.map((m) => {
              const selected = selectedMinistries.includes(m.id);
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => toggleMinistry(m.id)}
                  style={[styles.ministryChip, selected && styles.ministryChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.ministryText, selected && styles.ministryTextActive]}>
                    {selected ? '✓ ' : ''}{m.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedMinistries.length > 0 && (
            <View style={styles.enrolledNote}>
              <Text style={styles.enrolledNoteText}>
                Will be enrolled in: {selectedMinistryNames}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* CONFIRMATION MODAL */}
        <ConfirmationDialog
          visible={showConfirm}
          title="Add Student?"
          message={
            `Add ${firstName.trim()} ${lastName.trim()}${nickname.trim() ? ` (${nickname.trim()})` : ''}?` +
            (selectedMinistries.length > 0
              ? `\n\nWill be enrolled in:\n${selectedMinistryNames}`
              : '\n\nNot enrolled in any ministry yet.')
          }
          confirmLabel="Add Student"
          cancelLabel="Review"
          onConfirm={handleSaveConfirmed}
          onCancel={() => setShowConfirm(false)}
          loading={saving}
        />

        <Snackbar
          visible={snackbar.visible}
          message={snackbar.message}
          type={snackbar.type}
          onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelText: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.md },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.white },

  error: {
    backgroundColor: Colors.dangerLight,
    color: Colors.danger,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
    marginTop: 4,
  },
  sectionSub: { fontSize: Typography.xs, color: Colors.muted, marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: Typography.sm, fontWeight: '500', color: Colors.mid, marginBottom: 6 },
  required: { color: Colors.danger },
  optional: { color: Colors.muted, fontWeight: '400' },
  input: {
    height: Layout.inputHeight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: Typography.md,
    color: Colors.dark,
    backgroundColor: Colors.white,
  },
  ministryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  ministryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  ministryChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  ministryText: { fontSize: Typography.sm, color: Colors.mid, fontWeight: '500' },
  ministryTextActive: { color: Colors.primary, fontWeight: '700' },
  enrolledNote: {
    marginTop: 12,
    backgroundColor: Colors.accentLight,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  enrolledNoteText: { fontSize: Typography.sm, color: '#166534', fontWeight: '500' },
});