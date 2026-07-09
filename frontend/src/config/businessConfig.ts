// ── bedrawn business configuration ──
// All fee, pricing and compliance constants live here — never inline these
// values in components.

export const POSTAL_ADDRESS = 'bedrawn Free Entry\n[BEDRAWN POSTAL ADDRESS — config placeholder]';

export const TICKET_PRICE_LADDER_PENCE = [10, 20, 30, 50, 100, 200, 500];

export const PLATFORM_FEE_PCT = 0.12;
export const PROCESSING_FIXED_PENCE = 1700;
export const MIN_RETAIL_VALUE_PENCE = 20000;
export const CC_CAP_PENCE = 25000;
export const HARM_TRIGGER_PENCE = 20000;
export const FOUNDING_SELLER_CAP = 100;
export const DRAW_NIGHTS = ['tuesday', 'thursday'] as const;
export type DrawNight = typeof DRAW_NIGHTS[number];

/** Format a pence value as the ladder displays it: 10p · 20p … £1 · £2 · £5 */
export function formatTicketPricePence(pence: number): string {
  return pence >= 100 ? `£${(pence / 100) % 1 === 0 ? pence / 100 : (pence / 100).toFixed(2)}` : `${pence}p`;
}
