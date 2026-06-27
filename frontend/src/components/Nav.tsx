'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

const tabs = [
  { href: '/home',       label: 'Home',       icon: '⌂' },
  { href: '/live',       label: 'Live',        icon: '◉' },
  { href: '/tickets',    label: 'Tickets',     icon: '◈' },
  { href: '/grand-draw', label: 'Grand Draw',  icon: '✦', gold: true },
  { href: '/account',    label: 'Account',     icon: '◎' },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg)',
      borderTop: '1px solid var(--border)',
      display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => {
        const active = path.startsWith(tab.href);
        const color = active
          ? (tab.gold ? 'var(--gold)' : 'var(--purple)')
          : 'var(--muted)';
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 0 8px', textDecoration: 'none', gap: 3,
              transition: 'opacity 0.15s',
            }}
          >
            <span style={{ fontSize: 22, color, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
              color, textTransform: 'uppercase',
            }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const path = usePathname();
  return (
    <aside style={{
      width: 224, flexShrink: 0,
      borderRight: '1px solid var(--border)',
      padding: '24px 12px',
      display: 'flex', flexDirection: 'column', gap: 2,
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      background: 'var(--bg)',
    }}>
      <Link href="/home" style={{ textDecoration: 'none', display: 'block', margin: '0 4px 28px' }}>
        <Logo width={140} bg="var(--bg)" />
      </Link>
      {tabs.map(tab => {
        const active = path.startsWith(tab.href);
        const color = active
          ? (tab.gold ? 'var(--gold)' : 'var(--purple)')
          : 'var(--grey)';
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="nav-link"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10,
              background: active
                ? (tab.gold ? 'rgba(249,200,70,0.1)' : 'rgba(139,92,246,0.12)')
                : 'transparent',
              border: active
                ? `1px solid ${tab.gold ? 'rgba(249,200,70,0.3)' : 'rgba(139,92,246,0.3)'}`
                : '1px solid transparent',
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 18, color, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color }}>{tab.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
