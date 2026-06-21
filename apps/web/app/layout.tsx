import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import CheckoutModal from '@/components/checkout-modal'
import ScrollReveal from '@/components/scroll-reveal'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Finia — Tus finanzas, tan fáciles como mandar un mensaje',
  description: 'Registrá gastos e ingresos hablando o escribiendo — desde la app o por WhatsApp. La IA los clasifica, detecta tus suscripciones y te dice cuánto podés gastar hoy.',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        {children}
        <CheckoutModal />
        <ScrollReveal />
      </body>
    </html>
  )
}
