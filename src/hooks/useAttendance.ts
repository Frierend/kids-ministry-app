// src/hooks/useAttendance.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/AttendanceService';
import type { AttendanceStatus } from '../types';

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => attendanceService.getSessionById(sessionId),
    staleTime: 10_000,
    enabled: !!sessionId,
  });
}

export function useOrCreateSession(ministryId: string, date: string) {
  return useQuery({
    queryKey: ['session', 'byDate', ministryId, date],
    queryFn: () => attendanceService.getOrCreateSession(ministryId, date),
    staleTime: 10_000,
    enabled: !!ministryId && !!date,
  });
}

export function useMinistrySessionHistory(ministryId: string) {
  return useQuery({
    queryKey: ['sessions', 'history', ministryId],
    queryFn: () => attendanceService.getSessionsByMinistry(ministryId),
    staleTime: 30_000,
    enabled: !!ministryId,
  });
}

export function useRecentSessions() {
  return useQuery({
    queryKey: ['sessions', 'recent'],
    queryFn: () => attendanceService.getRecentSessions(10),
    staleTime: 30_000,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, studentId, status }: {
      sessionId: string; studentId: string; status: AttendanceStatus;
    }) => attendanceService.markAttendance(sessionId, studentId, status),
    onSuccess: (_, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      qc.invalidateQueries({ queryKey: ['session', 'byDate'] });
    },
  });
}

export function useCommitSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => attendanceService.commitSession(sessionId),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useStudentAttendanceHistory(studentId: string) {
  return useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: () => attendanceService.getStudentAttendanceHistory(studentId),
    staleTime: 30_000,
    enabled: !!studentId,
  });
}
