import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Subscription, CreateSubscriptionPayload, TransactionCategory } from '@/types';

// Backend shape differs from frontend Subscription type
export interface BackendSubscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: string;
  day_of_charge: number;   // → billing_day
  next_date: string;       // → next_billing_date
  category: string;
  ignored: boolean;        // → active (inverted)
  confidence: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export function normalizeSubscription(s: BackendSubscription): Subscription {
  return {
    id: s.id,
    user_id: s.user_id,
    name: s.name,
    amount: s.amount,
    billing_day: s.day_of_charge,
    category: s.category as TransactionCategory,
    active: !s.ignored,
    next_billing_date: s.next_date ?? null,
    created_at: s.created_at,
    updated_at: s.updated_at,
  };
}

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  list: () => [...subscriptionKeys.all, 'list'] as const,
};

export function useSubscriptions() {
  return useQuery({
    queryKey: subscriptionKeys.list(),
    queryFn: async () => {
      const res = await api.get<BackendSubscription[]>('/ai/subscriptions');
      return res.map(normalizeSubscription);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSubscriptionPayload) => {
      const res = await api.post<BackendSubscription>('/ai/subscriptions', payload);
      return normalizeSubscription(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useIgnoreSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/ai/subscriptions/${id}/ignore`, {});
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ai/subscriptions/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}
