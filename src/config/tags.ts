import { TagGroup } from '@/config/types';

export const TAG_GROUPS: TagGroup[] = [
  {
    name: 'Länder',
    description: 'Geografische Tags für Länder und Regionen',
    tags: [
      { id: 'portugal', label: 'Portugal', icon: '🇵🇹' },
      { id: 'spanien', label: 'Spanien', icon: '🇪🇸' },
      { id: 'italien', label: 'Italien', icon: '🇮🇹' },
      { id: 'frankreich', label: 'Frankreich', icon: '🇫🇷' },
      { id: 'deutschland', label: 'Deutschland', icon: '🇩🇪' },
      { id: 'kroatien', label: 'Kroatien', icon: '🇭🇷' },
      { id: 'griechenland', label: 'Griechenland', icon: '🇬🇷' },
      { id: 'belgien', label: 'Belgien', icon: '🇧🇪' },
      { id: 'luxemburg', label: 'Luxemburg', icon: '🇱🇺' }
    ]
  },
  {
    name: 'Vanlife',
    description: 'Vanlife-spezifische Tags',
    tags: [
      { id: 'camping', label: 'Camping', icon: '🏕️' },
      { id: 'wildcamping', label: 'Wildcamping', icon: '🌲' },
      { id: 'stellplatz', label: 'Stellplatz', icon: '🅿️' },
      { id: '4x4', label: '4x4', icon: '🚙' },
      { id: 'digital-nomade', label: 'Digital Nomade', icon: '💻' },
      { id: 'vanlife', label: 'Vanlife', icon: '🚐' },
      { id: 'wohnmobil', label: 'Wohnmobil', icon: '🏠' },
      { id: 'zelt', label: 'Zelt', icon: '⛺' }
    ]
  },
  {
    name: 'Technik',
    description: 'Technische und solar-bezogene Tags',
    tags: [
      { id: 'solarenergie', label: 'Solarenergie', icon: '☀️' },
      { id: 'batterie', label: 'Batterie', icon: '🔋' },
      { id: 'strom', label: 'Strom', icon: '⚡' },
      { id: 'internet', label: 'Internet', icon: '📡' },
      { id: 'navigation', label: 'Navigation', icon: '🗺️' },
      { id: 'reparatur', label: 'Reparatur', icon: '🔧' },
      { id: 'elektronik', label: 'Elektronik', icon: '📱' },
      { id: '12v', label: '12V System', icon: '🔌' }
    ]
  },
  {
    name: 'Lifestyle',
    description: 'Lifestyle und persönliche Tags',
    tags: [
      { id: 'kochen', label: 'Kochen', icon: '🍳' },
      { id: 'fitness', label: 'Fitness', icon: '💪' },
      { id: 'freedom', label: 'Freedom', icon: '🕊️' },
      { id: 'community', label: 'Community', icon: '👥' },
      { id: 'bitcoin', label: 'Bitcoin', icon: '₿' },
      { id: 'minimalismus', label: 'Minimalismus', icon: '🧘' },
      { id: 'sunset', label: 'Sunset', icon: '🌅' },
      { id: 'beachlife', label: 'Beachlife', icon: '🏖️' }
    ]
  },
  {
    name: 'Natur & Umwelt',
    description: 'Natur- und umweltbezogene Tags',
    tags: [
      { id: 'strand', label: 'Strand', icon: '🏖️' },
      { id: 'ocean', label: 'Ocean', icon: '🌊' },
      { id: 'berg', label: 'Berg', icon: '⛰️' },
      { id: 'natur', label: 'Natur', icon: '🌲' },
      { id: 'offgrid', label: 'Offgrid', icon: '🏡' },
      { id: 'wildnis', label: 'Wildnis', icon: '🌿' },
      { id: 'meer', label: 'Meer', icon: '🌊' },
      { id: 'kueste', label: 'Küste', icon: '🏖️' }
    ]
  },
  {
    name: 'Aktivitäten',
    description: 'Aktivitäten und Hobbys',
    tags: [
      { id: 'wandern', label: 'Wandern', icon: '🥾' },
      { id: 'surfen', label: 'Surfen', icon: '🏄' },
      { id: 'radfahren', label: 'Radfahren', icon: '🚴' },
      { id: 'klettern', label: 'Klettern', icon: '🧗' },
      { id: 'fotografie', label: 'Fotografie', icon: '📷' },
      { id: 'lesen', label: 'Lesen', icon: '📚' },
      { id: 'musik', label: 'Musik', icon: '🎵' },
      { id: 'yoga', label: 'Yoga', icon: '🧘' }
    ]
  },
  {
    name: 'Pets',
    description: 'Haustiere und Begleiter',
    tags: [
      { id: 'leon', label: 'Leon', icon: '🦁' },
      { id: 'hund', label: 'Hund', icon: '🐕' },
      { id: 'hund', label: 'Hunde', icon: '🐕‍🦺' },
      { id: 'camper-hund', label: 'Camper Hund', icon: '🚐' },
      { id: 'vanlife-hund', label: 'Vanlife Hund', icon: '🏕️' },
      { id: 'reise-hund', label: 'Reisehund', icon: '🗺️' },
      { id: 'abenteuer', label: 'Abenteuer', icon: '⛰️' },
      { id: 'tierfreundlich', label: 'Tierfreundlich', icon: '🏨' }
    ]
  }
];

export const ALL_TAGS = TAG_GROUPS.flatMap(group => group.tags);

export default TAG_GROUPS;