import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { requireAuth } from '../middleware/auth';
import { requireInternalOrJwt } from '../middleware/internal';
import { createError } from '../middleware/error';

const router: import('express').Router = Router();
router.use(requireInternalOrJwt);

const createSchema = z.object({
  name: z.string().min(1).max(60),
  emoji: z.string().max(4),
  target_amount: z.number().int().positive(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const depositSchema = z.object({
  amount: z.number().int().positive(),
  note: z.string().max(500).optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const goals = await prisma.goal.findMany({
      where: { user_id: userId },
      orderBy: { target_date: 'asc' },
    });

    const now = new Date();
    const enriched = goals.map((g) => {
      const target = new Date(g.target_date);
      const monthsLeft = Math.max(
        0,
        (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
      );
      const remaining = g.target_amount - g.saved_amount;
      const monthly_needed = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : 0;
      const pct = g.target_amount > 0 ? Math.round((g.saved_amount / g.target_amount) * 100) : 0;
      return { ...g, months_left: monthsLeft, monthly_needed, pct };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const data = createSchema.parse(req.body);
    const goal = await prisma.goal.create({
      data: { ...data, user_id: userId, target_date: new Date(data.target_date) },
    });
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const data = createSchema.partial().parse(req.body);
    const existing = await prisma.goal.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!existing) throw createError('Meta no encontrada', 404);

    const updated = await prisma.goal.update({
      where: { id: req.params.id },
      data: { ...data, target_date: data.target_date ? new Date(data.target_date) : undefined },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const goal = await prisma.goal.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!goal) throw createError('Meta no encontrada', 404);
    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/deposit', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const { amount, note } = depositSchema.parse(req.body);

    const goal = await prisma.goal.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!goal) throw createError('Meta no encontrada', 404);

    const [updatedGoal, txn] = await prisma.$transaction([
      prisma.goal.update({
        where: { id: goal.id },
        data: {
          saved_amount: { increment: amount },
          completed_at:
            goal.saved_amount + amount >= goal.target_amount ? new Date() : undefined,
        },
      }),
      prisma.transaction.create({
        data: {
          user_id: userId,
          amount,
          type: 'saving',
          description: `Aporte a meta: ${goal.name}`,
          category: 'Ahorro',
          date: new Date(),
          note,
          channel: 'app',
        },
      }),
    ]);

    res.json({ goal: updatedGoal, transaction: txn });
  } catch (err) {
    next(err);
  }
});

export default router;
