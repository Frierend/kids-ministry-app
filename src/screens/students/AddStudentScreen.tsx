import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudentsStackParamList, Ministry } from '../../types';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { Snackbar } from '../../components/organisms/Snackbar';
import { studentService } from '../../services/StudentService';
import { ministryService } from '../../services/MinistryService';
import { Colors, Typography, Spacing, Radius, Layout } from '../../constants';

type Props = NativeStackScreenProps<StudentsStackParamList, 'AddStudent'>;

interface FieldProps { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; keyboardType?: any; }
function Field({ label, value, onChange, placeholder, required, keyboardType }: FieldProps) {
  return (
    <View style={fStyles.container}>
      <Text style={fStyles.label}>{label}{required && <Text style={{ color: Colors.danger }}> *</Text>}</Text>
      <TextInput style={fStyles.input} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={Colors.light} keyboardType={keyboardType} />
    </View>
  );
}
const fStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.mid, marginBottom: 6 },
  input: { height: Layout.inputHeight, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, fontSize: Typography.md, color: Colors.dark, backgroundColor: Colors.white },
});

export function AddStudentScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistries, setSelectedMinistries] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { ministryService.getAll().then(setMinistries); }, []);

  const toggleMinistry = (id: number) => {
    setSelectedMinistries((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!firstName.trim()) { setError('First name is required'); return; }
    if (!lastName.trim()) { setError('Last name is required'); return; }
    setSaving(true);
    try {
      await studentService.create({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: nickname.trim() || undefined,
        guardian_name: guardianName.trim() || undefined,
        guardian_contact: guardianContact.trim() || undefined,
        ministry_ids: selectedMinistries,
      });
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>Add Student</Text>
        <PrimaryButton label="Save" onPress={handleSave} loading={saving} size="sm" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Field label="First Name" value={firstName} onChange={setFirstName} required placeholder="Maria" />
        <Field label="Last Name" value={lastName} onChange={setLastName} required placeholder="Santos" />
        <Field label="Nickname" value={nickname} onChange={setNickname} placeholder="Ria (optional)" />
        <Field label="Guardian Name" value={guardianName} onChange={setGuardianName} placeholder="Parent/Guardian" />
        <Field label="Contact Number" value={guardianContact} onChange={setGuardianContact} placeholder="09xx xxx xxxx" keyboardType="phone-pad" />

        <Text style={styles.sectionLabel}>Enroll in Ministries</Text>
        <View style={styles.ministryGrid}>
          {ministries.map((m) => {
            const selected = selectedMinistries.includes(m.id);
            return (
              <TouchableOpacity key={m.id} onPress={() => toggleMinistry(m.id)}
                style={[styles.ministryChip, selected && styles.ministryChipActive]}>
                <Text style={[styles.ministryChipText, selected && styles.ministryChipTextActive]}>{m.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { color: Colors.mid, fontSize: Typography.md },
  title: { fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.dark },
  error: { backgroundColor: Colors.dangerLight, color: Colors.danger, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: Typography.sm },
  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.mid, marginBottom: 8, marginTop: 8 },
  ministryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ministryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  ministryChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  ministryChipText: { fontSize: Typography.sm, color: Colors.mid },
  ministryChipTextActive: { color: Colors.primary, fontWeight: Typography.semiBold },
});
