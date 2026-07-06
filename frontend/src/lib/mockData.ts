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
  status?: 'open' | 'resolved' | 'cancelled';
  winnerHandle?: string;
  resolvedAt?: string;
  reserveTickets?: number;
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
  },
  {
    id: '2',
    title: 'Rolex Submariner Date — Blue Dial',
    seller: 'watch_vault',
    sellerId: 'demo-seller-watch-vault',
    sellerName: 'Watch Vault',
    sellerEmoji: '⌚',
    ticketPrice: 100,
    retailValue: 9500,
    totalTickets: 9500,
    soldTickets: 8240,
    category: 'Watches',
    style: 'Unisex',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    reserveTickets: 6650,
    description: 'Rolex Submariner 126610LV in perfect condition. Box and papers 2023. Never worn outside. Serial number available on request.',
    imageUrl: `${UNS}/photo-1587836374828-4dbafa94cf0e?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Rolex', 'Luxury', 'Watch'],
  },
  {
    id: '3',
    title: 'Air Jordan 1 Retro High OG — Chicago Lost & Found',
    seller: 'sneaker_don',
    sellerId: 'demo-seller-sneaker-don',
    sellerName: 'Sneaker Don',
    sellerEmoji: '👟',
    ticketPrice: 25,
    retailValue: 450,
    totalTickets: 1800,
    soldTickets: 960,
    category: 'Trainers',
    style: 'Menswear',
    condition: 'New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description: 'DS Air Jordan 1 Chicago Lost & Found, UK9. Original box, lace bags, receipt. Legitimately sourced.',
    imageUrl: `${UNS}/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Jordan', 'Nike', 'Sneakers'],
  },
  {
    id: '4',
    title: 'Bottega Veneta The Pouch — Cream',
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
    description: 'Bottega Veneta The Pouch in cream intrecciato leather. Brand new with tags and full packaging. Gift from a client — never used.',
    imageUrl: `${UNS}/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Bottega', 'Designer', 'Clutch'],
  },
  {
    id: '5',
    title: 'Supreme Box Logo Hoodie — Black (FW22)',
    seller: 'hype_archive',
    sellerId: 'demo-seller-hype-archive',
    sellerName: 'Hype Archive',
    sellerEmoji: '🔴',
    ticketPrice: 25,
    retailValue: 750,
    totalTickets: 3000,
    soldTickets: 1890,
    category: 'Streetwear',
    style: 'Unisex',
    condition: 'New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: false,
    description: 'Supreme Box Logo Hoodie FW22, size Large. DS, worn for 5 minutes for a photo. Original receipt included.',
    imageUrl: `${UNS}/photo-1556821840-3a63f15732ce?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Supreme', 'Streetwear', 'Hoodie'],
  },
  {
    id: '6',
    title: 'Cartier Love Bracelet — Yellow Gold',
    seller: 'maison_luxe',
    sellerId: 'demo-seller-maison-luxe',
    sellerName: 'Maison Luxe',
    sellerEmoji: '💛',
    ticketPrice: 100,
    retailValue: 5200,
    totalTickets: 5200,
    soldTickets: 4420,
    category: 'Jewellery',
    style: 'Womenswear',
    condition: 'Good',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description: 'Cartier Love Bracelet in 18k yellow gold. Size 18. Comes with original screwdriver, box, and receipt. Light surface scratches consistent with wear.',
    imageUrl: `${UNS}/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Cartier', 'Jewellery', 'Gold'],
  },
  {
    id: '7',
    title: 'Luxury Starter Bundle — 4 Pieces',
    seller: 'curated_co',
    sellerId: 'demo-seller-curated-co',
    sellerName: 'Curated Co',
    sellerEmoji: '🎁',
    ticketPrice: 50,
    retailValue: 2400,
    totalTickets: 4800,
    soldTickets: 3120,
    category: 'Fashion',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: true,
    isClosingTonight: false,
    isVerified: true,
    description: 'Four luxury essentials: Acne Studios leather belt, Toteme cashmere scarf, Jacquemus mini bag, JW Anderson puzzle earrings. All authenticated.',
    imageUrl: `${UNS}/photo-1483985988355-763728e1935b?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Bundle', 'Multi-brand', 'Gift'],
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
    description: 'Prada Re-Nylon backpack in black. Used three times. Full packaging included. Prada triangle logo intact and firm.',
    imageUrl: `${UNS}/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Prada', 'Backpack', 'Designer'],
  },
  {
    id: '9',
    title: 'Balenciaga Track 2 Sneakers — White/Silver',
    seller: 'rare_kicks',
    sellerId: 'demo-seller-rare-kicks',
    sellerName: 'Rare Kicks',
    sellerEmoji: '⚡',
    ticketPrice: 25,
    retailValue: 650,
    totalTickets: 2600,
    soldTickets: 1690,
    category: 'Trainers',
    style: 'Unisex',
    condition: 'New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: false,
    description: 'Balenciaga Track 2 EU42, deadstock. Original box, extra laces, tag. Perfect Christmas present for yourself.',
    imageUrl: `${UNS}/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Balenciaga', 'Sneakers', 'Designer'],
  },
  {
    id: '10',
    title: 'Dior Saddle Bag — Tan Grained Leather',
    seller: 'parisienne',
    sellerId: 'demo-seller-parisienne',
    sellerName: 'Parisienne',
    sellerEmoji: '🌹',
    ticketPrice: 50,
    retailValue: 2900,
    totalTickets: 5800,
    soldTickets: 4640,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Good',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description: 'Christian Dior Saddle Bag in tan grained calfskin. Purchased 2021. Light wear on corners, all hardware gold and intact.',
    imageUrl: `${UNS}/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Dior', 'Saddle', 'Handbag'],
  },
  {
    id: '11',
    title: 'Streetwear Archive Bundle — Rare Pieces',
    seller: 'culture_vault',
    sellerId: 'demo-seller-culture-vault',
    sellerName: 'Culture Vault',
    sellerEmoji: '🏆',
    ticketPrice: 25,
    retailValue: 3200,
    totalTickets: 12800,
    soldTickets: 5120,
    category: 'Streetwear',
    style: 'Menswear',
    condition: 'Good',
    isBundle: true,
    isClosingTonight: false,
    isVerified: true,
    description: 'Curated archive bundle: Palace FW21 jacket, KAWS x Uniqlo tee (DS), CDG PLAY cardigan, Off-White belt. Sizes L throughout.',
    imageUrl: `${UNS}/photo-1552346154-21d32810aba3?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Bundle', 'Archive', 'Streetwear'],
  },
  {
    id: '12',
    title: 'Omega Speedmaster Moonwatch — Original',
    seller: 'horology_house',
    sellerId: 'demo-seller-horology-house',
    sellerName: 'Horology House',
    sellerEmoji: '🌙',
    ticketPrice: 50,
    retailValue: 4800,
    totalTickets: 9600,
    soldTickets: 5760,
    category: 'Watches',
    style: 'Unisex',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description: 'Omega Speedmaster Professional Moonwatch 310.30.42.50.01.001. Bought 2022 from authorized dealer. Box and papers, polished to showroom condition.',
    imageUrl: `${UNS}/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&q=80&auto=format`,
    tags: ['Omega', 'Speedmaster', 'Watch'],
  },
];

export const chatMessages = [
  { id: '1', handle: '@sarah_j',      color: '#8B5CF6', message: 'First time entering a Chanel draw 🙏', time: '8:50pm' },
  { id: '2', handle: '@collector99',  color: '#FF2356', message: 'Good luck everyone! Last month\'s winner here 🏆', time: '8:51pm' },
  { id: '3', handle: '@hypekid',      color: '#F59E0B', message: 'Bought 20 tickets on the Jordan 1s, fingers crossed', time: '8:52pm' },
  { id: '4', handle: '@luxelover',    color: '#10B981', message: 'The Rolex is going to be insane tonight', time: '8:53pm' },
  { id: '5', handle: '@marcus_t',     color: '#3B82F6', message: 'Already in 3 draws tonight 👀', time: '8:54pm' },
  { id: '6', handle: '@priya_k',      color: '#FF2356', message: 'This is my 4th week in a row, obsessed', time: '8:55pm' },
  { id: '7', handle: '@watchman99',   color: '#F59E0B', message: 'Rolex or Jordan 1s tonight — can\'t decide 😩', time: '8:56pm' },
  { id: '8', handle: '@fashionista',  color: '#8B5CF6', message: 'That Bottega Pouch is MINE tonight', time: '8:57pm' },
  { id: '9', handle: '@streetwear_g', color: '#10B981', message: 'Good luck everyone 🤞🤞', time: '8:58pm' },
  { id: '10', handle: '@london_lux',  color: '#A78BFA', message: '2 mins to go!! Who else is ready', time: '8:58pm' },
];

export const tickets = [
  { id: '1', drawId: '1', quantity: 5, pricePerTicket: 50 },
  { id: '2', drawId: '2', quantity: 3, pricePerTicket: 100 },
  { id: '3', drawId: '6', quantity: 10, pricePerTicket: 100 },
];

export const notifications = [
  { id: '1', type: 'win', icon: '🏆', title: 'You won!', body: 'Air Jordan 1 Retro High OG — worth £450', time: '2 hours ago', read: false },
  { id: '2', type: 'purchase', icon: '🎫', title: '5 tickets purchased', body: 'Chanel Classic Flap Bag draw', time: 'Yesterday', read: true },
  { id: '3', type: 'reminder', icon: '⏰', title: 'Draw closing in 1 hour', body: 'Cartier Love Bracelet closes tonight at 9pm', time: 'Yesterday', read: true },
];

export const orders = [
  { id: '1', drawId: '3', drawTitle: 'Air Jordan 1 Retro High OG', date: '15 Jun 2026', tickets: 5, total: 125, status: 'Won' as const },
  { id: '2', drawId: '5', drawTitle: 'Supreme Box Logo Hoodie', date: '14 Jun 2026', tickets: 3, total: 75, status: 'Completed' as const },
  { id: '3', drawId: '8', drawTitle: 'Prada Re-Nylon Backpack', date: '13 Jun 2026', tickets: 8, total: 200, status: 'Active' as const },
];

export const walletTransactions = [
  { id: '1', icon: '⬆️', description: 'Top-up', amount: 2000, type: 'credit' as const, date: 'Today' },
  { id: '2', icon: '🎫', description: 'Tickets: Chanel Flap', amount: -250, type: 'debit' as const, date: 'Today' },
  { id: '3', icon: '🎫', description: 'Tickets: Rolex Sub', amount: -300, type: 'debit' as const, date: 'Yesterday' },
  { id: '4', icon: '🏆', description: 'Win credit: Air Jordan 1', amount: 450, type: 'credit' as const, date: '15 Jun' },
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
  prize: 'Rolex Submariner',
  emoji: '⌚',
  imageUrl: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600&h=400&fit=crop&q=80&auto=format',
  value: 8500,
  totalEntries: 847,
  month: 'June',
};

export const activityMessages = [
  '@sarah_j just bought 5 tickets on Chanel Flap',
  '@collector99 entered the Rolex Submariner draw',
  'Draw threshold hit! 🎯 Supreme Box Logo',
  '@hypekid just bought 20 tickets on Air Jordan 1s',
  '@luxelover entered their 3rd draw tonight',
];

export const recentWinners = [
  { handle: '@emily_w', item: 'Louis Vuitton Neverfull', paid: 120, value: 1200 },
  { handle: '@luxe_fan', item: 'Air Jordan 1 Chicago', paid: 50, value: 450 },
  { handle: '@watchguy', item: 'Omega Speedmaster', paid: 200, value: 4800 },
];
