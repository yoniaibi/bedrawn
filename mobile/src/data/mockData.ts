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
    imageColor: '#1a1a2e',
  },
  {
    id: '2',
    title: 'Air Jordan 1 Retro High OG "Chicago"',
    seller: 'sneaker_vault',
    sellerEmoji: '👟',
    ticketPrice: 10,
    retailValue: 450,
    totalTickets: 500,
    soldTickets: 336,
    category: 'Trainers',
    style: 'Menswear',
    condition: 'Brand New',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description:
      'Size UK 10. Deadstock Air Jordan 1 Retro High OG in the iconic Chicago colourway. Factory laced, never tried on, original receipt included from Nike SNKRS.',
    imageColor: '#8B0000',
  },
  {
    id: '3',
    title: 'Rolex Datejust 41 — Jubilee Bracelet',
    seller: 'watch_haven',
    sellerEmoji: '⌚',
    ticketPrice: 50,
    retailValue: 9200,
    totalTickets: 200,
    soldTickets: 189,
    category: 'Watches',
    style: 'Unisex',
    condition: 'Very Good',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description:
      'Rolex Datejust 41 in Oystersteel, silver dial with Roman numerals. Jubilee bracelet, 2021, serviced January 2024. Full set with box and papers. Circa £9,200 new.',
    imageColor: '#2C3E50',
  },
  {
    id: '4',
    title: 'Off-White x Nike Air Force 1 "Lot 01"',
    seller: 'hype_atelier',
    sellerEmoji: '🔥',
    ticketPrice: 10,
    retailValue: 780,
    totalTickets: 400,
    soldTickets: 302,
    category: 'Trainers',
    style: 'Menswear',
    condition: 'Brand New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description:
      'Off-White x Nike Air Force 1 Low "The Ten" from the original 2017 drop. UK 9.5. Deadstock with all original packaging, hangtag, and zip ties intact.',
    imageColor: '#F5F5DC',
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
    imageColor: '#4A3728',
  },
  {
    id: '6',
    title: 'Supreme FW23 Box Logo Hoodie — Black L',
    seller: 'the_drop_room',
    sellerEmoji: '🧢',
    ticketPrice: 10,
    retailValue: 320,
    totalTickets: 300,
    soldTickets: 127,
    category: 'Streetwear',
    style: 'Menswear',
    condition: 'Brand New',
    isBundle: false,
    isClosingTonight: false,
    isVerified: false,
    description:
      'Supreme FW23 Box Logo Hooded Sweatshirt in black, size Large. Purchased in-store week 1. Unworn with tags. Classic bogo front chest.',
    imageColor: '#CC0000',
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
    imageColor: '#2D2D2D',
  },
  {
    id: '8',
    title: 'Vintage Levi\'s 501 Bundle — 5 Pairs',
    seller: 'vintage_vault_ldn',
    sellerEmoji: '🕰',
    ticketPrice: 10,
    retailValue: 380,
    totalTickets: 200,
    soldTickets: 98,
    category: 'Streetwear',
    style: 'Unisex',
    condition: 'Good',
    isBundle: true,
    isClosingTonight: false,
    isVerified: false,
    description:
      'Bundle of 5 authentic vintage Levi\'s 501 jeans, sourced from US thrift stores. Sizes 30×32, 32×30, 28×32, 34×30, 32×32. Mix of 80s-90s era. All pre-washed and cleaned.',
    imageColor: '#1B4F8C',
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
    imageColor: '#C49A3C',
  },
  {
    id: '10',
    title: 'Luxury Streetwear Bundle — 8 Pieces',
    seller: 'hype_atelier',
    sellerEmoji: '🔥',
    ticketPrice: 20,
    retailValue: 2200,
    totalTickets: 600,
    soldTickets: 540,
    category: 'Streetwear',
    style: 'Menswear',
    condition: 'Mixed',
    isBundle: true,
    isClosingTonight: true,
    isVerified: true,
    description:
      'Curated bundle of 8 premium streetwear pieces: Palace hoodie (M), Stüssy crewneck (L), KITH tee (M), Carhartt WIP jacket (L), Represent joggers (M), A-COLD-WALL tee (M), Stone Island badge tee (L), and CP Company goggle jacket (L).',
    imageColor: '#1C2833',
  },
  {
    id: '11',
    title: 'Audemars Piguet Royal Oak — Silver Dial',
    seller: 'watch_haven',
    sellerEmoji: '⌚',
    ticketPrice: 100,
    retailValue: 28000,
    totalTickets: 300,
    soldTickets: 241,
    category: 'Watches',
    style: 'Unisex',
    condition: 'Excellent',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description:
      'Audemars Piguet Royal Oak Selfwinding 41mm in stainless steel with silver "Grande Tapisserie" dial. Box and papers, 2020. Worn maybe 10 times. Service history available.',
    imageColor: '#7F8C8D',
  },
  {
    id: '12',
    title: 'Comme des Garçons Archive Jacket + Shirt',
    seller: 'vintage_vault_ldn',
    sellerEmoji: '🕰',
    ticketPrice: 10,
    retailValue: 680,
    totalTickets: 350,
    soldTickets: 89,
    category: 'Fashion',
    style: 'Unisex',
    condition: 'Good',
    isBundle: true,
    isClosingTonight: false,
    isVerified: false,
    description:
      'Two-piece archive CdG bundle: FW2001 irregular-cut blazer in black wool (fits M/L) and a SS2003 graphic tee (size L). Both sourced from Japanese vintage market, authenticated.',
    imageColor: '#1A1A1A',
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
  { id: 'c2', handle: '@sneaker_dan', emoji: '👟', message: 'Already bought 10 tickets for the Jordan 1s 🙏', timestamp: '20:55' },
  { id: 'c3', handle: '@yoniaibi', emoji: '🦋', message: 'Anyone else going for the bundle?', timestamp: '20:56' },
  { id: 'c4', handle: '@watch_nerd_uk', emoji: '⌚', message: 'The AP is genuinely insane value', timestamp: '20:57' },
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
    drawTitle: 'Air Jordan 1 Retro High OG "Chicago"',
    drawImageColor: '#8B0000',
    ticketCount: 8,
    ticketPrice: 10,
    totalTickets: 500,
    soldTickets: 336,
    isTonight: true,
  },
  {
    id: 't3',
    drawId: '10',
    drawTitle: 'Luxury Streetwear Bundle — 8 Pieces',
    drawImageColor: '#1C2833',
    ticketCount: 4,
    ticketPrice: 20,
    totalTickets: 600,
    soldTickets: 540,
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
    body: 'Congratulations! You won the Air Jordan 1 Retro High OG draw. Check your orders for delivery details.',
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
    body: 'You haven\'t claimed today\'s free Grand Draw entry yet. Win a Rolex Submariner worth £8,500!',
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
    title: 'Air Jordan 1 Retro High OG "Chicago"',
    imageColor: '#8B0000',
    status: 'won',
    ticketCount: 8,
    ticketPrice: 10,
    retailValue: 450,
    date: '25 Jun 2026',
    trackingCode: 'RM123456789GB',
  },
  {
    id: 'o2',
    title: 'Chanel Classic Flap Bag — Medium',
    imageColor: '#1a1a2e',
    status: 'active',
    ticketCount: 12,
    ticketPrice: 10,
    retailValue: 6800,
    date: '26 Jun 2026',
  },
  {
    id: 'o3',
    title: 'Louis Vuitton Neverfull MM — Damier Ebène',
    imageColor: '#4A3728',
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
  { id: 'w3', type: 'spend', description: '8 tickets · Air Jordan 1', amount: -80, date: '25 Jun' },
  { id: 'w4', type: 'refund', description: 'Refund · AP Royal Oak draw cancelled', amount: 500, date: '22 Jun' },
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
  prize: 'Rolex Submariner',
  emoji: '⌚',
  value: 8500,
  totalEntries: 847,
  fund: 2100,
  month: 'June',
  pastWinner: '@luxe_fan_99',
  pastPrize: 'Louis Vuitton Neverfull',
  pastValue: 1200,
};

export const activityMessages = [
  '@sarah_j just bought 5 tickets for Chanel Classic Flap 🛍',
  '@sneaker_dan entered the Jordan 1 draw for 10p',
  '@watch_nerd_uk is watching the AP draw — 94% sold!',
  '@stylebyrae just won last night\'s Prada bag draw 🎉',
  '@luxe_collector bought 25 tickets for the streetwear bundle',
];

// 7 draws for tonight's live screen
export const tonightDraws = draws.filter(d => d.isClosingTonight);
