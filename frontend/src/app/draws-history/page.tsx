'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { draws } from '@/lib/mockData';

// Use draws with a resolved/complete status, or pick the first few for demo
const completedDraws = (() => {
  const resolved = draws.filter(d => d.status === 'resolved' || d.status === 'complete');
  if (resolved.length > 0) return resolved;
  // Fallback: treat first 4 draws as completed for demo purposes
  return draws.slice(0, 4).map(d => ({
    ...d,
    winnerHandle: d.winnerHandle ?? 'lucky_winner',
    resolvedAt: d.resolvedAt ?? d.closingDate ?? 'Recently',
  }));
})();

export default function DrawsHistoryPage() {
  const [items, setItems] = useState(completedDraws);

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
            Past Draws
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--grey)' }}>
            Completed draws from bedrawn — every winner verified on-chain
          </p>
        </div>

        {/* Grid */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--grey)' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>No completed draws yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Check back after tonight&apos;s draw at 9pm</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
            marginBottom: 48,
          }}>
            {items.map(draw => (
              <div key={draw.id} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                {/* Image */}
                <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={draw.imageUrl}
                    alt={draw.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65) 100%)',
                  }} />
                  {/* Verified pill overlay */}
                  <span style={{
                    position: 'absolute', bottom: 10, left: 10,
                    background: 'rgba(5,150,105,0.22)',
                    border: '1px solid rgba(5,150,105,0.55)',
                    color: '#6EE7B7',
                    fontSize: 9, fontWeight: 700,
                    padding: '3px 9px', borderRadius: 999,
                    letterSpacing: '0.08em',
                    backdropFilter: 'blur(8px)',
                  }}>
                    Verified draw ✓
                  </span>
                </div>

                {/* Card body */}
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.3 }}>
                    {draw.title}
                  </p>

                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>
                    Won by @{(draw as any).winnerHandle ?? 'lucky_winner'}
                  </p>

                  <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--grey)' }}>
                    £{draw.retailValue.toLocaleString()} · {draw.totalTickets.toLocaleString()} tickets
                  </p>

                  <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>
                    {(draw as any).resolvedAt
                      ? new Date((draw as any).resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : draw.closingDate
                      ? new Date(draw.closingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Recently'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to home */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/home" style={{
            color: 'var(--accent-coral)',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            ← Back to all draws
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
