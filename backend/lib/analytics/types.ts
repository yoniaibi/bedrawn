export type BrandId = 'chanel' | 'lv' | 'bottega' | 'prada' | 'celine';

export type DrawCondition =
  | 'brand_new' | 'like_new' | 'excellent' | 'very_good' | 'good' | 'fair';

export type AnalyticsEventType =
  | 'draw_created'
  | 'ticket_purchased'
  | 'threshold_reached'
  | 'draw_saved'
  | 'draw_unsaved'
  | 'draw_viewed'
  | 'draw_shared'
  | 'auth_passed'
  | 'auth_failed'
  | 'draw_completed'
  | 'draw_cancelled'
  | 'winner_confirmed';

// ─── Raw events ────────────────────────────────────────────────────────────────
// PK: DRAW#{drawId}  SK: EVENT#{ISO}#{eventType}
export interface AnalyticsEvent {
  PK: string;
  SK: string;
  eventType: AnalyticsEventType;
  drawId: string;
  brandId?: BrandId;
  itemSlug?: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

// ─── Draw summary (written once per draw after it completes/cancels) ───────────
// PK: DRAW#{drawId}  SK: SUMMARY
// GSI1: brandId_closedAt  →  all draws for a brand sorted by date
// GSI2: itemSlug_closedAt →  all draws for a specific model sorted by date
export interface DrawSummary {
  PK: string;
  SK: 'SUMMARY';
  drawId: string;
  brandId: BrandId;
  itemSlug: string;

  // Item metadata (snapshot at time of draw)
  modelName: string;
  modelVariant: string;
  condition: string;
  retailValueGBP: number;

  // Draw params
  ticketPricePence: number;
  reserveTickets: number;
  totalTickets: number;
  authTier?: string;
  authStatus?: string;
  sellerTier?: string | null;

  // Outcomes
  outcome: 'complete' | 'cancelled';
  totalTicketsSold: number;
  totalRevenuePence: number;
  effectiveSalePricePence: number; // winner's tickets × ticketPrice (0 if cancelled)

  // Timing
  createdAt: string;
  thresholdReachedAt?: string;
  hoursToThreshold?: number;       // hours from listing to reserve hit
  closedAt: string;

  // Demand
  uniqueBuyerCount: number;
  saveCount: number;               // filled in by snapshot generator from events

  // Winner (anonymised — no PII)
  winnerTicketCount?: number;
  winnerOdds?: number;             // winnerTicketCount / totalTicketsSold

  // GSI projection fields
  brandId_closedAt: string;        // "BRAND#chanel#2026-07"
  itemSlug_closedAt: string;       // "ITEM#chanel-classic-flap#2026-07-09"
}

// ─── Catalogue item (one entry per distinct bag model) ─────────────────────────
// PK: ITEM#{itemSlug}  SK: META
// GSI3: brandId_itemSlug  →  all catalogue items for a brand
export interface CatalogueItem {
  PK: string;
  SK: 'META';
  itemSlug: string;
  brandId: BrandId;
  modelName: string;
  modelVariant?: string;
  category: 'handbag' | 'satchel' | 'clutch' | 'tote' | 'backpack' | 'crossbody' | 'wallet';
  colourFamily?: string;
  hardwareFinish?: string;
  retailPriceLow?: number;
  retailPriceHigh?: number;

  firstListedAt: string;
  listingCount: number;
  lastListedAt: string;
  completedDraws: number;

  // Demand summary — updated by snapshot generator
  avgHoursToThreshold?: number | null;
  avgEffectiveSalePricePence?: number | null;
  avgSaveCount?: number | null;

  // GSI field
  brandId_itemSlug: string; // "BRAND#chanel"
}

// ─── Brand aggregate (recomputed nightly) ─────────────────────────────────────
// PK: BRAND#{brandId}  SK: AGGREGATE#all_time | AGGREGATE#{YYYY-MM}
export interface BrandAggregate {
  PK: string;
  SK: string;
  brandId: BrandId;
  period: string; // 'all_time' | '2026-06' | 'last_30d'

  // Volume
  totalDraws: number;
  completedDraws: number;
  cancelledDraws: number;
  completionRate: number;

  // Revenue (pence, completed draws only)
  totalRevenuePence: number;
  avgRevenuePence: number;
  avgEffectiveSalePricePence: number; // what winners actually "paid"
  avgRetailValueGBP: number;
  avgDiscountToRetailPct: number;     // effectiveSalePrice as % of retailValue

  // Demand
  avgSaveCount: number;
  avgHoursToThreshold: number | null;

  // Auth quality
  authTotal: number;
  authPassCount: number;
  authPassRate: number; // 0–100

  // Top models (up to 10, sorted by completed draw count)
  topModels: Array<{
    itemSlug: string;
    modelName: string;
    drawCount: number;
    completedDraws: number;
    avgRevenuePence: number;
    avgHoursToThreshold: number | null;
  }>;

  // Condition performance
  conditionBreakdown: Record<string, {
    count: number;
    avgRevenuePence: number;
    completionRate: number;
  }>;

  // Price point performance
  ticketPriceBreakdown: Record<number, {
    count: number;
    avgRevenuePence: number;
  }>;

  updatedAt: string;
}

// ─── Helper: derive item slug from brandId + draw title ────────────────────────
const BRAND_NAME_PATTERNS: Record<string, string> = {
  chanel: 'chanel',
  lv: 'louis vuitton',
  bottega: 'bottega veneta',
  prada: 'prada',
  celine: 'celine',
};

export function toItemSlug(brandId: string, title: string): string {
  let cleaned = title.toLowerCase();
  const brandName = BRAND_NAME_PATTERNS[brandId] ?? brandId;
  cleaned = cleaned.replace(brandName, '').trim();
  // Strip colorway/variant after em dash
  cleaned = cleaned.replace(/\s*[—–\-]{1,2}.*$/, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 4);
  return `${brandId}-${words.join('-').replace(/[^a-z0-9-]/g, '')}`;
}
