import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import CookieConsent from '@/components/CookieConsent';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['italic'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'bedrawn — Win luxury items for pennies',
  description: 'Luxury raffle platform. Real items. Verified sellers. Every night at 9pm.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full" style={{ background: 'var(--bg)', color: 'var(--white)' }}>
        <AuthProvider>
          {children}
          <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 24px', textAlign: 'center', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
              <Link href="/legal/terms" style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none' }}>Terms</Link>
              <Link href="/legal/privacy" style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none' }}>Privacy</Link>
              <Link href="/safer-play" style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none' }}>Safer Play</Link>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
              bedrawn Ltd · Company No. [PLACEHOLDER] · 18+ only · No purchase necessary
            </p>
          </footer>
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
