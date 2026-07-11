export interface Draw {
  id: string;
  title: string;
  seller: string;       // handle (display)
  sellerId?: string;    // Cognito sub — used to link to /sellers/[id]
  sellerName?: string;  // display name if set
  sellerAvatarUrl?: string;
  sellerEmoji: string;
  ticketPrice: number; // pence
  retailValue: number; // pounds
  totalTickets: number;
  soldTickets: number;
  category: string;
  style: 'Womenswear' | 'Menswear' | 'Unisex';
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  isBundle: boolean;
  isClosingTonight: boolean;
  isVerified: boolean;
  description: string;
  imageUrl: string;
  tags: string[];
  closingDate?: string; // ISO date string YYYY-MM-DD
  endsAt?: string;
  postalDeadline?: string;
  earlyClose?: boolean;
  status?: 'open' | 'pending_verification' | 'rejected' | 'resolved' | 'cancelled' | 'pending_auth' | 'auth_failed' | 'pending_shipment' | 'in_transit' | 'disputed' | 'complete' | 'sold_out_pending' | 'drawing';
  winnerHandle?: string;
  resolvedAt?: string;
  tracking?: { carrier: string; trackingNumber: string; shippedAt: string } | null;
  autoReleaseAt?: string | null;
  disputeReason?: string | null;
  reserveTickets?: number;
  certificateUrl?: string;
  verificationProvider?: string;
  userTickets?: number;
  imageUrls?: string[];
  brandId?: 'chanel' | 'lv' | 'bottega' | 'prada' | 'celine';
  auth?: {
    provider: 'legit_app';
    tier: 'photo' | 'photo_plus_physical';
    status: 'pending' | 'passed' | 'failed';
    certificateRef: string | null;
    checkedAt: string | null;
  };
  sellerTier?: 'founding' | 'trusted' | 'top' | null;
  minThreshold?: number;
}

const UNS = 'https://images.unsplash.com';

export const draws: Draw[] = [
  {
    id: '1',
    title: 'Chanel Classic Flap Bag — Black Caviar',
    seller: 'luxe_closet',
    sellerId: 'demo-seller-luxe-closet',
    sellerName: 'Luxe Closet',
    sellerEmoji: '💎',
    ticketPrice: 50,
    retailValue: 6800,
    totalTickets: 13600,
    soldTickets: 11220,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    reserveTickets: 9520,
    description: 'Iconic Chanel Classic Flap in black caviar leather with gold hardware. Carried twice, comes with original box, authenticity card, and dustbag. Purchased from Chanel Selfridges.',
    imageUrl: `${UNS}/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Chanel', 'Designer', 'Handbag'],
    brandId: 'chanel' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0001', checkedAt: '2026-06-01T10:00:00Z' },
    sellerTier: 'founding' as const,
    minThreshold: 0.7,
  },
  {
    id: '2',
    title: 'Louis Vuitton Neverfull MM — Monogram Canvas',
    seller: 'velvet_boutique',
    sellerId: 'demo-seller-velvet-boutique',
    sellerName: 'Velvet Boutique',
    sellerEmoji: '✨',
    ticketPrice: 20,
    retailValue: 1250,
    totalTickets: 6250,
    soldTickets: 4900,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Good',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    reserveTickets: 3750,
    description: 'Louis Vuitton Neverfull MM in iconic monogram canvas with beige interior. 2020, light patina on handles — desirable natural aging. Comes with pouch and dustbag.',
    imageUrl: `${UNS}/photo-1547949003-9792a18a2601?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Louis Vuitton', 'LV', 'Handbag'],
    brandId: 'lv' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0002', checkedAt: '2026-06-02T11:00:00Z' },
    sellerTier: 'trusted' as const,
    minThreshold: 0.6,
    closingDate: '2026-12-31',
  },
  {
    id: '3',
    title: 'Celine Classic Box Bag — Black Smooth Leather',
    seller: 'maison_luxe',
    sellerId: 'demo-seller-maison-luxe',
    sellerName: 'Maison Luxe',
    sellerEmoji: '🖤',
    ticketPrice: 30,
    retailValue: 2200,
    totalTickets: 7334,
    soldTickets: 3200,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    reserveTickets: 4400,
    description: 'Celine Classic Box Bag in smooth black calfskin with gold hardware. The Phoebe Philo era original. Barely used, comes with dustbag, card, and receipt from Celine Bond Street.',
    imageUrl: `${UNS}/photo-1614179689702-355b706ac72b?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Celine', 'Designer', 'Handbag'],
    brandId: 'celine' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo_plus_physical' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0003', checkedAt: '2026-06-03T09:00:00Z' },
    sellerTier: 'founding' as const,
    minThreshold: 0.6,
  },
  {
    id: '4',
    title: 'Bottega Veneta The Pouch — Cream Intrecciato',
    seller: 'velvet_boutique',
    sellerId: 'demo-seller-velvet-boutique',
    sellerName: 'Velvet Boutique',
    sellerEmoji: '✨',
    ticketPrice: 50,
    retailValue: 1800,
    totalTickets: 3600,
    soldTickets: 2880,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'New',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    reserveTickets: 1800,
    description: 'Bottega Veneta The Pouch in cream intrecciato leather. Brand new with tags and full packaging. Gift from a client — never used.',
    imageUrl: `${UNS}/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Bottega Veneta', 'Designer', 'Clutch'],
    brandId: 'bottega' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0004', checkedAt: '2026-06-04T12:00:00Z' },
    sellerTier: 'trusted' as const,
    minThreshold: 0.5,
    closingDate: '2026-12-31',
  },
  {
    id: '5',
    title: 'Chanel Boy Bag — Small Navy Blue Lambskin',
    seller: 'luxe_closet',
    sellerId: 'demo-seller-luxe-closet',
    sellerName: 'Luxe Closet',
    sellerEmoji: '💎',
    ticketPrice: 50,
    retailValue: 5200,
    totalTickets: 10400,
    soldTickets: 6240,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Good',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    reserveTickets: 6240,
    description: 'Chanel Boy Bag in small size, navy blue lambskin with ruthenium hardware. 2019, serial verified. Some minor corner wear, otherwise excellent. Box and dustbag included.',
    imageUrl: `${UNS}/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Chanel', 'Boy Bag', 'Designer'],
    brandId: 'chanel' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0005', checkedAt: '2026-06-05T10:00:00Z' },
    sellerTier: 'founding' as const,
    minThreshold: 0.6,
  },
  {
    id: '6',
    title: 'Prada Galleria Saffiano Bag — Caramel',
    seller: 'studio_prada',
    sellerId: 'demo-seller-studio-prada',
    sellerName: 'Studio Prada',
    sellerEmoji: '🖤',
    ticketPrice: 25,
    retailValue: 1650,
    totalTickets: 6600,
    soldTickets: 5280,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    reserveTickets: 3300,
    description: 'Prada Galleria in caramel Saffiano leather — the most iconic Prada silhouette. Medium size, gold hardware, used twice. Full set with authenticity card, dustbag, and ribbon box.',
    imageUrl: `${UNS}/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Prada', 'Galleria', 'Handbag'],
    brandId: 'prada' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0006', checkedAt: '2026-06-06T14:00:00Z' },
    sellerTier: 'trusted' as const,
    minThreshold: 0.5,
    closingDate: '2026-12-31',
  },
  {
    id: '7',
    title: 'Louis Vuitton Speedy 25 — Damier Azur',
    seller: 'parisienne',
    sellerId: 'demo-seller-parisienne',
    sellerName: 'Parisienne',
    sellerEmoji: '🌸',
    ticketPrice: 20,
    retailValue: 900,
    totalTickets: 4500,
    soldTickets: 1800,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Good',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    reserveTickets: 2700,
    description: 'Louis Vuitton Speedy 25 in Damier Azur canvas. 2018, light tan patina on handles. Comes with padlock, keys, and dustbag. Classic everyday bag in great condition.',
    imageUrl: `${UNS}/photo-1547949003-9792a18a2601?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Louis Vuitton', 'Speedy', 'Handbag'],
    brandId: 'lv' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0007', checkedAt: '2026-06-07T10:00:00Z' },
    sellerTier: null,
    minThreshold: 0.6,
  },
  {
    id: '8',
    title: 'Prada Re-Nylon Backpack — Black',
    seller: 'studio_prada',
    sellerId: 'demo-seller-studio-prada',
    sellerName: 'Studio Prada',
    sellerEmoji: '🖤',
    ticketPrice: 25,
    retailValue: 1100,
    totalTickets: 4400,
    soldTickets: 1760,
    category: 'Bags',
    style: 'Unisex',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    reserveTickets: 1760,
    description: 'Prada Re-Nylon backpack in black. Used three times. Full packaging included. Prada triangle logo intact and firm.',
    imageUrl: `${UNS}/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Prada', 'Backpack', 'Designer'],
    brandId: 'prada' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0008', checkedAt: '2026-06-08T09:30:00Z' },
    sellerTier: null,
    minThreshold: 0.4,
  },
  {
    id: '9',
    title: 'Celine Triomphe Bag — Natural Calfskin',
    seller: 'maison_luxe',
    sellerId: 'demo-seller-maison-luxe',
    sellerName: 'Maison Luxe',
    sellerEmoji: '🖤',
    ticketPrice: 30,
    retailValue: 1950,
    totalTickets: 6500,
    soldTickets: 2600,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    reserveTickets: 3250,
    description: 'Celine Triomphe bag in natural calfskin — the Hedi Slimane era icon. Gold chain hardware. Bought from Celine Sloane Street 2022. Lightly used, stunning condition.',
    imageUrl: `${UNS}/photo-1614179689702-355b706ac72b?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Celine', 'Triomphe', 'Handbag'],
    brandId: 'celine' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0009', checkedAt: '2026-06-09T11:00:00Z' },
    sellerTier: 'trusted' as const,
    minThreshold: 0.5,
  },
  {
    id: '10',
    title: 'Bottega Veneta Jodie Bag — Black Intrecciato',
    seller: 'velvet_boutique',
    sellerId: 'demo-seller-velvet-boutique',
    sellerName: 'Velvet Boutique',
    sellerEmoji: '✨',
    ticketPrice: 30,
    retailValue: 2400,
    totalTickets: 8000,
    soldTickets: 6400,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Good',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    reserveTickets: 4800,
    description: 'Bottega Veneta Jodie hobo bag in black intrecciato lambskin. The bag of the season. 2021, minimal wear. Comes with dustbag. Knot detail pristine.',
    imageUrl: `${UNS}/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Bottega Veneta', 'Jodie', 'Handbag'],
    brandId: 'bottega' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0010', checkedAt: '2026-06-10T09:00:00Z' },
    sellerTier: null,
    minThreshold: 0.6,
    closingDate: '2026-12-31',
  },
  {
    id: '11',
    title: 'Louis Vuitton Capucines MM — Taurillon Black',
    seller: 'parisienne',
    sellerId: 'demo-seller-parisienne',
    sellerName: 'Parisienne',
    sellerEmoji: '🌸',
    ticketPrice: 50,
    retailValue: 4600,
    totalTickets: 9200,
    soldTickets: 4140,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    reserveTickets: 5520,
    description: 'Louis Vuitton Capucines MM in black Taurillon leather. The understated LV — no monogram. Gold hardware, flap closure. 2022, carried five times. Full set with box and dustbag.',
    imageUrl: `${UNS}/photo-1547949003-9792a18a2601?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Louis Vuitton', 'Capucines', 'Handbag'],
    brandId: 'lv' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo_plus_physical' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0011', checkedAt: '2026-06-11T10:00:00Z' },
    sellerTier: 'top' as const,
    minThreshold: 0.6,
  },
  {
    id: '12',
    title: 'Chanel Wallet on Chain — Black Caviar',
    seller: 'luxe_closet',
    sellerId: 'demo-seller-luxe-closet',
    sellerName: 'Luxe Closet',
    sellerEmoji: '💎',
    ticketPrice: 30,
    retailValue: 2800,
    totalTickets: 9334,
    soldTickets: 5600,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    reserveTickets: 5600,
    description: 'Chanel Wallet on Chain (WOC) in black caviar leather with gold chain. The perfect evening bag. 2021, very lightly used. Authenticity card, dustbag, box included.',
    imageUrl: `${UNS}/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Chanel', 'WOC', 'Handbag'],
    brandId: 'chanel' as const,
    auth: { provider: 'legit_app' as const, tier: 'photo' as const, status: 'passed' as const, certificateRef: 'LGA-2026-0012', checkedAt: '2026-06-12T10:00:00Z' },
    sellerTier: 'founding' as const,
    minThreshold: 0.6,
  },
];

export const chatMessages = [
  { id: '1', handle: '@sarah_j',      color: '#8B5CF6', message: 'First time entering a Chanel draw 🙏', time: '8:50pm' },
  { id: '2', handle: '@collector99',  color: '#EC4899', message: 'Good luck everyone! Last month\'s winner here 🏆', time: '8:51pm' },
  { id: '3', handle: '@hypekid',      color: '#F59E0B', message: 'Bought 20 tickets on the Chanel WOC, fingers crossed', time: '8:52pm' },
  { id: '4', handle: '@luxelover',    color: '#10B981', message: 'The Capucines is going to be insane tonight', time: '8:53pm' },
  { id: '5', handle: '@marcus_t',     color: '#3B82F6', message: 'Already in 3 draws tonight 👀', time: '8:54pm' },
  { id: '6', handle: '@priya_k',      color: '#EC4899', message: 'This is my 4th week in a row, obsessed', time: '8:55pm' },
  { id: '7', handle: '@bagqueen',     color: '#F59E0B', message: 'LV or Celine tonight — can\'t decide 😩', time: '8:56pm' },
  { id: '8', handle: '@fashionista',  color: '#8B5CF6', message: 'That Bottega Pouch is MINE tonight', time: '8:57pm' },
  { id: '9', handle: '@prada_fan',    color: '#10B981', message: 'Good luck everyone 🤞🤞', time: '8:58pm' },
  { id: '10', handle: '@london_lux',  color: '#A78BFA', message: '2 mins to go!! Who else is ready', time: '8:58pm' },
];

export const tickets = [
  { id: '1', drawId: '1', quantity: 5, pricePerTicket: 50 },
  { id: '2', drawId: '4', quantity: 3, pricePerTicket: 50 },
  { id: '3', drawId: '6', quantity: 10, pricePerTicket: 25 },
];

export const notifications = [
  { id: '1', type: 'win', icon: '🏆', title: 'You won!', body: 'Bottega Veneta The Pouch — worth £1,800', time: '2 hours ago', read: false },
  { id: '2', type: 'purchase', icon: '🎫', title: '5 tickets purchased', body: 'Chanel Classic Flap Bag draw', time: 'Yesterday', read: true },
  { id: '3', type: 'reminder', icon: '⏰', title: 'Draw closing in 1 hour', body: 'Louis Vuitton Neverfull closes tonight at 9pm', time: 'Yesterday', read: true },
];

export const orders = [
  { id: '1', drawId: '4', drawTitle: 'Bottega Veneta The Pouch — Cream', date: '15 Jun 2026', tickets: 5, total: 250, status: 'Won' as const },
  { id: '2', drawId: '2', drawTitle: 'Louis Vuitton Neverfull MM', date: '14 Jun 2026', tickets: 3, total: 60, status: 'Completed' as const },
  { id: '3', drawId: '8', drawTitle: 'Prada Re-Nylon Backpack', date: '13 Jun 2026', tickets: 8, total: 200, status: 'Active' as const },
];

export const walletTransactions = [
  { id: '1', icon: '⬆️', description: 'Top-up', amount: 2000, type: 'credit' as const, date: 'Today' },
  { id: '2', icon: '🎫', description: 'Tickets: Chanel Flap', amount: -250, type: 'debit' as const, date: 'Today' },
  { id: '3', icon: '🎫', description: 'Tickets: LV Neverfull', amount: -60, type: 'debit' as const, date: 'Yesterday' },
  { id: '4', icon: '🏆', description: 'Win credit: Bottega Pouch', amount: 1800, type: 'credit' as const, date: '15 Jun' },
  { id: '5', icon: '👥', description: 'Referral bonus — @maxdoe', amount: 100, type: 'credit' as const, date: '14 Jun' },
];

export const currentUser = {
  handle: '@yoniaibi',
  name: 'Jonathan',
  emoji: '🦋',
  balancePence: 1240,
  streak: 7,
  grandDrawEntries: 12,
  joinedDate: 'January 2026',
};

export const grandDraw = {
  prize: 'Chanel Classic Flap — Gold Hardware',
  emoji: '🪡',
  imageUrl: `https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=400&fit=crop&q=80&auto=format`,
  value: 7200,
  totalEntries: 847,
  month: 'June',
};

export const activityMessages = [
  '@sarah_j just bought 5 tickets on Chanel Classic Flap',
  '@collector99 entered the LV Neverfull draw',
  'Draw threshold hit! 🎯 Celine Classic Box',
  '@bagqueen just bought 20 tickets on the Bottega Pouch',
  '@luxelover entered their 3rd draw tonight',
];

export const recentWinners = [
  { handle: '@emily_w', item: 'Louis Vuitton Neverfull MM', paid: 120, value: 1250 },
  { handle: '@luxe_fan', item: 'Celine Classic Box Bag', paid: 150, value: 2200 },
  { handle: '@chanelfan', item: 'Chanel Classic Flap', paid: 250, value: 6800 },
];

export const MOCK_PAST_WINNERS = [
  { drawId: 'pw1', brand: 'Chanel', model: 'Classic Flap Black Caviar', winnerHandle: '@sar***', ticketPrice: 50, totalEntries: 11220, wonAt: '2026-06-20', certificateRef: 'LGA-2026-0001', randomOrgRef: 'RO-2026-06-20-001' },
  { drawId: 'pw2', brand: 'Bottega Veneta', model: 'The Pouch Cream', winnerHandle: '@eli***', ticketPrice: 50, totalEntries: 2880, wonAt: '2026-06-22', certificateRef: 'LGA-2026-0004', randomOrgRef: 'RO-2026-06-22-002' },
  { drawId: 'pw3', brand: 'Prada', model: 'Re-Nylon Backpack Black', winnerHandle: '@tom***', ticketPrice: 25, totalEntries: 1760, wonAt: '2026-06-24', certificateRef: 'LGA-2026-0008', randomOrgRef: 'RO-2026-06-24-001' },
];
