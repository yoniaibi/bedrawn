'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';

const sections = [
  {
    title: '1. Who We Are',
    body: 'DRAWN is a luxury raffle platform operated from London, United Kingdom. We are the data controller for personal data collected through this platform. For privacy-related queries, contact privacy@bedrawn.app.',
  },
  {
    title: '2. What Data We Collect',
    body: 'We collect your name, email address, and password on signup. If you are a seller, we collect identity documents for KYC verification. We collect transactional data (draws entered, tickets purchased, wallet activity). We collect technical data including device type, IP address, and usage patterns.',
  },
  {
    title: '3. How We Use Your Data',
    body: 'To operate your account and process draw entries. To send you win notifications, draw reminders, and updates you have opted into. To verify seller identity and prevent fraud. To improve the platform using anonymised analytics. We do not sell your personal data to third parties.',
  },
  {
    title: '4. Legal Basis',
    body: 'We process your data under the following legal bases: contract performance (to operate your account and draws), legitimate interests (to prevent fraud and improve the platform), and consent (for marketing communications). You may withdraw consent for marketing at any time in Settings.',
  },
  {
    title: '5. Data Retention',
    body: 'We retain your account data for as long as your account is active. Transactional records are kept for 7 years for tax and legal compliance. Upon account deletion, personal data is removed within 30 days, except where retention is required by law.',
  },
  {
    title: '6. Your Rights',
    body: 'Under UK GDPR, you have the right to access your data, correct inaccurate data, delete your data (right to erasure), restrict processing, and data portability. To exercise any of these rights, email privacy@bedrawn.app. We will respond within 30 days.',
  },
  {
    title: '7. Cookies',
    body: 'We use essential cookies to keep you logged in and maintain session state. We use analytics cookies (with your consent) to understand how the platform is used. You can manage cookie preferences in your browser settings.',
  },
  {
    title: '8. Third Parties',
    body: 'We use AWS for hosting and data storage. We use Stripe for payment processing. These providers are bound by data processing agreements and GDPR-compliant terms. We do not share your data with advertisers.',
  },
];

export default function PrivacyPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>Privacy Policy</p>
        </div>

        <div style={{ padding: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--muted)' }}>Last updated: January 2026</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {sections.map(s => (
              <div key={s.title}>
                <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--white)' }}>{s.title}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 32, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            DRAWN · privacy@bedrawn.app · London, UK
          </p>
        </div>
      </div>
    </AppShell>
  );
}
