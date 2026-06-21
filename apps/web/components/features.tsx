import { Ico } from './icons'
import { Phone, ScreenDashboard, ScreenMovimientos, ScreenMetas } from './phone-mockups'

export default function Features() {
  return (
    <section className="section" id="funciones" style={{ padding: '70px 0', display: 'flex', flexDirection: 'column', gap: 90 }}>
      <div className="wrap" style={{ textAlign: 'center' }}>
        <span className="eyebrow">Funciones</span>
        <h2 className="h-sec" style={{ marginTop: 14 }}>Pensada para que entiendas tu plata.</h2>
      </div>

      <div className="wrap reveal">
        <div className="feature-row">
          <div className="feat-text">
            <div className="feat-badge" style={{ color: 'var(--success)' }}>{Ico.bolt(22)}</div>
            <h3 className="h-sec" style={{ fontSize: 'clamp(24px,3vw,34px)', marginTop: 18 }}>Cuánto podés gastar hoy</h3>
            <p className="lead" style={{ marginTop: 14 }}>Un número grande y claro que tiene en cuenta tus ingresos, gastos fijos y metas. Sin cuentas en la cabeza.</p>
            <ul className="feat-list">
              <li>{Ico.check(18)} Disponible diario calculado en tiempo real</li>
              <li>{Ico.check(18)} Balance, ingresos y gastos del mes de un vistazo</li>
              <li>{Ico.check(18)} Insights de IA sobre tus hábitos</li>
            </ul>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Phone><ScreenDashboard /></Phone>
          </div>
        </div>
      </div>

      <div className="wrap reveal">
        <div className="feature-row flip">
          <div className="feat-text">
            <div className="feat-badge">{Ico.brain(22)}</div>
            <h3 className="h-sec" style={{ fontSize: 'clamp(24px,3vw,34px)', marginTop: 18 }}>Cada gasto, en su lugar</h3>
            <p className="lead" style={{ marginTop: 14 }}>La IA clasifica y agrupa todo por categoría y canal. Ves al instante qué entró por la app y qué anotaste por WhatsApp.</p>
            <ul className="feat-list">
              <li>{Ico.check(18)} Categorización automática y editable</li>
              <li>{Ico.check(18)} Ícono de canal en cada movimiento (app · texto · audio)</li>
              <li>{Ico.check(18)} Búsqueda y filtros por tipo</li>
            </ul>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Phone><ScreenMovimientos /></Phone>
          </div>
        </div>
      </div>

      <div className="wrap reveal">
        <div className="feature-row">
          <div className="feat-text">
            <div className="feat-badge" style={{ color: 'var(--primary-2)' }}>{Ico.target(22)}</div>
            <h3 className="h-sec" style={{ fontSize: 'clamp(24px,3vw,34px)', marginTop: 18 }}>Metas que sí cumplís</h3>
            <p className="lead" style={{ marginTop: 14 }}>Definí un objetivo y la app te dice cuánto guardar por mes para llegar. Con barras de progreso y recordatorios.</p>
            <ul className="feat-list">
              <li>{Ico.check(18)} Cuánto ahorrar por mes para cada meta</li>
              <li>{Ico.check(18)} Presupuestos con alertas de límite</li>
              <li>{Ico.check(18)} Recap mensual de tu progreso</li>
            </ul>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Phone><ScreenMetas /></Phone>
          </div>
        </div>
      </div>
    </section>
  )
}
