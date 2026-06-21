// ─── Enums ───────────────────────────────────────────────────────────────────

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  SAVING = 'saving',
}

export enum TransactionCategory {
  ALIMENTACION = 'Alimentacion',
  TRANSPORTE = 'Transporte',
  ALQUILER = 'Alquiler',
  SALUD = 'Salud',
  ENTRETENIMIENTO = 'Entretenimiento',
  TRABAJO = 'Trabajo',
  TECNOLOGIA = 'Tecnologia',
  ROPA = 'Ropa',
  EDUCACION = 'Educacion',
  AHORRO = 'Ahorro',
  SUELDO = 'Sueldo',
  FREELANCE = 'Freelance',
  OTROS = 'Otros',
}

export enum TransactionChannel {
  APP = 'app',
  WA_TEXT = 'wa_text',
  WA_AUDIO = 'wa_audio',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ─── Models ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  agent_tone: 'amigable' | 'formal' | 'estricto';
  theme: 'light' | 'dark' | 'system';
  onboarding_done: boolean;
  income_monthly: number | null;
  budget_alert_pct: number;
  wa_phone: string | null;
  wa_verified?: boolean;
  rollover_enabled?: boolean;
  plan: 'free' | 'active' | 'expired';
  created_at: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number; // in centavos
  description: string;
  category: TransactionCategory;
  channel: TransactionChannel;
  date: string; // ISO date string
  note: string | null;
  source: 'manual' | 'whatsapp' | 'ai';
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: TransactionCategory;
  amount: number; // in centavos
  month: string; // YYYY-MM
  spent: number; // computed, in centavos
  remaining: number; // computed, in centavos
  percentage: number; // 0-100
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  target_amount: number; // in centavos
  current_amount: number; // in centavos
  deadline: string | null; // ISO date string
  status: GoalStatus;
  monthly_needed: number | null; // computed, in centavos
  percentage: number; // 0-100
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number; // in centavos
  billing_day: number; // 1-31
  category: TransactionCategory;
  active: boolean;
  next_billing_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: string;
  user_id: string;
  content: string;
  type: 'weekly' | 'monthly' | 'alert' | 'tip';
  generated_at: string;
  read_at: string | null;
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export interface CategorySummary {
  category: TransactionCategory;
  total: number; // in centavos
  count: number;
  percentage: number;
}

export interface Summary {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  balance: number;
  daily_available: number;
  pct_time: number;
  pct_spent: number;
  by_category: Record<string, number>;
  transaction_count: number;
  // Enriched by the aggregated endpoint
  top_budgets: Budget[];
  recent_transactions: Transaction[];
  subscriptions: Subscription[];
  subscriptions_total: number;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  txn_card?: Partial<Transaction>;
  timestamp: Date;
}

export interface ParsedTransaction {
  type: TransactionType;
  amount: number; // in centavos
  description: string;
  category: TransactionCategory;
  channel: TransactionChannel;
  date: string;
  note: string | null;
  confidence: number; // 0-1
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: TransactionCategory;
  month?: string; // YYYY-MM
  search?: string;
  page?: number;
  per_page?: number;
}

export interface CreateTransactionPayload {
  type: TransactionType;
  amount: number; // in centavos
  description: string;
  category: TransactionCategory;
  channel: TransactionChannel;
  date: string;
  note?: string;
}

export interface UpdateTransactionPayload extends Partial<CreateTransactionPayload> {
  id: string;
}

export interface CreateBudgetPayload {
  category: TransactionCategory;
  amount: number; // in centavos
  month: string; // YYYY-MM
}

export interface UpdateBudgetPayload extends Partial<CreateBudgetPayload> {
  id: string;
}

export interface CreateGoalPayload {
  name: string;
  target_amount: number; // in centavos
  deadline?: string;
}

export interface UpdateGoalPayload extends Partial<CreateGoalPayload> {
  id: string;
}

export interface GoalDepositPayload {
  id: string;
  amount: number; // in centavos
}

// ─── Commitments ─────────────────────────────────────────────────────────────

export type CommitmentStatus = 'paid' | 'due_soon' | 'overdue' | 'pending';

export interface Commitment {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  amount: number;               // centavos
  category: string;             // Vivienda | Credito | Seguros | Servicios | Transporte | Otros
  day_of_month: number;
  installment_current: number | null;
  installment_total: number | null;
  last_paid_month: string | null;
  active: boolean;
  status: CommitmentStatus;     // computed by backend
  days_until_due: number;       // computed by backend
  created_at: string;
  updated_at: string;
}

export interface CreateCommitmentPayload {
  name: string;
  emoji?: string;
  amount: number;
  category: string;
  day_of_month: number;
  installment_current?: number;
  installment_total?: number;
}

export interface CreateSubscriptionPayload {
  name: string;
  amount: number; // in centavos
  day_of_charge?: number; // 1-31
  category: TransactionCategory;
  frequency?: string;
}
