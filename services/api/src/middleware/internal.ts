import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { verifyAccess } from '../lib/jwt';

export function requireInternalOrJwt(req: Request, res: Response, next: NextFunction) {
  const serviceToken = req.headers['x-service-token'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (serviceToken && serviceToken === process.env.INTERNAL_SERVICE_TOKEN && userId) {
    (req as AuthRequest).userId = userId;
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }
  try {
    const payload = verifyAccess(header.slice(7));
    (req as AuthRequest).userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
