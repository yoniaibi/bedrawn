'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { HomeIcon, RadioIcon, TicketIcon, StarIcon, UserIcon } from './icons';

const tabs = [
  { href: '/home',       label: 'Home' },
  { href: '/live',       label: 'Live' },
  { href: '/tickets',    label: 'Tickets' },
  { href: '/grand-draw', label: 'Grand Draw', gold: true },
];

export function TopNav() {
  const path = usePathname();
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: 'rgba(250,250,248,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
      height: 60,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', width: '100%',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 0,
      }}>
        {/* Logo */}
        <Link href="/home" aria-label="BeDrawn home" style={{ textDecoration: 'none', flexShrink: 0, marginRight: 40, display: 'flex', alignItems: 'center' }}>
          <Logo width={126} bg="#FAFAF8" />
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
                style={{ color: tab.gold && active ? 'var(--accent-gold)' : undefined }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/search" className="icon-btn" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </Link>
          <Link href="/account/notifications" className="icon-btn" aria-label="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </Link>
          <Link href="/account/wallet" className="desktop-flex" style={{
            display: 'none', alignItems: 'center',
            background: 'rgba(255,35,86,0.08)',
            border: '1.5px solid rgba(255,35,86,0.25)',
            borderRadius: 999, padding: '6px 16px',
            textDecoration: 'none', color: 'var(--accent-coral)',
            fontSize: 13, fontWeight: 700,
            transition: 'background 0.15s',
          }}>
            Wallet
          </Link>
          <Link href="/account" className="icon-btn" aria-label="Account">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}

const tabIconMap: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>> = {
  '/home':       HomeIcon,
  '/live':       RadioIcon,
  '/tickets':    TicketIcon,
  '/grand-draw': StarIcon,
  '/account':    UserIcon,
};

export function BottomNav() {
  const path = usePathname();
  const allTabs = [...tabs, { href: '/account', label: 'Account' }];
  return (
    <nav className="mobile-only" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(250,250,248,0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 -1px 0 rgba(0,0,0,0.06)',
      display: 'flex', zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {allTabs.map(tab => {
        const active = path.startsWith(tab.href);
        const isGold = (tab as { gold?: boolean }).gold;
        const color = active
          ? (isGold ? 'var(--accent-gold)' : 'var(--accent-coral)')
          : 'var(--text-tertiary)';
        const IconComp = tabIconMap[tab.href] ?? UserIcon;
        return (
          <Link key={tab.href} href={tab.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '9px 0 7px', textDecoration: 'none', gap: 3,
            minHeight: 54,
          }}>
            <IconComp size={22} strokeWidth={active ? 2.4 : 1.8} color={color} />
            <span style={{
              fontSize: 10, fontWeight: active ? 600 : 500,
              color, letterSpacing: '0.01em',
            }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
