'use client';

import Link from 'next/link';
import { Draw } from '@/lib/mockData';

interface DrawCardProps {
  draw: Draw;
  fullWidth?: boolean;
}

export default function DrawCard({ draw, fullWidth = false }: DrawCardProps) {
  const pct = Math.round((draw.soldTickets / draw.totalTickets) * 100);
  const remaining = draw.totalTickets - draw.soldTickets;
  const scarce = remaining < 500;
  const price = draw.ticketPrice >= 100
    ? `£${(draw.ticketPrice / 100).toFixed(2)}`
    : `${draw.ticketPrice}p`;

  const imageHeight = fullWidth ? 220 : 180;

  return (
    <Link href={`/draw/${draw.id}`} style={{ textDecoration: 'none', display: 'block', width: fullWidth ? '100%' : undefined }}>
      <div
        className={`draw-card animate-fade-in-up${scarce ? ' draw-card-scarce' : ''}`}
        style={{
          background: 'var(--bg-raised)',
          border: scarce
            ? '1px solid rgba(248,113,113,0.30)'
            : '1px solid var(--border-subtle)',
          borderRadius: 14,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {/* Image with gradient overlay + text-on-image */}
        <div style={{ position: 'relative', height: imageHeight, overflow: 'hidden' }}>
          <img
            className="card-image-img"
            src={draw.imageUrl}
            alt={draw.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.82) 100%)',
          }} />

          {/* Top badges */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
            {draw.isClosingTonight && (
              <span style={{
                background: 'rgba(244,114,182,0.15)',
                border: '1px solid rgba(244,114,182,0.35)',
                color: '#F472B6',
                fontSize: 10, fontWeight: 600, padding: '3px 8px',
                borderRadius: 6, letterSpacing: '0.08em', textTransform: 'uppercase',
                backdropFilter: 'blur(8px)',
              }}>
                Closing Tonight
              </span>
            )}
            {draw.isBundle && (
              <span style={{
                background: 'rgba(252,211,77,0.12)',
                border: '1px solid rgba(252,211,77,0.25)',
                color: '#FCD34D',
                fontSize: 10, fontWeight: 600, padding: '3px 8px',
                borderRadius: 6, letterSpacing: '0.08em', textTransform: 'uppercase',
                backdropFilter: 'blur(8px)',
              }}>
                Bundle
              </span>
            )}
          </div>

          {draw.isVerified && (
            <span style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(196,181,253,0.12)',
              border: '1px solid rgba(196,181,253,0.25)',
              color: '#C4B5FD',
              fontSize: 10, fontWeight: 600, padding: '3px 8px',
              borderRadius: 6, letterSpacing: '0.08em', textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
            }}>
              Verified
            </span>
          )}

          {scarce && (
            <span style={{
              position: 'absolute', bottom: 44, left: 8,
              background: 'rgba(248,113,113,0.15)',
              border: '1px solid rgba(248,113,113,0.30)',
              color: '#F87171',
              fontSize: 10, fontWeight: 600, padding: '3px 8px',
              borderRadius: 6, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {remaining.toLocaleString()} left
            </span>
          )}

          {/* Title + price inside image, over gradient */}
          <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
            <p style={{
              margin: '0 0 4px', fontSize: 13, fontWeight: 600,
              color: '#FFFFFF', lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}>
              {draw.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="serif" style={{
                fontSize: fullWidth ? 22 : 18,
                fontWeight: 700,
                color: 'var(--accent-pink)',
              }}>
                {price}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>→</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.70)' }}>
                £{draw.retailValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Below-image: progress + meta */}
        <div style={{
          background: 'var(--bg-raised)',
          padding: '8px 12px 11px',
        }}>
          {/* Progress bar */}
          <div style={{
            height: 4, background: 'var(--border-subtle)',
            borderRadius: 99, marginBottom: 7, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: scarce ? 'var(--danger)' : 'var(--accent-lilac)',
              borderRadius: 99,
              transition: 'width 500ms ease-out',
            }} />
          </div>
          {/* Meta row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{draw.seller}</span>
            {draw.closingDate ? (
              <span style={{
                fontSize: 11,
                color: draw.isClosingTonight ? 'var(--accent-pink)' : 'var(--text-tertiary)',
                fontWeight: draw.isClosingTonight ? 600 : 400,
              }}>
                {draw.isClosingTonight ? 'Tonight' : `Closes ${new Date(draw.closingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{pct}% sold</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
