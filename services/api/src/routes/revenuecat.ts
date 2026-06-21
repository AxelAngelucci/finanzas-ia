import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';

const router: import('express').Router = Router();

const WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET ?? '';

// RevenueCat sends Authorization: Bearer <secret>
function verifySecret(req: Request): boolean {
  const auth = req.headers['authorization'] ?? '';
  return auth === `Bearer ${WEBHOOK_SECRET}` && WEBHOOK_SECRET.length > 0;
}

type RCEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'PRODUCT_CHANGE'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'BILLING_ISSUE'
  | 'SUBSCRIBER_ALIAS'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'TRANSFER';

interface RCEvent {
  type: RCEventType;
  app_user_id: string;
  aliases?: string[];
}

interface RCPayload {
  event: RCEvent;
  api_version: string;
}

router.post('/', async (req: Request, res: Response) => {
  if (!verifySecret(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const payload = req.body as RCPayload;
  const event = payload?.event;

  if (!event?.app_user_id) {
    res.status(400).json({ error: 'Missing app_user_id' });
    return;
  }

  res.json({ ok: true });

  // Process async to avoid blocking RC
  handleRCEvent(event).catch((err) => {
    console.error('[RevenueCat] Error procesando evento:', event.type, err);
  });
});

async function handleRCEvent(event: RCEvent): Promise<void> {
  const userId = event.app_user_id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.warn(`[RevenueCat] Usuario no encontrado: ${userId}`);
    return;
  }

  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
      await prisma.user.update({
        where: { id: userId },
        data: { plan: 'active', revenuecat_id: userId },
      });
      console.log(`[RevenueCat] ${event.type} → plan: active para ${userId}`);
      break;

    case 'EXPIRATION':
      await prisma.user.update({
        where: { id: userId },
        data: { plan: 'expired' },
      });
      console.log(`[RevenueCat] EXPIRATION → plan: expired para ${userId}`);
      break;

    // CANCELLATION = cancelled future renewal, still active until period ends — no change
    case 'CANCELLATION':
    case 'BILLING_ISSUE':
    case 'SUBSCRIPTION_PAUSED':
    case 'SUBSCRIBER_ALIAS':
    case 'TRANSFER':
      console.log(`[RevenueCat] Evento ignorado: ${event.type}`);
      break;

    default:
      console.log(`[RevenueCat] Evento desconocido: ${(event as RCEvent).type}`);
  }
}

export default router;
