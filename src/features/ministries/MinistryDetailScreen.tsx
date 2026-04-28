import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DayOfWeek } from '../../types';
import { SettingsStackParamList } from '../../navigation/navigation.types';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Snackbar } from '../../components/ui/Snackbar';
import { ministryService } from './ministry.service';
import { Colors, Typography, Radius, Layout } from '../../constants';

type Props = NativeStackScreenProps<SettingsStackParamList, 'MinistryDetail'>;

const ALL_DAYS: DayOfWeek[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// These days have FIXED point values — cannot be changed, but the day CAN be toggled
const FIXED_POINTS: Record<string, number> = { saturday: 20, sunday: 50 };

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};
const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export function MinistryDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const ministryId = route.params?.ministryId;
  const isNew = !ministryId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>(['saturday', 'sunday']);
  const [pointsMap, setPointsMap] = useState<Record<string, string>>({
    saturday: '20', sunday: '50',
  });
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    visible: false, message: '', isError: false,
  });

  useEffect(() => {
    if (ministryId) {
      ministryService.getById(ministryId).then((m) => {
        if (!m) return;
        setName(m.name);
        setDescription(m.description ?? '');
        setActiveDays(m.active_days);
        const pts: Record<string, string> = {};
        for (const d of ALL_DAYS) {
          if (FIXED_POINTS[d] !== undefined) {
            pts[d] = String(FIXED_POINTS[d]);
          } else {
            pts[d] = String((m.points_config as any)[d] ?? '');
          }
        }
        setPointsMap(pts);
      });
    }
  }, [ministryId]);

  const toggleDay = (day: DayOfWeek) => {
    // ALL days can be toggled — Saturday and Sunday just have locked point values
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    // When enabling a day, ensure it has a default point value
    if (!activeDays.includes(day)) {
      setPointsMap((prev) => ({
        ...prev,
        [day]: FIXED_POINTS[day] !== undefined ? String(FIXED_POINTS[day]) : (prev[day] || '10'),
      }));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Ministry name is required'); return; }
    if (activeDays.length === 0) { setError('Select at least one active day'); return; }

    const config: Record<string, number> = {};
    for (const d of activeDays) {
      if (FIXED_POINTS[d] !== undefined) {
        config[d] = FIXED_POINTS[d];
      } else {
        const v = parseInt(pointsMap[d] ?? '0', 10);
        if (isNaN(v) || v < 0) { setError(`Invalid points for ${DAY_LABELS[d]}`); return; }
        config[d] = v;
      }
    }

    setError('');
    setSaving(true);
    try {
      if (isNew) {
        await ministryService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          active_days: activeDays,
          points_config: config as any,
        });
      } else {
        await ministryService.update(ministryId!, {
          name: name.trim(),
          description: description.trim() || undefined,
          active_days: activeDays,
          points_config: config as any,
        });
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
      setSnackbar({ visible: true, message: 'Ministry archived', isError: false });
      setTimeout(() => navigation.goBack(), 1200);
    } catch (e: any) {
      setError(e.message ?? 'Archive failed');
    } finally {
      setArchiving(false);
      setShowArchiveDialog(false);
    }
  };

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
            <Text style={styles.headerTitle}>{isNew ? 'New Ministry' : 'Edit Ministry'}</Text>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* NAME */}
          <Text style={styles.label}>
            Ministry Name <Text style={{ color: Colors.danger }}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(v) => { setName(v); setError(''); }}
            placeholder="e.g. Bamboo Extension"
            placeholderTextColor={Colors.muted}
          />

          {/* DESCRIPTION */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor={Colors.muted}
            multiline
          />

          {/* ACTIVE DAYS */}
          <Text style={styles.label}>Active Days & Points</Text>
          <Text style={styles.labelSub}>
            Toggle days on/off. Saturday (20 pts) and Sunday (50 pts) have fixed point values per policy.
          </Text>

          <View style={styles.daysGrid}>
            {ALL_DAYS.map((day) => {
              const isActive = activeDays.includes(day);
              const isFixed = FIXED_POINTS[day] !== undefined;

              return (
                <View
                  key={day}
                  style={[styles.dayCard, isActive && styles.dayCardActive]}
                >
                  <View style={styles.dayHeader}>
                    <View>
                      <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>
                        {DAY_SHORT[day]}
                      </Text>
                      {isFixed && isActive && (
                        <Text style={styles.fixedTag}>fixed</Text>
                      )}
                    </View>
                    <Switch
                      value={isActive}
                      onValueChange={() => toggleDay(day)}
                      trackColor={{ true: Colors.primary, false: Colors.border }}
                      thumbColor={isActive ? Colors.white : Colors.light}
                    />
                  </View>

                  {isActive && (
                    <View style={styles.ptsRow}>
                      <Text style={styles.starIcon}>⭐</Text>
                      <TextInput
                        style={[styles.ptsInput, isFixed && styles.ptsInputFixed]}
                        value={isFixed ? String(FIXED_POINTS[day]) : (pointsMap[day] ?? '')}
                        onChangeText={(v) => {
                          if (!isFixed) setPointsMap((p) => ({ ...p, [day]: v }));
                        }}
                        keyboardType="number-pad"
                        editable={!isFixed}
                        placeholder="pts"
                        placeholderTextColor={Colors.muted}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={styles.note}>
            📌 Saturday = 20 pts, Sunday = 50 pts — point values fixed by policy, but days can be toggled
          </Text>

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
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelText: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.md, minWidth: 56 },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.white },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 56,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: Typography.sm },

  error: {
    backgroundColor: Colors.dangerLight,
    color: Colors.danger,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.mid,
    marginBottom: 6,
    marginTop: 16,
  },
  labelSub: {
    fontSize: Typography.xs,
    color: Colors.muted,
    marginBottom: 10,
    marginTop: -4,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: Layout.inputHeight,
    fontSize: Typography.md,
    color: Colors.dark,
    backgroundColor: Colors.white,
  },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCard: {
    width: '30%',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 10,
    backgroundColor: Colors.white,
  },
  dayCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayLabel: { fontSize: Typography.sm, fontWeight: '700', color: Colors.mid },
  dayLabelActive: { color: Colors.primary },
  fixedTag: {
    fontSize: 9,
    color: Colors.muted,
    fontWeight: '600',
    marginTop: 1,
  },
  ptsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starIcon: { fontSize: 12 },
  ptsInput: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    fontSize: Typography.sm,
    color: Colors.dark,
    backgroundColor: Colors.white,
    textAlign: 'center',
    fontWeight: '700',
  },
  ptsInputFixed: {
    backgroundColor: Colors.bg,
    color: Colors.muted,
    borderColor: Colors.border,
  },
  note: {
    fontSize: Typography.xs,
    color: Colors.muted,
    marginTop: 10,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
