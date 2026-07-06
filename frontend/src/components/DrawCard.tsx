'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Draw } from '@/lib/mockData';

interface DrawCardProps {
  draw: Draw;
  fullWidth?: boolean;
}

export default function DrawCard({ draw, fullWidth = false }: DrawCardProps) {
  const router = useRouter();
  const pct = Math.round((draw.soldTickets / draw.totalTickets) * 100);
  const remaining = draw.totalTickets - draw.soldTickets;
  const scarce = remaining < 500;
  const price = draw.ticketPrice >= 100
    ? `£${(draw.ticketPrice / 100).toFixed(2)}`
    : `${draw.ticketPrice}p`;

  const imageHeight = fullWidth ? 220 : 180;
  const sellerInitial = (draw.sellerName || draw.seller || '?').charAt(0).toUpperCase();
  const sellerDisplayName = draw.sellerName ? draw.sellerName.split(' ')[0] : `@${draw.seller}`;

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
                background: 'rgba(255,35,86,0.22)',
                border: '1px solid rgba(255,35,86,0.50)',
                color: '#FFFFFF',
                fontSize: 9, fontWeight: 800, padding: '3px 9px',
                borderRadius: 999, letterSpacing: '0.10em', textTransform: 'uppercase' as const,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 2px 8px rgba(255,35,86,0.25)',
              }}>
                Tonight
              </span>
            )}
            {draw.isBundle && (
              <span style={{
                background: 'rgba(245,158,11,0.22)',
                border: '1px solid rgba(245,158,11,0.45)',
                color: '#FDE68A',
                fontSize: 9, fontWeight: 800, padding: '3px 9px',
                borderRadius: 999, letterSpacing: '0.10em', textTransform: 'uppercase' as const,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}>
                Bundle
              </span>
            )}
          </div>

          {draw.isVerified && (
            <span style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(139,92,246,0.22)',
              border: '1px solid rgba(139,92,246,0.45)',
              color: '#FFFFFF',
              fontSize: 9, fontWeight: 700, padding: '3px 8px',
              borderRadius: 999, letterSpacing: '0.06em',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}>
              ✓ verified
            </span>
          )}

          {scarce && (
            <span style={{
              position: 'absolute', bottom: 46, left: 8,
              background: 'rgba(220,38,38,0.22)',
              border: '1px solid rgba(220,38,38,0.45)',
              color: '#FCA5A5',
              fontSize: 9, fontWeight: 700, padding: '3px 9px',
              borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 2px 8px rgba(220,38,38,0.20)',
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
        <div style={{ background: 'rgba(255,255,255,0.97)', padding: '8px 12px 11px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            {/* Seller pill — navigates to seller profile */}
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                if (draw.sellerId) router.push(`/sellers?id=${draw.sellerId}`);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: draw.sellerId ? 'pointer' : 'default',
                padding: 0, minWidth: 0, flexShrink: 1,
              }}
            >
              {/* Mini avatar */}
              {draw.sellerAvatarUrl ? (
                <img
                  src={draw.sellerAvatarUrl}
                  alt={sellerDisplayName}
                  style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-coral)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{sellerInitial}</span>
                </div>
              )}
              <span style={{
                fontSize: 11, color: draw.sellerId ? 'var(--text-secondary)' : '#A8A29E',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 100,
              }}>
                {sellerDisplayName}
              </span>
            </button>

            {draw.closingDate ? (
              <span style={{
                fontSize: 11, flexShrink: 0,
                color: draw.isClosingTonight ? '#FF2356' : '#A8A29E',
                fontWeight: draw.isClosingTonight ? 600 : 400,
              }}>
                {draw.isClosingTonight ? 'Tonight 9pm' : `Closes ${new Date(draw.closingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: '#A8A29E', flexShrink: 0 }}>{pct}% sold</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
