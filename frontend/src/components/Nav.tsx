'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/live', label: 'Live', icon: '🔴' },
  { href: '/tickets', label: 'Tickets', icon: '🎫' },
  { href: '/grand-draw', label: 'Grand Draw', icon: '✨' },
  { href: '/account', label: 'Account', icon: '👤' },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg)', borderTop: '1px solid var(--border)',
      display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => {
        const active = path.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '8px 0', textDecoration: 'none', gap: 2,
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: active ? 'var(--purple)' : 'var(--muted)',
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
      width: 220, flexShrink: 0, borderRight: '1px solid var(--border)',
      padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4,
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    }}>
      <Link href="/home" style={{ textDecoration: 'none' }}>
        <p className="serif" style={{ fontSize: 28, color: 'var(--gold)', margin: '0 0 24px 8px' }}>DRAWN</p>
      </Link>
      {tabs.map(tab => {
        const active = path.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10,
              background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
              border: active ? '1px solid var(--purple)' : '1px solid transparent',
              textDecoration: 'none', transition: 'background 0.15s',
            }}
          >
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: active ? 'var(--purple)' : 'var(--grey)',
            }}>{tab.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
