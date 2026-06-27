'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { orders } from '@/lib/mockData';

type Filter = 'All' | 'Active' | 'Won';

const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
  Active: { bg: 'rgba(139,92,246,0.15)', color: 'var(--purple)', border: 'var(--purple)' },
  Won: { bg: 'rgba(245,158,11,0.15)', color: 'var(--gold)', border: 'var(--gold)' },
  Completed: { bg: 'rgba(75,85,99,0.15)', color: 'var(--grey)', border: 'var(--muted)' },
};

export default function OrdersPage() {
  const [filter, setFilter] = useState<Filter>('All');
  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  return (
    <AppShell>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>My Orders</p>
        </div>

        {/* Filter tabs */}
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

        {filtered.length === 0 ? (
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
            {filtered.map(o => {
              const s = statusStyle[o.status];
              return (
                <Link key={o.id} href={`/draw/${o.drawId}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1, paddingRight: 12 }}>{o.drawTitle}</p>
                      <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                        {o.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span style={{ fontSize: 12, color: 'var(--grey)' }}>{o.date}</span>
                      <span style={{ fontSize: 12, color: 'var(--grey)' }}>{o.tickets} tickets</span>
                      <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>£{(o.total / 100).toFixed(2)}</span>
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
