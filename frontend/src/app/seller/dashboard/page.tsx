'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import ProgressBar from '@/components/ProgressBar';
import { draws } from '@/lib/mockData';

const sellerDraws = [
  { ...draws[0], status: 'Open', earnings: 5610 },
  { ...draws[2], status: 'Closing tonight', earnings: 240 },
  { ...draws[6], status: 'Completed', earnings: 1560 },
];

const statusStyle: Record<string, { color: string; border: string; bg: string }> = {
  'Open': { color: 'var(--green)', border: 'var(--green)', bg: 'rgba(16,185,129,0.1)' },
  'Closing tonight': { color: 'var(--pink)', border: 'var(--pink)', bg: 'rgba(236,72,153,0.1)' },
  'Completed': { color: 'var(--muted)', border: 'var(--muted)', bg: 'rgba(75,85,99,0.1)' },
  'Awaiting verification': { color: 'var(--gold)', border: 'var(--gold)', bg: 'rgba(245,158,11,0.1)' },
};

export default function SellerDashboardPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>My Dashboard · @yoniaibi</p>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Earnings cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Total earned</p>
              <p className="serif" style={{ margin: 0, fontSize: 28, color: 'var(--gold)', fontWeight: 700 }}>£620</p>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Pending</p>
              <p className="serif" style={{ margin: 0, fontSize: 28, color: 'var(--green)', fontWeight: 700 }}>£180</p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/seller/list" style={{ textDecoration: 'none', flex: 1 }}>
              <button style={{
                width: '100%', padding: '12px', borderRadius: 999,
                background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                border: 'none', color: 'var(--white)', fontWeight: 700, fontSize: 14,
              }}>+ List new item</button>
            </Link>
            <button style={{
              padding: '12px 20px', borderRadius: 999,
              background: 'var(--card)', border: '1px solid var(--border)',
              color: 'var(--grey)', fontWeight: 600, fontSize: 14,
            }}>💸 Payouts</button>
          </div>

          {/* Draw list */}
          <div>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>Your draws</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sellerDraws.map(d => {
                const pct = Math.round((d.soldTickets / d.totalTickets) * 100);
                const s = statusStyle[d.status] ?? statusStyle['Open'];
                return (
                  <div key={d.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: d.imageColor, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{d.title}</p>
                          <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                            {d.status}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>£{(d.earnings / 100).toFixed(2)} earned</p>
                      </div>
                    </div>
                    <ProgressBar percent={pct} height={4} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--grey)' }}>{pct}% sold · {d.soldTickets.toLocaleString()} tickets</span>
                      {d.status !== 'Completed' && (
                        <button style={{ background: 'none', border: 'none', color: 'var(--purple)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
