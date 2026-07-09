'use client';

import { BadgeTier, BADGE_LABELS } from '@/config/sellerBadges';

const BADGE_STYLES: Record<BadgeTier, { bg: string; border: string; color: string; icon: string }> = {
  FOUNDING_SELLER: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    color: 'var(--accent-gold)',
    icon: '◆',
  },
  TRUSTED_SELLER: {
    bg: 'rgba(124,58,237,0.10)',
    border: 'rgba(124,58,237,0.30)',
    color: 'var(--accent-lilac)',
    icon: '✓',
  },
  TOP_SELLER: {
    bg: 'rgba(124,58,237,0.10)',
    border: 'rgba(124,58,237,0.30)',
    color: 'var(--accent-lilac)',
    icon: '★',
  },
};

interface SellerBadgeProps {
  tier: BadgeTier;
  /** Compact = text-only pill (draw cards); full = icon + text (detail / profile) */
  compact?: boolean;
}

export default function SellerBadge({ tier, compact = false }: SellerBadgeProps) {
  const s = BADGE_STYLES[tier];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: compact ? 0 : 4,
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
      fontSize: compact ? 9 : 10,
      fontWeight: 700,
      padding: compact ? '2px 7px' : '3px 10px',
      borderRadius: 999,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
    }}>
      {!compact && <span aria-hidden style={{ fontSize: 9 }}>{s.icon}</span>}
      {BADGE_LABELS[tier]}
    </span>
  );
}

/** Convenience: render a row of badges (max two). */
export function SellerBadgeRow({ badges, compact = false }: { badges: BadgeTier[]; compact?: boolean }) {
  if (!badges.length) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {badges.slice(0, 2).map(b => <SellerBadge key={b} tier={b} compact={compact} />)}
    </span>
  );
}
