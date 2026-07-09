export interface DrawCohort {
  cohortId: string;
  drawId?: string;               // links to real draw if mode = 'app'
  label: string;                 // 'Draw #4 — Chanel Classic Flap'
  brandId: string;
  mode: 'manual' | 'app';
  listedAt: string;
  closedAt: string | null;
  // Funnel
  views: number;
  uniqueVisitors: number;
  ticketsSold: number;
  totalTickets: number;
  thresholdTickets: number;
  buyers: number;
  newBuyers: number;
  repeatBuyers: number;
  // Outcome
  status: 'open' | 'confirmed' | 'resolved' | 'rolled' | 'cancelled';
  rolloverCount: number;
  daysToThreshold: number | null;
  // Growth
  winnerShared: boolean;
  shareLinkVisits: number;
  buyersFromShares: number;
  // Economics (pence)
  grossRevenue: number;
  platformFee: number;           // 12% of gross
  authCost: number;
  processingCost: number;
  opsMinutes: number;
  shippingCost: number;
  // Metadata
  ticketPricePence: number;
  retailValuePence: number;
  locked: boolean;               // true after resolution; amend requires explicit action
  decisionNote?: string;         // pivot-or-persevere note if pivot triggered
  createdAt: string;
  updatedAt: string;
}

export interface DailySnapshot {
  cohortId: string;
  date: string;                  // YYYY-MM-DD
  ticketsSold: number;
  uniqueVisitors: number;
  newBuyerCount: number;
  shareLinkVisits: number;
  notes?: string;
}

export interface MetricSnapshot {
  fillRatePct: number;
  viewToTicketPct: number;
  repeatBuyerPct: number;
  sellerRepeatPct: number;
  winnerSharePct: number;
  viralCoefficient: number;
  contributionMarginPence: number;
  drawCount: number;             // cohorts used in computation
  computedAt: string;
}

export interface PivotTrigger {
  metric: string;
  value: number;
  threshold: number;
  drawCount: number;
  sentence: string;
  decisionNote?: string;
  decisionAt?: string;
}
