import { ContentCategory } from '@/config/types';
import { RV_LIFE_CATEGORIES, RV_LIFE_TAGS } from './rvLife';
import { CONTENT_CATEGORIES as BASE_CONTENT_CATEGORIES } from './contentCategories';

/**
 * Erweiterte Content-Kategorien mit RV Life Integration
 * Alle RV Life Inhalte erhalten automatisch RV Life Tags
 */

export const EXTENDED_CONTENT_CATEGORIES: Record<string, ContentCategory> = {
  // RV Life Hauptkategorien
  ...RV_LIFE_CATEGORIES,
  
  // Basiskategorien bleiben erhalten
  ...BASE_CONTENT_CATEGORIES,
};

/**
 * Hole alle Kategorien (einschlieelich RV Life)
 */
export function getAllCategories(): ContentCategory[] {
  return [
    ...Object.values(BASE_CONTENT_CATEGORIES),
    ...Object.values(RV_LIFE_CATEGORIES),
  ];
}

/**
 * Prüfe ob ein Event zu einer RV Life Kategorie gehört
 */
export function isRVLifeEvent(event: any, categoryId: string): boolean {
  const category = EXTENDED_CONTENT_CATEGORIES[categoryId];
  if (!category) return false;

  const eventTags = event.tags?.filter((tag: any) => tag[0] === 't')?.map((tag: any) => tag[1]) || [];

  // Prüfe ob das Event mindestens einen RV Life Tag hat
  return RV_LIFE_TAGS.some(tag => eventTags.includes(tag));
}

/**
 * Erstelle Tags für einen Inhaltstyp (inklusive RV Life Tags)
 */
export function createRVLifeAwareTags(categoryId: string, additionalTags: string[] = []): string[][] {
  const category = EXTENDED_CONTENT_CATEGORIES[categoryId];
  if (!category) return [];

  // Alle Tags: RV Life Tags + Required Tags + Additional Tags
  const allTags = [...RV_LIFE_TAGS, ...category.tags.required, ...additionalTags];

  // Entferne Duplikate
  const uniqueTags = Array.from(new Set(allTags));

  return uniqueTags.map(tag => ['t', tag]);
}

export default EXTENDED_CONTENT_CATEGORIES;
