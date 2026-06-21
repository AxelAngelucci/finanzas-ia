'use client'
import { useState } from 'react'
import { Ico } from './icons'

const items: [string, string][] = [
  ['¿Necesito instalar la app para empezar?', 'No. Podés empezar directamente por WhatsApp y registrar gastos hoy mismo. La app suma el dashboard, los gráficos y las metas cuando quieras descargarla.'],
  ['¿Cómo registro un gasto por WhatsApp?', 'Escribís o mandás un audio en lenguaje natural, como "gasté 4.500 en el súper". La IA lo entiende, lo clasifica y te confirma al instante.'],
  ['¿Mis datos están seguros?', 'Sí. Tus datos viajan cifrados y nunca compartimos tu información financiera. Vos tenés el control y podés borrar todo cuando quieras.'],
  ['¿Funciona con pesos argentinos?', 'Totalmente. Está pensada para Argentina: montos en $, formato local de miles y decimales, y categorías del día a día.'],
  ['¿Cómo funcionan los planes?', 'Hay un solo plan con acceso completo a todo, y vos elegís cómo pagarlo: mensual (lo cancelás cuando quieras) o un único pago de por vida, sin renovaciones ni aumentos nunca más. Empezás con 14 días gratis para probarla.'],
  ['¿Puedo compartir gastos con mi pareja o familia?', 'Sí, con Premium podés crear espacios compartidos para administrar gastos en común sin mezclarlos con los tuyos.'],
]

export default function FAQ() {
  const [open, setOpen] = useState<number>(0)

  return (
    <section className="section reveal" id="faq" style={{ padding: '70px 0' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="eyebrow">Preguntas frecuentes</span>
          <h2 className="h-sec" style={{ marginTop: 14 }}>Lo que todos preguntan.</h2>
        </div>
        <div className="faq">
          {items.map(([q, a], i) => (
            <div key={i} className={'faq-item' + (open === i ? ' open' : '')}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                {q}<span className="faq-ic">{Ico.plus(20)}</span>
              </button>
              <div className="faq-a" style={{ maxHeight: open === i ? 260 : 0 }}>
                <div className="faq-a-inner">{a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
