import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TextInput, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudentsStackParamList, Ministry } from '../../types';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Snackbar } from '../../components/ui/Snackbar';
import { studentService } from '../../services/StudentService';
import { ministryService } from '../../services/MinistryService';
import { Colors, Typography, Radius, Layout } from '../../constants';

type Props = NativeStackScreenProps<StudentsStackParamList, 'EditStudent'>;

export function EditStudentScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { studentId } = route.params;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [allMinistries, setAllMinistries] = useState<Ministry[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  useEffect(() => {
    (async () => {
      const [student, mins, enrolled] = await Promise.all([
        studentService.getById(studentId),
        ministryService.getAll(),
        studentService.getEnrolledMinistries(studentId),
      ]);
      if (student) {
        setFirstName(student.first_name);
        setLastName(student.last_name);
        setNickname(student.nickname ?? '');
      }
      setAllMinistries(mins);
      setEnrolledIds(enrolled);
    })();
  }, [studentId]);

  const toggleMinistry = async (ministryId: number) => {
    if (enrolledIds.includes(ministryId)) {
      setEnrolledIds((prev) => prev.filter((id) => id !== ministryId));
    } else {
      setEnrolledIds((prev) => [...prev, ministryId]);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await studentService.update(studentId, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: nickname.trim() || undefined,
      });

      // Sync enrollments
      const original = await studentService.getEnrolledMinistries(studentId);
      const toEnroll = enrolledIds.filter((id) => !original.includes(id));
      const toUnenroll = original.filter((id) => !enrolledIds.includes(id));
      for (const id of toEnroll) {
        await ministryService.enroll(studentId, id);
      }
      for (const id of toUnenroll) {
        await ministryService.unenroll(studentId, id);
      }

      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        {/* HEADER */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Student</Text>
          <PrimaryButton label="Save" onPress={handleSave} loading={saving} size="sm" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.sectionTitle}>Student Name</Text>

          {[
            { label: 'First Name', value: firstName, setter: setFirstName, required: true, placeholder: 'e.g. Maria' },
            { label: 'Last Name',  value: lastName,  setter: setLastName,  required: true, placeholder: 'e.g. Santos' },
            { label: 'Nickname',   value: nickname,  setter: setNickname,  required: false, placeholder: 'e.g. Ria (optional)' },
          ].map((f) => (
            <View key={f.label} style={styles.field}>
              <Text style={styles.label}>
                {f.label}{' '}
                {f.required
                  ? <Text style={styles.required}>*</Text>
                  : <Text style={styles.optional}>(optional)</Text>
                }
              </Text>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.setter}
                placeholder={f.placeholder}
                placeholderTextColor={Colors.light}
                autoCapitalize="words"
              />
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Ministry Enrollment</Text>
          <Text style={styles.sectionSub}>Tap to enroll or unenroll from a ministry.</Text>

          <View style={styles.ministryGrid}>
            {allMinistries.map((m) => {
              const enrolled = enrolledIds.includes(m.id);
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => toggleMinistry(m.id)}
                  style={[styles.ministryChip, enrolled && styles.ministryChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.ministryChipText, enrolled && styles.ministryChipTextActive]}>
                    {enrolled ? '✓ ' : ''}{m.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <Snackbar
          visible={snackbar.visible}
          message={snackbar.message}
          type="success"
          onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancel: { color: Colors.mid, fontSize: Typography.md },
  title: { fontSize: Typography.lg, fontWeight: '600', color: Colors.dark },
  error: {
    backgroundColor: Colors.dangerLight,
    color: Colors.danger,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: Typography.sm,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
    marginTop: 4,
  },
  sectionSub: {
    fontSize: Typography.xs,
    color: Colors.light,
    marginBottom: 12,
  },
  field: { marginBottom: 14 },
  label: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.mid,
    marginBottom: 6,
  },
  required: { color: Colors.danger },
  optional: { color: Colors.light, fontWeight: '400' },
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
  ministryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
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
  ministryChipText: {
    fontSize: Typography.sm,
    color: Colors.mid,
    fontWeight: '500',
  },
  ministryChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});