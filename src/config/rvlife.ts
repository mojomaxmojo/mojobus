import { ArticleCategory } from '@/config/types';

/**
 * RV Life Konfiguration
 * Untermenüpunkte für Artikel mit automatischen Tags
 */

export const RV_LIFE_CONFIG = {
  // Automatische Tags für alle RV Life Inhalte
  autoTags: ['rv-life', 'wohnmobil', 'rvlife', 'camper'],

  // Untermenüpunkte
  categories: {
    kuecheEssen: {
      id: 'kueche-essen',
      name: 'Küche & Essen',
      description: 'Kochen, Backen und alles rund um das Essen im Wohnmobil',
      icon: 'Cooking',
      emoji: '🍳',
      path: '/artikel/rvlife/kueche-essen',
      tags: {
        primary: ['kueche', 'essen', 'cooking', 'food', 'kochen'],
        optional: ['backen', 'rezepte', 'kochgeraete', 'kuechenausstattung', 'ersatznahrung', 'camping-kueche', 'kuechen-inspiration']
      },
      color: {
        light: 'text-orange-600',
        dark: 'text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900'
      },
      examples: [
        'Kochen auf kleinem Raum',
        'Camping-Rezepte für den Outdoor-Herd',
        'Küchenorganisation im Wohnmobil'
      ]
    },
    ausstattung: {
      id: 'ausstattung',
      name: 'Ausstattung',
      description: 'Wohnen, Küche, Bad und Storage im Wohnmobil',
      icon: 'Home',
      emoji: '🏠',
      path: '/artikel/rvlife/ausstattung',
      tags: {
        primary: ['ausstattung', 'equipment', 'ausruestung', 'wohnen'],
        optional: ['kuechenausstattung', 'badausstattung', 'storage', 'stauraum', 'moebel', 'interieur', 'innenausbau', 'wohnzimmer', 'schlafbereich', 'aufbewahrung']
      },
      color: {
        light: 'text-blue-600',
        dark: 'text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900'
      },
      examples: [
        'Cleverer Stauraum im Wohnmobil',
        'Bad-Einrichtung im Kleinen',
        'Wohnkomfort im Camper'
      ]
    },
    freeliving: {
      id: 'freeliving',
      name: 'Freeliving',
      description: 'Nomadenleben, Freiheit und Unabhängigkeit',
      icon: 'Compass',
      emoji: '🕊️',
      path: '/artikel/rvlife/freeliving',
      tags: {
        primary: ['freeliving', 'nomad', 'freedom', 'nomadenleben'],
        optional: ['digital-nomad', 'ortsunabhaengig', 'reisen', 'freiheit', 'abenteuer', 'minimalismus', 'community', 'unabhaengigkeit', 'leben-auf-radiern']
      },
      color: {
        light: 'text-purple-600',
        dark: 'text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-900'
      },
      examples: [
        'Das Leben als Digital Nomad',
        'Freiheit und Unabhängigkeit auf vier Rädern',
        'Minimalismus im Wohnmobil'
      ]
    }
  }
} as const;

/**
 * ArticleCategory Array für RV Life
 * Dies kann direkt in ARTICLE_CATEGORIES importiert werden
 */
export const RV_LIFE_ARTICLE_CATEGORIES: ArticleCategory[] = [
  {
    id: 'rvlife-kueche-essen',
    name: 'Küche & Essen',
    description: 'Kochen, Backen und alles rund um das Essen im Wohnmobil',
    icon: 'Cooking',
    emoji: '🍳',
    isRVLife: true,
    tags: {
      primary: ['rvlife', 'kueche-essen', 'kochen'],
      optional: ['backen', 'rezepte', 'kochgeraete', 'kuechenausstattung']
    },
    autoTags: ['rv-life', 'wohnmobil', 'rvlife', 'camper', 'kueche-essen', 'kochen'],
    priority: 8
  },
  {
    id: 'rvlife-ausstattung',
    name: 'Ausstattung',
    description: 'Wohnen, Küche, Bad und Storage im Wohnmobil',
    icon: 'Home',
    emoji: '🏠',
    isRVLife: true,
    tags: {
      primary: ['rvlife', 'ausstattung', 'wohnen'],
      optional: ['kuechenausstattung', 'badausstattung', 'storage', 'stauraum']
    },
    autoTags: ['rv-life', 'wohnmobil', 'rvlife', 'camper', 'ausstattung'],
    priority: 9
  },
  {
    id: 'rvlife-freeliving',
    name: 'Freeliving',
    description: 'Nomadenleben, Freiheit und Unabhängigkeit',
    icon: 'Compass',
    emoji: '🕊️',
    isRVLife: true,
    tags: {
      primary: ['rvlife', 'freeliving', 'nomad'],
      optional: ['digital-nomad', 'freedom', 'minimalismus', 'community']
    },
    autoTags: ['rv-life', 'wohnmobil', 'rvlife', 'camper', 'freeliving', 'nomad'],
    priority: 10
  }
];

/**
 * Alle RV Life Tags
 */
export const RV_LIFE_TAGS = Object.values(RV_LIFE_CONFIG.categories).flatMap(category => [
  ...category.tags.primary,
  ...category.tags.optional
]);

/**
 * Hilfsfunktion: Gibt RV Life Kategorie anhand der ID zurück
 */
export function getRVLifeCategoryById(id: string) {
  return Object.values(RV_LIFE_CONFIG.categories).find(cat => cat.id === id);
}

/**
 * Hilfsfunktion: Gibt alle automatischen RV Life Tags zurück
 */
export function getRVLifeAutoTags(): string[] {
  return [...RV_LIFE_CONFIG.autoTags];
}

/**
 * Hilfsfunktion: Gibt Tags für eine bestimmte RV Life Kategorie zurück
 */
export function getRVLifeCategoryTags(categoryId: string): string[] {
  const category = getRVLifeCategoryById(categoryId);
  if (!category) return [];
  return [...category.tags.primary, ...category.tags.optional];
}

/**
 * Hilfsfunktion: Erstellt die kompletten Tags für RV Life Inhalte
 * (automatische Tags + kategorienspezifische Tags)
 */
export function createRVLifeTags(categoryId: string, additionalTags: string[] = []): string[] {
  const autoTags = getRVLifeAutoTags();
  const categoryTags = getRVLifeCategoryTags(categoryId);

  // Kombiniere alle Tags und entferne Duplikate
  const allTags = [...autoTags, ...categoryTags, ...additionalTags];
  return Array.from(new Set(allTags));
}

export default RV_LIFE_CONFIG;
