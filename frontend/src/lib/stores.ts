export const formatStoreName = (storeName: string) => {
  if (!storeName) return '';
  const specialCases: Record<string, string> = {
    'no frills': 'No Frills',
    'nofrills': 'No Frills',
    'food basics': 'Food Basics',
    'foodbasics': 'Food Basics',
    'loblaws': 'Loblaws',
    'metro': 'Metro',
    'sobeys': 'Sobeys',
    'safeway': 'Safeway',
    'walmart': 'Walmart',
    'costco': 'Costco',
    'superstore': 'Superstore',
    'independent': 'Independent',
    // New banners and common variants
    'valu-mart': 'Valumart',
    'value mart': 'Valumart',
    'valumart': 'Valumart',
    'valuemart': 'Valumart',
    'zehrs': 'Zehrs',
    'maxi': 'Maxi',
    'fortinos': 'Fortinos',
  };
  const lower = storeName.toLowerCase().trim();
  if (specialCases[lower]) return specialCases[lower];
  return storeName
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const getStoreLogoPath = (storeName: string): string => {
  if (!storeName) return '/assets/store_logos/default.svg';
  const formattedName = storeName.toLowerCase().replace(/\s+/g, '-');
  const logoMappings: Record<string, string> = {
    'no-frills': 'no-frills.svg',
    'food-basics': 'food-basics.svg',
    'metro': 'metro.svg',
    'loblaws': 'loblaws.svg',
    'walmart': 'walmart.svg',
    'superstore': 'superstore.svg',
    'independent': 'independent.svg',
    // New banners (match files present in public/assets/store_logos)
    'valumart': 'valu-mart.svg',
    'valuemart': 'valu-mart.svg',
    'valu-mart': 'valu-mart.svg',
    'value-mart': 'valu-mart.svg',
    'zehrs': 'zehrs.svg',
    'maxi': 'maxi.svg',
    'fortinos': 'fortinos.svg',
    // Empire
    'sobeys': 'sobeys.svg',
    'safeway': 'safeway.svg',
  };
  const fileName = logoMappings[formattedName] || `${formattedName}.svg`;
  return `/assets/store_logos/${fileName}`;
};

export type HasDistance = { distance?: number | string | null };

const toNumberOrInfinity = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
  const n = Number(value as any);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
};

export const byDistanceAsc = <T extends HasDistance>(a: T, b: T): number => {
  const da = toNumberOrInfinity(a.distance);
  const db = toNumberOrInfinity(b.distance);
  return da - db;
};
