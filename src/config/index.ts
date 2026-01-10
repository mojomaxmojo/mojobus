// Re-export aller Konfigurationen für einfachen Import
export * from './types';
export * from './menu';
export * from './countries';
export * from './diy';
export * from './articles';
export * from './nature';
export * from './tags';

// Neue zentrale Konfigurationen
export * from './app';
export * from './relays';

// Legacy exports for backward compatibility
export { NOSTR_CONFIG, AUTHORS, DEFAULT_RELAYS } from './nostr';
export { DEFAULT_APP_CONFIG, APP_SETTINGS } from './app';
export { DEFAULT_APP_CONFIG as DEFAULT_APP_CONFIG_RELAYS } from './relays';