import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../db/client';
import { normalizeArgentinePhone } from '../lib/phone';

const router: import('express').Router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';

const PRICE_IDS: Record<'mensual' | 'lifetime', string | undefined> = {
  mensual: process.env.STRIPE_PRICE_MONTHLY,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

router.post('/checkout-session', async (req: Request, res: Response) => {
  const { phone, plan } = req.body as { phone?: string; plan?: 'mensual' | 'lifetime' };

  const phoneDigits = (phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    res.status(400).json({ error: 'Número de WhatsApp inválido' });
    return;
  }

  const priceId = plan ? PRICE_IDS[plan] : undefined;
  if (!priceId) {
    res.status(400).json({ error: 'Plan inválido' });
    return;
  }

  const fullPhone = normalizeArgentinePhone(`+54${phoneDigits}`);
  const isSubscription = plan === 'mensual';

  const existingUser = await prisma.user.findUnique({ where: { wa_phone: fullPhone } });

  // Ya paga — sea por Stripe o por un IAP de RevenueCat vinculado al mismo número.
  // No lo dejamos abrir un segundo checkout y pagar dos veces.
  if (existingUser?.plan === 'active') {
    res.status(409).json({ error: 'Ya tenés una suscripción activa con este número.' });
    return;
  }

  // Si ya existe una cuenta con este número, ya consumió algún trial (WhatsApp o uno
  // previo de Stripe) — no le regalamos otros 14 días gratis.
  const grantTrial = isSubscription && !existingUser;

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { phone: fullPhone },
    customer_creation: isSubscription ? undefined : 'always',
    subscription_data: isSubscription
      ? { trial_period_days: grantTrial ? 14 : undefined, metadata: { phone: fullPhone } }
      : undefined,
    payment_intent_data: !isSubscription ? { metadata: { phone: fullPhone } } : undefined,
    success_url: `${WEB_URL}/suscribite/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${WEB_URL}/suscribite`,
  });

  res.json({ url: session.url });
});

export default router;
