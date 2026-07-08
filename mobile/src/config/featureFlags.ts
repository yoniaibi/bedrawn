export const FEATURES = {
  // ── MVP: ON ────────────────────────────────────────────
  BAGS_NICHE:            true,   // bag-only listing flow, brand chips
  THRESHOLD_COUNTDOWN:   true,
  DRAW_HISTORY:          true,
  SELLER_BADGES:         true,
  WINNER_SHARE:          true,
  AI_VALUATION:          true,
  PAYOUT_COMPARISON:     true,
  LEGIT_APP_AUTH:        true,
  LIVE_SHARE_EMBED:      true,

  // ── HIDDEN FOR MVP — DO NOT DELETE, will re-enable ─────
  GRAND_DRAW:            false,  // entire Grand Draw tab + screens + store
  LOGIN_STREAK:          false,  // daily ticket, streak, shield
  WARDROBE_BUNDLES:      false,  // bundle listing type + bundle screens
  STYLE_CATEGORIES:      false,  // womenswear/menswear rows + style tagging
  REFERRALS:             false,  // referral programme screens
  SEARCH_SCREEN:         false,  // full search — brand chips replace it in MVP
  ACHIEVEMENTS:          false,  // badge/achievement system beyond seller badges
} as const;

export type FeatureKey = keyof typeof FEATURES;
export const isEnabled = (key: FeatureKey): boolean => FEATURES[key];
