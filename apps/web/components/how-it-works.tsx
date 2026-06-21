const steps = [
  { n: '01', t: 'Contanos lo que gastás', d: 'Texto o audio, en la app o por WhatsApp. "Pagué 12.500 en el súper" alcanza.' },
  { n: '02', t: 'La IA lo ordena', d: 'Clasifica la categoría, detecta el canal y reconoce tus suscripciones automáticamente.' },
  { n: '03', t: 'Sabés cuánto podés gastar', d: 'Tu disponible del día, tus metas y alertas — todo claro, sin abrir una planilla nunca más.' },
]

export default function HowItWorks() {
  return (
    <section className="section reveal" id="como" style={{ padding: '70px 0' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="eyebrow">Cómo funciona</span>
          <h2 className="h-sec" style={{ marginTop: 14 }}>Tres pasos. Cero fricción.</h2>
        </div>
        <div className="steps">
          {steps.map(s => (
            <div key={s.n} className="card step">
              <div className="step-n">{s.n}</div>
              <h3 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 20 }}>{s.t}</h3>
              <p style={{ color: 'var(--text2)', marginTop: 9, fontSize: 15.5 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
