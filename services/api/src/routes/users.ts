import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../db/client';
import { requireAuth } from '../middleware/auth';
import { requireInternalOrJwt } from '../middleware/internal';
import { createError } from '../middleware/error';

const router: import('express').Router = Router();
router.use(requireInternalOrJwt);

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  income_monthly: z.number().int().positive().optional(),
  agent_tone: z.enum(['amigable', 'formal', 'estricto']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  budget_alert_pct: z.number().int().min(50).max(95).optional(),
  rollover_enabled: z.boolean().optional(),
  onboarding_done: z.boolean().optional(),
});

router.get('/me', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        income_monthly: true,
        wa_phone: true,
        wa_verified: true,
        agent_tone: true,
        theme: true,
        budget_alert_pct: true,
        rollover_enabled: true,
        onboarding_done: true,
        plan: true,
        trial_ends_at: true,
        created_at: true,
      },
    });
    if (!user) throw createError('Usuario no encontrado', 404);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put('/me', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const data = updateSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: userId }, data });
    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
});

router.get('/me/wa-status', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { wa_phone: true, wa_verified: true },
    });
    if (!user) throw createError('Usuario no encontrado', 404);
    res.json({
      linked: user.wa_verified,
      phone: user.wa_phone ? `+549****${user.wa_phone.slice(-4)}` : null,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me/qr-token', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const token = crypto.randomBytes(16).toString('hex');
    const exp = new Date(Date.now() + 15 * 60 * 1000); // 15 min TTL

    await prisma.user.update({
      where: { id: userId },
      data: { wa_link_token: token, wa_link_token_exp: exp },
    });

    const waNumber = (process.env.TWILIO_WHATSAPP_NUMBER ?? '').replace('whatsapp:+', '') || '14155238886';
    const url = `https://wa.me/${waNumber}?text=vincular_${token}`;

    res.json({ token, url, expires_at: exp });
  } catch (err) {
    next(err);
  }
});

router.post('/me/revenuecat-id', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const { revenuecat_id } = z.object({ revenuecat_id: z.string().min(1) }).parse(req.body);
    await prisma.user.update({ where: { id: userId }, data: { revenuecat_id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/me/wa', async (req, res, next) => {
  try {
    const userId = req.userId!;
    await prisma.user.update({
      where: { id: userId },
      data: { wa_phone: null, wa_verified: false, wa_link_token: null },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
