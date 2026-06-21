import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { currentMonth } from '@/lib/format';
import { BackendBudget, normalizeBudget } from './useBudgets';
import { BackendSubscription, normalizeSubscription } from './useSubscriptions';
import type {
  Transaction,
  Summary,
  TransactionFilters,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  PaginatedResponse,
} from '@/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
  summary: (month: string) => [...transactionKeys.all, 'summary', month] as const,
};

// Backend returns { data: T[], meta: { page, limit, total, pages } }
interface BackendPaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery<
    PaginatedResponse<Transaction>,
    Error,
    InfiniteData<PaginatedResponse<Transaction>>,
    ReturnType<typeof transactionKeys.list>,
    number
  >({
    queryKey: transactionKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number | boolean | undefined> = {
        page: pageParam,
        per_page: filters.per_page ?? 20,
      };
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.month) params.month = filters.month;
      if (filters.search) params.q = filters.search;

      const res = await api.get<BackendPaginatedResponse<Transaction>>('/transactions', { params });
      // Normalize to PaginatedResponse shape
      return {
        data: res.data,
        total: res.meta.total,
        page: res.meta.page,
        per_page: res.meta.limit,
        total_pages: res.meta.pages,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) return lastPage.page + 1;
      return undefined;
    },
    staleTime: 1000 * 60,
  });
}

export function useSummary(month?: string) {
  const m = month ?? currentMonth();
  return useQuery({
    queryKey: transactionKeys.summary(m),
    queryFn: async () => {
      const raw = await api.get<Summary & { top_budgets: BackendBudget[]; subscriptions: BackendSubscription[] }>('/transactions/summary', { params: { month: m } });
      return {
        ...raw,
        top_budgets: (raw.top_budgets ?? []).map(normalizeBudget),
        subscriptions: (raw.subscriptions ?? []).map(normalizeSubscription),
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTransactionPayload) => {
      // Backend returns transaction directly
      return api.post<Transaction>('/transactions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTransactionPayload) => {
      return api.put<Transaction>(`/transactions/${id}`, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.setQueryData(transactionKeys.detail(data.id), data);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
