export const C = {
  // Backgrounds — warm light
  BG:           '#FAFAF8',   // warm off-white base
  CARD:         '#FFFFFF',   // pure white cards
  CARD2:        '#F5F2ED',   // elevated panels
  OVERLAY:      '#EDE8E1',   // modals / overlays

  // Text
  TEXT:         '#1C1917',   // warm near-black
  GREY:         '#78716C',   // secondary text
  MUTED:        '#A8A29E',   // tertiary / placeholders
  INVERSE:      '#FFFFFF',   // text on dark/coral surfaces

  // Brand accents
  CORAL:        '#FF2356',   // PRIMARY — all CTAs, active states
  PINK:         '#FF2356',   // alias for CORAL (backward compat)
  LILAC:        '#8B5CF6',   // verified / trust badges only
  GOLD:         '#F59E0B',   // winner states ONLY — never for CTAs or retail values
  VIOLET:       '#7C3AED',   // minimal secondary accent

  // Semantic
  GREEN:        '#059669',
  GREEN_BG:     'rgba(5,150,105,0.08)',
  RED:          '#DC2626',
  RED_BG:       'rgba(220,38,38,0.08)',
  WARNING:      '#F59E0B',
  WARNING_BG:   'rgba(245,158,11,0.10)',

  // Borders — light mode (rgba dark on white)
  BORDER_SUBTLE:  'rgba(0,0,0,0.06)',
  BORDER_DEFAULT: 'rgba(0,0,0,0.10)',
  BORDER_STRONG:  'rgba(0,0,0,0.18)',
  BORDER_ACCENT:  'rgba(255,35,86,0.30)',  // coral accent border

  // Shadows — used instead of borders for depth on cards
  SHADOW_XS: '0 1px 2px rgba(0,0,0,0.04)',
  SHADOW_SM: '0 2px 8px rgba(0,0,0,0.07)',
  SHADOW_MD: '0 4px 16px rgba(0,0,0,0.09)',
  SHADOW_LG: '0 8px 32px rgba(0,0,0,0.11)',

  // Backward-compat aliases for existing components
  WHITE:        '#FFFFFF',
  PURPLE:       '#FF2356',              // alias → CORAL (was primary, now coral is primary)
  PURPLE_DARK:  '#7C3AED',             // alias → VIOLET
  PURPLE_LIGHT: 'rgba(255,35,86,0.08)', // alias → coral tint (active element bg)
  GOLD_LIGHT:   'rgba(245,158,11,0.12)',
  GREEN_LIGHT:  'rgba(5,150,105,0.08)',
  RED_LIGHT:    'rgba(220,38,38,0.08)',
  BORDER:       'rgba(0,0,0,0.10)',  // alias → BORDER_DEFAULT
};
