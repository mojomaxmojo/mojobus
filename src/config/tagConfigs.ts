/**
 * Tab-spezifische Tag-Konfigurationen
 * Definiert welche Kategorien für jeden Content-Typ relevant sind
 */

import { TAG_CATEGORIES } from './tags';

export interface TagConfig {
  primary: string[];      // Pflicht-Kategorien (immer sichtbar)
  optional: string[];      // Optionale Kategorien (aufklappbar)
  defaults: string[];      // Standard-Tags für neuen Inhalt
  required?: string[];     // Pflicht-Tags (muss ausgewählt werden)
}

export const TAB_TAG_CONFIGS: Record<string, TagConfig> = {
  // 📝 Artikel (Blog Posts)
  article: {
    primary: ['content_type', 'travel_theme'],
    optional: ['location', 'season', 'activities'],
    defaults: ['story', 'travel'],
    required: ['content_type'] // Mindestens ein Inhaltstyp
  },

  // 📍 Plätze (Locations)
  place: {
    primary: ['location', 'travel_theme'],
    optional: ['activities', 'season'],
    defaults: ['location', 'vanlife'],
    required: ['location'] // Standort ist Pflicht für Plätze
  },

  // 💬 Notes (Quick Updates)
  note: {
    primary: ['content_type'],
    optional: ['travel_theme'],
    defaults: ['daily'],
    required: ['content_type'] // Inhaltstyp für Notes
  }
};

/**
 * Hole Tag-Konfiguration für einen spezifischen Tab
 */
export function getTabTagConfig(tabType: string): TagConfig {
  return TAB_TAG_CONFIGS[tabType] || TAB_TAG_CONFIGS.article;
}

/**
 * Hole verfügbare Kategorien für einen Tab
 */
export function getTabCategories(tabType: string): { primary: string[], optional: string[] } {
  const config = getTabTagConfig(tabType);
  return {
    primary: config.primary.filter(cat => TAG_CATEGORIES[cat]),
    optional: config.optional.filter(cat => TAG_CATEGORIES[cat])
  };
}

/**
 * Hole Standard-Tags für einen Tab
 */
export function getTabDefaults(tabType: string): string[] {
  const config = getTabTagConfig(tabType);
  return config.defaults || [];
}

/**
 * Prüfe ob ein Tag für einen Tab erlaubt ist
 */
export function isTagAllowedForTab(tagValue: string, tabType: string): boolean {
  const categories = getTabCategories(tabType);
  const allAllowedCategories = [...categories.primary, ...categories.optional];
  
  for (const category of allAllowedCategories) {
    if (TAG_CATEGORIES[category]?.tags.some(tag => tag.value === tagValue)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validiere Tags für einen spezifischen Tab
 */
export function validateTabTags(tags: string[], tabType: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const config = getTabTagConfig(tabType);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Prüfe Pflicht-Tags
  if (config.required) {
    for (const requiredTag of config.required) {
      const categoryTags = TAG_CATEGORIES[requiredTag]?.tags.map(tag => tag.value) || [];
      const hasRequiredTag = tags.some(tag => categoryTags.includes(tag));
      
      if (!hasRequiredTag) {
        errors.push(`${TAG_CATEGORIES[requiredTag]?.label || requiredTag} ist erforderlich`);
      }
    }
  }

  // Prüfe ob Tags für den Tab erlaubt sind
  const invalidTags = tags.filter(tag => !isTagAllowedForTab(tag, tabType));
  if (invalidTags.length > 0) {
    warnings.push(`Einige Tags sind für diesen Inhaltstyp ungewöhnlich: ${invalidTags.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}