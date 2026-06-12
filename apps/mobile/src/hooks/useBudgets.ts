import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { currentMonth } from '@/lib/format';
import type { Budget, CreateBudgetPayload, UpdateBudgetPayload } from '@/types';

// Backend budget shape differs from frontend type — normalize on read
export interface BackendBudget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number; // centavos — maps to Budget.amount
  month: string;
  spent: number;
  pct: number; // maps to Budget.percentage
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export function normalizeBudget(b: BackendBudget): Budget {
  return {
    id: b.id,
    user_id: b.user_id,
    category: b.category as Budget['category'],
    amount: b.limit_amount,
    month: b.month,
    spent: b.spent,
    remaining: b.limit_amount - b.spent,
    percentage: b.pct,
    created_at: b.created_at,
    updated_at: b.updated_at,
  };
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: (month: string) => [...budgetKeys.lists(), month] as const,
  detail: (id: string) => [...budgetKeys.all, 'detail', id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useBudgets(month?: string) {
  const m = month ?? currentMonth();
  return useQuery({
    queryKey: budgetKeys.list(m),
    queryFn: async () => {
      const res = await api.get<BackendBudget[]>('/budgets', { params: { month: m } });
      return res.map(normalizeBudget);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<BackendBudget>(`/budgets/${id}`);
      return normalizeBudget(res);
    },
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBudgetPayload) => {
      // Backend expects limit_amount, not amount
      const { amount, ...rest } = payload;
      const res = await api.post<BackendBudget>('/budgets', { ...rest, limit_amount: amount });
      return normalizeBudget(res);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.list(data.month) });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount, ...rest }: UpdateBudgetPayload) => {
      const body = amount !== undefined ? { ...rest, limit_amount: amount } : rest;
      const res = await api.put<BackendBudget>(`/budgets/${id}`, body);
      return normalizeBudget(res);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.list(data.month) });
      queryClient.setQueryData(budgetKeys.detail(data.id), data);
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budgets/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
