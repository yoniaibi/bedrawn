'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { fetchAuthSession } from 'aws-amplify/auth';

type Filter = 'All' | 'Active' | 'Won';

interface Entry {
  drawId: string;
  drawTitle: string;
  drawImageUrl: string;
  ticketCount: number;
  ticketPricePence: number;
  enteredAt: string;
  closingDate: string;
  status: string;
  isWinner: boolean;
}

const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
  open: { bg: 'rgba(139,92,246,0.15)', color: 'var(--purple)', border: 'var(--purple)' },
  resolved: { bg: 'rgba(75,85,99,0.15)', color: 'var(--grey)', border: 'var(--muted)' },
  won: { bg: 'rgba(245,158,11,0.15)', color: 'var(--gold)', border: 'var(--gold)' },
};

const statusLabel = (entry: Entry) => {
  if (entry.isWinner) return 'Won';
  if (entry.status === 'open') return 'Active';
  return 'Completed';
};

export default function OrdersPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('All');

  useEffect(() => {
    (async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/entries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries ?? []);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = entries.filter(e => {
    if (filter === 'All') return true;
    if (filter === 'Won') return e.isWinner;
    if (filter === 'Active') return e.status === 'open' && !e.isWinner;
    return true;
  });

  return (
    <AppShell>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>My Orders</p>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {(['All', 'Active', 'Won'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1, padding: '12px', border: 'none', background: 'transparent',
                color: filter === f ? 'var(--purple)' : 'var(--grey)',
                fontWeight: filter === f ? 700 : 400, fontSize: 14, cursor: 'pointer',
                borderBottom: filter === f ? '2px solid var(--purple)' : '2px solid transparent',
              }}
            >{f}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, color: 'var(--muted)' }}>◻</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>No orders</p>
            <Link href="/home" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '12px 28px', borderRadius: 999, background: 'var(--purple)', border: 'none', color: 'var(--white)', fontSize: 14, fontWeight: 700 }}>
                Browse draws
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(entry => {
              const label = statusLabel(entry);
              const s = statusStyle[entry.isWinner ? 'won' : entry.status] ?? statusStyle.resolved;
              const total = entry.ticketCount * entry.ticketPricePence;
              return (
                <Link key={entry.drawId} href={`/draw/${entry.drawId}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: 'var(--card2)' }}>
                      {entry.drawImageUrl ? (
                        <img src={entry.drawImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎟</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1, paddingRight: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.drawTitle}</p>
                        <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ fontSize: 12, color: 'var(--grey)' }}>{entry.closingDate}</span>
                        <span style={{ fontSize: 12, color: 'var(--grey)' }}>{entry.ticketCount} tickets</span>
                        {total > 0 && <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>£{(total / 100).toFixed(2)}</span>}
                      </div>
                    </div>
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
