/**
 * KI-Prompts Konfiguration
 * 
 * Zentrale Export-Datei für alle Foster Huntington Prompts
 * Leicht wartbar und erweiterbar
 */

export * from './lifestyles'
export * from './media'
export * from './trips'
export * from './articles'
export * from './notes'

/**
 * Tab-Namen und zugehörige Prompt-Funktionen
 */
export const promptConfigs = {
  media: {
    name: 'Medien',
    description: 'Für MediaUploadForm - Artikel mit Bildern',
    file: 'media'
  },
  trips: {
    name: 'Trips',
    description: 'Für TripForm - Reiseberichte mit Stationen',
    file: 'trips'
  },
  articles: {
    name: 'Berichte',
    description: 'Für ArticleForm - Ausführliche Berichte',
    file: 'articles'
  },
  notes: {
    name: 'Note',
    description: 'Für NoteForm - Kurze Notizen',
    file: 'notes'
  }
} as const

export type TabType = keyof typeof promptConfigs
