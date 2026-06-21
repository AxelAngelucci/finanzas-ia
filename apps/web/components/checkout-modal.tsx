'use client'
import { useState, useEffect } from 'react'
import Logo from './logo'
import { Ico } from './icons'
import { startCheckout } from '@/lib/checkout'

const PLANS = {
  mensual:  { id: 'mensual',  name: 'Mensual',     price: '$3.999',  unit: '/ mes',        trial: true  },
  lifetime: { id: 'lifetime', name: 'De por vida', price: '$49.999', unit: '/ pago único', trial: false },
}

type PlanId = keyof typeof PLANS

export default function CheckoutModal() {
  const [open, setOpen]       = useState(false)
  const [plan, setPlan]       = useState<PlanId>('mensual')
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ plan?: PlanId }>).detail
      setPlan(detail?.plan || 'mensual')
      setError('')
      setOpen(true)
    }
    window.addEventListener('open-checkout', onOpen)
    return () => window.removeEventListener('open-checkout', onOpen)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const P = PLANS[plan]
  const phoneDigits = phone.replace(/\D/g, '')
  const phoneOk = phoneDigits.length >= 10
  const fmtPhone = (v: string) => v.replace(/[^\d ]/g, '').slice(0, 16)

  async function handleContinue() {
    setLoading(true)
    setError('')
    try {
      await startCheckout(phoneDigits, plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal.')
      setLoading(false)
    }
  }

  return (
    <div
      className="co-overlay"
      onClick={(e) => { if ((e.target as HTMLElement).classList.contains('co-overlay')) setOpen(false) }}
    >
      <div className="co-modal" role="dialog" aria-modal="true">
        <div className="co-head">
          <Logo />
          <button className="co-close" onClick={() => setOpen(false)} aria-label="Cerrar">
            {Ico.close(18)}
          </button>
        </div>

        <div className="co-body">
          <div className="co-plan-toggle">
            {Object.values(PLANS).map(pl => (
              <button key={pl.id} className={'co-plan' + (plan === pl.id ? ' sel' : '')} onClick={() => setPlan(pl.id as PlanId)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{pl.name}</b>
                  {pl.id === 'lifetime' && <span className="co-tag">Mejor valor</span>}
                </div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
                  {pl.price}<span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}> {pl.unit}</span>
                </div>
              </button>
            ))}
          </div>

          <label className="co-label">Tu número de WhatsApp</label>
          <div className="co-phone">
            <span className="co-cc">🇦🇷 +54</span>
            <input
              className="co-input"
              inputMode="tel"
              placeholder="9 11 5555 5555"
              value={phone}
              onChange={e => setPhone(fmtPhone(e.target.value))}
              autoFocus
            />
          </div>
          <p className="co-hint">{Ico.wa(14)} Vinculamos tu suscripción a este número. Cuando registres gastos por WhatsApp, ya vamos a saber que sos premium — sin login.</p>

          {P.trial && (
            <div className="co-banner">
              <b>14 días gratis.</b> Te vamos a pedir la tarjeta en el siguiente paso, pero no se cobra nada hasta que termine la prueba. Cancelás cuando quieras.
            </div>
          )}

          {error && <p style={{ color: '#F87171', fontSize: 13, marginTop: 10 }}>{error}</p>}

          <button className="btn btn-grad co-cta" disabled={!phoneOk || loading} onClick={handleContinue}>
            {loading ? 'Redirigiendo...' : 'Continuar al pago seguro'}
          </button>
          <div className="co-secure">
            {Ico.lock(13)}
            Pago procesado por <b>Stripe</b> · nunca vemos los datos de tu tarjeta
          </div>
        </div>
      </div>
    </div>
  )
}
