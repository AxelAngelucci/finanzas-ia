import { Ico } from './icons'

const testimonials = [
  { q: 'La uso desde WhatsApp mientras hago la cola del súper. Nunca me había mantenido tan al día con mis gastos.', n: 'Valentina R.', r: 'Diseñadora, CABA', c: '#6366F1' },
  { q: 'Lo de la nota de voz es magia. Manejo y digo "carga de nafta 40 lucas" y queda anotado solo.', n: 'Martín G.', r: 'Freelance, Córdoba', c: '#8B5CF6' },
  { q: 'Por fin entiendo en qué se me va la plata. El número de "cuánto puedo gastar hoy" me cambió la cabeza.', n: 'Sofía L.', r: 'Contadora, Rosario', c: '#34D399' },
]

export default function Testimonials() {
  return (
    <section className="section reveal" style={{ padding: '70px 0' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 46 }}>
          <span className="eyebrow">Testimonios</span>
          <h2 className="h-sec" style={{ marginTop: 14 }}>Le gusta a quien le cuesta ahorrar.</h2>
        </div>
        <div className="tgrid">
          {testimonials.map(x => (
            <div key={x.n} className="card tcard">
              <div style={{ display: 'flex', gap: 3 }}>
                {Ico.star(16)}{Ico.star(16)}{Ico.star(16)}{Ico.star(16)}{Ico.star(16)}
              </div>
              <p>&ldquo;{x.q}&rdquo;</p>
              <div className="tperson">
                <div className="tavatar" style={{ background: x.c }}>{x.n[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{x.n}</div>
                  <div style={{ color: 'var(--text3)', fontSize: 13 }}>{x.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
