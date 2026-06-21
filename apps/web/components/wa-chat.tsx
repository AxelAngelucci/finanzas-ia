import Image from 'next/image'

export default function WaChat() {
  return (
    <div className="wa-window">
      <div className="wa-head">
        <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flex: 'none' }}>
          <Image src="/logo.png" alt="Finia" width={38} height={38} style={{ objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#E6EAEE' }}>Finia</div>
          <div style={{ fontSize: 11, color: '#25D366' }}>en línea</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#8696A0">
          <path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </svg>
      </div>
      <div className="wa-body">
        <div className="wa-msg wa-out">Gasté 4.500 en el súper 🛒<span className="wa-time">9:32</span></div>
        <div className="wa-msg wa-in">✅ Anotado. <b>$4.500</b> en <b>Alimentación</b>.<br />Llevás $38.200 en súper este mes.<span className="wa-time">9:32</span></div>
        <div className="wa-msg wa-out" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9FE8D2" strokeWidth="1.8" strokeLinecap="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
          <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {[10, 16, 22, 14, 20, 12, 18, 9].map((h, i) => (
              <i key={i} style={{ width: 2.5, height: h, background: '#9FE8D2', borderRadius: 2, display: 'inline-block' }} />
            ))}
          </span>
          <span style={{ fontSize: 11, color: '#9FE8D2' }}>0:04</span>
          <span className="wa-time">9:40</span>
        </div>
        <div className="wa-msg wa-in">Escuché "cobré el sueldo, 450 mil" 💰<br />✅ Sumé <b>+$450.000</b> a Ingresos.<span className="wa-time">9:40</span></div>
        <div className="wa-msg wa-out" style={{ padding: 4, background: '#005C4B' }}>
          <div style={{ width: 150, borderRadius: 9, overflow: 'hidden', background: '#F4F1EA', color: '#2A2A2A', padding: '10px 11px', fontFamily: 'var(--font-dm-mono), monospace' }}>
            <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.04em', textAlign: 'center', borderBottom: '1px dashed #B8B2A4', paddingBottom: 5, marginBottom: 5 }}>FARMACITY</div>
            {[['Ibuprofeno', '3.200'], ['Protector solar', '8.900'], ['Alcohol gel', '1.700']].map(([a, b]) => (
              <div key={a} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, marginBottom: 2 }}>
                <span>{a}</span><span>{b}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, fontWeight: 700, borderTop: '1px dashed #B8B2A4', paddingTop: 4, marginTop: 3 }}>
              <span>TOTAL</span><span>$13.800</span>
            </div>
          </div>
          <div style={{ fontSize: 11, padding: '5px 6px 2px', color: '#CFF6E8' }}>📷 Foto del ticket<span className="wa-time">9:41</span></div>
        </div>
        <div className="wa-msg wa-in">Leí el ticket 📄 <b>$13.800</b> en <b>Farmacia</b>.<br />Guardé el detalle de los 3 ítems.<span className="wa-time">9:41</span></div>
        <div className="wa-msg wa-out">¿Cuánto puedo gastar hoy?<span className="wa-time">9:41</span></div>
        <div className="wa-msg wa-in">Hoy podés gastar <b>$6.777</b> 👍<br />Te quedan $162.650 para 24 días.<span className="wa-time">9:41</span></div>
      </div>
    </div>
  )
}
