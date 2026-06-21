import { Ico } from './icons'
import { WA_LINK } from '@/lib/constants'
import CTAButtons from './cta-buttons'
import WaChat from './wa-chat'

function Proof({ center }: { center?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 30, justifyContent: center ? 'center' : 'flex-start', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex' }}>
          {['#6366F1', '#8B5CF6', '#34D399', '#F59E0B'].map((c, i) => (
            <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: '2px solid #08080F', marginLeft: i ? -10 : 0 }} />
          ))}
        </div>
        <span style={{ fontSize: 13.5, color: 'var(--text2)' }}>
          <b style={{ color: 'var(--text)' }}>+50.000</b> argentinos
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text2)' }}>
        <span style={{ display: 'flex', gap: 2 }}>{Ico.star()}{Ico.star()}{Ico.star()}{Ico.star()}{Ico.star()}</span>
        <b style={{ color: 'var(--text)' }}>4.8</b> en App Store
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--text2)' }}>
        <b style={{ color: 'var(--text)' }}>1,2M</b> gastos registrados
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="section" id="top" style={{ paddingTop: 130, paddingBottom: 70, position: 'relative' }}>
      <div className="blob" style={{ width: 520, height: 520, background: '#25D366', top: -100, right: -140, opacity: .22 }} />
      <div className="blob" style={{ width: 460, height: 460, background: '#6366F1', top: 80, left: -150, opacity: .32 }} />
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 0.85fr', gap: 50, alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <div>
          <span className="chip" style={{ marginBottom: 18, color: 'var(--wa)', borderColor: 'rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)' }}>
            {Ico.wa(15)} No es una app más — vive en tu WhatsApp
          </span>
          <h1 className="h-display">
            Registrá un gasto<br />con <span className="gradtext">un mensaje.</span>
          </h1>
          <p className="lead" style={{ marginTop: 20, maxWidth: 520 }}>
            Apps para anotar gastos hay miles, y todas terminás abandonando. Esta no: le escribís, le mandás un audio o le sacás una foto al ticket por WhatsApp. La IA lo lee, lo clasifica y lo suma a tu mes al instante.
          </p>
          <div style={{ marginTop: 30 }}><CTAButtons /></div>
          <p style={{ marginTop: 14, fontSize: 13.5, color: 'var(--text3)' }}>
            Sin descargar nada para empezar · la app suma los gráficos y metas cuando quieras.
          </p>
          <Proof />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <WaChat />
        </div>
      </div>
    </section>
  )
}
