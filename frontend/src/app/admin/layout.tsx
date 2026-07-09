'use client';

import '@/lib/amplify';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import { isAdminUser } from '@/config/admin';

const ENV = process.env.NEXT_PUBLIC_ENV ?? process.env.NODE_ENV ?? 'dev';

const NAV = [
  { href: '/admin',         label: 'Overview'   },
  { href: '/admin/draws',   label: 'Draws'      },
  { href: '/admin/entry',   label: 'Entry'      },
  { href: '/admin/growth',  label: 'Growth'     },
  { href: '/admin/sellers', label: 'Sellers'    },
  { href: '/admin/economics', label: 'Economics' },
  { href: '/admin/safety',  label: 'Safety'     },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'admin' | 'denied'>('loading');

  useEffect(() => {
    fetchAuthSession()
      .then(session => {
        const token = session.tokens?.idToken?.toString();
        if (!token) { setStatus('denied'); return; }
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.email ?? payload['cognito:username'] ?? '';
        setStatus(isAdminUser(email) ? 'admin' : 'denied');
      })
      .catch(() => setStatus('denied'));
  }, []);

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF8' }}>
      <span style={{ fontSize: 13, color: '#A8A29E' }}>Checking access…</span>
    </div>
  );

  if (status === 'denied') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF8' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 48, fontWeight: 900, color: '#1C1917', letterSpacing: '-0.02em', margin: '0 0 8px' }}>404</p>
        <p style={{ fontSize: 14, color: '#78716C', margin: '0 0 20px' }}>Page not found</p>
        <Link href="/home" style={{ fontSize: 13, color: '#FF2356', textDecoration: 'none', fontWeight: 600 }}>← Back to home</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8' }}>
      {/* Env banner */}
      <div style={{
        background: 'rgba(220,38,38,0.08)',
        borderBottom: '1px solid rgba(220,38,38,0.20)',
        padding: '5px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          ADMIN · {ENV.toUpperCase()}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: '#A8A29E' }}>bedrawn internal — not user-facing</span>
      </div>

      {/* Admin nav */}
      <nav style={{
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 2,
        overflowX: 'auto',
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#1C1917', letterSpacing: '-0.01em', marginRight: 16, whiteSpace: 'nowrap', padding: '12px 0' }}>
          bedrawn ops
        </span>
        {NAV.map(item => {
          const active = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              padding: '13px 14px',
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              color: active ? '#FF2356' : '#78716C',
              textDecoration: 'none',
              borderBottom: `2px solid ${active ? '#FF2356' : 'transparent'}`,
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}>{item.label}</Link>
          );
        })}
      </nav>

      {/* Page content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 80px' }}>
        {children}
      </main>
    </div>
  );
}
