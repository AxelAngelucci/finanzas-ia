import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GoalStatus } from '@/types';
import type { Goal, CreateGoalPayload, UpdateGoalPayload, GoalDepositPayload } from '@/types';

// Backend shape differs from the frontend Goal type — normalize on read
interface BackendGoal {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  target_amount: number;
  saved_amount: number;   // → current_amount
  target_date: string;    // → deadline
  completed_at: string | null; // → status
  pct: number;            // → percentage
  monthly_needed: number;
  months_left: number;
  created_at: string;
  updated_at: string;
}

function normalizeGoal(g: BackendGoal): Goal {
  const isCompleted = g.completed_at !== null || g.pct >= 100;
  return {
    id: g.id,
    user_id: g.user_id,
    name: g.name,
    emoji: g.emoji ?? '🎯',
    color: g.color ?? '#6366F1',
    target_amount: g.target_amount,
    current_amount: g.saved_amount,
    deadline: g.target_date ?? null,
    status: isCompleted ? GoalStatus.COMPLETED : GoalStatus.ACTIVE,
    monthly_needed: g.monthly_needed ?? null,
    percentage: g.pct,
    created_at: g.created_at,
    updated_at: g.updated_at,
  };
}

export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: () => [...goalKeys.lists()] as const,
  detail: (id: string) => [...goalKeys.all, 'detail', id] as const,
};

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.list(),
    queryFn: async () => {
      const res = await api.get<BackendGoal[]>('/goals');
      return res.map(normalizeGoal);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: goalKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<BackendGoal>(`/goals/${id}`);
      return normalizeGoal(res);
    },
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateGoalPayload) => {
      const { deadline, ...rest } = payload;
      const res = await api.post<BackendGoal>('/goals', {
        ...rest,
        target_date: deadline,
        emoji: '🎯',
        color: '#6366F1',
      });
      return normalizeGoal(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, deadline, ...rest }: UpdateGoalPayload) => {
      const body = { ...rest, ...(deadline !== undefined ? { target_date: deadline } : {}) };
      const res = await api.put<BackendGoal>(`/goals/${id}`, body);
      return normalizeGoal(res);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.setQueryData(goalKeys.detail(data.id), data);
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/goals/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useGoalDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: GoalDepositPayload) => {
      const res = await api.post<{ goal: BackendGoal }>(`/goals/${id}/deposit`, { amount });
      return normalizeGoal(res.goal);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.setQueryData(goalKeys.detail(data.id), data);
    },
  });
}
