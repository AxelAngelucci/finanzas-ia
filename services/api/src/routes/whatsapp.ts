import { Router, Request, Response } from 'express';
import { validateRequest } from 'twilio';
import { prisma } from '../db/client';
import { getUserContext, callAI } from '../lib/aiHelpers';
import { sendText, downloadMedia } from '../lib/twilio';
import { redis } from '../lib/redis';
import { normalizeArgentinePhone } from '../lib/phone';

const router: import('express').Router = Router();

const AUTH_TOKEN       = process.env.TWILIO_AUTH_TOKEN ?? '';
const AI_URL           = process.env.AI_SERVICE_URL ?? 'http://localhost:8000';
const IS_DEV           = process.env.NODE_ENV !== 'production';

const HISTORY_TTL      = 30 * 60;   // 30 min de inactividad limpia el hilo
const HISTORY_MAX_MSGS = 20;        // últimos 20 mensajes (10 turnos)

type HistoryMsg = { role: 'user' | 'assistant'; content: string };

async function loadHistory(phone: string): Promise<HistoryMsg[]> {
  const raw = await redis.get(`wa:hist:${phone}`);
  if (!raw) return [];
  try { return JSON.parse(raw) as HistoryMsg[]; } catch { return []; }
}

async function saveHistory(phone: string, history: HistoryMsg[]): Promise<void> {
  const trimmed = history.slice(-HISTORY_MAX_MSGS);
  await redis.setex(`wa:hist:${phone}`, HISTORY_TTL, JSON.stringify(trimmed));
}

// ─── Signature verification ───────────────────────────────────────────────────

function verifyTwilioSignature(req: Request): boolean {
  if (IS_DEV) return true; // Skip validation in development (ngrok changes URL on each restart)
  const proto  = (req.headers['x-forwarded-proto'] as string) ?? req.protocol;
  const host   = (req.headers['x-forwarded-host'] as string) ?? (req.headers['host'] as string);
  const url    = `${proto}://${host}${req.originalUrl}`;
  const sig    = req.headers['x-twilio-signature'] as string ?? '';
  return validateRequest(AUTH_TOKEN, sig, url, req.body as Record<string, string>);
}

// ─── Transcribe audio buffer via AI service ───────────────────────────────────

async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  const blob     = new Blob([buffer], { type: mimeType });
  const formData = new FormData();
  const ext      = mimeType.split('/')[1]?.split(';')[0] ?? 'ogg';
  formData.append('file', blob, `audio.${ext}`);

  const res = await fetch(`${AI_URL}/transcribe`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Error transcribiendo audio: ${res.status}`);
  const data = await res.json() as { text: string };
  return data.text;
}

// ─── Core message handler ─────────────────────────────────────────────────────

const LANDING_URL = 'https://finanzas-ia.app/suscribite';
const TRIAL_DAYS  = 2;

async function getOrCreateUser(phone: string) {
  const existing = await prisma.user.findFirst({ where: { wa_phone: phone } });
  if (existing) return { user: existing, isNew: false };

  const trial_ends_at = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const user = await prisma.user.create({
    data: { wa_phone: phone, wa_verified: true, trial_ends_at },
  });
  return { user, isNew: true };
}

async function checkSubscription(user: Awaited<ReturnType<typeof prisma.user.findFirst>> & object, phone: string): Promise<boolean> {
  if (user.plan === 'active') return true;

  if (user.plan === 'expired') {
    await sendText(
      phone,
      `Tu período de prueba gratuita terminó 🔒\n\nPara seguir usando *Finanzas IA* suscribite acá:\n👉 ${LANDING_URL}\n\n¿Tenés dudas? Respondé este mensaje.`,
    );
    return false;
  }

  // plan === 'free' — check if trial has expired
  if (user.trial_ends_at && new Date() > user.trial_ends_at) {
    await prisma.user.update({ where: { id: user.id }, data: { plan: 'expired' } });
    await sendText(
      phone,
      `¡Hola! 👋 Tus 2 días de prueba gratuita terminaron.\n\nPara seguir usando *Finanzas IA* elegí tu plan:\n👉 ${LANDING_URL}\n\n¿Tenés dudas? Respondé este mensaje.`,
    );
    return false;
  }

  return true;
}

interface ImagePayload { base64: string; mime: string }

async function handleUserMessage(
  phone: string,
  text: string,
  channel: 'wa_text' | 'wa_audio',
  image?: ImagePayload,
): Promise<void> {
  const { user, isNew } = await getOrCreateUser(phone);

  if (isNew) {
    await sendText(
      phone,
      '¡Hola! Soy *Finanzas IA* 👋\n\nTu cuenta fue creada automáticamente. Tenés *2 días de prueba gratis* para registrar gastos, ingresos y preguntarme lo que quieras sobre tus finanzas.\n\nEjemplo: _"Gasté 1500 en el super"_',
    );
    return;
  }

  const canContinue = await checkSubscription(user, phone);
  if (!canContinue) return;

  const [history, { tone, context }] = await Promise.all([
    loadHistory(phone),
    getUserContext(user.id),
  ]);

  // Para el historial guardamos "[imagen]" en lugar del base64 completo
  const userContent = image ? `[imagen] ${text}`.trim() : text;

  const aiResponse = await callAI('/agent', {
    message:       text,
    history,
    user_id:       user.id,
    tone,
    context,
    channel,
    ...(image && { image_base64: image.base64, image_mime: image.mime }),
  });

  const reply = (aiResponse.reply as string ?? '').slice(0, 4096);

  await Promise.all([
    sendText(phone, reply),
    saveHistory(phone, [
      ...history,
      { role: 'user' as const,      content: userContent },
      { role: 'assistant' as const, content: reply },
    ]),
  ]);
}

// ─── Account linking ───────────────────────────────────────────────────────────

const CHILD_MODELS = ['transaction', 'budget', 'goal', 'subscription', 'commitment', 'insight'] as const;

async function handleLinkToken(phone: string, token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { wa_link_token: token, wa_link_token_exp: { gt: new Date() } },
  });

  if (!user) {
    await sendText(phone, 'El código es inválido o expiró. Generá uno nuevo desde la app en Configuración > WhatsApp.');
    return;
  }

  // This number may already belong to a "ghost" account auto-created the first
  // time someone messaged the bot before ever linking from the app. `wa_phone`
  // is unique, so we must migrate that account's data into the app account
  // (or reject the link if it's a real, separate account) before updating it.
  const ghost = await prisma.user.findFirst({ where: { wa_phone: phone } });

  if (ghost && ghost.id !== user.id) {
    if (ghost.email || ghost.password_hash) {
      await sendText(
        phone,
        'Este número de WhatsApp ya está vinculado a otra cuenta de Finanzas IA. Desvinculalo primero desde esa cuenta para poder usarlo acá.',
      );
      return;
    }

    try {
      await prisma.$transaction(async (tx) => {
        for (const model of CHILD_MODELS) {
          await (tx[model] as { updateMany: (args: unknown) => Promise<unknown> }).updateMany({
            where: { user_id: ghost.id },
            data: { user_id: user.id },
          });
        }
        await tx.user.delete({ where: { id: ghost.id } });
        await tx.user.update({
          where: { id: user.id },
          data: { wa_phone: phone, wa_verified: true, wa_link_token: null, wa_link_token_exp: null },
        });
      });
    } catch (err) {
      console.error('[WhatsApp] Error migrando cuenta fantasma al vincular:', err);
      await sendText(phone, 'Hubo un error vinculando tu cuenta. Probá de nuevo en unos minutos o contactanos.');
      return;
    }

    await sendText(
      phone,
      '✅ *¡Cuenta vinculada!*\n\nLos gastos que ya habías registrado por WhatsApp ahora están en tu cuenta de la app. Escribime un gasto, un ingreso, o preguntame lo que quieras sobre tus finanzas.\n\nEjemplo: _"Gasté 1500 en el super"_',
    );
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data:  { wa_phone: phone, wa_verified: true, wa_link_token: null, wa_link_token_exp: null },
  });

  await sendText(
    phone,
    '✅ *¡Cuenta vinculada!*\n\nYa podés usar Finanzas IA por WhatsApp. Escribime un gasto, un ingreso, o preguntame lo que quieras sobre tus finanzas.\n\nEjemplo: _"Gasté 1500 en el super"_',
  );
}

// ─── GET /webhook/whatsapp — health check ────────────────────────────────────

router.get('/', (_req: Request, res: Response) => {
  res.type('text/xml').send('<Response/>');
});

// ─── POST /webhook/whatsapp — receive messages ────────────────────────────────

router.post('/', (req: Request, res: Response) => {
  if (!verifyTwilioSignature(req)) {
    res.status(403).send('Forbidden');
    return;
  }

  // ACK immediately — Twilio expects a response within 20 seconds
  res.type('text/xml').send('<Response/>');

  // Process async — errors are logged, never re-thrown to avoid double responses
  processWebhook(req.body as Record<string, string>).catch((err) => {
    console.error('[WhatsApp] Error procesando mensaje:', err);
  });
});

async function processWebhook(body: Record<string, string>): Promise<void> {
  const from     = body['From'] ?? '';
  const numMedia = parseInt(body['NumMedia'] ?? '0', 10);
  const rawPhone = from.replace('whatsapp:', '');
  const phone = normalizeArgentinePhone(rawPhone);

  if (!phone) return;

  // ── Media (image or audio) ────────────────────────────────────────────────
  if (numMedia > 0) {
    const mediaUrl = body['MediaUrl0'];
    const mimeType = body['MediaContentType0'] ?? 'application/octet-stream';
    if (!mediaUrl) return;

    const buffer = await downloadMedia(mediaUrl);

    if (mimeType.startsWith('image/')) {
      const base64   = buffer.toString('base64');
      const caption  = (body['Body'] ?? '').trim() || 'Analizá este ticket o factura y registrá el gasto.';
      await handleUserMessage(phone, caption, 'wa_text', { base64, mime: mimeType });
      return;
    }

    // Audio / voice note
    const transcription = await transcribeAudio(buffer, mimeType);
    await handleUserMessage(phone, transcription, 'wa_audio');
    return;
  }

  // ── Text message ──────────────────────────────────────────────────────────
  const text = (body['Body'] ?? '').trim();
  if (!text) return;

  if (text.toLowerCase().startsWith('vincular_')) {
    await handleLinkToken(phone, text.replace(/^vincular_/i, '').trim());
    return;
  }

  await handleUserMessage(phone, text, 'wa_text');
}

export default router;
