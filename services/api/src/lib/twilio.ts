import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken  = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER ?? 'whatsapp:+14155238886';

const client = twilio(accountSid, authToken);

export async function sendText(to: string, text: string): Promise<void> {
  const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  await client.messages.create({ from: fromNumber, to: toWa, body: text });
}

export async function downloadMedia(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
    },
  });
  if (!res.ok) throw new Error(`Error descargando media de Twilio: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
