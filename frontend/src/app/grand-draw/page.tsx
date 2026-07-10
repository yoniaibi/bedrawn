'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import '@/lib/amplify';

// Grand Draw coming soon — full implementation gated behind FEATURES.GRAND_DRAW.
// When re-enabled: one free entry per daily app open, streak display-only, NO spend linkage.

export default function GrandDrawPage() {
  const [notifyOn, setNotifyOn] = useState(() => {
    try { return localStorage.getItem('gd_notify_optin') === '1'; } catch { return false; }
  });

  const toggle = () => {
    const next = !notifyOn;
    setNotifyOn(next);
    try { next ? localStorage.setItem('gd_notify_optin', '1') : localStorage.removeItem('gd_notify_optin'); } catch {}
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🎁</div>
        <h1 className="serif" style={{ margin: '0 0 12px', fontSize: 32, fontStyle: 'italic', color: 'var(--accent-gold)', fontWeight: 700 }}>The Grand Draw</h1>
        <p style={{ margin: '0 0 32px', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          A monthly draw for a headline prize — free entries just for showing up. Coming soon.
        </p>

        <button
          onClick={toggle}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '12px 24px', borderRadius: 999,
            background: notifyOn ? 'rgba(245,158,11,0.12)' : 'var(--bg-elevated)',
            border: `2px solid ${notifyOn ? 'var(--accent-gold)' : 'var(--border-default)'}`,
            color: notifyOn ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'all 200ms ease-out',
          }}
        >
          <span style={{ fontSize: 16 }}>{notifyOn ? '🔔' : '🔕'}</span>
          {notifyOn ? "You'll be notified at launch" : 'Notify me when it launches'}
        </button>

        {notifyOn && (
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
            We&apos;ll send you one email when the Grand Draw goes live. No spam, ever.
          </p>
        )}
      </div>
    </AppShell>
  );
}
