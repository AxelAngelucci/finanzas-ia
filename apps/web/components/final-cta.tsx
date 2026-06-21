import CTAButtons from './cta-buttons'

export default function FinalCTA() {
  return (
    <section className="section reveal" id="descargar" style={{ padding: '40px 0 20px' }}>
      <div className="wrap">
        <div className="cta-band" style={{ textAlign: 'center' }}>
          <div className="blob" style={{ width: 300, height: 300, background: '#A78BFA', top: -80, right: -40, opacity: .4 }} />
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="h-sec" style={{ maxWidth: 640 }}>Empezá a ordenar tu plata en 30 segundos.</h2>
            <p className="lead" style={{ marginTop: 14, color: 'rgba(255,255,255,0.82)', maxWidth: 520 }}>
              Mandá un WhatsApp o descargá la app. Probala 14 días gratis, sin tarjeta.
            </p>
            <div style={{ marginTop: 28 }}><CTAButtons full /></div>
            <div style={{ display: 'flex', gap: 14, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span className="chip" style={{ background: 'rgba(0,0,0,0.2)' }}> App Store</span>
              <span className="chip" style={{ background: 'rgba(0,0,0,0.2)' }}>▶ Google Play</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
