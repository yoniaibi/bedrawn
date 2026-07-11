export interface AuthRecord {
  provider: 'legit_app';
  tier: 'photo' | 'photo_plus_physical';
  status: 'pending' | 'passed' | 'failed';
  certificateRef: string | null;
  checkedAt: string | null;
}

export type SellerTier = 'founding' | 'trusted' | 'top' | null;

export type Draw = {
  id: string;
  title: string;
  seller: string;
  sellerId?: string;
  sellerName?: string;
  sellerAvatarUrl?: string;
  sellerEmoji: string;
  ticketPrice: number; // pence
  retailValue: number; // pounds
  totalTickets: number;
  soldTickets: number;
  category: string;
  style: string;
  condition: string;
  isBundle: boolean;
  isClosingTonight: boolean;
  isVerified: boolean;
  description: string;
  imageColor: string;
  imageUrl?: string;
  closingDate?: string; // YYYY-MM-DD — only set once the reserve is hit (scheduled for next 9pm)
  reserveTickets?: number; // minimum tickets to confirm the draw
  minThreshold?: number;    // fraction 0-1 (e.g. 0.5 = 50% reserve). Alternative to reserveTickets.
  brandId?: 'chanel' | 'lv' | 'bottega' | 'prada' | 'celine';
  auth?: AuthRecord;
  sellerTier?: 'founding' | 'trusted' | 'top' | null;
  drawDurationDays?: number;
  endsAt?: string;
  postalDeadline?: string;
  status?: 'open' | 'pending_auth' | 'auth_failed' | 'pending_verification' | 'sold_out_pending' | 'drawing' | 'complete' | 'cancelled';
  winnerHandle?: string;
};

export const draws: Draw[] = [
  {
    id: '1',
    title: 'Chanel Classic Flap Bag — Medium',
    seller: 'luxe_resale',
    sellerEmoji: '💎',
    ticketPrice: 10,
    retailValue: 6800,
    totalTickets: 1000,
    soldTickets: 847,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Excellent',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description:
      'Authentic Chanel Classic Flap in black caviar leather with gold hardware. Serial number verified, comes with dustbag, box, and authenticity card. Purchased from Chanel Paris in 2022.',
    imageColor: '#E8DDD3',
    reserveTickets: 250,
    brandId: 'chanel' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0001', checkedAt: '2026-06-01T10:00:00Z' },
    sellerTier: 'founding' as const,
    minThreshold: 0.25,
  },
  {
    id: '2',
    title: 'Louis Vuitton Pochette Métis — Reverse Monogram',
    seller: 'parisian_preloved',
    sellerEmoji: '🛍️',
    ticketPrice: 10,
    retailValue: 1450,
    totalTickets: 800,
    soldTickets: 512,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Excellent',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description:
      'Louis Vuitton Pochette Métis in Reverse Monogram canvas. 2021, very light wear. Gold-tone hardware, all tabs and zips perfect. Comes with dustbag and date code.',
    imageColor: '#DDD0C4',
    reserveTickets: 400,
    brandId: 'lv' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0002', checkedAt: '2026-06-02T11:00:00Z' },
    sellerTier: 'trusted' as const,
    minThreshold: 0.5,
  },
  {
    id: '3',
    title: 'Celine Nano Luggage — Cashmere Grey',
    seller: 'the_edit_co',
    sellerEmoji: '✨',
    ticketPrice: 10,
    retailValue: 1650,
    totalTickets: 700,
    soldTickets: 280,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Very Good',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description:
      'Celine Nano Luggage tote in cashmere grey grained calfskin. The Phoebe Philo era original. Tri-fold flap, gold metal feet. 2018, light wear on base. Dustbag included.',
    imageColor: '#E5DAD0',
    reserveTickets: 350,
    brandId: 'celine' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0003', checkedAt: '2026-06-03T09:00:00Z' },
    sellerTier: 'founding' as const,
    minThreshold: 0.5,
  },
  {
    id: '4',
    title: 'Chanel Boy Bag — Small Black Lambskin',
    seller: 'luxe_resale',
    sellerEmoji: '💎',
    ticketPrice: 20,
    retailValue: 5200,
    totalTickets: 600,
    soldTickets: 420,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Very Good',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description:
      'Chanel Boy Bag in small black lambskin with ruthenium hardware. 2019, serial verified. Lightly worn, all stitching and hardware perfect. Original dustbag, box, and authenticity card.',
    imageColor: '#E8DDD3',
    reserveTickets: 300,
    brandId: 'chanel' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0004', checkedAt: '2026-06-04T10:00:00Z' },
    sellerTier: 'founding' as const,
    minThreshold: 0.5,
  },
  {
    id: '5',
    title: 'Louis Vuitton Neverfull MM — Damier Ebène',
    seller: 'parisian_preloved',
    sellerEmoji: '🛍️',
    ticketPrice: 10,
    retailValue: 1150,
    totalTickets: 600,
    soldTickets: 441,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Good',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description:
      'Louis Vuitton Neverfull MM in Damier Ebène canvas with red interior. Comes with pouch, dustbag, and date code 2019. Light wear consistent with age.',
    imageColor: '#DDD0C4',
    reserveTickets: 450,
    brandId: 'lv' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0005', checkedAt: '2026-06-05T14:30:00Z' },
    sellerTier: 'trusted' as const,
    minThreshold: 0.75,
  },
  {
    id: '6',
    title: 'Prada Saffiano Lux Tote — Nero',
    seller: 'luxe_resale',
    sellerEmoji: '💎',
    ticketPrice: 10,
    retailValue: 1350,
    totalTickets: 700,
    soldTickets: 350,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Excellent',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description:
      'Prada Saffiano Lux tote in nero (black) with double handles and detachable strap. Silver triangle logo, snap closure. 2021, barely used. Full set with dustbag and care card.',
    imageColor: '#D4C5B8',
    reserveTickets: 350,
    brandId: 'prada' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0006', checkedAt: '2026-06-06T14:00:00Z' },
    sellerTier: null,
    minThreshold: 0.5,
  },
  {
    id: '7',
    title: 'Prada Re-Edition 2000 Nylon Mini Bag',
    seller: 'luxe_resale',
    sellerEmoji: '💎',
    ticketPrice: 10,
    retailValue: 875,
    totalTickets: 500,
    soldTickets: 389,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Excellent',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description:
      'Prada Re-Edition 2000 in Re-Nylon and Saffiano leather in Nior. Silver metal lettering, shoulder strap included. 2022, barely used. Original receipt and dustbag.',
    imageColor: '#D4C5B8',
    reserveTickets: 250,
    brandId: 'prada' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0007', checkedAt: '2026-06-07T09:00:00Z' },
    sellerTier: 'founding' as const,
    minThreshold: 0.5,
  },
  {
    id: '8',
    title: 'Celine Classic Box Bag — Black Smooth Leather',
    seller: 'the_edit_co',
    sellerEmoji: '✨',
    ticketPrice: 20,
    retailValue: 2200,
    totalTickets: 600,
    soldTickets: 240,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description:
      'Celine Classic Box Bag in smooth black calfskin with gold hardware. The Phoebe Philo era original — highly sought-after. Lightly used, comes with dustbag, card, and Celine receipt.',
    imageColor: '#CFC2B5',
    reserveTickets: 300,
    brandId: 'celine' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo_plus_physical' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0008', checkedAt: '2026-06-08T09:00:00Z' },
    sellerTier: 'founding' as const,
    minThreshold: 0.5,
  },
  {
    id: '9',
    title: 'Bottega Veneta Intrecciato Clutch — Tan',
    seller: 'the_edit_co',
    sellerEmoji: '✨',
    ticketPrice: 20,
    retailValue: 1450,
    totalTickets: 400,
    soldTickets: 271,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Very Good',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description:
      'Bottega Veneta small Intrecciato woven leather clutch in tan. Gold zip. 2020, light use. Signature woven pattern, comes with dustbag.',
    imageColor: '#F0E6D3',
    reserveTickets: 300,
    brandId: 'bottega' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0009', checkedAt: '2026-06-09T11:15:00Z' },
    sellerTier: null,
    minThreshold: 0.75,
  },
  {
    id: '10',
    title: 'Bottega Veneta Cassette Bag — Cloud Blue',
    seller: 'the_edit_co',
    sellerEmoji: '✨',
    ticketPrice: 20,
    retailValue: 2800,
    totalTickets: 700,
    soldTickets: 560,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description:
      'Bottega Veneta Cassette bag in cloud blue padded intrecciato. The Matthieu Blazy era classic. 2022, carried twice. Adjustable strap, full BV packaging.',
    imageColor: '#EAE0D5',
    reserveTickets: 420,
    brandId: 'bottega' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0010', checkedAt: '2026-06-10T11:00:00Z' },
    sellerTier: null,
    minThreshold: 0.6,
  },
  {
    id: '11',
    title: 'Louis Vuitton Capucines MM — Black Taurillon',
    seller: 'parisian_preloved',
    sellerEmoji: '🛍️',
    ticketPrice: 50,
    retailValue: 4600,
    totalTickets: 500,
    soldTickets: 225,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description:
      'Louis Vuitton Capucines MM in black Taurillon leather — the understated LV with no monogram. Gold hardware, flap closure. 2022, carried five times. Full set with box and dustbag.',
    imageColor: '#CFC2B5',
    reserveTickets: 300,
    brandId: 'lv' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo_plus_physical' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0011', checkedAt: '2026-06-11T10:00:00Z' },
    sellerTier: 'top' as const,
    minThreshold: 0.6,
  },
  {
    id: '12',
    title: 'Chanel Wallet on Chain — Black Caviar',
    seller: 'luxe_resale',
    sellerEmoji: '💎',
    ticketPrice: 10,
    retailValue: 2800,
    totalTickets: 800,
    soldTickets: 320,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description:
      'Chanel Wallet on Chain (WOC) in black caviar leather with gold chain. The perfect evening bag. 2021, very lightly used. Authenticity card, dustbag, and box all included.',
    imageColor: '#C8B8A8',
    reserveTickets: 480,
    brandId: 'chanel' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0012', checkedAt: '2026-06-12T10:00:00Z' },
    sellerTier: 'founding' as const,
    minThreshold: 0.6,
  },
];

export type ChatMessage = {
  id: string;
  handle: string;
  emoji: string;
  message: string;
  timestamp: string;
};

export const chatMessages: ChatMessage[] = [
  { id: 'c1', handle: '@luxegirl', emoji: '💅', message: 'That Chanel is STUNNING, I need it', timestamp: '20:54' },
  { id: 'c2', handle: '@bagqueen', emoji: '👜', message: 'Already bought 10 tickets for the LV Pochette 🙏', timestamp: '20:55' },
  { id: 'c3', handle: '@yoniaibi', emoji: '🦋', message: 'Anyone else going for the Celine?', timestamp: '20:56' },
  { id: 'c4', handle: '@luxe_fan', emoji: '✨', message: 'The Bottega Cassette is genuinely insane value', timestamp: '20:57' },
  { id: 'c5', handle: '@stylebyrae', emoji: '🌸', message: 'Just bought my last 5 tickets for tonight, good luck everyone 🤞', timestamp: '20:58' },
];

export type TicketHolding = {
  id: string;
  drawId: string;
  drawTitle: string;
  drawImageColor: string;
  ticketCount: number;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  isTonight: boolean;
};

export const ticketHoldings: TicketHolding[] = [
  {
    id: 't1',
    drawId: '1',
    drawTitle: 'Chanel Classic Flap Bag — Medium',
    drawImageColor: '#1a1a2e',
    ticketCount: 12,
    ticketPrice: 10,
    totalTickets: 1000,
    soldTickets: 847,
    isTonight: true,
  },
  {
    id: 't2',
    drawId: '2',
    drawTitle: 'Louis Vuitton Pochette Métis — Reverse Monogram',
    drawImageColor: '#4A3728',
    ticketCount: 8,
    ticketPrice: 10,
    totalTickets: 800,
    soldTickets: 512,
    isTonight: true,
  },
  {
    id: 't3',
    drawId: '10',
    drawTitle: 'Bottega Veneta Cassette Bag — Cloud Blue',
    drawImageColor: '#A8C5DA',
    ticketCount: 4,
    ticketPrice: 20,
    totalTickets: 700,
    soldTickets: 560,
    isTonight: true,
  },
  {
    id: 't4',
    drawId: '5',
    drawTitle: 'Louis Vuitton Neverfull MM — Damier Ebène',
    drawImageColor: '#4A3728',
    ticketCount: 3,
    ticketPrice: 10,
    totalTickets: 600,
    soldTickets: 441,
    isTonight: false,
  },
];

export type Notification = {
  id: string;
  type: 'win' | 'reminder' | 'promo';
  title: string;
  body: string;
  date: string;
  read: boolean;
};

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'win',
    title: '🏆 You won!',
    body: 'Congratulations! You won the LV Pochette Métis draw. Check your orders for delivery details.',
    date: 'Today',
    read: false,
  },
  {
    id: 'n2',
    type: 'reminder',
    title: '⏰ Draws in 1 hour',
    body: '3 draws you entered close tonight at 9pm. Watch live to see if you win!',
    date: 'Today',
    read: false,
  },
  {
    id: 'n3',
    type: 'promo',
    title: '🎟 Claim your Grand Draw ticket',
    body: 'You haven\'t claimed today\'s free Grand Draw entry yet. Win a Chanel Classic Flap worth £7,200!',
    date: 'Yesterday',
    read: true,
  },
];

export type Order = {
  id: string;
  title: string;
  imageColor: string;
  status: 'won' | 'active' | 'delivered';
  ticketCount: number;
  ticketPrice: number;
  retailValue: number;
  date: string;
  trackingCode?: string;
};

export const orders: Order[] = [
  {
    id: 'o1',
    title: 'Louis Vuitton Pochette Métis — Reverse Monogram',
    imageColor: '#DDD0C4',
    status: 'won',
    ticketCount: 8,
    ticketPrice: 10,
    retailValue: 1450,
    date: '25 Jun 2026',
    trackingCode: 'RM123456789GB',
  },
  {
    id: 'o2',
    title: 'Chanel Classic Flap Bag — Medium',
    imageColor: '#E8DDD3',
    status: 'active',
    ticketCount: 12,
    ticketPrice: 10,
    retailValue: 6800,
    date: '26 Jun 2026',
  },
  {
    id: 'o3',
    title: 'Louis Vuitton Neverfull MM — Damier Ebène',
    imageColor: '#DDD0C4',
    status: 'delivered',
    ticketCount: 5,
    ticketPrice: 10,
    retailValue: 1150,
    date: '18 Jun 2026',
    trackingCode: 'RM987654321GB',
  },
];

export type WalletTransaction = {
  id: string;
  type: 'topup' | 'spend' | 'win' | 'refund';
  description: string;
  amount: number; // pence, positive = credit, negative = debit
  date: string;
};

export const walletTransactions: WalletTransaction[] = [
  { id: 'w1', type: 'topup', description: 'Top-up via Apple Pay', amount: 1000, date: '26 Jun' },
  { id: 'w2', type: 'spend', description: '12 tickets · Chanel Classic Flap', amount: -120, date: '26 Jun' },
  { id: 'w3', type: 'spend', description: '8 tickets · LV Pochette Métis', amount: -80, date: '25 Jun' },
  { id: 'w4', type: 'refund', description: 'Refund · Celine Nano draw cancelled', amount: 200, date: '22 Jun' },
  { id: 'w5', type: 'topup', description: 'Top-up via card', amount: 2000, date: '20 Jun' },
];

export const currentUser = {
  handle: '@yoniaibi',
  name: 'Yoni Aibi',
  emoji: '🦋',
  balance: 1240, // pence
  streak: 7,
  grandDrawEntries: 12,
  isFoundingMember: true,
  wins: 2,
  totalTickets: 47,
  activeDraws: 3,
  totalValue: 620,
  referralCode: 'YONI42',
  longestStreak: 12,
  allTimeEarned: 23,
};

export const grandDraw = {
  prize: 'Chanel Classic Flap — Gold Hardware',
  emoji: '🪡',
  value: 7200,
  totalEntries: 847,
  fund: 2100,
  month: 'June',
  pastWinner: '@luxe_fan_99',
  pastPrize: 'Louis Vuitton Neverfull MM',
  pastValue: 1150,
};

export const activityMessages = [
  '@sarah_j just bought 5 tickets for Chanel Classic Flap 🛍',
  '@bagqueen entered the LV Pochette draw for 10p',
  '@luxe_fan is watching the Bottega Cassette draw — 80% sold!',
  '@stylebyrae just won last night\'s Prada bag draw 🎉',
  '@celine_lover bought 25 tickets for the Celine Classic Box',
];

// 7 draws for tonight's live screen
export const tonightDraws = draws.filter(d => d.isClosingTonight);

export interface PastWin {
  drawId: string;
  brand: string;
  model: string;
  winnerHandle: string; // masked: '@sar***'
  ticketPrice: number;
  totalEntries: number;
  wonAt: string;
  certificateRef: string;
  randomOrgRef: string;
}

export const MOCK_PAST_WINNERS: PastWin[] = [
  { drawId: 'pw1', brand: 'Chanel', model: 'Classic Flap Medium', winnerHandle: '@sar***', ticketPrice: 10, totalEntries: 847, wonAt: '2026-06-20', certificateRef: 'LGA-2026-0001', randomOrgRef: 'RO-2026-06-20-001' },
  { drawId: 'pw2', brand: 'Louis Vuitton', model: 'Neverfull MM', winnerHandle: '@lux***', ticketPrice: 10, totalEntries: 441, wonAt: '2026-06-22', certificateRef: 'LGA-2026-0005', randomOrgRef: 'RO-2026-06-22-003' },
  { drawId: 'pw3', brand: 'Prada', model: 'Re-Edition 2000', winnerHandle: '@mar***', ticketPrice: 10, totalEntries: 389, wonAt: '2026-06-24', certificateRef: 'LGA-2026-0007', randomOrgRef: 'RO-2026-06-24-001' },
];
