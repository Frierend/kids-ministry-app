import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList, DayOfWeek } from '../../types';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { ConfirmationDialog } from '../../components/organisms/ConfirmationDialog';
import { Snackbar } from '../../components/organisms/Snackbar';
import { ministryService } from '../../services/MinistryService';
import { Colors, Typography, Radius, Layout } from '../../constants';

type Props = NativeStackScreenProps<SettingsStackParamList, 'MinistryDetail'>;

const ALL_DAYS: DayOfWeek[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const FIXED: Record<string, number> = { saturday: 20, sunday: 50 };
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export function MinistryDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const ministryId = route.params?.ministryId;
  const isNew = !ministryId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>(['saturday','sunday']);
  const [pointsMap, setPointsMap] = useState<Record<string, string>>({ saturday: '20', sunday: '50' });
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', isError: false });

  useEffect(() => {
    if (ministryId) {
      ministryService.getById(ministryId).then((m) => {
        if (!m) return;
        setName(m.name);
        setDescription(m.description ?? '');
        setActiveDays(m.active_days);
        const pts: Record<string, string> = { saturday: '20', sunday: '50' };
        for (const d of m.active_days) {
          pts[d] = String((m.points_config as any)[d] ?? (FIXED[d] ?? ''));
        }
        setPointsMap(pts);
      });
    }
  }, [ministryId]);

  const toggleDay = (day: DayOfWeek) => {
    if (day === 'saturday' || day === 'sunday') return; // always included
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    setPointsMap((prev) => ({ ...prev, [day]: prev[day] ?? '' }));
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Ministry name is required'); return; }
    const config: any = { saturday: 20, sunday: 50 };
    for (const d of activeDays) {
      if (d !== 'saturday' && d !== 'sunday') {
        const v = parseInt(pointsMap[d] ?? '0', 10);
        if (isNaN(v) || v < 0) { setError(`Invalid points for ${DAY_LABELS[d]}`); return; }
        config[d] = v;
      }
    }
    setError('');
    setSaving(true);
    try {
      if (isNew) {
        await ministryService.create({ name: name.trim(), description: description.trim() || undefined, active_days: activeDays, points_config: config });
      } else {
        await ministryService.update(ministryId!, { name: name.trim(), description: description.trim() || undefined, active_days: activeDays, points_config: config });
      }
      setSnackbar({ visible: true, message: isNew ? 'Ministry created!' : 'Ministry updated!', isError: false });
      setTimeout(() => navigation.goBack(), 1200);
    } catch (e: any) {
      setError(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await ministryService.archive(ministryId!);
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? 'Archive failed');
    } finally {
      setArchiving(false);
      setShowArchiveDialog(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        {/* HEADER */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isNew ? 'New Ministry' : 'Edit Ministry'}</Text>
          <PrimaryButton label="Save" onPress={handleSave} loading={saving} size="sm" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* NAME */}
          <Text style={styles.label}>Ministry Name <Text style={{ color: Colors.danger }}>*</Text></Text>
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="e.g. Bamboo Extension" placeholderTextColor={Colors.light} />

          {/* DESCRIPTION */}
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription}
            placeholder="Optional description" placeholderTextColor={Colors.light} multiline />

          {/* ACTIVE DAYS */}
          <Text style={styles.label}>Active Days & Points</Text>
          <View style={styles.daysGrid}>
            {ALL_DAYS.map((day) => {
              const isFixed = day === 'saturday' || day === 'sunday';
              const isActive = activeDays.includes(day);
              return (
                <View key={day} style={[styles.dayCard, isActive && styles.dayCardActive]}>
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>
                      {DAY_LABELS[day]}
                    </Text>
                    <Switch
                      value={isActive}
                      onValueChange={() => toggleDay(day)}
                      disabled={isFixed}
                      trackColor={{ true: Colors.primary }}
                      thumbColor={isActive ? Colors.white : Colors.light}
                    />
                  </View>
                  {isActive && (
                    <View style={styles.ptsRow}>
                      <Text style={styles.ptsIcon}>⭐</Text>
                      <TextInput
                        style={[styles.ptsInput, isFixed && styles.ptsInputFixed]}
                        value={isFixed ? String(FIXED[day]) : (pointsMap[day] ?? '')}
                        onChangeText={(v) => !isFixed && setPointsMap((p) => ({ ...p, [day]: v }))}
                        keyboardType="number-pad"
                        editable={!isFixed}
                        placeholder="pts"
                        placeholderTextColor={Colors.light}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* FIXED POINTS NOTE */}
          <Text style={styles.note}>📌 Saturday = 20 pts, Sunday = 50 pts (fixed by policy)</Text>

          {/* ARCHIVE */}
          {!isNew && (
            <PrimaryButton
              label="Archive Ministry"
              onPress={() => setShowArchiveDialog(true)}
              variant="danger"
              style={{ marginTop: 32 }}
            />
          )}
        </ScrollView>

        <ConfirmationDialog
          visible={showArchiveDialog}
          title="Archive Ministry?"
          message="This ministry will be hidden. Existing sessions and enrollments are preserved."
          confirmLabel="Archive"
          onConfirm={handleArchive}
          onCancel={() => setShowArchiveDialog(false)}
          loading={archiving}
          destructive
        />

        <Snackbar visible={snackbar.visible} message={snackbar.message}
          type={snackbar.isError ? 'error' : 'success'}
          onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { color: Colors.mid, fontSize: Typography.md },
  title: { fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.dark },
  error: { backgroundColor: Colors.dangerLight, color: Colors.danger, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: Typography.sm },
  label: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.mid, marginBottom: 6, marginTop: 16 },
  input: { height: Layout.inputHeight, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, fontSize: Typography.md, color: Colors.dark, backgroundColor: Colors.white },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  dayCard: { width: '30%', borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, padding: 10, backgroundColor: Colors.white },
  dayCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  dayLabel: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.mid },
  dayLabelActive: { color: Colors.primary },
  ptsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ptsIcon: { fontSize: 14 },
  ptsInput: { flex: 1, height: 32, borderWidth: 1, borderColor: Colors.primary, borderRadius: 6, paddingHorizontal: 8, fontSize: Typography.sm, color: Colors.dark, backgroundColor: Colors.white },
  ptsInputFixed: { backgroundColor: Colors.bg, color: Colors.mid, borderColor: Colors.border },
  note: { fontSize: Typography.xs, color: Colors.light, marginTop: 10, fontStyle: 'italic' },
});
