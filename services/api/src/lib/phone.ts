// Argentina: los números de celular llevan un "9" después del +54 (+54 9 11 ...),
// pero Twilio lo omite en el From del webhook (+5411... en vez de +54911...).
// El checkout web tampoco lo pide de forma obligatoria. Esta normalización es el
// único punto de verdad para pasar cualquier variante al mismo wa_phone canónico,
// así un usuario que paga por Stripe siempre matchea con su cuenta de WhatsApp.
export function normalizeArgentinePhone(phone: string): string {
  return phone.replace(/^\+54(?!9)(\d+)$/, '+549$1');
}
