export type BadgeTier = 'FOUNDING_SELLER' | 'TRUSTED_SELLER' | 'TOP_SELLER';

export function computeBadges(resolvedDraws: number, isFoundingSeller: boolean, strikes: number): BadgeTier[] {
  const badges: BadgeTier[] = [];
  if (isFoundingSeller) badges.push('FOUNDING_SELLER');
  if (strikes === 0 && resolvedDraws >= 10) badges.push('TOP_SELLER');
  else if (strikes === 0 && resolvedDraws >= 3) badges.push('TRUSTED_SELLER');
  return badges.slice(0, 2); // max two badges shown
}

export const BADGE_LABELS: Record<BadgeTier, string> = {
  FOUNDING_SELLER: 'Founding Seller',
  TRUSTED_SELLER: 'Trusted Seller',
  TOP_SELLER: 'Top Seller',
};

/** Map the legacy Draw.sellerTier field to badge tiers. */
export function tierToBadges(tier?: 'founding' | 'trusted' | 'top' | null): BadgeTier[] {
  if (tier === 'founding') return ['FOUNDING_SELLER'];
  if (tier === 'trusted') return ['TRUSTED_SELLER'];
  if (tier === 'top') return ['TOP_SELLER'];
  return [];
}

/** Resolve badges for a draw object — prefers seller.badges, falls back to sellerTier. */
export function badgesForDraw(draw: { sellerTier?: 'founding' | 'trusted' | 'top' | null; seller?: unknown }): BadgeTier[] {
  const seller = draw.seller as { badges?: BadgeTier[] } | string | undefined;
  if (seller && typeof seller === 'object' && Array.isArray(seller.badges)) {
    return seller.badges.slice(0, 2);
  }
  return tierToBadges(draw.sellerTier);
}
