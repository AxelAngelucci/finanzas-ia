import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../db/client';

// Llamadas internas (AI service procesando WhatsApp) ya pasaron por checkSubscription()
// en whatsapp.ts antes de llegar acá — no se re-evalúa el plan para no duplicar la lógica.
export async function requireActivePlan(req: Request, res: Response, next: NextFunction) {
  const serviceToken = req.headers['x-service-token'] as string;
  if (serviceToken && serviceToken === process.env.INTERNAL_SERVICE_TOKEN) {
    next();
    return;
  }

  try {
    const userId = (req as AuthRequest).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, trial_ends_at: true },
    });

    const inTrial = user?.plan === 'free' && !!user.trial_ends_at && new Date() <= user.trial_ends_at;
    const allowed = user?.plan === 'active' || inTrial;

    if (!allowed) {
      res.status(403).json({ error: 'Necesitás una suscripción activa', code: 'SUBSCRIPTION_REQUIRED' });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
