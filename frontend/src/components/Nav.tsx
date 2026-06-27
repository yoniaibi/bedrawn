'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/home',       label: 'Home' },
  { href: '/live',       label: 'Live' },
  { href: '/tickets',    label: 'Tickets' },
  { href: '/grand-draw', label: 'Grand Draw', gold: true },
];

export function TopNav() {
  const path = usePathname();
  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(253,250,255,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(124,58,237,0.1)',
        boxShadow: '0 1px 12px rgba(124,58,237,0.06)',
        height: 60,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', width: '100%',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', gap: 0,
        }}>
          {/* Logo */}
          <Link href="/home" style={{ textDecoration: 'none', flexShrink: 0, marginRight: 40 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-ticket.svg" alt="BeDrawn" style={{ height: 44, width: 'auto' }} />
          </Link>

          {/* Desktop nav links */}
          <nav className="desktop-flex" style={{ display: 'none', alignItems: 'center', gap: 32, flex: 1 }}>
            {tabs.map(tab => {
              const active = path.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`top-nav-link${active ? ' active' : ''}`}
                  style={{ color: tab.gold && active ? 'var(--gold)' : undefined }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/search" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--card)', border: '1px solid var(--border)',
              textDecoration: 'none', color: 'var(--grey)',
              transition: 'border-color 0.15s, color 0.15s',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </Link>
            <Link href="/account/wallet" className="desktop-flex" style={{
              display: 'none', alignItems: 'center',
              background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 999, padding: '6px 14px',
              textDecoration: 'none', color: 'var(--purple)',
              fontSize: 13, fontWeight: 700,
              transition: 'background 0.15s',
            }}>
              Wallet
            </Link>
            <Link href="/account" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--card)', border: '1px solid var(--border)',
              textDecoration: 'none', color: 'var(--grey)',
              transition: 'border-color 0.15s',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile hamburger menu — shown in BottomNav instead */}
    </>
  );
}

export function BottomNav() {
  const path = usePathname();
  const allTabs = [...tabs, { href: '/account', label: 'Account' }];
  return (
    <nav className="mobile-only" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--white)',
      borderTop: '1px solid var(--border)',
      display: 'flex', zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {allTabs.map(tab => {
        const active = path.startsWith(tab.href);
        const isGold = (tab as { gold?: boolean }).gold;
        const color = active
          ? (isGold ? 'var(--gold)' : 'var(--purple)')
          : 'var(--muted)';
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 0 8px', textDecoration: 'none', gap: 3,
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: active ? 700 : 500,
              letterSpacing: '0.04em', color,
              textTransform: 'uppercase',
            }}>{tab.label}</span>
            {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: isGold ? 'var(--gold)' : 'var(--purple)' }} />}
          </Link>
        );
      })}
    </nav>
  );
}
