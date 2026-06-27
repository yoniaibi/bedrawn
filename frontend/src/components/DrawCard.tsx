'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Draw } from '@/lib/mockData';
import ProgressBar from './ProgressBar';
import LiveDot from './LiveDot';

interface DrawCardProps {
  draw: Draw;
  fullWidth?: boolean;
}

export default function DrawCard({ draw, fullWidth = false }: DrawCardProps) {
  const [saved, setSaved] = useState(false);
  const pct = Math.round((draw.soldTickets / draw.totalTickets) * 100);
  const remaining = draw.totalTickets - draw.soldTickets;
  const scarce = remaining < 500;
  const price = draw.ticketPrice >= 100
    ? `£${(draw.ticketPrice / 100).toFixed(2)}`
    : `${draw.ticketPrice}p`;

  return (
    <Link href={`/draw/${draw.id}`} style={{ textDecoration: 'none', display: 'block', width: fullWidth ? '100%' : undefined }}>
      <div
        className={`draw-card animate-fade-in-up${scarce ? ' draw-card-scarce' : ''}`}
        style={{
          background: 'var(--card)',
          border: scarce ? '1.5px solid var(--red)' : '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Image area */}
        <div style={{ position: 'relative', height: fullWidth ? 200 : 140, background: 'var(--card)', overflow: 'hidden' }}>
          <img
            src={draw.imageUrl}
            alt={draw.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {draw.isBundle && (
            <span style={{
              position: 'absolute', top: 8, left: 8,
              background: 'var(--gold)', color: '#000', fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 999, letterSpacing: 1,
            }}>BUNDLE</span>
          )}
          {draw.isClosingTonight && (
            <span style={{
              position: 'absolute', top: 8, left: draw.isBundle ? undefined : 8,
              right: draw.isBundle ? undefined : undefined,
              background: 'rgba(236,72,153,0.2)', border: '1px solid var(--pink)',
              color: 'var(--pink)', fontSize: 10, fontWeight: 600,
              padding: '2px 8px', borderRadius: 999,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <LiveDot size={6} /> CLOSING TONIGHT
            </span>
          )}
          {draw.isVerified && (
            <span style={{
              position: 'absolute', top: 8, right: 36,
              background: 'rgba(139,92,246,0.2)', border: '1px solid var(--purple)',
              color: 'var(--purple)', fontSize: 10, fontWeight: 700,
              padding: '2px 6px', borderRadius: 999,
            }}>✓</span>
          )}
          {scarce && (
            <span style={{
              position: 'absolute', bottom: 8, left: 8,
              background: 'rgba(239,68,68,0.2)', border: '1px solid var(--red)',
              color: 'var(--red)', fontSize: 10, fontWeight: 600,
              padding: '2px 8px', borderRadius: 999,
            }}>Only {remaining} left</span>
          )}
          <button
            onClick={e => { e.preventDefault(); setSaved(s => !s); }}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.5)', border: 'none',
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: saved ? 'var(--pink)' : 'var(--grey)', fontSize: 14, cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
          >
            {saved ? '♥' : '♡'}
          </button>
        </div>

        {/* Card body — hierarchy: price ratio → title → progress → seller */}
        <div style={{ padding: '10px 10px 12px' }}>
          {/* Price ratio — the hook, most prominent */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--pink)' }}>{price}</span>
            <span style={{ fontSize: 11, color: 'var(--grey)' }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)' }}>£{draw.retailValue.toLocaleString()}</span>
          </div>
          <p style={{ margin: '0 0 7px', fontSize: 11, fontWeight: 600, color: 'var(--grey)', lineHeight: 1.3 }}>
            {draw.title}
          </p>
          <ProgressBar percent={pct} height={4} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <p style={{ margin: 0, fontSize: 9, color: 'var(--muted)' }}>
              {draw.sellerEmoji} {draw.seller}
            </p>
            <p style={{ margin: 0, fontSize: 9, color: 'var(--muted)' }}>{pct}% sold</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
