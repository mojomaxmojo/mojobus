import { DIYCategory } from '@/config/types';

export const NATURE_CATEGORIES: Record<string, DIYCategory> = {
  'strand': {
    id: 'strand',
    name: 'Strand',
    description: 'Die schönsten Strände und Küstenregionen',
    icon: 'Beach',
    emoji: '🏖️',
    path: '/bilder/natur/strand',
    tags: {
      primary: ['natur', 'strand', 'meer', 'küste'],
      secondary: ['sandstrand', 'wellness', 'sonnenuntergang', 'surfen', 'strandwanderung', 'felsen', 'insel', 'buchten', 'hafen']
    },
    color: {
      light: 'text-cyan-600',
      dark: 'text-cyan-400',
      bg: 'bg-cyan-100 dark:bg-cyan-900'
    }
  },
  'berge': {
    id: 'berge',
    name: 'Berge',
    description: 'Majestätische Berggipfel und Wanderwege',
    icon: 'Mountain',
    emoji: '⛰️',
    path: '/bilder/natur/berge',
    tags: {
      primary: ['natur', 'berge', 'wanderung', 'gipfel', 'alpen'],
      secondary: ['hochgebirge', 'gipfelwanderung', 'alpenpanorama', 'wanderwege', 'fels', 'klettern', 'skigebiet', 'schutzhuette', 'gipfelrestaurant', 'alpenblühen', 'bergsee']
    },
    color: {
      light: 'text-green-600',
      dark: 'text-green-400',
      bg: 'bg-green-100 dark:bg-green-900'
    }
  },
  'see': {
    id: 'see',
    name: 'Seen & Ansichten',
    description: 'Beeindruckende Seen und Panoramapunkte',
    icon: 'Eye',
    emoji: '👁️',
    path: '/bilder/natur/see',
    tags: {
      primary: ['natur', 'see', 'panorama', 'aussicht', 'sunset', 'sonnenuntergang', 'sonnenaufgang', 'wetter', 'luft', 'horizont', 'wolken'],
      secondary: ['panoramapunkt', 'auslugspunkt', 'wettererscheinung', 'nachthimmel', 'wolkenformation', 'lichtstrahl', 'regenbogen', 'farbe', 'sonnenstrahl']
    },
    color: {
      light: 'text-orange-600',
      dark: 'text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900'
    }
  },
  'wald': {
    id: 'wald',
    name: 'Wälder',
    description: 'Dichte Wälder, Baumgipfel und Naturpfade',
    icon: 'Trees',
    emoji: '🌲',
    path: '/bilder/natur/wald',
    tags: {
      primary: ['natur', 'wald', 'bäume', 'forst', 'baumgipfel', 'naturschutz', 'waldweg', 'wildnis', 'naturpark', 'jagd', 'pilze'],
      secondary: ['laub', 'moos', 'farn', 'holzwurzel', 'buche', 'tannen', 'eichenbaum', 'waldstrand', 'naturbadestehen', 'wildblumen', 'pilze']
    },
    color: {
      light: 'text-emerald-600',
      dark: 'text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900'
    }
  },
  'wasserfall': {
    id: 'wasserfall',
    name: 'Wasserfälle',
    description: 'Imposante Wasserfälle und Flüsse in der Natur',
    icon: 'Droplets',
    emoji: '💧',
    path: '/bilder/natur/wasserfall',
    tags: {
      primary: ['natur', 'wasserfall', 'fluss', 'wasser', 'bach', 'wildwasser', 'stromschnell'],
      secondary: [' Regenwald', 'Bergbach', 'Kaskade', 'Stromschnelle', 'Quelle', 'Alpental', 'Flussauen', 'Naturpark', 'Wasserkraft']
    },
    color: {
      light: 'text-blue-600',
      dark: 'text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900'
    }
  },
  'wiese': {
    id: 'wiese',
    name: 'Wiesen',
    description: 'Blühende Wiesen, Almen und Naturwiesen',
    icon: 'Sun',
    emoji: '🌻',
    path: '/bilder/natur/wiese',
    tags: {
      primary: ['natur', 'wiese', 'alm', 'alpenwiese', 'blumenwiese', 'sommerwiese', 'bauerwiese', 'wildblumen', 'kleeblüte', 'heufern'],
      secondary: ['sommerblume', 'kastanie', 'margerite', 'klee', 'schlaf', 'enkelkorn', 'wiesenblume', 'gentian', 'rose', 'lavendel']
    },
    color: {
      light: 'text-yellow-600',
      dark: 'text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900'
    }
  },
  'tiere': {
    id: 'tiere',
    name: 'Tiere & Wildlife',
    description: 'Begegnungen mit wilden Tieren und Vogelwelt',
    icon: 'Camera',
    emoji: '🦌',
    path: '/bilder/natur/tiere',
    tags: {
      primary: ['natur', 'tiere', 'wildtiere', 'wildlife', 'wildlife', 'vögel', 'birds', 'insekten', 'butterflies', 'schildkröte', 'rehwildtiere', 'wildfotografie'],
      secondary: ['wildschwein', 'rehwildtier', 'storch', 'adler', 'falke', 'eule', 'specht', 'biene', 'hummelnbiene', 'schmetterling', 'libelle', 'vogelbeobachtung']
    },
    color: {
      light: 'text-red-600',
      dark: 'text-red-400',
      bg: 'bg-red-100 dark:bg-red-900'
    }
  }
};

export const NATURE_TAGS = Object.values(NATURE_CATEGORIES).flatMap(category => [
  ...category.tags.primary,
  ...category.tags.secondary
]);

export default NATURE_CATEGORIES;