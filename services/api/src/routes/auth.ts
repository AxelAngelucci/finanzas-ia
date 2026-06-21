import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/client';
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt';
import { redis } from '../lib/redis';
import { createError } from '../middleware/error';
import { sendText } from '../lib/twilio';

const router: import('express').Router = Router();

// Must mirror TRIAL_DAYS in routes/whatsapp.ts — same free-tier trial window
// regardless of which channel the account was created from.
const TRIAL_DAYS = 2;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(80),
  income_monthly: z.number().int().positive().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw createError('El email ya está registrado', 409);

    const password_hash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash,
        name: data.name,
        income_monthly: data.income_monthly ?? 0,
        trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);

    res.status(201).json({
      access_token: access,
      refresh_token: refresh,
      user: {
        id:              user.id,
        email:           user.email,
        name:            user.name,
        agent_tone:      user.agent_tone,
        theme:           user.theme,
        onboarding_done: user.onboarding_done,
        income_monthly:  user.income_monthly,
        wa_phone:        user.wa_phone,
        wa_verified:     user.wa_verified,
        budget_alert_pct: user.budget_alert_pct,
        plan:            user.plan,
        created_at:      user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw createError('Credenciales inválidas', 401);

    if (!user.password_hash) throw createError('Esta cuenta usa acceso por WhatsApp. Iniciá sesión con tu número.', 401);
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) throw createError('Credenciales inválidas', 401);

    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);

    res.json({
      access_token: access,
      refresh_token: refresh,
      user: {
        id:               user.id,
        email:            user.email,
        name:             user.name,
        agent_tone:       user.agent_tone,
        theme:            user.theme,
        onboarding_done:  user.onboarding_done,
        income_monthly:   user.income_monthly,
        wa_phone:         user.wa_phone,
        wa_verified:      user.wa_verified,
        budget_alert_pct: user.budget_alert_pct,
        plan:             user.plan,
        created_at:       user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) throw createError('Refresh token requerido', 400);

    const blacklisted = await redis.get(`blacklist:${refresh_token}`);
    if (blacklisted) throw createError('Token inválido', 401);

    const payload = verifyRefresh(refresh_token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw createError('Usuario no encontrado', 401);

    await redis.setex(`blacklist:${refresh_token}`, 60 * 60 * 24 * 31, '1');

    const newAccess = signAccess(user.id);
    const newRefresh = signRefresh(user.id);

    res.json({ access_token: newAccess, refresh_token: newRefresh });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      await redis.setex(`blacklist:${refresh_token}`, 60 * 60 * 24 * 31, '1');
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── WhatsApp OTP login ───────────────────────────────────────────────────────

router.post('/wa-claim', async (req, res, next) => {
  try {
    const { phone } = z.object({ phone: z.string().min(8) }).parse(req.body);
    const normalized = phone.startsWith('+') ? phone : `+${phone}`;

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await redis.setex(`wa:otp:${normalized}`, 300, code);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP para ${normalized}: ${code}`);
    }

    await sendText(normalized, `Tu código de verificación de *Finanzas IA* es: *${code}*\n\nVence en 5 minutos.`);

    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/wa-verify', async (req, res, next) => {
  try {
    const { phone, code } = z.object({
      phone: z.string().min(8),
      code: z.string().length(6),
    }).parse(req.body);

    const normalized = phone.startsWith('+') ? phone : `+${phone}`;
    const stored = await redis.get(`wa:otp:${normalized}`);
    if (!stored || stored !== code) throw createError('Código inválido o expirado', 401);
    await redis.del(`wa:otp:${normalized}`);

    let user = await prisma.user.findFirst({ where: { wa_phone: normalized } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          wa_phone: normalized,
          wa_verified: true,
          trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
        },
      });
    }

    const access  = signAccess(user.id);
    const refresh = signRefresh(user.id);

    res.json({
      access_token:  access,
      refresh_token: refresh,
      user: {
        id:               user.id,
        email:            user.email,
        name:             user.name,
        agent_tone:       user.agent_tone,
        theme:            user.theme,
        onboarding_done:  user.onboarding_done,
        income_monthly:   user.income_monthly,
        wa_phone:         user.wa_phone,
        wa_verified:      user.wa_verified,
        budget_alert_pct: user.budget_alert_pct,
        plan:             user.plan,
        created_at:       user.created_at,
      },
    });
  } catch (err) { next(err); }
});

export default router;
