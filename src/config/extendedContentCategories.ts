/**
 * Erweiterte Content-Kategorien mit RV Life Integration
 */

import { ContentCategory } from '@/config/contentCategories';
import { RV_LIFE_CATEGORIES } from './rvLife';

/**
 * Erweiterte Content-Kategorien
 * Erweitert bestehende Kategorien um RV Life Integration
 */

export const EXTENDED_CONTENT_CATEGORIES: Record<string, ContentCategory> = {
  // RV Life Hauptkategorien
  ...RV_LIFE_CATEGORIES,

  // Basiskategorien bleiben erhalten (von contentCategories.ts)
  notes: {
    id: 'notes',
    name: 'Notes',
    route: '/notes',
    kind: 1,
    tags: {
      required: ['notes', 'note'],
      optional: [
        // RV Life-spezifische Tags
        'rv-life', 'wohnmobil', 'vanlife', 'nomade',
        // Vanlife-spezifische Tags
        'camping', 'wildcamping', 'stellplatz', 'offgrid',
        'solar', 'strom', 'batterie',
        // Länder
        'portugal', 'spanien', 'italien', 'frankreich',
        // Lifestyle
        'kochen', 'fitness', 'freedom', 'community'
      ],
      filter: ['notes', 'note']
    },
    metadata: {
      title: 'Notes',
      description: 'Kurze Updates und Gedanken',
      icon: '💭',
      color: '#0891B2'
    }
  },

  places: {
    id: 'places',
    name: 'Plätze',
    route: '/plaetze',
    kind: 30023,
    tags: {
      required: ['location', 'places', 'place'],
      optional: [
        // RV Life-spezifische Tags
        'rv-life', 'wohnmobil',
        // Ortstypen
        'campingplatz', 'wildcamping', 'stellplatz', 'aussichtspunkt',
        'strand', 'berg', 'see', 'stadt', 'natur',
        // Länder
        'portugal', 'spanien', 'italien', 'frankreich',
        // Ausstattung
        'strom', 'wasser', 'wc', 'dusche', 'wlan'
      ],
      filter: ['location', 'places', 'place']
    },
    metadata: {
      title: 'Plätze',
      description: 'Campingplätze und Reiseziele',
      icon: '📍',
      color: '#DC2626'
    }
  },

  articles: {
    id: 'articles',
    name: 'Artikel',
    route: '/artikel',
    kind: 30023,
    tags: {
      required: ['artikel', 'article'],
      optional: [
        // RV Life-spezifische Tags
        'rv-life', 'wohnmobil', 'vanlife', 'nomade',
        // Kategorien
        'vanlife', 'technik', 'reisen', 'leben', 'anleitung', 'erfahrung',
        // Themen
        'solar', '4x4', 'navigation', 'reparatur', 'outdoor',
        // Reiseziele
        'europa', 'portugal', 'spanien', 'italien', 'griechenland',
        // Vanlife
        'ausbau', 'camping', 'wildcamping', 'digital', 'nomade'
      ],
      filter: ['artikel', 'article']
    },
    metadata: {
      title: 'Artikel',
      description: 'Ausführliche Geschichten und Guides',
      icon: '📖',
      color: '#7C3AED'
    }
  },

  leon: {
    id: 'leon',
    name: 'Leon Story',
    route: '/artikel/leon',
    kind: 30023,
    tags: {
      required: ['leon', 'artikel', 'article', 'hund', 'dog', 'lion', 'dogo'],
      optional: [
        'rv-life', 'wohnmobil', 'vanlife', 'camping', 'wildcamping'
      ],
      filter: ['leon', 'artikel', 'article', 'hund', 'dog', 'lion', 'dogo']
    },
    metadata: {
      title: 'Leon Story',
      description: 'Die Abenteuer und täglichen Momente von Leon',
      icon: '🦁',
      color: '#F59E0B'
    }
  },

  media: {
    id: 'media',
    name: 'Medien',
    route: '/bilder',
    kind: 1,
    tags: {
      required: ['medien', 'media', 'bilder', 'images'],
      optional: [
        // RV Life-spezifische Tags
        'rv-life', 'wohnmobil', 'vanlife', 'nomade',
        // Media-Typen
        'photo', 'video', 'audio', 'panorama', 'timelapse',
        // Vanlife-Themen
        'vanlife', 'camping', 'reise', 'strand', 'sunset', 'natur',
        // Qualität
        '4k', 'hd', 'drone', 'professional',
        // Länder
        'portugal', 'spanien', 'italien', 'frankreich'
      ],
      filter: ['medien', 'media', 'bilder', 'images']
    },
    metadata: {
      title: 'Bilder',
      description: 'Fotos, Videos und Medien',
      icon: '🖼️',
      color: '#059669'
    }
  }
};

/**
 * Hole alle Kategorien (einschlieelich RV Life)
 */
export function getAllCategories(): ContentCategory[] {
  return Object.values(EXTENDED_CONTENT_CATEGORIES);
}

/**
 * Hole eine Kategorie anhand der ID
 */
export function getCategoryById(id: string): ContentCategory | undefined {
  return EXTENDED_CONTENT_CATEGORIES[id];
}

/**
 * Hole eine Kategorie anhand der Route
 */
export function getCategoryByRoute(route: string): ContentCategory | undefined {
  return Object.values(EXTENDED_CONTENT_CATEGORIES).find(cat => cat.route === route);
}

/**
 * Prüfe ob ein Event zu einer RV Life Kategorie gehört
 */
export function isRVLifeEvent(event: any, categoryId: string): boolean {
  const category = getCategoryById(categoryId);
  if (!category) return false;

  const eventTags = event.tags?.filter((tag: any) => tag[0] === 't')?.map((tag: any) => tag[1]) || [];

  // Prüfe ob das Event mindestens einen RV Life Tag hat
  return category.tags.filter.some(filterTag => eventTags.includes(filterTag));
}

/**
 * Erstelle Tags für einen Inhaltstyp (inklusive RV Life Tags)
 */
export function createRVLifeAwareTags(categoryId: string, additionalTags: string[] = []): string[][] {
  const category = getCategoryById(categoryId);
  if (!category) return [];

  // Alle Tags: RV Life Tags + Required Tags + Additional Tags
  const allTags = ['rv-life', 'wohnmobil', 'vanlife', 'nomade', ...category.tags.required, ...additionalTags];

  // Entferne Duplikate
  const uniqueTags = Array.from(new Set(allTags));

  return uniqueTags.map(tag => ['t', tag]);
}

export default EXTENDED_CONTENT_CATEGORIES;
