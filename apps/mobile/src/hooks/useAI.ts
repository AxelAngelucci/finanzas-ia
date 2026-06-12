import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Insight, ChatMessage } from '@/types';

const DEFAULT_SUGGESTIONS = [
  'Ver gastos del mes 📊',
  '¿Cuánto puedo gastar hoy?',
  'Agregar ingreso 💰',
  'Resumen del mes',
  '¿Cómo van mis metas?',
];

// ─── Agent response shape ─────────────────────────────────────────────────────

export interface RichContent {
  type: 'txn_card' | 'budget_list' | 'goal_list' | 'summary' | 'subscription_list';
  data: unknown;
}

interface AgentResponse {
  reply: string;
  tools_used: string[];
  rich_content: RichContent | null;
}

// ─── useChat ──────────────────────────────────────────────────────────────────

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  suggestions: string[];
  sendMessage: (text: string, imageBase64?: string, imageMime?: string) => Promise<void>;
  clearChat: () => void;
}

export function useChat(): UseChatReturn {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);

  const sendMessage = useCallback(
    async (text: string, imageBase64?: string, imageMime?: string) => {
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const history = messages.slice(-12).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        let result: AgentResponse;

        if (imageBase64) {
          // Multipart form for image upload
          const formData = new FormData();
          formData.append('message', text || 'Analizá esta imagen y extraé los datos del gasto.');
          formData.append('history', JSON.stringify(history));
          const blob = await fetch(`data:${imageMime ?? 'image/jpeg'};base64,${imageBase64}`).then((r) =>
            r.blob()
          );
          formData.append('image', blob, 'receipt.jpg');

          result = await api.post<AgentResponse>('/ai/chat', formData, { noAuth: false });
        } else {
          result = await api.post<AgentResponse>('/ai/chat', {
            message: text,
            history,
          });
        }

        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: result.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Invalidate queries if agent wrote data
        const used = result.tools_used ?? [];
        if (used.some((t) =>
          ['create_transaction', 'update_transaction', 'delete_transaction',
           'create_budget', 'update_budget', 'delete_budget',
           'create_goal', 'update_goal', 'delete_goal', 'deposit_to_goal',
           'create_subscription', 'ignore_subscription', 'delete_subscription',
           'update_user_preferences',
          ].includes(t)
        )) {
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['budgets'] });
          queryClient.invalidateQueries({ queryKey: ['goals'] });
          queryClient.invalidateQueries({ queryKey: ['summary'] });
        }
        if (used.some((t) =>
          ['create_subscription', 'ignore_subscription', 'delete_subscription'].includes(t)
        )) {
          queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        }
        if (used.some((t) =>
          ['create_commitment', 'mark_commitment_paid', 'delete_commitment'].includes(t)
        )) {
          queryClient.invalidateQueries({ queryKey: ['commitments'] });
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error_${Date.now()}`,
            role: 'assistant',
            content: 'Lo siento, no pude procesar tu mensaje. Intentá de nuevo.',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, queryClient],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, suggestions, sendMessage, clearChat };
}

// ─── useInsight ───────────────────────────────────────────────────────────────

export function useInsight() {
  return useQuery({
    queryKey: ['ai', 'insight'],
    queryFn: () => api.get<{ content: string | null; cached: boolean }>('/ai/insight'),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}
