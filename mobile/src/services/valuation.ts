import { BrandId } from '../config/brands';
import { BAG_COMPS, BRAND_MEDIANS } from '../mocks/bagComps';

export type Condition = 'pristine' | 'excellent' | 'good' | 'fair';

export interface ValuationInput {
  brandId: BrandId;
  model: string;
  condition: Condition;
  hasBox: boolean;
  hasDustBag: boolean;
  hasReceipt: boolean;
  hasAuthCard: boolean;
}

export interface ValuationResult {
  estimatedValuePence: number;
  rangeLowPence: number;
  rangeHighPence: number;
  suggestedTicketPricePence: number;
  suggestedTotalTickets: number;
  projectedSellerPayoutPence: number;
  confidence: 'high' | 'medium' | 'low';
}

const CONDITION_MULTIPLIERS: Record<Condition, number> = {
  pristine:  1.00,
  excellent: 0.88,
  good:      0.74,
  fair:      0.58,
};

const TICKET_PRICE_LADDER = [10, 20, 30, 50, 100, 200, 500]; // pence

const PLATFORM_FEE = 0.12;
const PROCESSING_PENCE = 1700; // £17

export function computeValuation(input: ValuationInput): ValuationResult {
  // 1. Look up base value
  const modelKey = input.model.trim().toLowerCase();
  const comp = BAG_COMPS.find(
    c => c.brandId === input.brandId && c.model.toLowerCase() === modelKey
  );
  const confidence: 'high' | 'medium' | 'low' = comp ? 'high' : 'low';
  const baseValue = comp?.baseValuePence ?? BRAND_MEDIANS[input.brandId];

  // 2. Apply condition multiplier
  const conditionMultiplier = CONDITION_MULTIPLIERS[input.condition];
  let value = Math.round(baseValue * conditionMultiplier);

  // 3. Completeness bonus (cap +6%)
  let bonus = 0;
  if (input.hasBox)      bonus += 0.02;
  if (input.hasDustBag)  bonus += 0.01;
  if (input.hasReceipt)  bonus += 0.02;
  if (input.hasAuthCard) bonus += 0.02;
  bonus = Math.min(bonus, 0.06);
  value = Math.round(value * (1 + bonus));

  // 4. Range ±12%
  const rangeLowPence  = Math.round(value * 0.88);
  const rangeHighPence = Math.round(value * 1.12);

  // 5. Ticket price ladder — find price where totalTickets ∈ [1500, 8000]
  // Target gross = value × 1.18 (covers 12% fee + processing + headroom)
  const targetGross = Math.round(value * 1.18);
  let ticketPricePence = 10;
  let totalTickets = 8000;

  for (const price of TICKET_PRICE_LADDER) {
    const count = Math.ceil(targetGross / price);
    if (count >= 1500 && count <= 8000) {
      ticketPricePence = price;
      totalTickets = Math.round(count / 100) * 100; // round to nearest 100
      break;
    }
    if (count < 1500) {
      // price too high, stick with previous or keep going
      ticketPricePence = price;
      totalTickets = Math.max(1500, Math.round(count / 100) * 100);
      break;
    }
  }
  // Fallback if no ladder price fits
  if (totalTickets > 8000) {
    ticketPricePence = TICKET_PRICE_LADDER[TICKET_PRICE_LADDER.length - 1];
    totalTickets = Math.round(Math.ceil(targetGross / ticketPricePence) / 100) * 100;
  }

  // 6. Projected payout
  const grossRevenue = totalTickets * ticketPricePence;
  const projectedSellerPayoutPence = Math.round(grossRevenue * (1 - PLATFORM_FEE) - PROCESSING_PENCE);

  return {
    estimatedValuePence: value,
    rangeLowPence,
    rangeHighPence,
    suggestedTicketPricePence: ticketPricePence,
    suggestedTotalTickets: totalTickets,
    projectedSellerPayoutPence,
    confidence,
  };
}

export function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatTicketPrice(pence: number): string {
  if (pence >= 100) return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
  return `${pence}p`;
}
