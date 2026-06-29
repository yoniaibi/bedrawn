export const C = {
  // Backgrounds — near-neutral dark (not purple-tinted)
  BG:           '#0A0A0B',   // --bg-base
  CARD:         '#141416',   // --bg-raised
  CARD2:        '#1C1C1F',   // --bg-elevated
  OVERLAY:      '#242428',   // --bg-overlay

  // Text
  TEXT:         '#F4F4F5',   // --text-primary (warm white, not pure white)
  GREY:         '#A1A1AA',   // --text-secondary
  MUTED:        '#52525B',   // --text-tertiary
  INVERSE:      '#09090B',   // --text-inverse (for light backgrounds)

  // Brand accents — used sparingly
  LILAC:        '#C4B5FD',   // --accent-lilac (softer, readable on dark)
  PINK:         '#F472B6',   // --accent-pink (live states, urgency, CTA only)
  GOLD:         '#FCD34D',   // --accent-gold (winner states ONLY)
  VIOLET:       '#7C3AED',   // --accent-violet (primary action buttons)
  ROSE:         '#FB7185',   // --accent-rose (secondary accents)

  // Semantic
  GREEN:        '#4ADE80',
  GREEN_BG:     'rgba(74,222,128,0.10)',
  RED:          '#F87171',
  RED_BG:       'rgba(248,113,113,0.10)',
  WARNING:      '#FCD34D',
  WARNING_BG:   'rgba(252,211,77,0.10)',

  // Borders — always rgba
  BORDER_SUBTLE:  'rgba(255,255,255,0.06)',
  BORDER_DEFAULT: 'rgba(255,255,255,0.10)',
  BORDER_STRONG:  'rgba(255,255,255,0.18)',
  BORDER_ACCENT:  'rgba(196,181,253,0.35)',

  // Keep these aliases for backward compat with existing components
  WHITE:        '#FFFFFF',
  PURPLE:       '#C4B5FD',   // alias → LILAC (softer, not deep violet)
  PURPLE_DARK:  '#7C3AED',   // alias → VIOLET
  PURPLE_LIGHT: 'rgba(196,181,253,0.12)',
  GOLD_LIGHT:   'rgba(252,211,77,0.12)',
  GREEN_LIGHT:  'rgba(74,222,128,0.10)',
  RED_LIGHT:    'rgba(248,113,113,0.10)',
  BORDER:       'rgba(255,255,255,0.10)',  // alias → BORDER_DEFAULT
};

// Light mode tokens (applied when user toggles in Settings)
export const LIGHT = {
  BG:           '#FAFAFA',
  CARD:         '#FFFFFF',
  CARD2:        '#F4F4F5',
  OVERLAY:      '#E4E4E7',
  TEXT:         '#09090B',
  GREY:         '#52525B',
  MUTED:        '#A1A1AA',
  INVERSE:      '#F4F4F5',
  LILAC:        '#7C3AED',
  PINK:         '#EC4899',
  GOLD:         '#D97706',
  VIOLET:       '#6D28D9',
  ROSE:         '#E11D48',
  BORDER_SUBTLE:  'rgba(0,0,0,0.06)',
  BORDER_DEFAULT: 'rgba(0,0,0,0.10)',
  BORDER_STRONG:  'rgba(0,0,0,0.18)',
  BORDER_ACCENT:  'rgba(124,58,237,0.35)',
};
