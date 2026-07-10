'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

interface ResolvedDraw {
  id: string;
  title: string;
  imageUrl: string;
  retailValue: number;
  totalTickets: number;
  soldTickets: number;
  winnerHandle?: string;
  resolvedAt?: string;
  randomOrgCert?: string;
  legitAppCert?: string;
}

/** Masks a handle: @sarah_k → @s***h_k */
function maskHandle(h: string): string {
  const raw = h.startsWith('@') ? h.slice(1) : h;
  if (raw.length <= 3) return `@${raw[0]}***`;
  return `@${raw[0]}${'*'.repeat(Math.max(0, raw.length - 2))}${raw[raw.length - 1]}`;
}

export default function DrawsHistoryPage() {
  const [draws, setDraws] = useState<ResolvedDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) { setLoading(false); return; }
    fetch(`${url}/draws?status=resolved`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.draws) setDraws(d.draws); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 64px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Past Draws
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
            Every winner independently verified — draw ID, certificate, and randomness proof included.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-img" />
                <div className="skeleton-line" />
                <div className="skeleton-line-short" />
              </div>
            ))}
          </div>
        ) : draws.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>No completed draws yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Check back after tonight&apos;s draw at 9pm</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
            marginBottom: 48,
          }}>
            {draws.map(draw => (
              <div key={draw.id} style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                {/* Image */}
                <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draw.imageUrl}
                    alt={draw.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65) 100%)',
                  }} />
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
                    Verified ✓
                  </span>
                </div>

                {/* Card body */}
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {draw.title}
                  </p>

                  {draw.winnerHandle && (
                    <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--accent-gold)' }}>
                      Won by {maskHandle(draw.winnerHandle)}
                    </p>
                  )}

                  <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    £{draw.retailValue.toLocaleString()} · {draw.soldTickets.toLocaleString()} tickets
                  </p>

                  <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {draw.resolvedAt
                      ? new Date(draw.resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : ''}
                  </p>

                  {/* Verify panel toggle */}
                  <button
                    onClick={() => setExpandedId(expandedId === draw.id ? null : draw.id)}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      fontSize: 11, color: 'var(--accent-lilac)', fontWeight: 600,
                    }}
                  >
                    {expandedId === draw.id ? 'Hide verification ↑' : 'Verify this draw ↓'}
                  </button>

                  {expandedId === draw.id && (
                    <div style={{
                      marginTop: 10, padding: '10px 12px',
                      background: 'rgba(124,58,237,0.05)',
                      border: '1px solid rgba(124,58,237,0.15)',
                      borderRadius: 8,
                    }}>
                      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Verification</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-secondary)' }}>
                          Draw ID: <code style={{ fontFamily: 'monospace', fontSize: 10 }}>{draw.id}</code>
                        </p>
                        {draw.randomOrgCert ? (
                          <a href={draw.randomOrgCert} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: 'var(--accent-lilac)' }}>
                            RANDOM.ORG certificate →
                          </a>
                        ) : (
                          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>RANDOM.ORG cert: pending</p>
                        )}
                        {draw.legitAppCert ? (
                          <a href={draw.legitAppCert} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: 'var(--accent-lilac)' }}>
                            LegitApp authentication cert →
                          </a>
                        ) : (
                          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>Authentication cert: n/a</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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
