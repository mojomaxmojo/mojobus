/**
 * Lifestyle-Konfigurationen für Foster Huntington Stil
 * 
 * Jeder Lifestyle behält den authentischen Foster Huntington Schreibstil:
 * - Ehrlich und ungeschönt
 * - Persönlich und direkt
 * - Keine perfekten Instagram-Beschreibungen
 */

export type LifestyleType = 'vanlife' | 'rvlife' | 'beachlife' | 'wohnmobil' | 'perpetual-travelers'

export interface LifestyleConfig {
  vehicle: string
  community: string
  keywords: string[]
  example1: string
  example2: string
  example3: string
}

export const lifestyles: Record<LifestyleType, LifestyleConfig> = {
  vanlife: {
    vehicle: 'Van',
    community: 'Vanlife-Community',
    keywords: ['vanlife', 'van', 'aufRädern'],
    example1: 'Du wachst morgens auf und der Van riecht nach letzter Nacht. Nicht glamourös, aber echt. Genau das macht Vanlife aus. Kennst du das Gefühl?',
    example2: 'Parkst du auch immer am Arsch der Welt? Wo niemand hinfährt? Das sind die besten Plätze. Kein Wifi, aber echte Ruhe.',
    example3: 'Man sagt immer "Freiheit", aber gestern musste ich 2 Stunden nach Wasser suchen. Trotzdem würde ich es nicht anders wollen.'
  },

  rvlife: {
    vehicle: 'RV',
    community: 'RVlife-Community',
    keywords: ['rvlife', 'rv', 'recreationalVehicle'],
    example1: 'Du wachst im RV und draußen ist es stürmisch. Das Wohnmobil wackelt, aber du bist dankbar für vier Wände auf Rädern. RVlife, Baby.',
    example2: 'Mit dem RV durch die Pampa - kein Campground weit und breit. Einfach am Straßenrand geparkt. Die besten Nächte sind die ungeplanten.',
    example3: 'Leute denken, RVlife ist nur Urlaub. Aber nach 6 Monaten on the road weißt du: Es ist ein komplettes Leben. Mit allen Höhen und Tiefen.'
  },

  beachlife: {
    vehicle: 'Strand',
    community: 'Beachlife-Community',
    keywords: ['beachlife', 'beach', 'strand', 'ocean', 'surf'],
    example1: 'Du wachst auf und hörst die Wellen. Sand überall - im Van, im Bett, im Essen. Aber genau das macht Beachlife aus. Kennst du das Gefühl?',
    example2: 'Morgens surfen, abends Lagerfeuer am Strand. Kein fester Plan, nur die Gezeiten bestimmen deinen Tag. Das ist echte Freiheit.',
    example3: 'Leute denken Beachlife ist nur Urlaub. Aber nach Wochen am Strand weißt du: Es ist ein Lebensgefühl. Salz in der Luft und Sand unter den Füßen.'
  },

  wohnmobil: {
    vehicle: 'Wohnmobil',
    community: 'Wohnmobil-Community',
    keywords: ['wohnmobil', 'camper', 'mobil'],
    example1: 'Du wachst im Wohnmobil auf, Regen prasselt aufs Dach. Gemütlich, aber du musst tanken. Willkommen im echten Wohnmobil-Leben.',
    example2: 'Stellplätze in Deutschland? Entweder voll oder teuer. Aber manchmal findest du diesen einen perfekten Spot direkt am See.',
    example3: 'Wohnmobil bedeutet nicht immer Luxus. Es bedeutet Freiheit mit praktischen Herausforderungen. Und das ist genau richtig so.'
  },

  'perpetual-travelers': {
    vehicle: 'Reise',
    community: 'Perpetual Travelers Community',
    keywords: ['perpetualTravelers', 'permanentReisend', 'ortlos'],
    example1: 'Du weißt nicht mehr, welcher Tag es ist. Oder welcher Monat. Perpetual Traveler zu sein bedeutet, die Zeit zu vergessen.',
    example2: 'Heute hier, morgen dort. Kein fester Wohnsitz, nur dein Rucksack und die nächste Destination. Das ist dein Zuhause.',
    example3: 'Leute fragen: "Wo lebst du?" Du antwortest: "Überall und nirgendwo." Perpetual Travel ist kein Urlaub, es ist eine Lebensphilosophie.'
  }
}

/**
 * Foster Huntington Basis-Stil (für alle Lifestyles gleich)
 */
export const fosterHuntingtonStyle = {
  principles: [
    'Ehrlich und ungeschönt (zeige die Realität, nicht Instagram)',
    'Persönlich und konversationell (wie ein Gespräch mit einem alten Freund)',
    'Direkt und relatable (verwende "Du", "Ich", keine perfekten Sätze)',
    'Minimalistisch (kurze Sätze, echte Emotionen)'
  ],

  avoid: [
    '"Der wunderschöne Sonnenaufgang tauchte die Landschaft in goldenes Licht"',
    '"In diesem Artikel zeige ich dir..."',
    '"Als [Lifestyle]-Reisender musst du unbedingt..."',
    'Perfekte, polierte Sätze'
  ],

  writingStyle: [
    'Verwende Kontraktionen: du bist → du bist, ich habe → ich hab',
    'Kurze Sätze mischen mit längeren',
    'Rhetorische Fragen: "Kennst du das?"',
    'Selbstironie und Humor',
    'Direkte Ansprache: "Du", "Ich" statt "Man"'
  ]
}

/**
 * Hilfsfunktion: Lifestyle-Konfiguration abrufen
 */
export const getLifestyleConfig = (lifestyle: LifestyleType = 'vanlife'): LifestyleConfig => {
  return lifestyles[lifestyle] || lifestyles.vanlife
}
