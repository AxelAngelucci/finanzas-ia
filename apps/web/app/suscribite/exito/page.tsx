import Logo from '@/components/logo'
import { Ico } from '@/components/icons'
import { WA_LINK } from '@/lib/constants'

export default function CheckoutSuccessPage() {
  return (
    <div className="sub-page">
      <div className="sub-col" style={{ paddingTop: 60, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
          <Logo />
        </div>
        <div className="co-check" style={{ margin: '0 auto' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m20 6-11 11-5-5" />
          </svg>
        </div>
        <h1 className="h-display" style={{ fontSize: 'clamp(28px,7vw,40px)', marginTop: 18 }}>
          ¡Ya sos Premium!
        </h1>
        <p className="lead" style={{ marginTop: 12, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          Activamos tu acceso y lo vinculamos a tu WhatsApp. Escribinos cuando quieras para empezar a registrar tus gastos.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, maxWidth: 340, margin: '24px auto 0' }}>
          <a href={WA_LINK} target="_blank" rel="noopener" className="btn btn-wa">{Ico.wa()} Empezar en WhatsApp</a>
        </div>
      </div>
    </div>
  )
}
