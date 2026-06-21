const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function startCheckout(phone: string, plan: 'mensual' | 'lifetime'): Promise<void> {
  const res = await fetch(`${API_URL}/v1/billing/checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, plan }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || 'No pudimos iniciar el pago. Probá de nuevo en un momento.')
  }

  const { url } = await res.json()
  window.location.href = url
}

export function openCheckout(plan: 'mensual' | 'lifetime') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-checkout', { detail: { plan } }))
  }
}
