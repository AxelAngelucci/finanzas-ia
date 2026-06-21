import type { CSSProperties, ReactNode } from 'react'

const IcWa = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
    <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.2-.9-2.7-1.2-4.4-4-4.5-4.2-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.1.1.3 0 .5l-.4.5c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4 0 .5-.1l.8-1c.2-.2.3-.2.5-.1l2 .9c.2.1.4.2.4.3.1.2.1.6 0 .8Z" />
  </svg>
)

const IcMic = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
)

const IcApp = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
)

function StatusBar() {
  return (
    <div className="scr-statusbar">
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
          <rect x="0" y="6" width="3" height="5" rx="1" />
          <rect x="4.5" y="4" width="3" height="7" rx="1" />
          <rect x="9" y="2" width="3" height="9" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <path d="M7.5 2.2c2 0 3.8.8 5.1 2l1-1.1A9 9 0 0 0 7.5.6 9 9 0 0 0 1.4 3.1l1 1.1A7.5 7.5 0 0 1 7.5 2.2Zm0 3c1.1 0 2.1.4 2.8 1.1l1-1.1A6 6 0 0 0 7.5 3.7 6 6 0 0 0 3.7 5.2l1 1.1A4.4 4.4 0 0 1 7.5 5.2Zm0 3c.5 0 1 .2 1.3.6l-1.3 1.4-1.3-1.4c.4-.4.8-.6 1.3-.6Z" />
        </svg>
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
          <rect x="0.5" y="0.5" width="20" height="11" rx="3" stroke="currentColor" opacity=".5" />
          <rect x="2" y="2" width="16" height="8" rx="1.5" fill="currentColor" />
          <rect x="21.5" y="3.5" width="1.5" height="5" rx=".7" fill="currentColor" opacity=".5" />
        </svg>
      </span>
    </div>
  )
}

function MiniTxn({ ic, bg, t, s, amt, neg }: { ic: ReactNode; bg: string; t: string; s: string; amt: string; neg?: boolean }) {
  return (
    <div className="txn-row">
      <div className="txn-ic" style={{ background: bg }}>{ic}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</div>
        <div style={{ color: '#6F6F8E', fontSize: 11 }}>{s}</div>
      </div>
      <div className="mono" style={{ fontWeight: 700, fontSize: 13.5, color: neg ? '#F87171' : '#34D399' }}>{amt}</div>
    </div>
  )
}

function DayLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#6F6F8E', textTransform: 'uppercase', marginTop: 4 }}>{children}</div>
}

export function ScreenDashboard() {
  return (
    <div className="scr" style={{ background: '#0C0C1A' }}>
      <StatusBar />
      <div className="scr-body">
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600 }}>Junio 2026</div>
          <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: '-0.02em', marginTop: 2 }}>Hola, Valentina 👋</div>
        </div>

        <div className="mini-card" style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#EAFFF6' }}>
          <div className="deco-circle" style={{ width: 120, height: 120, top: -40, right: -20, background: 'rgba(255,255,255,0.12)' }} />
          <div className="deco-circle" style={{ width: 80, height: 80, bottom: -30, right: 30, background: 'rgba(255,255,255,0.08)' }} />
          <div className="label">¿Cuánto podés gastar hoy?</div>
          <div className="big mono">$ 6.777</div>
          <div style={{ display: 'flex', gap: 26, marginTop: 12, fontSize: 10.5 }}>
            <div><div style={{ opacity: .8 }}>Disponible</div><div className="mono" style={{ fontWeight: 700, marginTop: 1 }}>$ 162.650</div></div>
            <div><div style={{ opacity: .8 }}>Días restantes</div><div style={{ fontWeight: 700, marginTop: 1 }}>24 días en junio</div></div>
          </div>
        </div>

        <div className="mini-card" style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff' }}>
          <div className="deco-circle" style={{ width: 130, height: 130, top: -50, right: -30, background: 'rgba(255,255,255,0.10)' }} />
          <div className="label">Balance disponible</div>
          <div className="big mono">$ 162.650</div>
          <div style={{ display: 'flex', gap: 26, marginTop: 12, fontSize: 10.5 }}>
            <div><div style={{ opacity: .8 }}>↑ Ingresos</div><div className="mono" style={{ fontWeight: 700, marginTop: 1 }}>$ 450.000</div></div>
            <div><div style={{ opacity: .8 }}>↓ Gastos</div><div className="mono" style={{ fontWeight: 700, marginTop: 1 }}>$ 287.350</div></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#6F6F8E', textTransform: 'uppercase' }}>Últimos movimientos</span>
          <span style={{ fontSize: 11, color: '#818CF8', fontWeight: 600 }}>Ver todo</span>
        </div>
        <MiniTxn ic={IcWa} bg="#25D366" t="Nafta YPF" s="Transporte · WhatsApp" amt="−$ 45.000" neg />
        <MiniTxn ic={IcApp} bg="#6366F1" t="Sueldo" s="Ingreso · App" amt="+$ 450.000" />
      </div>
    </div>
  )
}

export function ScreenMovimientos() {
  const chips: [string, boolean][] = [['Todas', true], ['Gastos', false], ['Ingresos', false]]
  return (
    <div className="scr" style={{ background: '#0C0C1A' }}>
      <StatusBar />
      <div className="scr-body" style={{ gap: 9 }}>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>Movimientos</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1B1B33', border: '1px solid #2A2A4A', borderRadius: 12, padding: '10px 12px', color: '#6F6F8E', fontSize: 13 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
          Buscar movimientos…
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          {chips.map(([c, on]) => (
            <span key={c} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: on ? '#6366F1' : '#1B1B33', color: on ? '#fff' : '#A2A2C0', border: on ? 'none' : '1px solid #2A2A4A' }}>{c}</span>
          ))}
        </div>
        <DayLabel>Hoy</DayLabel>
        <MiniTxn ic={IcMic} bg="#25D366" t="Nafta YPF" s="Transporte · audio" amt="−$ 45.000" neg />
        <MiniTxn ic={IcWa} bg="#25D366" t="Café con Lu" s="Salidas · texto" amt="−$ 6.800" neg />
        <DayLabel>Ayer</DayLabel>
        <MiniTxn ic={IcWa} bg="#25D366" t="Supermercado Día" s="Alimentación" amt="−$ 12.500" neg />
        <MiniTxn ic={IcApp} bg="#6366F1" t="Freelance diseño" s="Ingreso · App" amt="+$ 85.000" />
        <DayLabel>01 Jun</DayLabel>
        <MiniTxn ic={IcApp} bg="#6366F1" t="Alquiler junio" s="Vivienda" amt="−$ 85.000" neg />
      </div>
    </div>
  )
}

export function ScreenMetas() {
  const metas = [
    { emoji: '🏖️', name: 'Vacaciones en Brasil', sub: 'Meta para Mar 2027', pct: 37, c: '#818CF8', ahorrado: '$ 187.000', objetivo: '$ 500.000', mes: '$ 34.778' },
    { emoji: '🛡️', name: 'Fondo de emergencia', sub: 'Meta para Dic 2026', pct: 60, c: '#34D399', ahorrado: '$ 540.000', objetivo: '$ 900.000', mes: '$ 60.000' },
    { emoji: '💻', name: 'Notebook nueva', sub: 'Meta para Sep 2026', pct: 78, c: '#A78BFA', ahorrado: '$ 700.000', objetivo: '$ 900.000', mes: '$ 66.000' },
  ]
  return (
    <div className="scr" style={{ background: '#0C0C1A' }}>
      <StatusBar />
      <div className="scr-body" style={{ gap: 9 }}>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>Reportes</div>
        <div style={{ display: 'flex', gap: 6, background: '#14142A', padding: 4, borderRadius: 12 }}>
          {['Presupuestos', 'Analíticas', 'Metas'].map((s, i) => (
            <span key={s} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: i === 2 ? '#1B1B33' : 'transparent', color: i === 2 ? '#fff' : '#6F6F8E' }}>{s}</span>
          ))}
        </div>
        <div style={{ border: '1px dashed #2A2A4A', borderRadius: 12, padding: '10px 0', textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#818CF8' }}>+ Nueva meta de ahorro</div>
        {metas.map(m => (
          <div key={m.name} style={{ background: '#14142A', border: '1px solid #2A2A4A', borderRadius: 16, padding: '13px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 22 }}>{m.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{m.name}</div>
                <div style={{ color: '#6F6F8E', fontSize: 10.5 }}>{m.sub}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: m.c, background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 999 }}>{m.pct}%</div>
            </div>
            <div className="bar" style={{ margin: '11px 0 10px' }}><i style={{ width: m.pct + '%', background: m.c, boxShadow: `0 0 12px ${m.c}` }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5 }}>
              <div><div style={{ color: '#6F6F8E' }}>Ahorrado</div><div className="mono" style={{ fontWeight: 700, marginTop: 1 }}>{m.ahorrado}</div></div>
              <div><div style={{ color: '#6F6F8E' }}>Objetivo</div><div className="mono" style={{ fontWeight: 700, marginTop: 1 }}>{m.objetivo}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ color: '#6F6F8E' }}>Ahorrar/mes</div><div className="mono" style={{ fontWeight: 700, marginTop: 1, color: m.c }}>{m.mes}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Phone({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return (
    <div className="phone" style={style}>
      <div className="phone-island" />
      <div className="phone-screen">{children}</div>
    </div>
  )
}
