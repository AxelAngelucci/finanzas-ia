'use client'
import { useEffect, useRef } from 'react'
import Logo from './logo'
import { Ico } from './icons'
import { WA_LINK } from '@/lib/constants'

export default function Nav() {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="nav" id="nav" ref={navRef}>
      <div className="wrap nav-inner">
        <Logo />
        <div className="nav-links">
          <a href="#como">Cómo funciona</a>
          <a href="#funciones">Funciones</a>
          <a href="#whatsapp">WhatsApp</a>
          <a href="#precios">Precios</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="nav-cta">
          <a href={WA_LINK} target="_blank" rel="noopener" className="btn btn-sm btn-wa">
            {Ico.wa(16)}<span className="long">WhatsApp</span>
          </a>
          <a href="#descargar" className="btn btn-sm btn-grad">Descargar</a>
        </div>
      </div>
    </nav>
  )
}
