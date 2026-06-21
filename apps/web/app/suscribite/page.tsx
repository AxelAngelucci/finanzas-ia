'use client'
import { useState, useEffect } from 'react'
import Logo from '@/components/logo'
import { Ico } from '@/components/icons'
import { WA_LINK } from '@/lib/constants'
import { openCheckout } from '@/lib/checkout'

const subPerks = [
  ['Notas de voz y fotos de tickets', 'Registrá hablando o sacándole una foto al ticket — ilimitado.'],
  ['Presupuestos y metas sin límite', 'Creá todos los que quieras y seguí tu progreso real.'],
  ['Detección de suscripciones', 'La IA encuentra esos débitos que te olvidaste que pagás.'],
  ['Espacios compartidos', 'Gastos en común con tu pareja o familia, sin mezclar.'],
  ['Recap mensual con IA', 'Un resumen claro de tu mes y en qué se te fue la plata.'],
]

function StickyCTA() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 360)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className={'sub-sticky' + (show ? ' show' : '')}>
      <div className="sub-sticky-inner">
        <div className="sub-sticky-meta">
          <b>14 días gratis</b>
          <span>Después $3.999/mes · cancelás cuando quieras</span>
        </div>
        <button className="btn btn-grad" onClick={() => openCheckout('mensual')}>Activar prueba</button>
      </div>
    </div>
  )
}

export default function SuscribitePage() {
  return (
    <div className="sub-page">
      <div className="blob" style={{ width: 480, height: 480, background: '#6366F1', top: -180, left: '50%', transform: 'translateX(-50%)', opacity: .32 }} />
      <div className="blob" style={{ width: 360, height: 360, background: '#25D366', top: 60, right: -160, opacity: .14 }} />

      <div className="sub-col">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
          <Logo />
        </div>

        <div className="sub-hero">
          <span className="chip" style={{ marginBottom: 18, color: 'var(--wa)', borderColor: 'rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)' }}>
            {Ico.wa(15)} Ya probaste la app — el siguiente paso
          </span>
          <h1 className="h-display" style={{ fontSize: 'clamp(32px,8vw,46px)' }}>
            Te enganchó, ¿no?<br /><span className="gradtext">Desbloqueá todo, gratis 14 días.</span>
          </h1>
          <p className="lead" style={{ marginTop: 18 }}>
            Ya viste lo fácil que es registrar gastos. Activá tu prueba y llevá el control total de tu plata — <b style={{ color: 'var(--text)' }}>sin pagar un peso hoy.</b>
          </p>
          <button className="btn btn-grad sub-bigcta" onClick={() => openCheckout('mensual')}>
            Empezar mis 14 días gratis
          </button>
          <p className="sub-micro">
            {Ico.check(14, '#34D399')} No pagás nada hoy &nbsp;·&nbsp; {Ico.check(14, '#34D399')} Cancelás cuando quieras
          </p>

          <div className="sub-proof">
            <div style={{ display: 'flex' }}>
              {['#6366F1', '#8B5CF6', '#34D399', '#F59E0B', '#EC4899'].map((c, i) => (
                <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: '2px solid #08080F', marginLeft: i ? -10 : 0 }} />
              ))}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text2)' }}>
              <span style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                {Ico.star(13)}{Ico.star(13)}{Ico.star(13)}{Ico.star(13)}{Ico.star(13)}
              </span>
              <b style={{ color: 'var(--text)' }}>+50.000</b> ya se ordenan con Premium
            </div>
          </div>
        </div>

        <div className="sub-card">
          <div className="sub-eyebrow">Con Premium desbloqueás</div>
          <div className="sub-perks">
            {subPerks.map(([t, d]) => (
              <div key={t} className="sub-perk">
                <span className="sub-perk-ic">{Ico.check(15, '#fff')}</span>
                <div>
                  <b>{t}</b>
                  <div className="sub-perk-d">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sub-eyebrow center" style={{ marginTop: 38 }}>Elegí cómo seguir</div>
        <h2 className="h-sec" style={{ fontSize: 'clamp(24px,6vw,32px)', textAlign: 'center', marginTop: 8, marginBottom: 22 }}>
          Activá tu prueba o asegurate de por vida.
        </h2>

        <div className="sub-plans">
          <button className="sub-plan featured" onClick={() => openCheckout('mensual')}>
            <div className="sub-plan-badge">Empezá acá · 14 días gratis</div>
            <div className="sub-plan-name">Mensual</div>
            <div className="sub-plan-price">
              <span className="mono gradtext">$3.999</span>
              <span className="sub-plan-unit">/ mes</span>
            </div>
            <div className="sub-plan-note">Hoy pagás <b>$0</b>. Después $3.999/mes. Cancelás cuando quieras.</div>
            <div className="btn btn-grad" style={{ width: '100%', marginTop: 16 }}>Empezar gratis</div>
          </button>

          <button className="sub-plan" onClick={() => openCheckout('lifetime')}>
            <div className="sub-plan-tag">Mejor valor</div>
            <div className="sub-plan-name">De por vida</div>
            <div className="sub-plan-price">
              <span className="mono">$49.999</span>
              <span className="sub-plan-unit">/ único</span>
            </div>
            <div className="sub-plan-note">Un solo pago y es tuyo <b>para siempre</b>. Sin renovaciones ni aumentos.</div>
            <div className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }}>Comprar de por vida</div>
          </button>
        </div>

        <div className="sub-quote">
          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 12 }}>
            {Ico.star(16)}{Ico.star(16)}{Ico.star(16)}{Ico.star(16)}{Ico.star(16)}
          </div>
          <p>&ldquo;Probé un montón de apps y las dejé todas. Con esta, mandar un audio por WhatsApp y que quede anotado me cambió la cabeza. La pago feliz.&rdquo;</p>
          <div className="sub-quote-person">
            <div className="tavatar" style={{ background: '#8B5CF6', width: 38, height: 38 }}>M</div>
            <div>
              <b style={{ fontSize: 14 }}>Martín G.</b>
              <div style={{ color: 'var(--text3)', fontSize: 12.5 }}>Freelance, Córdoba</div>
            </div>
          </div>
        </div>

        <div className="sub-trust">
          <div>{Ico.check(16, '#34D399')} No te cobramos hoy</div>
          <div>{Ico.check(16, '#34D399')} Cancelás en 1 toque</div>
          <div>{Ico.check(16, '#34D399')} Tus datos quedan intactos</div>
        </div>

        <div className="sub-faq">
          {[
            ['¿Me cobran algo hoy?', 'No. Activás 14 días gratis y recién después se debita $3.999/mes. Te avisamos antes.'],
            ['¿Puedo cancelar?', 'Sí, cuando quieras y en un toque. Si cancelás durante la prueba, no pagás nada.'],
            ['¿Pierdo lo que ya cargué?', 'Para nada. Todos tus gastos y metas siguen igual, solo desbloqueás más funciones.'],
          ].map(([q, a]) => (
            <div key={q} className="sub-faq-item">
              <b>{q}</b>
              <p>{a}</p>
            </div>
          ))}
        </div>

        <div className="sub-secure">
          {Ico.lock(13)}
          Pago seguro con RevenueCat + Stripe
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: 14, paddingBottom: 40 }}>
          © 2026 Finia · Hecho en Argentina 🇦🇷
        </p>
      </div>

      <StickyCTA />
    </div>
  )
}
