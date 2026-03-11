// src/hooks/useStudents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services/StudentService';

export const STUDENTS_KEY = 'students';
export const STUDENT_KEY = (id: string) => ['student', id];
export const BALANCE_KEY = (id: string) => ['balance', id];

export function useStudents(includeArchived = false) {
  return useQuery({
    queryKey: [STUDENTS_KEY, { includeArchived }],
    queryFn: () => studentService.getAll(includeArchived),
    staleTime: 60_000,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: STUDENT_KEY(id),
    queryFn: () => studentService.getById(id),
    staleTime: 60_000,
    enabled: !!id,
  });
}

export function useStudentBalance(studentId: string) {
  return useQuery({
    queryKey: BALANCE_KEY(studentId),
    queryFn: () => studentService.getBalance(studentId),
    staleTime: 30_000,
    enabled: !!studentId,
  });
}

export function useStudentsByMinistry(ministryId: string) {
  return useQuery({
    queryKey: [STUDENTS_KEY, 'ministry', ministryId],
    queryFn: () => studentService.getByMinistry(ministryId),
    staleTime: 60_000,
    enabled: !!ministryId,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentService.create.bind(studentService),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STUDENTS_KEY] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => studentService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] });
      qc.invalidateQueries({ queryKey: STUDENT_KEY(id) });
    },
  });
}

export function useArchiveStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentService.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STUDENTS_KEY] }),
  });
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, ministryId }: { studentId: string; ministryId: string }) =>
      studentService.enroll(studentId, ministryId),
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: STUDENT_KEY(studentId) });
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] });
    },
  });
}

export function useStudentEnrollments(studentId: string) {
  return useQuery({
    queryKey: ['enrollments', studentId],
    queryFn: () => studentService.getEnrollments(studentId),
    staleTime: 60_000,
    enabled: !!studentId,
  });
}
