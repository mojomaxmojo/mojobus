import { ARTICLE_CATEGORIES, ContentCategory } from '@/config/contentCategories';
import { RV_LIFE_CATEGORIES, RVLifeCategory } from '@/config/rvLife';
import { MAIN_MENU } from '@/config/menu';
import { ArticleCategory } from '@/config/types';

/**
 * Erweiterte Artikel-Kategorien mit RV Life Integration
 * Alle Artikel erhalten automatisch RV Life Tags
 */
export const EXTENDED_ARTICLE_CATEGORIES: Record<string, ContentCategory> = {
  ...ARTICLE_CATEGORIES,
  
  rv_life: {
    id: 'rv-life',
    name: 'RV Life',
    route: '/rv-life',
    kind: 30023,
    tags: {
      required: ['rv-life', 'wohnmobil', 'rv', 'vanlife'],
      optional: [
        // Allgemein
        'wohnen', 'vanlife', 'nomade', 'offgrid', 'minimalism', 'freedom',
        
        // Ausstattung
        'interior', 'einrichtung', 'bett', 'kuche', 'bad', 'wc',
        
        // Technik
        'elektronik', 'solar', 'strom', '12v', 'batterie',
        
        // Fahren
        'motor', 'getriebe', 'reifen', 'bremsen', 'wartung',
      ],
      filter: ['rv-life', 'wohnmobil']
    },
    metadata: {
      title: 'RV Life',
      description: 'Alles rund ums Wohnmobil',
      icon: '🚐',
      color: '#0891B2'
    }
  },
  
  rv_life_kueche: {
    id: 'rv-life-kueche',
    name: 'Kuche & Essen',
    route: '/rv-life/kueche-essen',
    kind: 30023,
    tags: {
      required: ['rv-life', 'kueche', 'kochen', 'wohnmobil'],
      optional: [
        'kocher', 'herd', 'topf', 'spuele', 'geschirrspueler',
        'kuehlschrank', 'gefrierschrank', 'mikrowelle', 'kochgeschirr',
        'rezept', 'food', 'meal', 'backen', 'kochen', 'kuechengerat',
        'gas-camping-kocher', 'lagerung', 'vorrat'
      ],
      filter: ['rv-life', 'kueche', 'kochen']
    },
    metadata: {
      title: 'Kuche & Essen',
      description: 'Rezepte, Kucheneinrichtung, Kochen unterwegs',
      icon: '🍳',
      color: '#DC2626'
    }
  },
  
  rv_life_ausstattung: {
    id: 'rv-life-ausstattung',
    name: 'Ausstattung',
    route: '/rv-life/ausstattung',
    kind: 30023,
    tags: {
      required: ['rv-life', 'ausstattung', 'wohnmobil'],
      optional: [
        'interior', 'einrichtung', 'bett', 'matratze',
        'stauraum', 'storage', 'unterhalt',
        'beleuchtung', 'heizung', 'klimaanlage'
      ],
      filter: ['rv-life', 'ausstattung']
    },
    metadata: {
      title: 'Ausstattung',
      description: 'Interior, Einrichtung, Beleuchtung, Heizung',
      icon: '🏠',
      color: '#7C3AED'
    }
  },
  
  rv_life_freeliving: {
    id: 'rv-life-freeliving',
    name: 'Freeliving',
    route: '/rv-life/freeliving',
    kind: 30023,
    tags: {
      required: ['rv-life', 'freeliving', 'wohnmobil'],
      optional: [
        'freedom', 'minimalismus', 'sustainability', 'offgrid',
        'autark', 'selbstversorgung', 'nachhaltig', 'nomadic'
      ],
      filter: ['rv-life', 'freeliving']
    },
    metadata: {
      title: 'Freeliving',
      description: 'Freiheit, Minimalismus, Nachhaltigkeit, Autarkie',
      icon: '🌿',
      color: '#059669'
    }
  },
};

/**
 * Hole alle Kategorien (einschlielich RV Life)
 */
export function getAllCategories(): ContentCategory[] {
  return [
    ...Object.values(ARTICLE_CATEGORIES),
    ...Object.values(RV_LIFE_CATEGORIES),
  ];
}

/**
 * Hole eine Kategorie anhand der ID
 */
export function getCategoryById(id: string): ContentCategory | undefined {
  return getAllCategories().find(cat => cat.id === id);
}

/**
 * Hole Kategorien für RV Life
 */
export function getRVLifeCategories(): ContentCategory[] {
  return Object.values(RV_LIFE_CATEGORIES);
}

export default EXTENDED_ARTICLE_CATEGORIES;
