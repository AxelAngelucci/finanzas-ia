import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos inválidos',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  if (err instanceof Error) {
    console.error('[Error]', err.message);
    const status = (err as any).status ?? 500;
    res.status(status).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}

export function createError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}
