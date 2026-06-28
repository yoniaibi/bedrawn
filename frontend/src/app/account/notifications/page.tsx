'use client';

import '@/lib/amplify';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import AppShell from '@/components/AppShell';

interface Notification {
  id: string;
  type: string;
  drawId: string;
  drawTitle: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; border: string; color: string; icon: string }> = {
  draw_won: {
    label: 'You won!',
    bg: 'rgba(245,158,11,0.1)', border: 'var(--gold)', color: 'var(--gold)',
    icon: '★',
  },
  draw_cancelled: {
    label: 'Draw cancelled',
    bg: 'rgba(239,68,68,0.08)', border: 'var(--red)', color: 'var(--red)',
    icon: '×',
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Notifications</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--grey)' }}>Loading…</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, color: 'var(--purple)' }}>○</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>Nothing yet</p>
            <p style={{ fontSize: 14, color: 'var(--grey)', margin: 0 }}>We&apos;ll let you know when you win a draw</p>
          </div>
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(n => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.draw_won;
              return (
                <Link key={n.id} href={`/draw/${n.drawId}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: n.read ? 'var(--card)' : cfg.bg,
                    border: `1px solid ${n.read ? 'var(--border)' : cfg.border}`,
                    borderRadius: 12, padding: '14px 16px',
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    opacity: n.read ? 0.75 : 1,
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, color: cfg.color, fontWeight: 700,
                    }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: cfg.color }}>{cfg.label}</p>
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{n.drawTitle}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, marginTop: 6, flexShrink: 0 }} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
