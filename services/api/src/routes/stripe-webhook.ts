import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../db/client';
import { getStripe } from '../lib/stripe';

const router: import('express').Router = Router();
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

router.post('/', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body as Buffer, signature as string, WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe] Firma inválida:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  res.json({ ok: true });

  handleEvent(event).catch((err) => {
    console.error('[Stripe] Error procesando evento:', event.type, err);
  });
});

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const phone = session.metadata?.phone;
      if (!phone) return;

      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const isSubscription = session.mode === 'subscription';

      await prisma.user.upsert({
        where: { wa_phone: phone },
        create: {
          wa_phone: phone,
          plan: 'active',
          trial_ends_at: isSubscription ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
          stripe_customer_id: customerId,
        },
        update: {
          plan: 'active',
          trial_ends_at: isSubscription ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
          stripe_customer_id: customerId,
        },
      });
      console.log(`[Stripe] checkout.session.completed → plan: active para ${phone}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

      const user = await prisma.user.findFirst({ where: { stripe_customer_id: customerId } });
      if (!user) return;

      await prisma.user.update({ where: { id: user.id }, data: { plan: 'expired' } });
      console.log(`[Stripe] customer.subscription.deleted → plan: expired para ${user.wa_phone}`);
      break;
    }

    // Stripe ya reintentó el cobro varias veces (Smart Retries) antes de llegar a
    // 'unpaid' o 'canceled' — si no llega a cancelar la sub del todo (subscription.deleted),
    // este es el único evento que nos avisa que el cliente dejó de pagar.
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

      if (subscription.status !== 'unpaid' && subscription.status !== 'canceled') break;

      const user = await prisma.user.findFirst({ where: { stripe_customer_id: customerId } });
      if (!user) return;

      await prisma.user.update({ where: { id: user.id }, data: { plan: 'expired' } });
      console.log(`[Stripe] customer.subscription.updated (${subscription.status}) → plan: expired para ${user.wa_phone}`);
      break;
    }

    default:
      console.log(`[Stripe] Evento ignorado: ${event.type}`);
  }
}

export default router;
