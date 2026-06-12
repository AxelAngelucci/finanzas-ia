import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { requireAuth } from '../middleware/auth';
import { requireInternalOrJwt } from '../middleware/internal';
import { createError } from '../middleware/error';
import { TransactionCategory, TransactionType, TransactionChannel } from '@prisma/client';

const router: import('express').Router = Router();
router.use(requireInternalOrJwt);

const CATEGORIES = Object.values(TransactionCategory);

const createSchema = z.object({
  amount: z.number().int().positive(),
  type: z.nativeEnum(TransactionType),
  description: z.string().min(1).max(120),
  category: z.nativeEnum(TransactionCategory),
  note: z.string().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  channel: z.nativeEnum(TransactionChannel).optional(),
  raw_text: z.string().optional(),
  ai_confidence: z.number().min(0).max(1).optional(),
});

const updateSchema = createSchema.partial().omit({ channel: true, raw_text: true, ai_confidence: true });

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId, deleted_at: null };

    if (req.query.type) where.type = req.query.type;
    if (req.query.category) where.category = req.query.category;
    if (req.query.from || req.query.to) {
      where.date = {};
      if (req.query.from) where.date.gte = new Date(req.query.from as string);
      if (req.query.to) where.date.lte = new Date(req.query.to as string);
    }
    if (req.query.q) {
      where.description = { contains: req.query.q as string, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    res.json({
      data: items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const month = req.query.month as string ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [year, mon] = month.split('-').map(Number);
    const from = new Date(year, mon - 1, 1);
    const to = new Date(year, mon, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: { user_id: userId, deleted_at: null, date: { gte: from, lte: to } },
    });


    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savings = transactions.filter((t) => t.type === 'saving').reduce((s, t) => s + t.amount, 0);

    const byCategory = CATEGORIES.reduce((acc, cat) => {
      const sum = transactions
        .filter((t) => t.type === 'expense' && t.category === cat)
        .reduce((s, t) => s + t.amount, 0);
      if (sum > 0) acc[cat] = sum;
      return acc;
    }, {} as Record<string, number>);

    const today = new Date();
    const daysLeft = Math.max(1, to.getDate() - today.getDate() + 1);
    const balance = income - expenses - savings;
    const daily_available = Math.round(balance / daysLeft);

    const daysInMonth = to.getDate();
    const daysPassed = Math.min(today.getDate(), daysInMonth);
    const pct_time = Math.round((daysPassed / daysInMonth) * 100);

    const [user, budgets, subscriptions] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { income_monthly: true } }),
      prisma.budget.findMany({ where: { user_id: userId, month } }),
      prisma.subscription.findMany({ where: { user_id: userId, ignored: false }, orderBy: { amount: 'desc' } }),
    ]);

    const budget_base = user?.income_monthly ?? income;
    const pct_spent = budget_base > 0 ? Math.round((expenses / budget_base) * 100) : 0;

    const spentByCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => { spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + t.amount; });

    const enrichedBudgets = budgets
      .map((b) => ({
        ...b,
        spent: spentByCategory[b.category] ?? 0,
        pct: b.limit_amount > 0 ? Math.round(((spentByCategory[b.category] ?? 0) / b.limit_amount) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);

    const recent = transactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    const subscriptions_total = subscriptions.reduce((s, sub) => s + sub.amount, 0);

    res.json({
      month,
      income,
      expenses,
      savings,
      balance,
      daily_available,
      pct_time,
      pct_spent,
      by_category: byCategory,
      transaction_count: transactions.length,
      top_budgets: enrichedBudgets,
      recent_transactions: recent,
      subscriptions,
      subscriptions_total,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const data = createSchema.parse(req.body);

    const txn = await prisma.transaction.create({
      data: {
        ...data,
        user_id: userId,
        date: new Date(data.date),
      },
    });

    res.status(201).json(txn);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const data = updateSchema.parse(req.body);

    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, user_id: userId, deleted_at: null },
    });
    if (!existing) throw createError('Transacción no encontrada', 404);

    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId!;

    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, user_id: userId, deleted_at: null },
    });
    if (!existing) throw createError('Transacción no encontrada', 404);

    await prisma.transaction.update({
      where: { id: req.params.id },
      data: { deleted_at: new Date() },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
