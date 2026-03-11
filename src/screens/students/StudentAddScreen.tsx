// src/screens/students/StudentAddScreen.tsx

import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { ScreenWrapper, StackHeader } from '../../components/navigation/ScreenWrapper';
import { GlassCard } from '../../components/atomic/GlassCard';
import { PrimaryButton } from '../../components/atomic';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useCreateStudent } from '../../hooks/useStudents';
import type { StudentsStackParamList } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<StudentsStackParamList, 'StudentAdd'>;
}

export default function StudentAddScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', date_of_birth: '', notes: '',
  });
  const createMutation = useCreateStudent();

  const set = (field: string) => (val: string) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      Alert.alert('Required', 'Please enter first and last name.');
      return;
    }
    try {
      const student = await createMutation.mutateAsync({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth || undefined,
        notes: form.notes || undefined,
      });
      navigation.replace('StudentDetail', { studentId: student.id });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to add student');
    }
  };

  return (
    <ScreenWrapper>
      <StackHeader title="Add Student" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <GlassCard style={styles.form}>
          <FormField
            label="First Name *"
            value={form.first_name}
            onChangeText={set('first_name')}
            placeholder="e.g. Emma"
            autoCapitalize="words"
          />
          <FormField
            label="Last Name *"
            value={form.last_name}
            onChangeText={set('last_name')}
            placeholder="e.g. Johnson"
            autoCapitalize="words"
          />
          <FormField
            label="Date of Birth"
            value={form.date_of_birth}
            onChangeText={set('date_of_birth')}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />
          <FormField
            label="Notes"
            value={form.notes}
            onChangeText={set('notes')}
            placeholder="Allergies, notes for teacher…"
            multiline
            numberOfLines={3}
          />
        </GlassCard>

        <PrimaryButton
          label={createMutation.isPending ? 'Saving…' : 'Add Student'}
          onPress={handleSave}
          loading={createMutation.isPending}
          size="lg"
          style={styles.saveBtn}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

function FormField({
  label, value, onChangeText, placeholder, autoCapitalize,
  keyboardType, multiline, numberOfLines,
}: any) {
  return (
    <View style={styles.field}>
      <Text style={[Typography.label, { color: Colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        autoCapitalize={autoCapitalize ?? 'none'}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[Typography.body, styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.md, gap: Spacing.md },
  form: { gap: Spacing.md, padding: Spacing.md },
  field: { gap: 6 },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
  },
  saveBtn: { marginTop: Spacing.sm },
});
