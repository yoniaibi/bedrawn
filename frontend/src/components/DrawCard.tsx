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
          background: 'var(--white)',
          border: scarce ? '1.5px solid var(--red)' : '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: fullWidth ? 220 : 160, background: 'var(--card)', overflow: 'hidden' }}>
          <img
            src={draw.imageUrl}
            alt={draw.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {/* Badges */}
          {draw.isBundle && (
            <span style={{
              position: 'absolute', top: 8, left: 8,
              background: 'var(--gold)', color: 'var(--white)',
              fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 999, letterSpacing: 0.5,
            }}>BUNDLE</span>
          )}
          {draw.isClosingTonight && (
            <span style={{
              position: 'absolute', top: 8, left: draw.isBundle ? undefined : 8,
              background: 'rgba(236,72,153,0.9)',
              color: 'var(--white)', fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 999,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <LiveDot size={5} /> Tonight
            </span>
          )}
          {scarce && (
            <span style={{
              position: 'absolute', bottom: 8, left: 8,
              background: 'rgba(220,38,38,0.9)',
              color: 'var(--white)', fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 999,
            }}>{remaining} left</span>
          )}
          {draw.isVerified && (
            <span style={{
              position: 'absolute', top: 8, right: 36,
              background: 'rgba(5,150,105,0.9)',
              color: 'var(--white)', fontSize: 10, fontWeight: 700,
              padding: '3px 7px', borderRadius: 999,
            }}>Verified</span>
          )}

          {/* Save heart */}
          <button
            onClick={e => { e.preventDefault(); setSaved(s => !s); }}
            className="save-btn"
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(255,255,255,0.9)',
              border: 'none', borderRadius: '50%',
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: saved ? 'var(--pink)' : 'var(--muted)',
              fontSize: 14, cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
          >
            {saved ? '♥' : '♡'}
          </button>
        </div>

        {/* Card body */}
        <div style={{ padding: '10px 12px 12px' }}>
          {/* Price ratio — most prominent */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--purple)' }}>{price}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>for a chance at</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>£{draw.retailValue.toLocaleString()}</span>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>
            {draw.title}
          </p>
          <ProgressBar percent={pct} height={3} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)' }}>{draw.seller}</p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)' }}>{pct}% sold</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
