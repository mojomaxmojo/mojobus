import { MenuCategory } from '@/config/menu';
import { RV_LIFE_CATEGORIES } from './rvLife';

const EXTENDED_MENU: MenuCategory[] = [
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
    icon: 'MapPin',
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
    children: Object.values(RV_LIFE_CATEGORIES).map((cat) => ({
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

export function getAllMenuCategories(): MenuCategory[] {
  const flatCategories: MenuCategory[] = [];

  EXTENDED_MENU.forEach((category) => {
    if (category.children) {
      flatCategories.push(...category.children);
    } else {
      flatCategories.push(category);
    }
  });

  return flatCategories;
}

export function getMenuCategoryById(id: string): MenuCategory | undefined {
  const flatCategories = getAllMenuCategories();
  return flatCategories.find((cat) => cat.id === id);
}

export function getMenuCategoryByRoute(route: string): MenuCategory | undefined {
  const flatCategories = getAllMenuCategories();
  return flatCategories.find((cat) => cat.route === route);
}

export function getSubCategories(categoryId: string): MenuCategory[] | undefined {
  const category = getMenuCategoryById(categoryId);
  return category?.children;
}

export function isRVLifeRoute(route: string): boolean {
  return route.startsWith('/rv-life/') || route === '/rv-life';
}

export default EXTENDED_MENU;
