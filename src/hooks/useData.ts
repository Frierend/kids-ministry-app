// src/hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/TransactionService';
import type { TransactionType } from '../types';

export function useTransactions(studentId: string) {
  return useQuery({
    queryKey: ['transactions', studentId],
    queryFn: () => transactionService.getByStudent(studentId),
    staleTime: 30_000,
    enabled: !!studentId,
  });
}

export function useAwardPoints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      student_id: string;
      points: number;
      type: TransactionType;
      description: string;
      created_by?: string;
    }) => transactionService.awardPoints(data),
    onSuccess: (_, data) => {
      qc.invalidateQueries({ queryKey: ['transactions', data.student_id] });
      qc.invalidateQueries({ queryKey: ['balance', data.student_id] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useRedeemItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transactionService.redeemItem.bind(transactionService),
    onSuccess: (_, data) => {
      qc.invalidateQueries({ queryKey: ['transactions', data.student_id] });
      qc.invalidateQueries({ queryKey: ['balance', data.student_id] });
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['market-items'] });
    },
  });
}

// src/hooks/useMinistries.ts
import { ministryService } from '../services/MinistryService';

export function useMinistries(activeOnly = true) {
  return useQuery({
    queryKey: ['ministries', { activeOnly }],
    queryFn: () => ministryService.getAll(activeOnly),
    staleTime: 60_000,
  });
}

export function useMinistry(id: string) {
  return useQuery({
    queryKey: ['ministry', id],
    queryFn: () => ministryService.getById(id),
    staleTime: 60_000,
    enabled: !!id,
  });
}

export function useCreateMinistry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ministryService.create.bind(ministryService),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ministries'] }),
  });
}

export function useUpdateMinistry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ministryService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ministries'] }),
  });
}

// src/hooks/useMarket.ts
import { marketService } from '../services/MarketService';

export function useMarketItems(availableOnly = false) {
  return useQuery({
    queryKey: ['market-items', { availableOnly }],
    queryFn: () => marketService.getAll(availableOnly),
    staleTime: 30_000,
  });
}

export function useMarketItem(id: string) {
  return useQuery({
    queryKey: ['market-item', id],
    queryFn: () => marketService.getById(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useCreateMarketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marketService.create.bind(marketService),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-items'] }),
  });
}

export function useUpdateMarketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => marketService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-items'] }),
  });
}
