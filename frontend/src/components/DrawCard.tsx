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
          background: '#FFFFFF',
          border: scarce
            ? '1.5px solid rgba(220,38,38,0.25)'
            : '1px solid rgba(0,0,0,0.06)',
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

          {/* Gradient overlay — deeper for text readability */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 25%, rgba(0,0,0,0.50) 65%, rgba(0,0,0,0.80) 100%)',
          }} />

          {/* Top badges */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
            {draw.isClosingTonight && (
              <span style={{
                background: 'rgba(255,35,86,0.18)',
                border: '1px solid rgba(255,35,86,0.40)',
                color: '#FFFFFF',
                fontSize: 10, fontWeight: 700, padding: '3px 8px',
                borderRadius: 6, letterSpacing: '0.08em', textTransform: 'uppercase',
                backdropFilter: 'blur(8px)',
              }}>
                Tonight
              </span>
            )}
            {draw.isBundle && (
              <span style={{
                background: 'rgba(245,158,11,0.18)',
                border: '1px solid rgba(245,158,11,0.35)',
                color: '#FCD34D',
                fontSize: 10, fontWeight: 700, padding: '3px 8px',
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
              background: 'rgba(139,92,246,0.18)',
              border: '1px solid rgba(139,92,246,0.35)',
              color: '#FFFFFF',
              fontSize: 10, fontWeight: 600, padding: '3px 8px',
              borderRadius: 6, letterSpacing: '0.06em',
              backdropFilter: 'blur(8px)',
            }}>
              ✓
            </span>
          )}

          {scarce && (
            <span style={{
              position: 'absolute', bottom: 44, left: 8,
              background: 'rgba(220,38,38,0.18)',
              border: '1px solid rgba(220,38,38,0.35)',
              color: '#FFAAAA',
              fontSize: 10, fontWeight: 600, padding: '3px 8px',
              borderRadius: 6, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {remaining.toLocaleString()} left
            </span>
          )}

          {/* Title + price inside image */}
          <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
            <p style={{
              margin: '0 0 3px', fontSize: 13, fontWeight: 600,
              color: '#FFFFFF', lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}>
              {draw.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="serif" style={{
                fontSize: fullWidth ? 22 : 18,
                fontWeight: 700,
                color: '#FF5F7E',
              }}>
                {price}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>→</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>
                £{draw.retailValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Below-image: progress + meta */}
        <div style={{ background: '#FFFFFF', padding: '8px 12px 11px' }}>
          {/* Progress bar */}
          <div style={{
            height: 3, background: 'rgba(0,0,0,0.08)',
            borderRadius: 99, marginBottom: 7, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: scarce ? '#DC2626' : '#FF2356',
              borderRadius: 99,
              transition: 'width 500ms ease-out',
            }} />
          </div>
          {/* Meta row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#A8A29E' }}>@{draw.seller}</span>
            {draw.closingDate ? (
              <span style={{
                fontSize: 11,
                color: draw.isClosingTonight ? '#FF2356' : '#A8A29E',
                fontWeight: draw.isClosingTonight ? 600 : 400,
              }}>
                {draw.isClosingTonight ? 'Tonight 9pm' : `Closes ${new Date(draw.closingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: '#A8A29E' }}>{pct}% sold</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
