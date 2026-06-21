import Nav from '@/components/nav'
import Hero from '@/components/hero'
import HowItWorks from '@/components/how-it-works'
import Features from '@/components/features'
import WhatsAppSection from '@/components/whatsapp-section'
import Pricing from '@/components/pricing'
import Testimonials from '@/components/testimonials'
import FAQ from '@/components/faq'
import FinalCTA from '@/components/final-cta'
import Footer from '@/components/footer'

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <WhatsAppSection />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
