import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { requireInternalOrJwt } from '../middleware/internal';
import { requireActivePlan } from '../middleware/subscription';
import { createError } from '../middleware/error';
import { TransactionType, TransactionChannel, TransactionCategory } from '@prisma/client';

const router: import('express').Router = Router();
router.use(requireInternalOrJwt);
router.use(requireActivePlan);

const COMMITMENT_CATEGORIES = ['Vivienda', 'Credito', 'Seguros', 'Servicios', 'Transporte', 'Otros'] as const;

const CATEGORY_TO_TXN: Record<string, TransactionCategory> = {
  Vivienda:   TransactionCategory.Alquiler,
  Credito:    TransactionCategory.Otros,
  Seguros:    TransactionCategory.Salud,
  Servicios:  TransactionCategory.Otros,
  Transporte: TransactionCategory.Transporte,
  Otros:      TransactionCategory.Otros,
};

const createSchema = z.object({
  name:                z.string().min(1).max(80),
  emoji:               z.string().max(8).default('📅'),
  amount:              z.number().int().positive(),
  category:            z.enum(COMMITMENT_CATEGORIES),
  day_of_month:        z.number().int().min(1).max(31),
  installment_current: z.number().int().positive().optional(),
  installment_total:   z.number().int().positive().optional(),
});

function currentMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function enrich(c: any, month: string, todayDay: number) {
  const isPaid        = c.last_paid_month === month;
  const daysUntilDue  = c.day_of_month - todayDay;
  const status        = isPaid ? 'paid'
    : daysUntilDue < 0 ? 'overdue'
    : daysUntilDue <= 3 ? 'due_soon'
    : 'pending';
  return { ...c, status, days_until_due: daysUntilDue };
}

// ─── GET /commitments?month=YYYY-MM ───────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const today  = new Date();
    const month  = (req.query.month as string) ?? currentMonthStr(today);

    const items = await prisma.commitment.findMany({
      where: { user_id: userId, active: true },
      orderBy: { day_of_month: 'asc' },
    });

    res.json(items.map(c => enrich(c, month, today.getDate())));
  } catch (err) { next(err); }
});

// ─── POST /commitments ────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const data   = createSchema.parse(req.body);
    const today  = new Date();
    const month  = currentMonthStr(today);

    const item = await prisma.commitment.create({ data: { ...data, user_id: userId } });
    res.status(201).json(enrich(item, month, today.getDate()));
  } catch (err) { next(err); }
});

// ─── PUT /commitments/:id ─────────────────────────────────────────────────────

router.put('/:id', async (req, res, next) => {
  try {
    const userId   = req.userId!;
    const data     = createSchema.partial().parse(req.body);
    const existing = await prisma.commitment.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!existing) throw createError('Compromiso no encontrado', 404);

    const updated = await prisma.commitment.update({ where: { id: req.params.id }, data });
    const today   = new Date();
    res.json(enrich(updated, currentMonthStr(today), today.getDate()));
  } catch (err) { next(err); }
});

// ─── DELETE /commitments/:id ──────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const userId   = req.userId!;
    const existing = await prisma.commitment.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!existing) throw createError('Compromiso no encontrado', 404);
    await prisma.commitment.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── POST /commitments/:id/pay ────────────────────────────────────────────────

router.post('/:id/pay', async (req, res, next) => {
  try {
    const userId     = req.userId!;
    const today      = new Date();
    const month      = currentMonthStr(today);
    const commitment = await prisma.commitment.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!commitment) throw createError('Compromiso no encontrado', 404);
    if (commitment.last_paid_month === month) throw createError('Ya fue registrado como pagado este mes', 409);

    const txnCategory = CATEGORY_TO_TXN[commitment.category] ?? TransactionCategory.Otros;
    await prisma.transaction.create({
      data: {
        user_id:     userId,
        amount:      commitment.amount,
        type:        TransactionType.expense,
        description: commitment.name,
        category:    txnCategory,
        date:        new Date(today.getFullYear(), today.getMonth(), commitment.day_of_month),
        channel:     TransactionChannel.app,
        note:        'Pago de compromiso recurrente',
      },
    });

    const updateData: Record<string, any> = { last_paid_month: month };
    if (commitment.installment_current != null && commitment.installment_total != null) {
      const next = commitment.installment_current + 1;
      updateData.installment_current = next;
      if (next >= commitment.installment_total) updateData.active = false;
    }

    const updated = await prisma.commitment.update({ where: { id: req.params.id }, data: updateData });
    res.json(enrich(updated, month, today.getDate()));
  } catch (err) { next(err); }
});

// ─── POST /commitments/:id/unpay ─────────────────────────────────────────────

router.post('/:id/unpay', async (req, res, next) => {
  try {
    const userId     = req.userId!;
    const today      = new Date();
    const month      = currentMonthStr(today);
    const commitment = await prisma.commitment.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!commitment) throw createError('Compromiso no encontrado', 404);
    if (commitment.last_paid_month !== month) throw createError('No hay pago registrado este mes', 400);

    const updateData: Record<string, any> = { last_paid_month: null };
    if (commitment.installment_current != null && commitment.installment_current > 0) {
      updateData.installment_current = commitment.installment_current - 1;
      if (!commitment.active) updateData.active = true;
    }

    const updated = await prisma.commitment.update({ where: { id: req.params.id }, data: updateData });
    res.json(enrich(updated, month, today.getDate()));
  } catch (err) { next(err); }
});

export default router;
