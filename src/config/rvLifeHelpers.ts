/**
 * RV Life Tag-Helper-Funktionen
 */

import { RV_LIFE_CATEGORIES, RV_LIFE_TAGS } from './rvLife';

/**
 * Erstelle Tags für einen RV Life Inhalt
 */
export function createRVLifeTags(categoryId: string, additionalTags: string[] = []): string[][] {
  const category = RV_LIFE_CATEGORIES[categoryId];
  if (!category) return [];

  // Kombiniere alle Tags
  const allTags = [
    ...RV_LIFE_TAGS,        // RV Life Pflichttags
    ...category.requiredTags,    // Kategorie-spezifische Pflichttags
    ...additionalTags,           // User-Auswahl
  ];

  // Entferne Duplikate
  const uniqueTags = Array.from(new Set(allTags));

  return uniqueTags.map(tag => ['t', tag]);
}

/**
 * Prüfe ob ein Tag zu RV Life gehört
 */
export function isRVLifeTag(tag: string): boolean {
  return RV_LIFE_TAGS.includes(tag);
}

/**
 * Prüfe ob ein Event zu einer RV Life Kategorie gehört
 */
export function isRVLifeEvent(event: any, categoryId: string): boolean {
  const category = RV_LIFE_CATEGORIES[categoryId];
  if (!category) return false;

  const eventTags = event.tags?.filter((tag: any) => tag[0] === 't')?.map((tag: any) => tag[1]) || [];

  // Prüfe RV Life Tags
  const hasRVLifeTags = category.requiredTags.some(tag => RV_LIFE_TAGS.includes(tag) && eventTags.includes(tag));

  // Prüfe Kategorie-Pflichttags
  const hasRequiredTags = category.requiredTags.some(tag => eventTags.includes(tag));

  return hasRequiredTags && hasRVLifeTags;
}

/**
 * Hole verfügbare optionale Tags für eine Kategorie
 */
export function getRVLifeOptionalTags(categoryId: string): string[] {
  const category = RV_LIFE_CATEGORIES[categoryId];
  return category?.optionalTags || [];
}

export default {
  RV_LIFE_TAGS,
  KUECHE_ESSEN_TAGS,
  AUSSTATTUNG_TAGS,
  FREELIVING_TAGS,
  createRVLifeTags,
  isRVLifeTag,
  isRVLifeEvent,
  getRVLifeOptionalTags,
};
