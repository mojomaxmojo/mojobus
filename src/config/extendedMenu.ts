/**
 * Main Menu Configuration
 * Erweitert mit RV Life Untermenüs
 */

import { CONTENT_CATEGORIES } from './contentCategories';
import { RV_LIFE_CATEGORIES, RV_LIFE_TAG_CONFIG, getAllRVLifeTagConfigs } from './rvLife';

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  route: string;
  children?: MenuCategory[];
}

/**
 * Hauptmenüstruktur
 */
export const MAIN_MENU: MenuCategory[] = [
  {
    id: 'home',
    name: 'Home',
    icon: 'Home',
    route: '/',
  },
  {
    id: 'artikel',
    name: 'Artikel',
    icon: 'FileText',
    route: '/artikel',
  },
  {
    id: 'plaetze',
    name: 'Plätze',
    icon: 'Map',
    route: '/plaetze',
  },
  {
    id: 'bilder',
    name: 'Bilder',
    icon: 'Image',
    route: '/bilder',
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: 'MessageSquare',
    route: '/notes',
  },
  {
    id: 'rv-life',
    name: 'RV Life',
    icon: 'Van',
    route: '/rv-life',
    children: RV_LIFE_CATEGORIES.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      route: cat.route,
    })),
  },
  {
    id: 'about',
    name: 'About',
    icon: 'User',
    route: '/about',
  },
  {
    id: 'login',
    name: 'Login',
    icon: 'LogIn',
    route: '/login',
  },
];

/**
 * Hole alle Kategorien inklusive Untermenüs
 */
export function getAllMenuCategories(): MenuCategory[] {
  const flatCategories: MenuCategory[] = [];
  
  MAIN_MENU.forEach(category => {
    if (category.children) {
      flatCategories.push(...category.children);
    } else {
      flatCategories.push(category);
    }
  });
  
  return flatCategories;
}

/**
 * Hole eine Kategorie anhand der ID
 */
export function getMenuCategoryById(id: string): MenuCategory | undefined {
  const flatCategories = getAllMenuCategories();
  return flatCategories.find(cat => cat.id === id);
}

/**
 * Hole eine Kategorie anhand der Route
 */
export function getMenuCategoryByRoute(route: string): MenuCategory | undefined {
  const flatCategories = getAllMenuCategories();
  return flatCategories.find(cat => cat.route === route);
}

/**
 * Hole Untermenüs für eine Kategorie
 */
export function getSubCategories(categoryId: string): MenuCategory[] | undefined {
  const category = getMenuCategoryById(categoryId);
  return category?.children;
}

/**
 * Prüfe ob eine Route zu RV Life gehört
 */
export function isRVLifeRoute(route: string): boolean {
  return route.startsWith('/rv-life/');
}

export default MAIN_MENU;
