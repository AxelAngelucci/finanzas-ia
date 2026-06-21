import { Ico } from './icons'
import { WA_LINK } from '@/lib/constants'
import WaChat from './wa-chat'

export default function WhatsAppSection() {
  return (
    <section className="section reveal" id="whatsapp" style={{ padding: '70px 0', position: 'relative' }}>
      <div className="blob" style={{ width: 480, height: 480, background: '#25D366', top: -40, left: -160, opacity: .16 }} />
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 0.85fr', gap: 60, alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <div>
          <span className="eyebrow" style={{ color: 'var(--wa)' }}>{Ico.wa(16)} Sin instalar nada</span>
          <h2 className="h-sec" style={{ marginTop: 16 }}>Tu contador personal,<br />en el chat que ya usás.</h2>
          <p className="lead" style={{ marginTop: 18, maxWidth: 480 }}>
            Mandá un texto o una nota de voz y listo. La IA entiende, clasifica y responde. Empezá hoy sin descargar la app — después la sumás cuando quieras.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '26px 0 30px' }}>
            {[
              ['Texto, audio o foto', 'Escribí, mandá un audio o sacale una foto al ticket.'],
              ['Respuesta al toque', 'Confirmación y categoría al instante.'],
              ['Se sincroniza con la app', 'Todo aparece igual en tu dashboard.'],
            ].map(([t, d]) => (
              <div key={t} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(37,211,102,0.14)', border: '1px solid rgba(37,211,102,0.3)', display: 'grid', placeItems: 'center', flex: 'none', color: 'var(--wa)' }}>
                  {Ico.check(15, '#25D366')}
                </span>
                <div>
                  <b style={{ fontSize: 15.5 }}>{t}</b>
                  <div style={{ color: 'var(--text2)', fontSize: 14.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
          <a href={WA_LINK} target="_blank" rel="noopener" className="btn btn-wa">
            {Ico.wa()} Escribirnos por WhatsApp
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <WaChat />
        </div>
      </div>
    </section>
  )
}
