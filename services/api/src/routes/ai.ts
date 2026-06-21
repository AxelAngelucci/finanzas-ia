import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../db/client';
import { requireInternalOrJwt } from '../middleware/internal';
import { requireActivePlan } from '../middleware/subscription';
import { createError } from '../middleware/error';
import { TransactionCategory, TransactionType, TransactionChannel } from '@prisma/client';
import { callAI, getUserContext } from '../lib/aiHelpers';

const router: import('express').Router = Router();
router.use(requireInternalOrJwt);
router.use(requireActivePlan);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const AI_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8000';

// ── Main chat endpoint — supports text + optional image ───────────────────────

router.post('/chat', upload.single('image'), async (req, res, next) => {
  try {
    const userId = req.userId!;

    const bodyRaw = req.is('multipart/form-data') ? req.body : req.body;
    const { message, history } = z.object({
      message: z.string().min(1),
      history: z.preprocess(
        (v) => (typeof v === 'string' ? JSON.parse(v) : v),
        z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional()
      ),
    }).parse(bodyRaw);

    const { tone, context } = await getUserContext(userId);

    const agentPayload: Record<string, any> = {
      message,
      history: history ?? [],
      user_id: userId,
      tone,
      context,
    };

    if (req.file) {
      agentPayload.image_base64 = req.file.buffer.toString('base64');
      agentPayload.image_mime = req.file.mimetype;
    }

    const result = await callAI('/agent', agentPayload);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── Audio transcription + agent ───────────────────────────────────────────────

router.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) throw createError('Se requiere un archivo de audio', 400);

    // Node 20+ native FormData + Blob
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    const formData = new FormData();
    formData.append('file', blob, req.file.originalname || 'audio.mp3');

    const response = await fetch(`${AI_URL}/transcribe`, { method: 'POST', body: formData });
    if (!response.ok) throw createError('Error transcribiendo audio', 502);

    const { text } = (await response.json()) as { text: string };
    res.json({ text });
  } catch (err) {
    next(err);
  }
});

// ── Parse (for WhatsApp webhook — internal use) ───────────────────────────────

router.post('/parse', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const { text, channel } = z.object({
      text: z.string().min(1),
      channel: z.enum(['app', 'wa_text', 'wa_audio']).optional(),
    }).parse(req.body);

    const { tone, context } = await getUserContext(userId);

    const result = await callAI('/agent', {
      message: text,
      history: [],
      user_id: userId,
      tone,
      context,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── Insight (cached weekly) ───────────────────────────────────────────────────

router.get('/insight', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const isoWeek = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    const weekKey = `${d.getUTCFullYear()}W${String(isoWeek).padStart(2, '0')}`;

    const cached = await prisma.insight.findUnique({
      where: { user_id_week_key: { user_id: userId, week_key: weekKey } },
    });

    if (cached) {
      res.json({ content: cached.content, cached: true });
      return;
    }

    // Generate on demand if not cached
    const { tone, context } = await getUserContext(userId);
    try {
      const result = await callAI('/agent', {
        message: 'Generá un insight financiero semanal personalizado. Máximo 2 oraciones, siempre con un consejo accionable concreto.',
        history: [],
        user_id: userId,
        tone,
        context,
      });

      if (result.reply) {
        await prisma.insight.create({
          data: { user_id: userId, content: result.reply, week_key: weekKey },
        });
        res.json({ content: result.reply, cached: false });
        return;
      }
    } catch {
      // Non-fatal — return empty
    }

    res.json({ content: null, cached: false });
  } catch (err) {
    next(err);
  }
});

// ── Subscriptions ─────────────────────────────────────────────────────────────

const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(80),
  amount: z.number().int().positive(),
  day_of_charge: z.number().int().min(1).max(31).optional(),
  category: z.nativeEnum(TransactionCategory),
  frequency: z.string().default('monthly'),
});

router.get('/subscriptions', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const subs = await prisma.subscription.findMany({
      where: { user_id: userId, ignored: false },
      orderBy: { amount: 'desc' },
    });
    res.json(subs);
  } catch (err) {
    next(err);
  }
});

router.post('/subscriptions', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const data = createSubscriptionSchema.parse(req.body);

    const today = new Date();
    const dayOfCharge = data.day_of_charge ?? today.getDate();

    // Next billing date: this month if day hasn't passed, next month otherwise
    const thisMonthBilling = new Date(today.getFullYear(), today.getMonth(), dayOfCharge);
    const nextDate = thisMonthBilling > today
      ? thisMonthBilling
      : new Date(today.getFullYear(), today.getMonth() + 1, dayOfCharge);

    const sub = await prisma.subscription.create({
      data: {
        user_id: userId,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        day_of_charge: dayOfCharge,
        next_date: nextDate,
        category: data.category,
        confidence: 1.0,
        ignored: false,
      },
    });

    // Auto-create expense transaction for the current month's charge
    // only if the billing day has already passed (or is today)
    if (today.getDate() >= dayOfCharge) {
      await prisma.transaction.create({
        data: {
          user_id: userId,
          amount: data.amount,
          type: TransactionType.expense,
          description: data.name,
          category: data.category,
          date: new Date(today.getFullYear(), today.getMonth(), dayOfCharge),
          channel: TransactionChannel.app,
          note: 'Suscripción recurrente',
        },
      });
    }

    res.status(201).json(sub);
  } catch (err) {
    next(err);
  }
});

router.put('/subscriptions/:id/ignore', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const sub = await prisma.subscription.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!sub) throw createError('Suscripción no encontrada', 404);
    await prisma.subscription.update({ where: { id: req.params.id }, data: { ignored: true } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/subscriptions/:id', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const sub = await prisma.subscription.findFirst({ where: { id: req.params.id, user_id: userId } });
    if (!sub) throw createError('Suscripción no encontrada', 404);
    await prisma.subscription.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
