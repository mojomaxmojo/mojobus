# Leaflet Implementierung: Mojobusco Optimierung

## ✅ Was von Mojotravel übernommen werden sollte

### 1. Vite Config Korrektur
**Datei:** `vite.config.ts`

**Aktuell (falsch):**
```js
optimizeDeps: {
  include: ['leaflet', ...],
  exclude: [
    '@react-leaflet/core',
    'react-leaflet',
  ],
  force: true,
},
```

**Geändert zu (korrekt):**
```js
optimizeDeps: {
  include: [
    'react',
    'react-dom',
    'nostr-tools',
    'buffer',
    '@nostrify/react',
    '@nostrify/nostrify',
    'dijkstrajs',
    'leaflet',
    'react-leaflet',
    '@react-leaflet/core',
    'ngeohash',
  ],
  force: true,
},
```

**Warum?**
- Das `exclude` von react-leaflet verhindert die Voraussetzungsberechnung (pre-bundling)
- Das führt zu Build-Fehlern und Problemen beim Tree-Shaking
- Mojotravel hat keine exclude-Einträge und funktioniert einwandfrei

---

### 2. Globaler CSS Import
**Datei:** `src/index.css`

**Am Anfang hinzufügen:**
```css
/* Leaflet CSS */
@import 'leaflet/dist/leaflet.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Und am Ende Leaflet-spezifische Styles hinzufügen:**
```css
/* Leaflet Popup Styling */
.leaflet-popup-content-wrapper {
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.leaflet-popup-content {
  margin: 0;
  padding: 0;
}

.leaflet-popup-tip {
  background: white;
}

/* Leaflet Controls */
.leaflet-control-zoom {
  border: none !important;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  border-radius: 8px !important;
  overflow: hidden;
}

.leaflet-control-zoom a {
  border: none !important;
  border-radius: 0 !important;
  color: #374151 !important;
  font-weight: 600;
  transition: all 0.2s;
}

.leaflet-control-zoom a:hover {
  background: #f3f4f6 !important;
  color: #111827 !important;
}

.leaflet-control-zoom a:first-child {
  border-bottom: 1px solid #e5e7eb !important;
}

/* Leaflet Container */
.leaflet-container {
  background: #e0f2fe;
  font-family: inherit;
}
```

**Warum?**
- Globaler Import statt pro-Komponente Import
- Konsistentes Styling über alle Maps hinweg
- Vermeidet doppelte CSS-Imports
- Bessere Performance durch Bündelung

---

### 3. Custom Marker Icons
**Neue Datei:** `src/lib/mapIcons.ts`

```typescript
import L from 'leaflet';

// Custom SVG marker as data URL with shadow (blue marker with star)
const mainMarkerSvg = `data:image/svg+xml;base64,${btoa(`<?xml version="1.0" encoding="UTF-8"?>
<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76.12 113.81">
  <defs>
    <style>
      .cls-1 {
        fill: #fc0;
      }
      .cls-2 {
        fill: #fff;
      }
      .cls-3 {
        fill: #27b0ff;
      }
    </style>
  </defs>
  <circle class="cls-2" cx="36.31" cy="49.53" r="19.75"/>
  <path class="cls-3" d="M36.31,13.09C15.67,13.09,0,31.41,0,50.14c0,14.93,36.31,63.67,36.31,63.67,0,0,36.3-48.74,36.3-63.67,0-18.72-15.67-37.04-36.3-37.04ZM36.31,66.6c-9.19,0-16.64-7.45-16.64-16.64s7.45-16.64,16.64-16.64,16.64,7.45,16.64,16.64-7.45,16.64-16.64,16.64Z"/>
  <path class="cls-1" d="M57.95,26.65l11.24,8.18-4.3-13.2,11.24-8h-13.78L57.95,0l-4.39,13.63h-13.78l11.24,8-4.3,13.2,11.24-8.18Z"/>
</svg>`)}`;

// Main marker icon using custom SVG (blue with yellow star)
export const mainMarkerIcon = L.icon({
  iconUrl: mainMarkerSvg,
  iconSize: [42, 62],
  iconAnchor: [21, 62],
  popupAnchor: [0, -62],
  shadowUrl: undefined,
  shadowSize: undefined,
  shadowAnchor: undefined,
});

// Create custom div icon with emoji
export const createCustomIcon = (options?: {
  color?: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
}) => {
  const color = options?.color || '#f59e0b';
  const icon = options?.icon || '📍';
  const sizeClass = options?.size || 'medium';

  const sizeMap = {
    small: 'w-8 h-8 text-xl',
    medium: 'w-10 h-10 text-2xl',
    large: 'w-12 h-12 text-3xl',
  };

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center ${sizeMap[sizeClass]}" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <svg class="absolute w-full h-full" viewBox="0 0 24 36" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.6-5.4-12-12-12z"/>
        </svg>
        <span class="relative z-10 -mt-2" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">${icon}</span>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Predefined icon types
export const markerIcons = {
  default: createCustomIcon({ color: '#f59e0b', icon: '📍' }),
  photo: createCustomIcon({ color: '#3b82f6', icon: '📷' }),
  location: createCustomIcon({ color: '#10b981', icon: '📍' }),
  food: createCustomIcon({ color: '#ef4444', icon: '🍽️' }),
  hotel: createCustomIcon({ color: '#8b5cf6', icon: '🏨' }),
  activity: createCustomIcon({ color: '#f59e0b', icon: '🎯' }),
  shop: createCustomIcon({ color: '#ec4899', icon: '🛍️' }),
  nature: createCustomIcon({ color: '#059669', icon: '🌲' }),
  culture: createCustomIcon({ color: '#7c3aed', icon: '🏛️' }),
  selected: mainMarkerIcon,
};

// Get icon based on category
export const getIconByCategory = (category?: string): L.DivIcon | L.Icon => {
  if (!category) return markerIcons.default;

  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('photo') || categoryLower.includes('image')) {
    return markerIcons.photo;
  }
  if (categoryLower.includes('food') || categoryLower.includes('restaurant') || categoryLower.includes('cafe')) {
    return markerIcons.food;
  }
  if (categoryLower.includes('hotel') || categoryLower.includes('accommodation')) {
    return markerIcons.hotel;
  }
  if (categoryLower.includes('shop') || categoryLower.includes('store')) {
    return markerIcons.shop;
  }
  if (categoryLower.includes('nature') || categoryLower.includes('park') || categoryLower.includes('outdoor')) {
    return markerIcons.nature;
  }
  if (categoryLower.includes('culture') || categoryLower.includes('museum') || categoryLower.includes('historical')) {
    return markerIcons.culture;
  }
  if (categoryLower.includes('activity') || categoryLower.includes('entertainment')) {
    return markerIcons.activity;
  }

  return markerIcons.location;
};
```

---

### 4. Map Tile Layer Configuration
**Neue Datei:** `src/lib/mapConfig.ts`

```typescript
// Map tile layer configurations - colorful style

export const getTileLayerConfig = (provider: 'openstreetmap' | 'satellite' = 'openstreetmap') => {
  switch (provider) {
    case 'openstreetmap':
      return {
        // Using Carto Voyager - colorful with greens and blues
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      };
    case 'satellite':
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
        maxZoom: 19,
      };
    default:
      return {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      };
  }
};
```

---

### 5. LocationPicker Komponente Aktualisierung
**Datei:** `src/components/LocationPicker.tsx`

**Änderungen:**
1. Entferne den CSS-Import (Zeile 11): `import 'leaflet/dist/leaflet.css';`
2. Entferne den Fix für Default Icons (Zeilen 13-19)
3. Füge Imports für Icons hinzu:
   ```tsx
   import { markerIcons } from '@/lib/mapIcons';
   import { getTileLayerConfig } from '@/lib/mapConfig';
   ```

**Marker Komponente aktualisieren:**
```tsx
<Marker
  position={position}
  draggable={true}
  icon={markerIcons.selected}
  eventHandlers={{
    dragend: (e) => {
      const marker = e.target;
      const { lat, lng } = marker.getLatLng();
      setPosition([lat, lng]);
    },
  }}
/>
```

**TileLayer aktualisieren:**
```tsx
{(() => {
  const config = getTileLayerConfig('openstreetmap');
  return (
    <TileLayer
      url={config.url}
      attribution={config.attribution}
      maxZoom={config.maxZoom}
    />
  );
})()}
```

---

## 📋 Zusammenfassung der Schritte

1. ✅ **Vite Config korrigieren** - react-leaflet aus exclude entfernen
2. ✅ **Leaflet CSS global importieren** - in index.css statt in Komponente
3. ✅ **Custom Icons erstellen** - mapIcons.ts von Mojotravel kopieren
4. ✅ **Map Config erstellen** - mapConfig.ts von Mojotravel kopieren
5. ✅ **LocationPicker aktualisieren** - Custom Icons verwenden, CSS-Import entfernen
6. ✅ **Leaflet Styles hinzufügen** - Popup und Control Styling in index.css

---

## 🎯 Vorteile dieser Lösung

1. **Build-Fehler behoben** - react-leaflet wird korrekt vorausgesetzt und optimiert
2. **Bessere Performance** - CSS wird nur einmal importiert
3. **Schönere Icons** - Custom SVG statt Standard Marker
4. **Konsistentes Styling** - Alle Maps sehen gleich aus
5. **Wartbarkeit** - Icons und Configs sind zentralisiert

---

## 🔍 Unterschiede zu Mojotravel

- Mojotravel hat auch `react-leaflet-cluster` - für Clustered Markers (optional)
- Mojotravel hat mehr Icon-Typen - kann nach Bedarf erweitert werden
- Mojotravel hat einen MapProvider Hook - für Provider-Auswahl (optional)
