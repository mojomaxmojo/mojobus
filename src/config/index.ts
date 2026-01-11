/**
 * Central Configuration Exports
 */

export { NOSTR_CONFIG } from './nostr';
export { APP_CONFIG } from './app';
export { RELAYS_CONFIG } from './relays';
export { MAIN_MENU } from './menu';
export { TAG_GROUPS, ALL_TAGS } from './tags';
export { CONTENT_CATEGORIES, createRequiredTags, getOptionalTags, getTabConfig } from './contentCategories';
export { TAG_CONFIGS, getTabTagConfig, getTabCategories, getTabDefaults, isTagAllowedForTab, validateTabTags } from './tagConfigs';
export { ARTICLE_CATEGORIES } from './articles';
export { DIY_CATEGORIES, DIY_TAGS } from './diy';
export { NATURE_CATEGORIES, NATURE_TAGS } from './nature';
export { COUNTRIES } from './countries';

export * from './rvLife';

export * from './extendedContentCategories';

export * from './extendedMenu';

export type { NostrEvent } from '@nostrify/nostrify';
export type { ContentCategory } from './contentCategories';
export type { MenuCategory } from './menu';

export { PERFORMANCE_CONFIG } from './performance';

export default {
  nostr: NOSTR_CONFIG,
  app: APP_CONFIG,
  relays: RELAYS_CONFIG,
  menu: MAIN_MENU,
  tags: TAG_GROUPS,
  contentCategories: CONTENT_CATEGORIES,
  tagConfigs: TAG_CONFIGS,
  rvLife: RV_LIFE_CATEGORIES,
  performance: PERFORMANCE_CONFIG,
};
