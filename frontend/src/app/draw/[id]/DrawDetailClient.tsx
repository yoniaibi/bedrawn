'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import ProgressBar from '@/components/ProgressBar';
import LiveDot from '@/components/LiveDot';
import ActivityTicker from '@/components/ActivityTicker';
import { draws } from '@/lib/mockData';
import type { Draw } from '@/lib/mockData';

const socialProof = [
  '@emily just bought 5 tickets — 2 mins ago',
  '@collector99 entered — 4 mins ago',
  '@hypekid just bought 10 tickets — 6 mins ago',
];

export default function DrawDetailClient({ id }: { id: string }) {
  const mockDraw = draws.find(d => d.id === id) ?? null;
  const [draw, setDraw] = useState<Draw | null>(mockDraw);
  const [loading, setLoading] = useState(!mockDraw);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (mockDraw) return;
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) { setLoading(false); return; }
    fetch(`${url}/draws/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.draw) setDraw(data.draw as Draw); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, mockDraw]);

  if (loading) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--grey)' }}>Loading…</div>
      </AppShell>
    );
  }

  if (!draw) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '60px 32px' }}>
          <p style={{ color: 'var(--text)', fontSize: 16, margin: '0 0 12px' }}>Draw not found</p>
          <Link href="/home" style={{ color: 'var(--purple)' }}>← Back to home</Link>
        </div>
      </AppShell>
    );
  }

  const pct = Math.round((draw.soldTickets / draw.totalTickets) * 100);
  const remaining = draw.totalTickets - draw.soldTickets;
  const price = draw.ticketPrice >= 100 ? `£${(draw.ticketPrice / 100).toFixed(2)}` : `${draw.ticketPrice}p`;

  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/home" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }} />
          <button onClick={() => setSaved(s => !s)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: saved ? 'var(--pink)' : 'var(--grey)' }}>
            {saved ? '♥' : '♡'}
          </button>
          <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--grey)' }}>⤴</button>
        </div>

        {/* Hero image */}
        <div style={{ height: 280, background: 'var(--card)', position: 'relative', overflow: 'hidden' }}>
          <img src={draw.imageUrl} alt={draw.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(13,11,20,0.6))' }} />
          {draw.isClosingTonight && (
            <div style={{ position: 'absolute', top: 16, left: 16 }}>
              <span style={{ background: 'rgba(236,72,153,0.2)', border: '1px solid var(--pink)', color: 'var(--pink)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6 }}>
                <LiveDot size={6} /> CLOSING TONIGHT
              </span>
            </div>
          )}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
            <span style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--white)', fontSize: 11, padding: '4px 10px', borderRadius: 999 }}>{draw.condition}</span>
            {draw.isVerified && <span style={{ background: 'rgba(139,92,246,0.3)', border: '1px solid var(--purple)', color: 'var(--purple)', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>✓ Verified</span>}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '20px 16px' }}>
          <p className="serif" style={{ fontSize: 24, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.2 }}>{draw.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: 'var(--grey)' }}>{draw.seller}</span>
            {draw.isVerified && <span style={{ color: 'var(--purple)', fontSize: 12 }}>✓</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid var(--purple)', color: 'var(--purple)', fontSize: 14, fontWeight: 700, padding: '6px 16px', borderRadius: 999 }}>{price}</span>
            <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: 14, fontWeight: 700, padding: '6px 16px', borderRadius: 999 }}>£{draw.retailValue.toLocaleString()} retail</span>
          </div>
          <ProgressBar percent={pct} height={6} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--grey)' }}>{pct}% of {draw.totalTickets.toLocaleString()} tickets sold</span>
            <span style={{ fontSize: 12, color: remaining < 500 ? 'var(--red)' : 'var(--grey)' }}>{remaining.toLocaleString()} remaining</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--grey)' }}>247 watching</span>
            <span style={{ fontSize: 12, color: 'var(--grey)' }}>12 postal entries</span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>About this item</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: expanded ? 'none' : 3, WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden' }}>
              {draw.description}
            </p>
            <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', color: 'var(--purple)', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>
              {expanded ? 'Show less' : 'Read more'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {draw.tags.map(tag => <span key={tag} style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--grey)', fontSize: 12, padding: '4px 10px', borderRadius: 999 }}>{tag}</span>)}
          </div>
          <ActivityTicker messages={socialProof} />
          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
            Free postal entry available. All draws verified by DRAWN.
          </p>
        </div>

        {/* Sticky CTA */}
        <div style={{ position: 'fixed', bottom: 64, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 500, padding: '12px 16px', background: 'var(--bg)', borderTop: '1px solid var(--border)', zIndex: 50 }}>
          {draw.isClosingTonight && <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--pink)', textAlign: 'center', fontWeight: 600 }}>⏰ Closing tonight at 9pm</p>}
          <Link href={`/draw/${draw.id}/purchase`} style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: 16, borderRadius: 999, background: 'linear-gradient(135deg, var(--purple), var(--pink))', border: 'none', color: 'var(--white)', fontSize: 16, fontWeight: 700 }}>
              Enter draw · {price}
            </button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
