/**
 * RV Life Tag-Konfiguration
 */

export const RV_LIFE_TAGS = [
  'rv-life',
  'wohnmobil',
  'rv',
  'vanlife',
  'camper',
  'wohnenmobil',
  'mobile',
  'nomade',
];

export const KUECHE_ESSEN_TAGS = [
  'kueche',
  'kochen',
  'backen',
  'kocher',
  'herd',
  'topf',
  'suele',
  'geschirrspueler',
  'kuehlschrank',
  'gefrierschrank',
  'mikrowelle',
  'kochgeschirr',
  'rezept',
  'food',
  'meal',
];

export const AUSSTATTUNG_TAGS = [
  'ausstattung',
  'wohnraum',
  'schlafbereich',
  'badezimmer',
  'wc',
  'dusche',
  'waschmaschine',
  'kuehlbox',
  'stauraum',
  'garage',
];

export const FREELIVING_TAGS = [
  'freeliving',
  'nomadic',
  'sustainability',
  'offgrid',
  'minimalism',
  'freedom',
  'minimalismus',
  'nachhaltig',
  'autark',
  'selbstversorgung',
];

export interface RVLifeCategory {
  id: string;
  name: string;
  route: string;
  icon: string;
  description: string;
  requiredTags: string[];
  optionalTags: string[];
}

export const RV_LIFE_CATEGORIES: Record<string, RVLifeCategory> = {
  kueche_essen: {
    id: 'kueche_essen',
    name: 'Kueche & Essen',
    route: '/rv-life/kueche-essen',
    icon: '🍳',
    description: 'Rezepte, Kuecheneinrichtung, Kochen unterwegs',
    requiredTags: RV_LIFE_TAGS,
    optionalTags: KUECHE_ESSEN_TAGS,
  },

  ausstattung: {
    id: 'ausstattung',
    name: 'Ausstattung',
    route: '/rv-life/ausstattung',
    icon: '🏠',
    description: 'Innenraum, WC, Dusche, Lagerung, Werkstatt',
    requiredTags: RV_LIFE_TAGS,
    optionalTags: AUSSTATTUNG_TAGS,
  },

  freeliving: {
    id: 'freeliving',
    name: 'Freeliving',
    route: '/rv-life/freeliving',
    icon: '🌿',
    description: 'Freiheit, Minimalismus, Nachhaltigkeit, Autarkie',
    requiredTags: RV_LIFE_TAGS,
    optionalTags: FREELIVING_TAGS,
  },
};

export default RV_LIFE_CATEGORIES;
