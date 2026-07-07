import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
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
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
