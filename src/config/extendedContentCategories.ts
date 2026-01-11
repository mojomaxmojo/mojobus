import { RV_LIFE_CATEGORIES } from './rvLife';

export const EXTENDED_CONTENT_CATEGORIES: Record<string, any> = {
  // RV Life Hauptkategorien
  ...RV_LIFE_CATEGORIES,
  
  // Basiskategorien bleiben erhalten (wenn sie definiert sind)
};

export default EXTENDED_CONTENT_CATEGORIES;
