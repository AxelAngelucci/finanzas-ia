import Stripe from 'stripe';

let client: Stripe | null = null;

// Lazy singleton — constructing Stripe with an empty apiKey throws immediately,
// which used to crash the whole process at import time whenever
// STRIPE_SECRET_KEY was missing in the environment.
export function getStripe(): Stripe {
  if (!client) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) throw new Error('STRIPE_SECRET_KEY no está configurada');
    client = new Stripe(apiKey);
  }
  return client;
}
