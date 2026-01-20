// Intelligente Ländererkennung für Nostr-Events
// Basiert auf Geo-Koordinaten, Standort-Tags und Text-Analyse

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  keywords: string[];
  cities: string[];
  coordinates?: {
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
}

export const countries: Record<string, CountryInfo> = {
  portugal: {
    code: 'portugal',
    name: 'Portugal',
    flag: '🇵🇹',
    keywords: ['portugal', 'portugiesisch', 'lisboa', 'lisbon', 'porto', 'algarve', 'faro', 'madeira'],
    cities: ['lisbon', 'lisboa', 'porto', 'faros', 'albufeira', 'funchal'],
    coordinates: {
      bounds: {
        north: 42.0,
        south: 36.9,
        east: -6.1,
        west: -9.6,
      }
    }
  },
  spanien: {
    code: 'spanien',
    name: 'Spanien',
    flag: '🇪🇸',
    keywords: ['spanien', 'spanisch', 'espana', 'barcelona', 'madrid', 'valencia', 'andalusien', 'sevilla'],
    cities: ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'palma', 'bilbao'],
    coordinates: {
      bounds: {
        north: 43.8,
        south: 36.0,
        east: 4.3,
        west: -9.3,
      }
    }
  },
  frankreich: {
    code: 'frankreich',
    name: 'Frankreich',
    flag: '🇫🇷',
    keywords: ['frankreich', 'französisch', 'paris', 'lyon', 'marseille', 'nice', 'bordeaux'],
    cities: ['paris', 'lyon', 'marseille', 'nice', 'bordeaux', 'strasbourg', 'lille'],
    coordinates: {
      bounds: {
        north: 51.1,
        south: 41.3,
        east: 9.6,
        west: -5.1,
      }
    }
  },
  belgien: {
    code: 'belgien',
    name: 'Belgien',
    flag: '🇧🇪',
    keywords: ['belgien', 'belgisch', 'brüssel', 'bruxelles', 'brussels', 'antwerpen', 'antwerp', 'gent', 'ghent'],
    cities: ['brussels', 'bruxelles', 'antwerp', 'antwerpen', 'ghent', 'gent', 'brugge', 'bruges'],
    coordinates: {
      bounds: {
        north: 51.5,
        south: 49.5,
        east: 6.4,
        west: 2.5,
      }
    }
  },
  luxemburg: {
    code: 'luxemburg',
    name: 'Luxemburg',
    flag: '🇱🇺',
    keywords: ['luxemburg', 'luxembourg', 'luxemburgisch'],
    cities: ['luxembourg', 'luxemburg', 'esch-sur-alzette'],
    coordinates: {
      bounds: {
        north: 50.2,
        south: 49.4,
        east: 6.5,
        west: 5.7,
      }
    }
  },
  deutschland: {
    code: 'deutschland',
    name: 'Deutschland',
    flag: '🇩🇪',
    keywords: ['deutschland', 'deutsch', 'germany', 'berlin', 'hamburg', 'münchen', 'munich', 'köln', 'cologne'],
    cities: ['berlin', 'hamburg', 'munich', 'münchen', 'cologne', 'köln', 'frankfurt', 'stuttgart'],
    coordinates: {
      bounds: {
        north: 55.1,
        south: 47.2,
        east: 15.0,
        west: 5.9,
      }
    }
  }
};

// Geo-Koordinaten parsen aus verschiedenen Formaten
function parseCoordinates(content: string, tags: string[][]): { lat: number; lng: number } | null {
  // 1. Aus location Tags
  const locationTag = tags.find(([name]) => name === 'location')?.[1];
  if (locationTag) {
    // Format: "lat,lng" oder "lat lng"
    const coords = locationTag.match(/(-?\d+\.?\d*)[,\s](-?\d+\.?\d*)/);
    if (coords) {
      return { lat: parseFloat(coords[1]), lng: parseFloat(coords[2]) };
    }
  }

  // 2. Aus geo Tags
  const geoTag = tags.find(([name]) => name === 'geo')?.[1];
  if (geoTag) {
    // Format: "lat;lng"
    const parts = geoTag.split(';');
    if (parts.length === 2) {
      return { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
    }
  }

  // 3. Aus Text parsen (einfache Pattern)
  const coordPattern = /(-?\d+\.?\d*)[°\s]+[NSns]\s*,?\s*(-?\d+\.?\d*)[°\s]+[EWew]/i;
  const match = content.match(coordPattern);
  if (match) {
    // TODO: Implementiere NS/EW Umwandlung
  }

  return null;
}

// Prüft ob Koordinaten in einem Land liegen
function isPointInCountry(lat: number, lng: number, country: CountryInfo): boolean {
  if (!country.coordinates) return false;
  
  const { bounds } = country.coordinates;
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

// Textanalyse für Ländererkennung
function detectCountryFromText(text: string): string[] {
  const detectedCountries: string[] = [];
  const lowerText = text.toLowerCase();

  Object.entries(countries).forEach(([code, country]) => {
    // Überprüfe Keywords und Städte
    const allKeywords = [...country.keywords, ...country.cities];
    const hasMatch = allKeywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );

    if (hasMatch) {
      detectedCountries.push(code);
    }
  });

  return detectedCountries;
}

// Hauptfunktion: Ländererkennung für ein Nostr-Event
export function detectCountries(event: any): string[] {
  const detectedCountries = new Set<string>();

  // 1. Tag-basierte Erkennung (höchste Priorität)
  const tags = event.tags || [];
  tags.forEach(([tagName, value]) => {
    if (tagName === 't' || tagName === 'location') {
      const tagValue = value?.toLowerCase();
      if (tagValue) {
        Object.entries(countries).forEach(([code, country]) => {
          if (tagValue.includes(country.name.toLowerCase()) ||
              tagValue.includes(code) ||
              country.keywords.some(keyword => tagValue.includes(keyword.toLowerCase()))) {
            detectedCountries.add(code);
          }
        });
      }
    }
  });

  // 2. Geo-Koordinaten-basierte Erkennung
  const coords = parseCoordinates(event.content || '', tags);
  if (coords) {
    Object.entries(countries).forEach(([code, country]) => {
      if (isPointInCountry(coords.lat, coords.lng, country)) {
        detectedCountries.add(code);
      }
    });
  }

  // 3. Text-basierte Erkennung (Fallback)
  const textCountries = detectCountryFromText(event.content || '');
  textCountries.forEach(code => detectedCountries.add(code));

  return Array.from(detectedCountries);
}

// Helper-Funktion: Format für Display
export function formatCountryName(code: string): string {
  return countries[code]?.name || code;
}

export function formatCountryFlag(code: string): string {
  return countries[code]?.flag || '🏳️';
}

// Verbesserte Filter-Funktion für Events
export function filterEventsByCountry(events: any[], countryCode?: string): any[] {
  if (!countryCode) return events;
  
  return events.filter(event => 
    detectCountries(event).includes(countryCode)
  );
}

// Event-Tags mit Länderinformationen anreichern
export function enrichEventWithCountries(event: any): any & { countries: string[] } {
  return {
    ...event,
    countries: detectCountries(event)
  };
}