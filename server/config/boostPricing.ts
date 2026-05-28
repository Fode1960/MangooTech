export type BoostKind = 'sponsored' | 'promo' | 'new';

export type BoostProduct = {
  kind: BoostKind;
  durationHours: 12 | 24 | 72;
  priceXof: number;
  title: string;
  description: string;
  sponsoredTier?: 1 | 2 | 3;
};

export const BOOST_PRODUCTS: BoostProduct[] = [
  {
    kind: 'sponsored',
    durationHours: 12,
    priceXof: 2000,
    title: 'Boost Sponsorisé (12h)',
    description: 'Sponsorisé sur la carte Mangoo Local+ (12h)',
    sponsoredTier: 1,
  },
  {
    kind: 'sponsored',
    durationHours: 24,
    priceXof: 5000,
    title: 'Boost Sponsorisé (24h)',
    description: 'Sponsorisé sur la carte Mangoo Local+ (24h)',
    sponsoredTier: 2,
  },
  {
    kind: 'sponsored',
    durationHours: 72,
    priceXof: 12000,
    title: 'Boost Sponsorisé (72h)',
    description: 'Sponsorisé sur la carte Mangoo Local+ (72h)',
    sponsoredTier: 3,
  },
  {
    kind: 'promo',
    durationHours: 24,
    priceXof: 1000,
    title: 'Boost Promo (24h)',
    description: 'Badge Promo sur la carte Mangoo Local+ (24h)',
  },
  {
    kind: 'promo',
    durationHours: 72,
    priceXof: 2500,
    title: 'Boost Promo (72h)',
    description: 'Badge Promo sur la carte Mangoo Local+ (72h)',
  },
  {
    kind: 'new',
    durationHours: 24,
    priceXof: 500,
    title: 'Boost Nouveau (24h)',
    description: 'Badge Nouveau sur la carte Mangoo Local+ (24h)',
  },
  {
    kind: 'new',
    durationHours: 72,
    priceXof: 1500,
    title: 'Boost Nouveau (72h)',
    description: 'Badge Nouveau sur la carte Mangoo Local+ (72h)',
  },
];

export function getBoostProduct(kind: BoostKind, durationHours: number): BoostProduct | null {
  const d = Number(durationHours);
  if (d !== 12 && d !== 24 && d !== 72) return null;
  return BOOST_PRODUCTS.find((p) => p.kind === kind && p.durationHours === d) || null;
}

export function boostKindToVendorBoostColumn(kind: BoostKind): 'sponsored' | 'promo' | 'new' {
  return kind;
}

export function sponsoredTierToNumber(tier: unknown): 1 | 2 | 3 | null {
  const t = String(tier || '').trim().toLowerCase();
  if (t === 'bronze') return 1;
  if (t === 'argent') return 2;
  if (t === 'or') return 3;
  return null;
}

export function numberToSponsoredTierLabel(tier: number | null | undefined): 'bronze' | 'argent' | 'or' | null {
  if (tier === 1) return 'bronze';
  if (tier === 2) return 'argent';
  if (tier === 3) return 'or';
  return null;
}

