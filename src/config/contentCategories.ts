/**
 * Content Categories Configuration
 * Zentrale Konfiguration für die Trennung von Inhaltstypen
 */

export interface ContentCategory {
  id: string;
  name: string;
  route: string;
  kind: number;
  tags: {
    required: string[]; // Diese Tags werden immer hinzugefügt
    optional?: string[]; // Optionale Tags die verfügbar sind
    filter?: string[]; // Tags zum Filtern auf der entsprechenden Seite
  };
  metadata?: {
    title?: string;
    description?: string;
    icon?: string;
    color?: string;
  };
}

export const CONTENT_CATEGORIES: Record<string, ContentCategory> = {
  notes: {
    id: 'notes',
    name: 'Notes',
    route: '/notes',
    kind: 1, // Short text note
    tags: {
      required: ['notes', 'note', 'mojobus'], // Always include #mojobus
      optional: [
        // Vanlife-spezifische Tags
        'vanlife', 'camping', 'wildcamping', 'stellplatz',
        'solarenergie', 'offgrid', 'beachlife', 'sunset',
        'portugal', 'spanien', 'italien', 'kroatien',
        'bitcoin', 'freedom', 'community', 'minimalismus',
        'cooking', 'fitness', 'travel', 'nature'
      ],
      filter: ['notes', 'note'] // Tags zum Anzeigen unter /notes
    },
    metadata: {
      title: 'Notes',
      description: 'Kurze Updates und Gedanken',
      icon: '💭',
      color: '#0891B2' // Ocean Blue
    }
  },

  places: {
    id: 'places',
    name: 'Plätze',
    route: '/plaetze',
    kind: 30023, // Long-form addressable event
    tags: {
      required: ['location', 'places', 'place', 'mojobus'], // Always include #mojobus
      optional: [
        // Ortstypen
        'campingplatz', 'wildcamping', 'stellplatz', 'aussichtspunkt',
        'strand', 'berg', 'see', 'stadt', 'natur',
        // Länder/Regionen
        'portugal', 'spanien', 'italien', 'frankreich', 'deutschland',
        'algarve', 'andalusien', 'katalonien', 'toskana',
        // Ausstattung
        'strom', 'wasser', 'wc', 'dusche', 'wlan', 'shop',
        // Geeignet für
        'familien', 'paare', 'single', 'wohnmobil', 'zelt'
      ],
      filter: ['location', 'places', 'place'] // Tags zum Anzeigen unter /plaetze
    },
    metadata: {
      title: 'Plätze',
      description: 'Campingplätze und Reiseziele',
      icon: '📍',
      color: '#DC2626' // Red
    }
  },

  articles: {
    id: 'articles',
    name: 'Artikel',
    route: '/artikel',
    kind: 30023, // Long-form addressable event
    tags: {
      required: ['artikel', 'article', 'mojobus'], // Always include #mojobus
      optional: [
        // Kategorien
        'vanlife', 'technik', 'reisen', 'leben', 'anleitung', 'erfahrung',
        // Themen
        'solar', '4x4', 'navigation', 'reparatur', 'outdoor',
        'kochen', 'gesundheit', 'sicherheit', 'budget',
        // Reiseziele
        'europa', 'portugal', 'spanien', 'italien', 'griechenland',
        // Vanlife
        'ausbau', 'camping', 'wildcamping', 'digital', 'nomade'
      ],
      filter: ['artikel', 'article'] // Tags zum Anzeigen unter /artikel
    },
    metadata: {
      title: 'Artikel',
      description: 'Ausführliche Geschichten und Guides',
      icon: '📖',
      color: '#7C3AED' // Purple
    }
  },

  leon: {
    id: 'leon',
    name: 'Leon Story',
    route: '/artikel/leon',
    kind: 30023, // Long-form addressable event
    tags: {
      required: ['leon', 'artikel', 'article', 'hund', 'dog', 'lion', 'dogo', 'mojobus'], // Always include #mojobus
      optional: ['vanlife', 'technik', 'reisen', 'leben', 'anleitung', 'erfahrung'],
      filter: ['leon', 'artikel', 'article', 'hund', 'dog', 'lion', 'dogo'] // Tags zum Anzeigen unter /artikel/leon
    },
    metadata: {
      title: 'Leon Story',
      description: 'Die Abenteuer und täglichen Momente von Leon',
      icon: '🦁',
      color: '#F59E0B' // Amber
    }
  },

  media: {
    id: 'media',
    name: 'Medien',
    route: '/bilder',
    kind: 1, // Text note with media attachments
    tags: {
      required: ['medien', 'media', 'bilder', 'images', 'mojobus'], // Always include #mojobus
      optional: [
        // Media-Typen
        'photo', 'video', 'audio', 'panorama', 'timelapse',
        // Vanlife-Themen
        'vanlife', 'camping', 'reise', 'strand', 'sunset', 'natur',
        // Qualität
        '4k', 'hd', 'drone', 'professional',
        // Länder
        'portugal', 'spanien', 'italien', 'frankreich'
      ],
      filter: ['medien', 'media', 'bilder', 'images'] // Tags zum Anzeigen unter /bilder
    },
    metadata: {
      title: 'Bilder',
      description: 'Fotos, Videos und Medien',
      icon: '🖼️',
      color: '#059669' // Emerald
    }
  }
} as const;

// Helper Functions

/**
 * Gibt alle Kategorien als Array zurück
 */
export function getAllCategories(): ContentCategory[] {
  return Object.values(CONTENT_CATEGORIES);
}

/**
 * Findet Kategorie anhand der ID
 */
export function getCategoryById(id: string): ContentCategory | undefined {
  return CONTENT_CATEGORIES[id];
}

/**
 * Findet Kategorie anhand der Route
 */
export function getCategoryByRoute(route: string): ContentCategory | undefined {
  return Object.values(CONTENT_CATEGORIES).find(cat => cat.route === route);
}

/**
 * Gibt die Filter-Tags für eine bestimmte Kategorie zurück
 */
export function getFilterTags(categoryId: string): string[] {
  const category = getCategoryById(categoryId);
  return category?.tags.filter || [];
}

/**
 * Prüft ob ein Event zu einer bestimmten Kategorie gehört
 */
export function eventBelongsToCategory(event: any, categoryId: string): boolean {
  const category = getCategoryById(categoryId);
  if (!category) return false;

  const eventTags = event.tags?.filter((tag: any) => tag[0] === 't')?.map((tag: any) => tag[1]) || [];

  return category.tags.filter.some(filterTag => eventTags.includes(filterTag));
}

/**
 * Erstellt die erforderlichen Tags für einen Inhaltstyp
 */
export function createRequiredTags(categoryId: string, additionalTags: string[] = []): string[][] {
  const category = getCategoryById(categoryId);
  if (!category) return [];

  // Kombiniere required und additional Tags, aber entferne Duplikate
  const allTags = [...category.tags.required, ...additionalTags];
  const uniqueTags = Array.from(new Set(allTags));

  return uniqueTags.map(tag => ['t', tag]);
}

/**
 * Gibt verfügbare optionale Tags für eine Kategorie zurück
 */
export function getOptionalTags(categoryId: string): string[] {
  const category = getCategoryById(categoryId);
  return category?.tags.optional || [];
}

/**
 * Erstellt Nostr-Query-Filter für eine bestimmte Kategorie
 */
export function createCategoryFilter(categoryId: string, additionalFilters?: any): any {
  const category = getCategoryById(categoryId);
  if (!category) return {};

  return {
    kinds: [category.kind],
    '#t': category.tags.filter,
    ...additionalFilters
  };
}

/**
 * Konfiguration für UI-Componenten (Tab-Liste etc.)
 */
export function getTabConfig() {
  return Object.values(CONTENT_CATEGORIES).map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.metadata?.icon || '📄',
    color: cat.metadata?.color || '#0891B2'
  }));
}

export default CONTENT_CATEGORIES;