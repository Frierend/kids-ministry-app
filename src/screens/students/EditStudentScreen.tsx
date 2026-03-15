import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudentsStackParamList } from '../../types';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { studentService } from '../../services/StudentService';
import { Colors, Typography, Spacing, Radius, Layout } from '../../constants';

type Props = NativeStackScreenProps<StudentsStackParamList, 'EditStudent'>;

export function EditStudentScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { studentId } = route.params;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    studentService.getById(studentId).then((s) => {
      if (!s) return;
      setFirstName(s.first_name);
      setLastName(s.last_name);
      setNickname(s.nickname ?? '');
      setGuardianName(s.guardian_name ?? '');
      setGuardianContact(s.guardian_contact ?? '');
    });
  }, [studentId]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      await studentService.update(studentId, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: nickname.trim() || undefined,
        guardian_name: guardianName.trim() || undefined,
        guardian_contact: guardianContact.trim() || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>Edit Student</Text>
        <PrimaryButton label="Save" onPress={handleSave} loading={saving} size="sm" />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {[
          { label: 'First Name', value: firstName, setter: setFirstName },
          { label: 'Last Name',  value: lastName,  setter: setLastName },
          { label: 'Nickname',   value: nickname,  setter: setNickname },
          { label: 'Guardian',   value: guardianName, setter: setGuardianName },
          { label: 'Contact',    value: guardianContact, setter: setGuardianContact },
        ].map((f) => (
          <View key={f.label} style={{ marginBottom: 16 }}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput style={styles.input} value={f.value} onChangeText={f.setter} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { color: Colors.mid, fontSize: Typography.md },
  title: { fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.dark },
  error: { backgroundColor: Colors.dangerLight, color: Colors.danger, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: Typography.sm },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.mid, marginBottom: 6 },
  input: { height: Layout.inputHeight, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, fontSize: Typography.md, color: Colors.dark, backgroundColor: Colors.white },
});
