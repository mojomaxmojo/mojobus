import { DIYCategory } from '@/config/types';

export const DIY_CATEGORIES: Record<string, DIYCategory> = {
  lifepo4: {
    id: 'lifepo4',
    name: 'LiFePo4 Systeme',
    description: 'Batteriesysteme, Solaranlagen und Stromversorgung',
    icon: 'Battery',
    emoji: '🔋',
    path: '/artikel/diy/LiFePo4',
    tags: {
      primary: ['lifepo4', 'diy', 'battery'],
      secondary: ['batterie', 'strom', 'stromversorgung', '12v', '24v', 'bms']
    },
    color: {
      light: 'text-green-600',
      dark: 'text-green-400',
      bg: 'bg-green-100 dark:bg-green-900'
    },
    examples: [
      'LiFePo4 Batterie im Camper installieren',
      'BMS Konfiguration für Anfänger',
      'Solar-Ladecontroller einrichten'
    ]
  },
  solar: {
    id: 'solar',
    name: 'Solaranlagen',
    description: 'Solarpanel-Installationen und Optimierung',
    icon: 'Sun',
    emoji: '☀️',
    path: '/artikel/diy/solar',
    tags: {
      primary: ['solar', 'diy', 'photovoltaik'],
      secondary: ['sonnenenergie', 'panel', 'watt', 'victron', 'mppt']
    },
    color: {
      light: 'text-yellow-600',
      dark: 'text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900'
    },
    examples: [
      'Solaranlage für Camper auslegen',
      'MPPT-Controller einstellen',
      'Panell justierung für maximale Ausbeute'
    ]
  },
  reparatur: {
    id: 'reparatur',
    name: 'Reparaturanleitungen',
    description: 'Fahrzeugwartung und technische Reparaturen',
    icon: 'Wrench',
    emoji: '🔧',
    path: '/artikel/diy/reparatur',
    tags: {
      primary: ['reparatur', 'diy', 'wartung'],
      secondary: ['reparieren', 'werkstatt', 'ölwechsel', 'bremsen', 'motor']
    },
    color: {
      light: 'text-blue-600',
      dark: 'text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900'
    },
    examples: [
      'Sprinter Ölwechsel selbst gemacht',
      'Heizung im Camper reparieren',
      'Gassystem prüfen und warten'
    ]
  },
  ausbau: {
    id: 'ausbau',
    name: 'Ausbau & Umbau',
    description: 'Innenausbau, Möbel und Raumkonzepte',
    icon: 'Hammer',
    emoji: '🛠️',
    path: '/artikel/diy/ausbau',
    tags: {
      primary: ['ausbau', 'diy', 'umbau'],
      secondary: ['innenausbau', 'möbel', 'holz', 'design', 'planung']
    },
    color: {
      light: 'text-purple-600',
      dark: 'text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900'
    },
    examples: [
      'Bett im Camper selbstgebaut',
      'Küchenzeile Planung und Bau',
      'Stauraum clever nutzen'
    ]
  },
  technik: {
    id: 'technik',
    name: 'Technik & Elektronik',
    description: 'Elektronikprojekte und technische Lösungen',
    icon: 'Cpu',
    emoji: '⚙️',
    path: '/artikel/diy/technik',
    tags: {
      primary: ['technik', 'diy', 'elektronik'],
      secondary: ['elektrik', 'verdrahtung', '12v-system', 'led', 'arduino']
    },
    color: {
      light: 'text-red-600',
      dark: 'text-red-400',
      bg: 'bg-red-100 dark:bg-red-900'
    },
    examples: [
      '12V Stromkreis im Camper',
      'LED Beleuchtung installieren',
      'WLAN Repeater für besseres Empfang'
    ]
  }
};

export const DIY_TAGS = Object.values(DIY_CATEGORIES).flatMap(category => [
  ...category.tags.primary,
  ...category.tags.secondary
]);

export default DIY_CATEGORIES;