import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { requireAuth } from '../middleware/auth';
import { requireInternalOrJwt } from '../middleware/internal';
import { createError } from '../middleware/error';
import { TransactionCategory } from '@prisma/client';

const router: import('express').Router = Router();
router.use(requireInternalOrJwt);

const createSchema = z.object({
  category: z.nativeEnum(TransactionCategory),
  limit_amount: z.number().int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  rollover: z.boolean().optional(),
  alert_threshold: z.number().int().min(50).max(100).optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const month =
      (req.query.month as string) ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [year, mon] = month.split('-').map(Number);
    const from = new Date(year, mon - 1, 1);
    const to = new Date(year, mon, 0, 23, 59, 59);

    const budgets = await prisma.budget.findMany({
      where: { user_id: userId, month },
    });

    const expenses = await prisma.transaction.groupBy({
      by: ['category'],
      where: { user_id: userId, type: 'expense', deleted_at: null, date: { gte: from, lte: to } },
      _sum: { amount: true },
    });

    const spentMap = Object.fromEntries(
      expenses.map((e) => [e.category, e._sum.amount ?? 0])
    );

    const result = budgets.map((b) => ({
      ...b,
      spent: spentMap[b.category] ?? 0,
      pct: b.limit_amount > 0 ? Math.round(((spentMap[b.category] ?? 0) / b.limit_amount) * 100) : 0,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const data = createSchema.parse(req.body);

    const existing = await prisma.budget.findUnique({
      where: { user_id_category_month: { user_id: userId, category: data.category, month: data.month } },
    });
    if (existing) throw createError('Ya existe un presupuesto para esa categoría y mes', 409);

    const budget = await prisma.budget.create({ data: { ...data, user_id: userId } });
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const data = createSchema.partial().parse(req.body);

    const existing = await prisma.budget.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!existing) throw createError('Presupuesto no encontrado', 404);

    const updated = await prisma.budget.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const existing = await prisma.budget.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!existing) throw createError('Presupuesto no encontrado', 404);

    await prisma.budget.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
