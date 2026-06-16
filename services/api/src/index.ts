import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import transactionRoutes from './routes/transactions';
import budgetRoutes from './routes/budgets';
import goalRoutes from './routes/goals';
import aiRoutes from './routes/ai';
import commitmentRoutes from './routes/commitments';
import whatsappRoutes from './routes/whatsapp';
import { errorHandler } from './middleware/error';

const app: import('express').Application = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// Webhook de Twilio requiere form-encoded y debe registrarse antes del json() global
app.use('/webhook/whatsapp', express.urlencoded({ extended: false }), whatsappRoutes);

app.use(express.json({ limit: '2mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/transactions', transactionRoutes);
app.use('/v1/budgets', budgetRoutes);
app.use('/v1/goals', goalRoutes);
app.use('/v1/ai', aiRoutes);
app.use('/v1/commitments', commitmentRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[API] Listening on :${PORT} — env: ${process.env.NODE_ENV ?? 'development'}`);
  const sid = process.env.TWILIO_ACCOUNT_SID;
  console.log(`[Twilio] SID defined: ${sid !== undefined}, length: ${sid?.length ?? 0}, starts_AC: ${sid?.startsWith('AC')}, repr: ${JSON.stringify(sid?.slice(0, 6))}`);
});

export default app;
