export const TARGETS = {
  fillRatePct:        { healthy: 70,  pivot: 40,  pivotAfterDraws: 10 },
  viewToTicketPct:    { healthy: 8,   pivot: 3,   pivotAfterDraws: 6  },
  repeatBuyerPct:     { healthy: 35,  pivot: 15,  pivotAfterDraws: 10 },
  sellerRepeatPct:    { healthy: 50,  pivot: 20,  pivotAfterDraws: 10 },
  winnerSharePct:     { healthy: 40,  pivot: 15,  pivotAfterDraws: 8  },
  viralCoefficient:   { healthy: 0.5, pivot: 0.2, pivotAfterDraws: 10 },
  contributionMargin: { healthy: 0,   pivot: 0,   pivotAfterDraws: 15 },
  opsHourlyRatePence: 2500,
} as const;

export type MetricKey = keyof Omit<typeof TARGETS, 'opsHourlyRatePence'>;

export const PIVOT_SENTENCES: Record<MetricKey, string> = {
  fillRatePct:        'Fill rate below 40% after 10 draws — the threshold model needs a pivot-or-persevere decision.',
  viewToTicketPct:    'View-to-ticket conversion below 3% after 6 draws — the draw page or pricing needs a pivot-or-persevere decision.',
  repeatBuyerPct:     'Repeat buyer rate below 15% after 10 draws — retention is failing; pivot-or-persevere required.',
  sellerRepeatPct:    'Fewer than 20% of sellers have re-listed after 10 draws — supply-side retention needs a pivot-or-persevere decision.',
  winnerSharePct:     'Fewer than 15% of winners sharing after 8 draws — the viral loop is broken; pivot-or-persevere required.',
  viralCoefficient:   'Viral coefficient below 0.2 after 10 draws — word-of-mouth growth is negligible; pivot-or-persevere required.',
  contributionMargin: 'Contribution margin still negative after 15 draws — unit economics are not working; pivot-or-persevere required.',
};
