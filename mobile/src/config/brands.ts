export const LAUNCH_BRANDS = [
  { id: 'chanel',   label: 'Chanel' },
  { id: 'lv',       label: 'Louis Vuitton' },
  { id: 'bottega',  label: 'Bottega Veneta' },
  { id: 'prada',    label: 'Prada' },
  { id: 'celine',   label: 'Celine' },
] as const;

export type BrandId = typeof LAUNCH_BRANDS[number]['id'];

export const MIN_RETAIL_VALUE_PENCE = 20000; // £200

export const BAG_MODELS: Record<BrandId, string[]> = {
  chanel:  ['Classic Flap Medium', 'Classic Flap Small', 'Boy Bag Medium', 'Boy Bag Small', '19 Bag', 'WOC', 'Gabrielle Hobo', 'Trendy CC', 'Coco Handle', 'Mini Square Flap'],
  lv:      ['Neverfull MM', 'Neverfull GM', 'Speedy 30', 'Speedy 25', 'Pochette Métis', 'Alma BB', 'Capucines MM', 'Loop Hobo', 'Twist MM', 'Dauphine MM'],
  bottega: ['Jodie Small', 'Jodie Medium', 'Cassette', 'The Pouch', 'Arco Tote', 'Chain Pouch', 'Intrecciato Clutch', 'Padded Cassette', 'Loop Bag', 'Teen Jodie'],
  prada:   ['Re-Edition 2000', 'Re-Edition 2005', 'Re-Nylon Backpack', 'Galleria Medium', 'Galleria Small', 'Cleo Shoulder', 'Triangle Bag', 'Bucket Bag', 'Padded Nappa Tote', 'Cahier Bag'],
  celine:  ['Classic Box', 'Triomphe', 'Ava Bag', '16 Bag', 'Cabas Phantom', 'Belt Bag', 'Micro 16', 'Clasp Bag', 'Teen Triomphe', 'Small Bucket'],
};
