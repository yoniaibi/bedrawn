'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { notifications } from '@/lib/mockData';

const typeStyles: Record<string, { bg: string; border: string; color: string }> = {
  win: { bg: 'rgba(245,158,11,0.1)', border: 'var(--gold)', color: 'var(--gold)' },
  purchase: { bg: 'rgba(139,92,246,0.1)', border: 'var(--purple)', color: 'var(--purple)' },
  reminder: { bg: 'rgba(139,92,246,0.1)', border: 'var(--purple)', color: 'var(--purple)' },
  payout: { bg: 'rgba(236,72,153,0.1)', border: 'var(--pink)', color: 'var(--pink)' },
};

export default function NotificationsPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>Notifications</p>
        </div>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px' }}>
            <p style={{ fontSize: 48, margin: '0 0 16px' }}>🔔</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', margin: '0 0 8px' }}>Nothing yet</p>
            <p style={{ fontSize: 14, color: 'var(--grey)' }}>We&apos;ll let you know when something happens</p>
          </div>
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(n => {
              const style = typeStyles[n.type] ?? typeStyles.reminder;
              return (
                <div key={n.id} style={{
                  background: n.read ? 'var(--card)' : style.bg,
                  border: `1px solid ${n.read ? 'var(--border)' : style.border}`,
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  opacity: n.read ? 0.7 : 1,
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{n.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>{n.title}</p>
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--grey)' }}>{n.body}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{n.time}</p>
                  </div>
                  {!n.read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: style.color, marginTop: 4, flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
