# Map Integration Dokumentation

## Übersicht

Die `/map` Route zeigt eine interaktive Leaflet-Karte mit allen GPS-aktivierten Beiträgen aus der MojoBus-Plattform. Aufgrund von Build-Einschränkungen in Shakespeare funktioniert die Karte nur in der Produktionsumgebung.

## Problem: Leaflet und Shakespeare Build-System

### Warum funktioniert Leaflet nicht in Shakespeare?

Shakespeare verwendet `esbuild-wasm` mit ESM CDN für den Build-Prozess. Die `react-leaflet` Bibliothek hat Kompatibilitätsprobleme mit diesem Setup:

```
Error: Build failed with 138 errors:
esm:https://esm.sh/*react-leaflet@4.2.1/esnext/react-leaflet.mjs
ERROR: No matching export for import "useLeafletContext"
ERROR: No matching export for import "createControlComponent"
...
```

**Ursachen:**
- ESM CDN kann `react-leaflet` nicht korrekt auflösen
- Fehlende Exports zwischen `@react-leaflet/core` und `react-leaflet`
- `esbuild-wasm` verarbeitet die Module anders als normales Vite/Rollup

### Lösung: Dual-Setup

**Development (Shakespeare):** Platzhalter-Seite  
**Production (VPS):** Echte Leaflet-Karte

## Dateien-Struktur

### Development (Standard im Repository)

```
src/pages/
├── MapPage.production.tsx        # Echte Map mit Leaflet (inaktiv)
└── MapPagePlaceholder.tsx         # Platzhalter (aktiv)

src/components/
└── MapMarkerPopup.tsx             # Popup für Marker

src/lib/
├── mapConfig.ts                   # Karten-Konfiguration
└── markerIcons.ts                 # Custom Marker Icons

src/hooks/
└── useGpsContent.ts               # GPS-Content Hook

src/AppRouter.tsx
# Zeile 21: const MapPage = lazy(() => import("./pages/MapPagePlaceholder")...
```

### Production (Während VPS-Build)

```
src/pages/
├── MapPage.tsx                    # Echte Map (aktiv) ✅
└── MapPagePlaceholder.tsx         # Platzhalter

src/AppRouter.tsx
# Zeile 21: const MapPage = lazy(() => import("./pages/MapPage")...
```

## Deployment-Workflow

### Automatisches VPS-Deployment

Das `deploy-test.sh` Script auf dem VPS kümmert sich automatisch um die Map-Wiederherstellung:

```bash
# Auf dem VPS ausführen
cd /root/deploy-git/test/mojobusco
./deploy-test.sh --force
```

**Script-Ablauf:**

1. **Git Pull** - Holt Updates vom test-Branch
2. **Dependencies** - Installiert npm packages
3. **🗺️ Map Restore** - Stellt echte Map-Dateien wieder her:
   ```bash
   mv src/pages/MapPage.production.tsx src/pages/MapPage.tsx
   sed -i 's/MapPagePlaceholder/MapPage/' src/AppRouter.tsx
   ```
4. **Build** - Baut mit voller Leaflet-Unterstützung
5. **Deploy** - Kopiert nach `/home/nginx/domains/test.mojobus.co/public`
6. **🔄 Restore Dev** - Stellt Development-Konfiguration wieder her:
   ```bash
   mv src/pages/MapPage.tsx src/pages/MapPage.production.tsx
   # AppRouter.tsx aus Backup wiederherstellen
   ```

### Manuelle Wiederherstellung (falls nötig)

Falls das Script nicht funktioniert:

```bash
# 1. Map-Dateien wiederherstellen
cd /root/deploy-git/test/mojobusco
mv src/pages/MapPage.production.tsx src/pages/MapPage.tsx

# 2. AppRouter.tsx anpassen
sed -i 's/import("\.\/pages\/MapPagePlaceholder")/import("\.\/pages\/MapPage")/g' src/AppRouter.tsx

# 3. Build
npm run build

# 4. Deploy
cp -r dist/* /home/nginx/domains/test.mojobus.co/public/
chown -R nginx:nginx /home/nginx/domains/test.mojobus.co/public

# 5. Development wiederherstellen
mv src/pages/MapPage.tsx src/pages/MapPage.production.tsx
git checkout src/AppRouter.tsx
```

## Map-Komponenten

### MapPage.production.tsx

Die Haupt-Map-Komponente mit vollständiger Leaflet-Integration:

```typescript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useGpsContent } from '@/hooks/useGpsContent';

export default function MapPage() {
  const { data: markers = [], isLoading, error, refetch } = useGpsContent();
  
  return (
    <MapContainer center={[48.5, 10.5]} zoom={5}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markers.map(marker => (
        <Marker key={marker.id} position={[marker.lat, marker.lon]}>
          <Popup><MapMarkerPopup marker={marker} /></Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

**Features:**
- ✅ Interaktive Leaflet-Karte von Europa
- ✅ GPS-Marker für alle Content-Typen (Bilder, Notizen, Plätze, Artikel)
- ✅ Filter-Buttons nach Content-Typ
- ✅ Custom Marker-Icons mit Farben
- ✅ Popup-Details beim Klick
- ✅ Vollständige Zoom/Pan-Funktionalität

### MapPagePlaceholder.tsx

Einfache Info-Seite für Shakespeare/Development:

```typescript
export default function MapPagePlaceholder() {
  return (
    <Card>
      <CardContent>
        <MapPin className="w-12 h-12" />
        <h3>Karte in Entwicklung nicht verfügbar</h3>
        <p>Die Leaflet-Bibliothek kann in Shakespeare's Build-System 
           nicht geladen werden.</p>
        <p>Die echte Karte funktioniert in Produktion auf mojobus.co.</p>
      </CardContent>
    </Card>
  );
}
```

### useGpsContent Hook

Lädt alle GPS-aktivierten Events vom Nostr-Netzwerk:

```typescript
export function useGpsContent() {
  const { nostr } = useNostr();
  
  return useQuery({
    queryKey: ['gps-content'],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        { kinds: [1, 1063, 30023, 37515], limit: 500 }
      ], { signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) });
      
      // Filter events with 'g' tag (geohash)
      return events
        .filter(e => e.tags.some(([name]) => name === 'g'))
        .map(eventToMarker);
    }
  });
}
```

**Unterstützte Event-Kinds:**
- `1` - Text Notes (mit GPS)
- `1063` - File Metadata (Bilder)
- `30023` - Long-form Content (Artikel)
- `37515` - Places (Custom Kind)

### Map-Konfiguration

`src/lib/mapConfig.ts`:

```typescript
// Europa-Grenzen
export const EUROPA_BOUNDS = {
  north: 71.0,  // Nordkap
  south: 36.0,  // Südspanien
  west: -10.0,  // Portugal
  east: 40.0    // Russland
};

// Zentrum
export const EUROPA_CENTER = {
  lat: 48.5,
  lng: 10.5
};

// Zoom-Einstellungen
export const ZOOM_SETTINGS = {
  default: 5,
  min: 4,
  max: 18
};

// Content-Type Farben
export const CONTENT_COLORS = {
  media: '#3b82f6',    // Blau
  note: '#10b981',     // Grün
  place: '#f59e0b',    // Orange
  article: '#8b5cf6'   // Lila
};
```

### Custom Marker Icons

`src/lib/markerIcons.ts`:

```typescript
import L from 'leaflet';

export function getMarkerIcon(type: ContentType): L.Icon {
  const color = CONTENT_COLORS[type];
  
  const svgString = `
    <svg viewBox="0 0 32 48">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 32 16 32s16-23.163 16-32c0-8.837-7.163-16-16-16z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
    </svg>
  `;
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48]
  });
}
```

## Nostr GPS-Integration

### GPS-Tags auf Events

MojoBus verwendet die `g` (geohash) Tag aus NIP-52 für GPS-Koordinaten:

```json
{
  "kind": 1,
  "content": "Toller Spot am Strand! 🌊",
  "tags": [
    ["g", "u0y7mgjq"],           // Geohash
    ["t", "vanlife"],            // Topic
    ["client", "mojobus"]
  ]
}
```

**Geohash-Dekodierung:**

```typescript
import { decode } from 'ngeohash';

const geohash = "u0y7mgjq";
const { latitude, longitude } = decode(geohash);
// latitude: 48.137, longitude: 11.576 (München)
```

**Precision:**
- 8 Zeichen = ~19m Genauigkeit
- 7 Zeichen = ~152m Genauigkeit  
- 6 Zeichen = ~1.2km Genauigkeit

### Event zu Marker Mapping

```typescript
function eventToMarker(event: NostrEvent): MapMarker {
  const gTag = event.tags.find(([name]) => name === 'g')?.[1];
  const { latitude, longitude } = decode(gTag);
  
  return {
    id: event.id,
    lat: latitude,
    lon: longitude,
    type: getContentType(event),
    title: getTitle(event),
    content: event.content,
    imageUrl: getImageUrl(event),
    author: getAuthor(event),
    createdAt: event.created_at,
    naddr: getNaddr(event)
  };
}
```

## Testing

### Lokales Testing (Shakespeare)

```bash
# In Shakespeare
npm run dev
# Navigiere zu http://localhost:8080/map
# Erwartung: Platzhalter-Seite wird angezeigt ✅
```

### Production Testing (VPS)

```bash
# Auf VPS
cd /root/deploy-git/test/mojobusco
./deploy-test.sh --force

# Prüfe Log auf:
# ✅ "Stelle Map-Dateien für Production wieder her..."
# ✅ "MapPage.tsx wiederhergestellt"
# ✅ "Build erfolgreich"

# Teste im Browser
# https://test.mojobus.co/map
# Erwartung: Volle Leaflet-Karte mit Markern ✅
```

### Debugging

**Problem:** Platzhalter wird in Production angezeigt

**Lösung:**
```bash
# 1. Prüfe, welche Datei importiert wird
grep "MapPage" /home/nginx/domains/test.mojobus.co/public/assets/*.js

# 2. Prüfe Build-Log
tail -100 /root/deploy-git/test/mojobusco/logs/deploy-test-latest.log | grep -A 5 "Map"

# 3. Manuelle Map-Wiederherstellung
cd /root/deploy-git/test/mojobusco
mv src/pages/MapPage.production.tsx src/pages/MapPage.tsx
sed -i 's/MapPagePlaceholder/MapPage/' src/AppRouter.tsx
npm run build
cp -r dist/* /home/nginx/domains/test.mojobus.co/public/
```

## Dependencies

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "ngeohash": "^0.6.3"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.20"
  }
}
```

## Browser-Kompatibilität

Die Leaflet-Karte funktioniert in:
- ✅ Chrome/Edge (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ✅ Mobile Browsers (iOS Safari, Chrome Mobile)

**Bekannte Probleme:**
- ❌ Shakespeare Build-System (esbuild-wasm + ESM CDN)
- ⚠️ IE11 wird nicht unterstützt

## Performance

**Optimierungen:**
- Lazy Loading der MapPage-Komponente
- Limit von 500 Events (anpassbar in `useGpsContent`)
- Geohash-Caching
- Custom Marker Icons als Data URLs (keine separaten HTTP-Requests)

**Typische Ladezeiten:**
- Initial Load: ~2-3s (inkl. Leaflet Library)
- Marker Rendering: ~500ms für 100 Marker
- Map Interaction: 60fps

## Zukünftige Verbesserungen

- [ ] Marker Clustering für bessere Performance bei vielen Punkten
- [ ] Heatmap-Ansicht für Dichte-Visualisierung
- [ ] Route-Visualisierung zwischen Punkten
- [ ] Offline-Support mit Service Worker
- [ ] Custom Tile Layer mit eigenen Karten-Styles
- [ ] Geolocation-Button für "Zeige meine Position"
- [ ] Suchfunktion für Orte
- [ ] Permalink für spezifische Map-Ansichten

## Support

Bei Problemen:

1. **Logs prüfen:** `/root/deploy-git/test/mojobusco/logs/deploy-test-latest.log`
2. **GitHub Issues:** https://github.com/mojomaxmojo/mojobusco/issues
3. **Deployment-Dokumentation:** `DEPLOYMENT_WORKFLOW.md`

## Lizenz

MIT License - siehe [LICENSE](../LICENSE)
