import { prisma } from '../db/client';
import { createError } from '../middleware/error';

const AI_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8000';

export async function callAI(path: string, body: object): Promise<any> {
  const res = await fetch(`${AI_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw createError(`Error en servicio IA: ${await res.text()}`, 502);
  return res.json();
}

export async function getUserContext(userId: string) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [year, mon] = month.split('-').map(Number);
  const from = new Date(year, mon - 1, 1);
  const to = new Date(year, mon, 0, 23, 59, 59);

  const [user, transactions, budgets, goals, commitments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { agent_tone: true, income_monthly: true, onboarding_done: true, password_hash: true } }),
    prisma.transaction.findMany({ where: { user_id: userId, deleted_at: null, date: { gte: from, lte: to } } }),
    prisma.budget.findMany({ where: { user_id: userId, month } }),
    prisma.goal.findMany({ where: { user_id: userId, completed_at: null } }),
    prisma.commitment.findMany({ where: { user_id: userId, active: true } }),
  ]);

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return {
    tone: user?.agent_tone ?? 'amigable',
    context: {
      income_monthly: user?.income_monthly ?? 0,
      month_income: income,
      month_expenses: expenses,
      balance: income - expenses,
      budgets: budgets.map((b) => ({ category: b.category, limit: b.limit_amount })),
      goals: goals.map((g) => ({ name: g.name, target: g.target_amount, saved: g.saved_amount })),
      commitments: commitments.map((c) => ({ id: c.id, name: c.name, amount: c.amount, last_paid_month: c.last_paid_month })),
      has_app: !!(user?.onboarding_done || user?.password_hash),
    },
  };
}
