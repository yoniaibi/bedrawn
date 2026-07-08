// Mock comparable sales data — (brandId, model) → UK resale value in pence
// Source: aggregated UK resale market data (approximate)

import { BrandId } from '../config/brands';

export interface BagComp {
  brandId: BrandId;
  model: string;
  baseValuePence: number;
}

export const BAG_COMPS: BagComp[] = [
  // Chanel
  { brandId: 'chanel', model: 'Classic Flap Medium',    baseValuePence: 520000 },
  { brandId: 'chanel', model: 'Classic Flap Small',     baseValuePence: 460000 },
  { brandId: 'chanel', model: 'Boy Bag Medium',         baseValuePence: 420000 },
  { brandId: 'chanel', model: 'Boy Bag Small',          baseValuePence: 370000 },
  { brandId: 'chanel', model: '19 Bag',                 baseValuePence: 380000 },
  { brandId: 'chanel', model: 'WOC',                    baseValuePence: 180000 },
  { brandId: 'chanel', model: 'Gabrielle Hobo',         baseValuePence: 240000 },
  { brandId: 'chanel', model: 'Trendy CC',              baseValuePence: 280000 },
  { brandId: 'chanel', model: 'Coco Handle',            baseValuePence: 320000 },
  { brandId: 'chanel', model: 'Mini Square Flap',       baseValuePence: 350000 },
  // Louis Vuitton
  { brandId: 'lv',     model: 'Neverfull MM',           baseValuePence: 115000 },
  { brandId: 'lv',     model: 'Neverfull GM',           baseValuePence: 130000 },
  { brandId: 'lv',     model: 'Speedy 30',              baseValuePence: 80000  },
  { brandId: 'lv',     model: 'Speedy 25',              baseValuePence: 70000  },
  { brandId: 'lv',     model: 'Pochette Métis',         baseValuePence: 160000 },
  { brandId: 'lv',     model: 'Alma BB',                baseValuePence: 90000  },
  { brandId: 'lv',     model: 'Capucines MM',           baseValuePence: 280000 },
  { brandId: 'lv',     model: 'Loop Hobo',              baseValuePence: 110000 },
  { brandId: 'lv',     model: 'Twist MM',               baseValuePence: 220000 },
  { brandId: 'lv',     model: 'Dauphine MM',            baseValuePence: 190000 },
  // Bottega Veneta
  { brandId: 'bottega', model: 'Jodie Small',           baseValuePence: 140000 },
  { brandId: 'bottega', model: 'Jodie Medium',          baseValuePence: 180000 },
  { brandId: 'bottega', model: 'Cassette',              baseValuePence: 190000 },
  { brandId: 'bottega', model: 'The Pouch',             baseValuePence: 180000 },
  { brandId: 'bottega', model: 'Arco Tote',             baseValuePence: 160000 },
  { brandId: 'bottega', model: 'Chain Pouch',           baseValuePence: 120000 },
  { brandId: 'bottega', model: 'Intrecciato Clutch',    baseValuePence: 145000 },
  { brandId: 'bottega', model: 'Padded Cassette',       baseValuePence: 210000 },
  { brandId: 'bottega', model: 'Loop Bag',              baseValuePence: 130000 },
  { brandId: 'bottega', model: 'Teen Jodie',            baseValuePence: 110000 },
  // Prada
  { brandId: 'prada',  model: 'Re-Edition 2000',        baseValuePence: 87500  },
  { brandId: 'prada',  model: 'Re-Edition 2005',        baseValuePence: 95000  },
  { brandId: 'prada',  model: 'Re-Nylon Backpack',      baseValuePence: 110000 },
  { brandId: 'prada',  model: 'Galleria Medium',        baseValuePence: 130000 },
  { brandId: 'prada',  model: 'Galleria Small',         baseValuePence: 110000 },
  { brandId: 'prada',  model: 'Cleo Shoulder',          baseValuePence: 140000 },
  { brandId: 'prada',  model: 'Triangle Bag',           baseValuePence: 75000  },
  { brandId: 'prada',  model: 'Bucket Bag',             baseValuePence: 85000  },
  { brandId: 'prada',  model: 'Padded Nappa Tote',      baseValuePence: 155000 },
  { brandId: 'prada',  model: 'Cahier Bag',             baseValuePence: 120000 },
  // Celine
  { brandId: 'celine', model: 'Classic Box',            baseValuePence: 180000 },
  { brandId: 'celine', model: 'Triomphe',               baseValuePence: 150000 },
  { brandId: 'celine', model: 'Ava Bag',                baseValuePence: 95000  },
  { brandId: 'celine', model: '16 Bag',                 baseValuePence: 200000 },
  { brandId: 'celine', model: 'Cabas Phantom',          baseValuePence: 130000 },
  { brandId: 'celine', model: 'Belt Bag',               baseValuePence: 160000 },
  { brandId: 'celine', model: 'Micro 16',               baseValuePence: 170000 },
  { brandId: 'celine', model: 'Clasp Bag',              baseValuePence: 145000 },
  { brandId: 'celine', model: 'Teen Triomphe',          baseValuePence: 125000 },
  { brandId: 'celine', model: 'Small Bucket',           baseValuePence: 110000 },
];

// Brand medians for fallback when model not matched
export const BRAND_MEDIANS: Record<BrandId, number> = {
  chanel:  340000,
  lv:      130000,
  bottega: 160000,
  prada:   110000,
  celine:  145000,
};
