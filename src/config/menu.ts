// Hauptmenü-Konfiguration für MojoBus
// Strukturierte Menüdaten für Header und Navigation

export const MAIN_MENU = {
  // Länder-Konfiguration
  countries: {
    portugal: { code: 'portugal', name: 'Portugal', flag: '🇵🇹' },
    spanien: { code: 'spanien', name: 'Spanien', flag: '🇪🇸' },
    frankreich: { code: 'frankreich', name: 'Frankreich', flag: '🇫🇷' },
    belgien: { code: 'belgien', name: 'Belgien', flag: '🇧🇪' },
    luxemburg: { code: 'luxemburg', name: 'Luxemburg', flag: '🇱🇺' },
    deutschland: { code: 'deutschland', name: 'Deutschland', flag: '🇩🇪' }
  },

  // DIY Kategorien
  diy: {
    all: { id: 'all', name: 'Alle DIY-Anleitungen', emoji: '🛠️' },
    lifepo4: { id: 'lifepo4', name: 'LiFePo4 Systeme', emoji: '🔋' },
    solar: { id: 'solar', name: 'Solaranlagen', emoji: '☀️' },
    reparatur: { id: 'reparatur', name: 'Reparaturanleitungen', emoji: '🔧' },
    ausbau: { id: 'ausbau', name: 'Ausbau & Umbau', emoji: '🛠️' },
    technik: { id: 'technik', name: 'Technik & Elektronik', emoji: '⚙️' }
  },



  // Natur Kategorien für Bilder
  nature: {
    tiere: {
      id: 'tiere',
      name: 'Tiere',
      emoji: '🦁',
      tags: {
        primary: ['natur', 'tiere', 'wildtiere', 'wildlife', 'vögel', 'birds', 'insekten', 'butterflies', 'schmetterlinge', 'rehwildtiere', 'wildfotografie'],
        secondary: ['wildschwein', 'rehwildtier', 'storch', 'adler', 'falke', 'eule', 'bienen', 'hummelnbien', 'schmetterling', 'libelle', 'vogelbeobachtung']
      }
    },
    blumen: {
      id: 'blumen',
      name: 'Blumen',
      emoji: '🌻',
      tags: {
        primary: ['natur', 'wiesen', 'alpenwiesen', 'blumenwiesen', 'sommerblumen', 'wildblumen', 'blüten'],
        secondary: ['sommerblume', 'kastanie', 'margarite', 'klee', 'schlafblume', 'rose', 'lavendel', 'wiesenblume', 'gentian', 'enkelkorn']
      }
    },
    beach: {
      id: 'strand',
      name: 'Strand/Beach',
      emoji: '🏖️',
      tags: {
        primary: ['natur', 'strand', 'meer', 'küste'],
        secondary: ['sandstrand', 'wellness', 'sonnenuntergang', 'surfen', 'strandwanderung', 'felsen', 'insel', 'buchten', 'hafen', 'strandabschluss']
      }
    },
    berge: {
      id: 'berge',
      name: 'Berge',
      emoji: '⛰️',
      tags: {
        primary: ['natur', 'berge', 'wanderung', 'gipfel', 'alpen'],
        secondary: ['hochgebirge', 'gipfelwanderung', 'alpenpanorama', 'wanderwege', 'felsschutz', 'gipfelrestaurant', 'alpenblühen', 'bergsee', 'kulisse', 'massiv']
      }
    },
    wald: {
      id: 'wald',
      name: 'Wald',
      emoji: '🌲',
      tags: {
        primary: ['natur', 'wald', 'bäume', 'forst', 'baimgipfel', 'naturschutz', 'waldweg', 'wildnis', 'naturpark', 'jagd', 'pilze'],
        secondary: ['laub', 'moos', 'farn', 'holzwurzel', 'buche', 'tannen', 'eichenbaum', 'waldstrand', 'naturbadestellen', 'wildblumen', 'pilze']
      }
    },
    meer: {
      id: 'meer',
      name: 'Meer/Ocean',
      emoji: '🌊',
      tags: {
        primary: ['natur', 'meer', 'ocean', 'panorama', 'aussichtspunkt', 'sunset', 'sonnenuntergang', 'sonnenaufgang', 'wetter', 'luft', 'horizont', 'wolken'],
        secondary: ['panoramapunkt', 'auslugspunkt', 'wettererscheinung', 'nachthimmel', 'wolkenformation', 'lichtstrahl', 'regenbogen', 'farbe', 'sonnenstrahl']
      }
    }
  }
};

export default MAIN_MENU;