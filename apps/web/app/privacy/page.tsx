import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/logo'

export const metadata: Metadata = {
  title: 'Privacy Policy — Finia',
  description: 'How Finia collects, uses, and protects your personal and financial data across the app, the website, and WhatsApp.',
}

export default function PrivacyPage() {
  return (
    <div className="legal-page wrap">
      <Link href="/" className="legal-back">← Back to Finia</Link>

      <div className="legal-head">
        <Logo />
        <h1 className="h-sec" style={{ marginTop: 22 }}>Privacy Policy</h1>
        <p className="legal-updated">Last updated: June 21, 2026</p>
      </div>

      <div className="legal-notice">
        This document is a general template provided for transparency purposes and does not constitute
        legal advice. Finia should have this Privacy Policy reviewed by qualified legal counsel to confirm
        compliance with applicable data protection laws (including Argentina&apos;s Ley 25.326, the EU/UK GDPR,
        and the California CCPA/CPRA) before relying on it as a binding compliance document.
      </div>

      <div className="legal-content">
        <h2>1. Who We Are</h2>
        <p>
          Finia (&quot;Finia&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a personal finance assistant available through a
          mobile app, a website at finanzas-ia.app, and a WhatsApp channel (together, the &quot;Service&quot;). This
          Privacy Policy explains what personal data we collect, why we collect it, and the rights you have
          over it.
        </p>

        <h2>2. Data We Collect</h2>
        <p>We collect the following categories of data:</p>
        <ul>
          <li><strong>Account data:</strong> name, email address, phone number, password hash, and authentication tokens.</li>
          <li><strong>Financial data you provide:</strong> transactions, income, budgets, savings goals, and monthly income figures you enter or that our AI extracts from your messages.</li>
          <li><strong>WhatsApp content:</strong> text messages, voice notes, and photos of receipts you send to the assistant, processed to register transactions on your behalf.</li>
          <li><strong>Subscription data:</strong> plan status and purchase identifiers from Apple App Store, Google Play, RevenueCat, and Stripe (we do not receive or store your full payment card details).</li>
          <li><strong>Device and usage data:</strong> app version, device type, crash logs, and general usage analytics needed to operate and improve the Service.</li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <ul>
          <li>To provide the core Service: recording transactions, generating budgets, goals, and reports.</li>
          <li>To process your messages, voice notes, and receipt photos through AI models in order to classify expenses and income automatically.</li>
          <li>To manage your subscription, trial period, and billing status.</li>
          <li>To send service-related communications, such as billing notices, security alerts, or trial-expiration reminders.</li>
          <li>To detect fraud, abuse, and to keep the Service secure.</li>
        </ul>
        <p>
          We do not sell your personal data. We do not use your financial data to serve third-party advertising.
        </p>

        <h2>4. AI Processing</h2>
        <p>
          To classify your transactions and generate insights, the content you submit (text, voice
          transcriptions, and receipt images) is sent to third-party AI model providers for processing.
          These providers process the data solely to return a result to Finia and are contractually
          restricted from using your data to train their own models, to the extent permitted by their
          terms. We retain the right to change AI providers; this Policy will be updated if doing so
          materially changes how your data is processed.
        </p>

        <h2>5. Third Parties We Share Data With</h2>
        <ul>
          <li><strong>Twilio</strong> — delivers and receives WhatsApp messages on our behalf.</li>
          <li><strong>RevenueCat</strong> — manages mobile in-app subscriptions and entitlements.</li>
          <li><strong>Stripe</strong> — processes web-based subscription payments.</li>
          <li><strong>Cloud hosting and database providers</strong> — store application data and backend infrastructure.</li>
          <li><strong>AI model providers</strong> — process message content as described in Section 4.</li>
        </ul>
        <p>
          Each third party processes data under its own privacy policy and only to the extent necessary to
          provide its service to Finia.
        </p>

        <h2>6. International Data Transfers</h2>
        <p>
          Finia is operated from Argentina, and some of our service providers process data in other
          countries, including the United States and the European Union. Where required, we rely on
          standard contractual clauses or equivalent safeguards to protect data transferred internationally.
        </p>

        <h2>7. Data Retention</h2>
        <p>
          We retain your account and financial data for as long as your account is active. If you delete
          your account, we delete or anonymize your personal data within a reasonable period, except where
          we are required to retain certain records for legal, tax, or fraud-prevention purposes.
        </p>

        <h2>8. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you;</li>
          <li>Request correction of inaccurate data;</li>
          <li>Request deletion of your account and associated data;</li>
          <li>Export your transaction data;</li>
          <li>Object to or restrict certain processing, where applicable (EU/UK GDPR);</li>
          <li>Opt out of the sale or sharing of personal information (California CCPA/CPRA) — note that Finia does not sell personal data.</li>
        </ul>
        <p>
          You can exercise most of these rights directly within the app&apos;s Settings screen, or by contacting
          us at <a href="mailto:privacy@finanzas-ia.app">privacy@finanzas-ia.app</a>.
        </p>

        <h2>9. Children&apos;s Privacy</h2>
        <p>
          The Service is not directed to individuals under 18 years of age, and we do not knowingly collect
          personal data from minors. If you believe a minor has provided us with personal data, contact us
          and we will delete it.
        </p>

        <h2>10. Security</h2>
        <p>
          We use industry-standard technical and organizational measures, including encryption in transit
          and access controls, to protect your data. No system is perfectly secure, and we cannot guarantee
          absolute security.
        </p>

        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be notified through the
          app or by email before they take effect.
        </p>

        <h2>12. Contact</h2>
        <p>
          For privacy questions or to exercise your rights, contact us at{' '}
          <a href="mailto:privacy@finanzas-ia.app">privacy@finanzas-ia.app</a>. See also our{' '}
          <Link href="/terms">Terms of Service</Link>.
        </p>
      </div>
    </div>
  )
}
