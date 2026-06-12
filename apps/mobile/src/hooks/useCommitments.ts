import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Commitment, CreateCommitmentPayload } from '@/types';

export const commitmentKeys = {
  all:  ['commitments'] as const,
  list: (month?: string) => [...commitmentKeys.all, 'list', month ?? ''] as const,
};

export function useCommitments(month?: string) {
  return useQuery({
    queryKey: commitmentKeys.list(month),
    queryFn: () => {
      const params = month ? { month } : {};
      return api.get<Commitment[]>('/commitments', { params });
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateCommitment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommitmentPayload) =>
      api.post<Commitment>('/commitments', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commitmentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useMarkCommitmentPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Commitment>(`/commitments/${id}/pay`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commitmentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useMarkCommitmentUnpaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Commitment>(`/commitments/${id}/unpay`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commitmentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useDeleteCommitment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/commitments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commitmentKeys.all });
    },
  });
}
