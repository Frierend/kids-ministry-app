import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, RefreshControl, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AttendanceStackParamList, Ministry, AttendanceSession } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { MinistrySelector } from '../../components/domain/MinistrySelector';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { AttendanceSessionCard } from '../../components/domain/AttendanceSessionCard';
import { ministryService } from '../../services/MinistryService';
import { attendanceService } from '../../services/AttendanceService';
import { Colors, Typography, Radius } from '../../constants';
import { format, addDays } from 'date-fns';

type Nav = NativeStackNavigationProp<AttendanceStackParamList, 'AttendanceHome'>;

function toYYYYMMDD(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function AttendanceHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(toYYYYMMDD(new Date()));
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Custom points — editable before starting session
  const [customPointsStr, setCustomPointsStr] = useState('');
  const [editingPoints, setEditingPoints] = useState(false);

  const load = useCallback(async () => {
    const [mins, sessions] = await Promise.all([
      ministryService.getAll(),
      attendanceService.getRecentSessions(undefined, 10),
    ]);
    setMinistries(mins);
    if (mins.length && !selectedMinistryId) setSelectedMinistryId(mins[0].id);
    setRecentSessions(sessions);
  }, [selectedMinistryId]);

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused, load]);

  // Reset custom points when ministry or date changes
  useEffect(() => {
    setCustomPointsStr('');
    setEditingPoints(false);
  }, [selectedMinistryId, selectedDate]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const selectedMinistry = ministries.find((m) => m.id === selectedMinistryId);
  const dayName = format(new Date(selectedDate + 'T00:00:00'), 'EEEE').toLowerCase();
  const defaultPoints = selectedMinistry
    ? (selectedMinistry.points_config as any)[dayName] ?? 0
    : 0;

  // Effective points: use custom if set and valid, else default
  const customPoints = parseInt(customPointsStr, 10);
  const effectivePoints = (editingPoints && !isNaN(customPoints) && customPoints > 0)
    ? customPoints
    : defaultPoints;

  const handleStartSession = async () => {
    if (!selectedMinistryId) return;
    setLoading(true);
    try {
      const session = await attendanceService.getOrCreateSession(
        selectedMinistryId,
        selectedDate,
        effectivePoints > 0 ? effectivePoints : undefined
      );
      const ministry = ministries.find((m) => m.id === selectedMinistryId);
      navigation.push('SessionDetail', {
        sessionId: session.id,
        ministryName: ministry?.name ?? 'Session',
        sessionDate: selectedDate,
      });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const dates = [-3, -2, -1, 0, 1, 2, 3].map((d) => addDays(today, d));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── NAVY HEADER ── */}
        <LinearGradient
          colors={Colors.gradientNavy as [string, string]}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Attendance</Text>
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => navigation.push('AttendanceHistory', {})}
            >
              <Text style={styles.historyBtnText}>📅 History</Text>
            </TouchableOpacity>
          </View>

          {/* DATE STRIP */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
          >
            {dates.map((d) => {
              const str = toYYYYMMDD(d);
              const selected = str === selectedDate;
              const isToday = str === toYYYYMMDD(today);
              return (
                <TouchableOpacity
                  key={str}
                  onPress={() => setSelectedDate(str)}
                  style={[styles.dateChip, selected && styles.dateChipActive]}
                >
                  <Text style={[styles.dayLabel, selected && styles.activeDateText]}>
                    {format(d, 'EEE')}
                  </Text>
                  <Text style={[styles.dateNum, selected && styles.activeDateText]}>
                    {format(d, 'd')}
                  </Text>
                  {isToday && (
                    <View style={[styles.todayDot, selected && styles.todayDotActive]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </LinearGradient>

        {/* ── MINISTRY SELECTOR ── */}
        <View style={styles.selectorWrap}>
          <MinistrySelector
            ministries={ministries}
            selectedId={selectedMinistryId}
            onChange={setSelectedMinistryId}
          />
        </View>

        {/* ── SESSION CARD ── */}
        {selectedMinistry && (
          <View style={styles.sessionCardWrap}>
            <AppCard elevated>
              <View style={styles.sessionTop}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionMinistry}>{selectedMinistry.name}</Text>
                  <Text style={styles.sessionDate}>
                    {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                  </Text>
                </View>

                {/* POINTS BADGE — tappable to edit */}
                <TouchableOpacity
                  style={styles.ptsBadge}
                  onPress={() => setEditingPoints((v) => !v)}
                  activeOpacity={0.7}
                >
                  {editingPoints ? (
                    <View style={styles.ptsEditRow}>
                      <TextInput
                        style={styles.ptsInput}
                        value={customPointsStr}
                        onChangeText={setCustomPointsStr}
                        keyboardType="number-pad"
                        placeholder={String(defaultPoints)}
                        placeholderTextColor={Colors.primaryLight}
                        maxLength={3}
                        autoFocus
                      />
                      <Text style={styles.ptsLabel}>pts</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.ptsNum}>
                        +{effectivePoints}
                      </Text>
                      <Text style={styles.ptsLabel}>pts</Text>
                      {effectivePoints !== defaultPoints && (
                        <Text style={styles.ptsCustomTag}>custom</Text>
                      )}
                    </>
                  )}
                  <Text style={styles.ptsEditHint}>✏️</Text>
                </TouchableOpacity>
              </View>

              {editingPoints && (
                <View style={styles.ptsHintBox}>
                  <Text style={styles.ptsHintText}>
                    Tap the points badge to edit.
                    Default for {format(new Date(selectedDate + 'T00:00:00'), 'EEEE')}s is {defaultPoints} pts.
                  </Text>
                </View>
              )}

              {defaultPoints > 0 || effectivePoints > 0 ? (
                <PrimaryButton
                  label={loading ? 'Loading...' : 'Start Session'}
                  onPress={handleStartSession}
                  loading={loading}
                  style={{ marginTop: 14 }}
                />
              ) : (
                <View style={styles.inactiveDay}>
                  <Text style={styles.inactiveDayText}>
                    🚫 {selectedMinistry.name} has no points configured for{' '}
                    {format(new Date(selectedDate + 'T00:00:00'), 'EEEE')}s.
                    Tap ✏️ on the badge above to set custom points, or edit this
                    ministry's schedule in Settings.
                  </Text>
                </View>
              )}
            </AppCard>
          </View>
        )}

        {ministries.length === 0 && (
          <View style={styles.noMinistriesBox}>
            <Text style={styles.noMinistriesText}>
              No ministries yet. Go to Settings → Ministries to create one.
            </Text>
          </View>
        )}

        {/* ── RECENT SESSIONS ── */}
        <SectionHeader
          title="Recent Sessions"
          count={recentSessions.length}
          onSeeAll={() => navigation.push('AttendanceHistory', {})}
        />

        {recentSessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySub}>
              Select a ministry above and tap Start Session
            </Text>
          </View>
        ) : (
          recentSessions.map((session) => (
            <AttendanceSessionCard
              key={session.id}
              session={session}
              onPress={() =>
                navigation.push('SessionDetail', {
                  sessionId: session.id,
                  ministryName: session.ministry_name ?? '',
                  sessionDate: session.session_date,
                })
              }
            />
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.white },
  historyBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  historyBtnText: { fontSize: 13, color: Colors.white, fontWeight: '600' },

  dateStrip: { gap: 8, paddingBottom: 4 },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dateChipActive: { backgroundColor: Colors.white, borderColor: Colors.white },
  dayLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  dateNum: { fontSize: 15, fontWeight: '700', color: Colors.white },
  activeDateText: { color: Colors.navyMid },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)', marginTop: 4 },
  todayDotActive: { backgroundColor: Colors.primary },

  selectorWrap: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  sessionCardWrap: { margin: 16 },
  sessionTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  sessionInfo: { flex: 1 },
  sessionMinistry: { fontSize: 17, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  sessionDate: { fontSize: 13, color: Colors.muted },

  // Points badge
  ptsBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 72,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  ptsEditRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ptsInput: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    width: 44,
    textAlign: 'center',
    padding: 0,
  },
  ptsNum: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  ptsLabel: { fontSize: 10, color: Colors.primary, fontWeight: '600', marginTop: 1 },
  ptsCustomTag: {
    fontSize: 9,
    color: Colors.accent,
    fontWeight: '700',
    backgroundColor: Colors.accentLight,
    borderRadius: 4,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  ptsEditHint: { fontSize: 10, marginTop: 4 },

  ptsHintBox: {
    backgroundColor: Colors.bgBlue,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  ptsHintText: { fontSize: 12, color: Colors.primary, lineHeight: 18 },

  inactiveDay: {
    marginTop: 12,
    backgroundColor: Colors.borderLight,
    borderRadius: 10,
    padding: 12,
  },
  inactiveDayText: { fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 20 },

  noMinistriesBox: { margin: 16, padding: 20, backgroundColor: Colors.warningLight, borderRadius: 12 },
  noMinistriesText: { fontSize: 14, color: '#92400E', textAlign: 'center', lineHeight: 22 },

  empty: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.mid },
  emptySub: { fontSize: 13, color: Colors.muted, marginTop: 4, textAlign: 'center' },
});