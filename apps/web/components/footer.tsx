import Link from 'next/link'
import Logo from './logo'
import { Ico } from './icons'
import { WA_LINK } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Logo />
          <p style={{ color: 'var(--text2)', fontSize: 14.5, marginTop: 14, maxWidth: 300 }}>
            Tus finanzas personales, tan fáciles como mandar un mensaje. Hecho en Argentina 🇦🇷
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <a href={WA_LINK} target="_blank" rel="noopener" className="btn btn-sm btn-wa">
              {Ico.wa(16)} WhatsApp
            </a>
          </div>
        </div>
        <div>
          <h4>Producto</h4>
          <div className="footer-links">
            <a href="#funciones">Funciones</a>
            <a href="#precios">Precios</a>
            <a href="#como">Cómo funciona</a>
            <a href="#descargar">Descargar</a>
          </div>
        </div>
        <div>
          <h4>Recursos</h4>
          <div className="footer-links">
            <a href="#faq">Preguntas frecuentes</a>
            <a href="#whatsapp">Registro por WhatsApp</a>
            <a href="#">Blog</a>
            <a href="#">Ayuda</a>
          </div>
        </div>
        <div>
          <h4>Legal</h4>
          <div className="footer-links">
            <Link href="/terms">Términos</Link>
            <Link href="/privacy">Privacidad</Link>
            <a href="#">Seguridad</a>
            <a href="mailto:support@finanzas-ia.app">Contacto</a>
          </div>
        </div>
      </div>
      <div className="wrap" style={{ marginTop: 44, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, color: 'var(--text3)', fontSize: 13 }}>
        <span>© 2026 Finia. Todos los derechos reservados.</span>
        <span>$ Pesos argentinos · es-AR</span>
      </div>
    </footer>
  )
}
