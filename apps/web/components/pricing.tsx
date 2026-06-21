'use client'
import { Ico } from './icons'
import { openCheckout } from '@/lib/checkout'

const feats = [
  'Registro ilimitado por app y WhatsApp',
  'Texto, audio y foto de tickets',
  'Presupuestos y metas ilimitadas',
  'Detección automática de suscripciones',
  'Espacios compartidos (familia/pareja)',
  'Recap mensual e insights de IA',
]

export default function Pricing() {
  return (
    <section className="section reveal" id="precios" style={{ padding: '70px 0' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 46 }}>
          <span className="eyebrow">Precios</span>
          <h2 className="h-sec" style={{ marginTop: 14 }}>Un solo plan. Lo pagás como quieras.</h2>
          <p className="lead" style={{ marginTop: 14 }}>Acceso completo a todo. Elegí mensual para probar o de por vida y olvidate de pagar.</p>
        </div>
        <div className="price-grid">
          <div className="card price-card">
            <div style={{ fontWeight: 700, fontSize: 18 }}>Mensual</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Flexible, cancelás cuando quieras</div>
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="price-amt mono">$3.999</span>
              <span style={{ color: 'var(--text3)' }}>/ mes</span>
            </div>
            <ul className="price-feats">
              {feats.map(f => (
                <li key={f}>{Ico.check(17, '#818CF8')}{f}</li>
              ))}
            </ul>
            <button
              onClick={() => openCheckout('mensual')}
              className="btn btn-ghost"
              style={{ marginTop: 'auto', cursor: 'pointer' }}
            >
              Probar 14 días gratis
            </button>
          </div>

          <div className="card price-card pro">
            <div style={{ position: 'absolute', top: 22, right: 24 }} className="chip">⭐ Mejor valor</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>De por vida</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Un solo pago, tuyo para siempre</div>
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="price-amt gradtext mono">$49.999</span>
              <span style={{ color: 'var(--text3)' }}>/ pago único</span>
            </div>
            <ul className="price-feats">
              <li style={{ color: 'var(--text)', fontWeight: 600 }}>{Ico.check(17, '#A78BFA')}Todo lo del plan Mensual, para siempre</li>
              {feats.slice(1).map(f => (
                <li key={f}>{Ico.check(17, '#A78BFA')}{f}</li>
              ))}
              <li style={{ color: 'var(--text)', fontWeight: 600 }}>{Ico.check(17, '#A78BFA')}Sin renovaciones ni aumentos nunca más</li>
            </ul>
            <button
              onClick={() => openCheckout('lifetime')}
              className="btn btn-grad"
              style={{ marginTop: 'auto', cursor: 'pointer' }}
            >
              Comprar de por vida
            </button>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 22 }}>
          Precios en pesos argentinos. La opción mensual la cancelás cuando quieras, sin vueltas.
        </p>
      </div>
    </section>
  )
}
