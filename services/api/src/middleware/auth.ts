import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../lib/jwt';

export interface AuthRequest extends Request {
  userId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyAccess(token);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
