# MojoBus Blog - KI Projektübersicht

## 🎯 Projektübersicht

**MojoBus** ist ein hochoptimierter, moderner Blog für "Perpetual Travelers" (dauerhafte Reisende) mit Nostr-Integration. Es handelt sich um eine Vanlife/Offgrid-Reiseblog-Plattform mit Fokus auf Deutschland/Schweiz.

### Kern-Funktionen:
- **Nostr-basierte** Inhaltsverwaltung und Authentifizierung
- **Geolocation** und Kartenintegration (Leaflet)
- **Bilderverwaltung** mit automatischer Optimierung
- **Mehrsprachige Inhalte** (primär Deutsch)
- **PWA** (Progressive Web App) mit Service Worker
- **Vollständige Performance-Optimierung**

## 🏗️ Technologie-Stack

### Frontend:
- **React 18.x** mit TypeScript
- **Vite** Build Tool (mit intelligentem Code-Splitting)
- **TailwindCSS 3.x** mit benutzerdefinierten Design-Tokens
- **shadcn/ui** UI-Komponenten (basierend auf Radix UI)
- **React Router 6** für Routing

### Nostr-Integration:
- **@nostrify/nostrify** und **@nostrify/react** für Nostr-Client
- **nostr-tools** für Low-Level-Nostr-Operationen
- **NIP-23** Long-Form Content Support
- **NIP-19** Bech32-Identifier-Unterstützung

### Spezielle Features:
- **Milkdown** Rich-Text-Editor (Markdown-basiert)
- **Leaflet** für interaktive Karten
- **Image Compression** (browser-image-compression)
- **EXIF-Daten-Parsing** (exifr)
- **QR-Code-Generierung** (qrcode)
- **Date-FNS** für Datumsoperationen

## 📁 Projektstruktur

```
mkstack/
├── src/
│   ├── components/          # React-Komponenten
│   │   ├── ui/             # shadcn/ui Komponenten
│   │   ├── auth/           # Authentifizierung
│   │   ├── comments/       # Kommentar-System
│   │   └── ...
│   ├── pages/              # Seiten-Komponenten
│   │   ├── Home.tsx        # Startseite
│   │   ├── Articles.tsx    # Artikel-Übersicht
│   │   ├── Publish.tsx     # Veröffentlichungs-Editor
│   │   ├── Images.tsx      # Bildergalerie
│   │   ├── MapPage.tsx     # Kartenansicht
│   │   ├── Settings.tsx    # Einstellungen
│   │   └── ...
│   ├── config/             # Konfigurationen
│   │   ├── app.ts          # App-Konfiguration
│   │   ├── relays.ts       # Nostr-Relays
│   │   ├── tags.ts         # Tag-Kategorisierung
│   │   ├── countries.ts    # Länder-Konfiguration
│   │   └── ...
│   ├── contexts/           # React Contexts
│   ├── hooks/              # Custom Hooks
│   ├── lib/                # Hilfsfunktionen
│   ├── services/           # API-Services
│   ├── types/              # TypeScript-Typen
│   └── api/                # API-Handler
├── public/                 # Statische Assets
├── server/                 # Server-Side Code (optional)
├── workers/                # Cloudflare Workers
├── scripts/                # Build-Skripte
└── docs/                   # Dokumentation
```

## 🔧 Konfigurationssystem

Das Projekt verwendet ein zentrales Konfigurationssystem in `src/config/`:

### Wichtige Konfigurationsdateien:

1. **`src/config/relays.ts`** - Nostr-Relay-Konfiguration
   - Read/Write-Relays getrennt
   - Performance-Optimierungen (Deduplication, Timeouts)
   - Regionale Relay-Auswahl (EU/US)

2. **`src/config/app.ts`** - App-Einstellungen
   - Theme-Konfiguration (light/dark/system)
   - Nostr-Kinds und Cache-Einstellungen
   - UI- und Performance-Einstellungen

3. **`src/config/tags.ts`** - Inhaltskategorisierung
   - Land-basierte Tags (DE, CH, AT, etc.)
   - Kategorie-Tags (Natur, Städte, Kultur)
   - Autoren-Tags (mojo, lionhunter)

4. **`src/config/performance.ts`** - Performance-Optimierungen
   - Caching-Strategien
   - Bild-Optimierung
   - Lazy-Loading-Konfiguration

## 🚀 Build & Deployment

### Build-System:
- **Vite** mit intelligentem Code-Splitting
- **Route-basierte Chunks** für schnelle Ladezeiten
- **Automatische Polyfill-Injection** für Node.js-Module
- **Service Worker** für Offline-Funktionalität

### Build-Skripte:
```json
"scripts": {
  "dev": "npm i --silent && vite",
  "build": "node build-intelligent.js",  // Intelligenter Build-Prozess
  "analyze": "node scripts/analyze-bundle.mjs",
  "deploy": "npm run build && npx -y nostr-deploy-cli deploy --skip-setup"
}
```

### Deployment-Optionen:
1. **Nostr-Deploy** (Primär)
2. **Cloudflare Workers** (über `workers/` Verzeichnis)
3. **Netlify** (via `netlify.toml`)
4. **VPS/NGINX** (mit separaten Deploy-Skripten)

## 🎨 Design-System

### Farbpalette (TravelTelly-inspiriert):
- **Primär**: Ocean Teal (`hsl(188 88% 42%)`)
- **Akzent**: Coral Pink (`hsl(349 83% 51%)`)
- **Background**: Soft Blue/Gray
- **Dark Mode**: Deep Navy mit helleren Akzenten

### Typografie:
- **Heading**: Playfair Display (Serif)
- **Body**: Inter (Sans-Serif)
- **Code**: System Monospace

### Animationen:
- **Wave**: Ozean-Wellen-Effekt
- **Float**: Schwebende Elemente
- **Gradient**: Animierte Verläufe
- **Glassmorphism**: Moderne UI-Effekte

## 🔐 Authentifizierung & Nostr

### Nostr-Integration:
- **NIP-07** Browser-Extension Support
- **NIP-46** Remote Signing
- **NWC** (Nostr Wallet Connect) für Zahlungen
- **NIP-05** Identifier-Verifizierung

### Autoren-Konfiguration:
- **mojo**: `npub1...` (Primärer Autor)
- **lionhunter**: `npub1...` (Leon, Co-Autor)
- Jeder mit Nostr-Key kann Beiträge verfassen

### Event-Kinds:
- `1`: Kurze Notizen
- `30023`: Long-Form Artikel (NIP-23)
- `0`: Profil-Metadaten
- `30000`: Replaceable Events

## 📱 Seiten & Routing

### Haupt-Routen:
- `/` - Homepage mit Featured Content
- `/artikel` - Artikel-Übersicht (filterbar nach Land/Kategorie)
- `/bilder` - Bildergalerie mit Kategorien
- `/plaetze` - Orte & Locations
- `/notes` - Kurznotizen
- `/map` - Interaktive Karte
- `/veroeffentlichen` - Editor für neue Inhalte
- `/settings` - App-Einstellungen
- `/:nip19` - Dynamische Nostr-Content-Anzeige

### URL-Parameter:
- `/:country` - Länderfilter (DE, CH, AT, etc.)
- `/:category` - Kategoriefilter
- `/:nip19` - Nostr-Bezeichner (npub, note, naddr)

## 🖼️ Medienverwaltung

### Bilderverarbeitung:
- **Automatische Kompression** (client-side)
- **EXIF-Daten-Extraktion** (GPS, Datum, Kamera)
- **Responsive Images** (verschiedene Größen)
- **Lazy Loading** mit Intersection Observer

### Bild-Services:
- **Blossom** (primal.net) für Nostr-Bilder
- **images.weserv.nl** als Image-Proxy/CDN
- **Cloudflare Images** (optional)
- **Lokale Caching-Strategie**

## 🗺️ Geolocation & Karten

### Leaflet-Integration:
- **Interaktive Karten** für Orte & Trips
- **GeoJSON-Support** für Routen
- **Clustering** für viele Marker
- **Heatmaps** für Besucherhäufigkeit

### GPS-Features:
- **Ngeohash** für effiziente Geo-Querying
- **EXIF GPS-Daten** aus Bildern
- **Trip-Tracking** mit Zeitachsen
- **Country/Region-Filter**

## ⚡ Performance-Optimierungen

### Ladezeit-Optimierungen:
- **Critical CSS** Inlining
- **Font Preloading** (selbst gehostet)
- **DNS-Prefetch** für externe Ressourcen
- **Resource Hints** (preconnect, preload)

### Code-Splitting:
- **Route-based Chunks** (jede Seite separat)
- **Vendor Chunks** (Radix, React-Query, etc.)
- **Dynamic Imports** für große Bibliotheken
- **Tree Shaking** für ungenutzten Code

### Caching-Strategien:
- **Service Worker** mit Cache-First für Assets
- **Nostr-Event-Caching** (10min stale time)
- **Browser Storage** für persistente Einstellungen
- **Image Cache** mit Versionierung

## 🔧 Entwicklung

### Entwicklungsumgebung:
```bash
npm run dev      # Start Development Server (Port 8080)
npm run build    # Production Build
npm run analyze  # Bundle-Analyse
npm run test     # Testausführung
```

### Konfiguration:
- **Tailwind**: `tailwind.config.ts`
- **TypeScript**: `tsconfig.json`
- **Vite**: `vite.config.ts`
- **ESLint**: `eslint.config.js`
- **PostCSS**: `postcss.config.js`

## 📊 SEO & Metadaten

### SEO-Optimierungen:
- **Schema.org** Structured Data
- **Open Graph** Tags für Social Media
- **Twitter Cards** Integration
- **Canonical URLs** für Duplicate Content

### Metadaten:
- **Dynamische Title Tags** pro Seite
- **Meta Descriptions** mit Keywords
- **Theme Color** für PWA
- **Manifest** für Installierbarkeit

## 🛠️ Wartung & Skalierung

### Skalierungsstrategien:
- **Stateless Design** (außer localStorage)
- **CDN-basierte Assets**
- **Nostr als verteiltes Backend**
- **Incremental Static Regeneration**-ähnlich

### Monitoring:
- **Service Worker Status** Anzeige
- **Performance Metrics** Logging
- **Error Boundary** für React-Fehler
- **Console Logging** (Produktion reduziert)

## 💡 Wichtige Besonderheiten

### 1. **Node.js Polyfills**
Das Projekt benötigt Polyfills für Node.js-Module im Browser:
- `process`, `buffer`, `stream`, `events`
- Wird automatisch im Build-Prozess hinzugefügt

### 2. **Nostr-Relay-Optimierung**
- Deduplication aktiviert
- Regionale Relay-Auswahl
- Timeout-Konfiguration pro Relay-Typ

### 3. **Image Service Fallback**
- Primär: Blossom (primal.net)
- Fallback: images.weserv.nl
- Lokale Caching-Ebene

### 4. **PWA-Funktionen**
- Installierbar als Native App
- Offline-Fähigkeit (begrenzt)
- Push Notifications (geplant)
- Background Sync (geplant)

## 🔍 Troubleshooting

### Häufige Probleme:

1. **Nostr-Connectivity**
   - Prüfe Relay-Status in `/settings`
   - Teste alternative Relays

2. **Bild-Lade-Probleme**
   - Image-Service prüfen
   - CORS-Probleme (Proxy verwenden)

3. **Build-Fehler**
   - Node.js Polyfills prüfen
   - TypeScript-Kompilierung

4. **Performance-Issues**
   - Bundle analysieren (`npm run analyze`)
   - Caching-Strategien prüfen

## 📈 Erweiterungsmöglichkeiten

### Geplante Features:
- **NIP-89** App Recommendations
- **NIP-51** Listen & Kuratierung
- **NIP-57** Lightning Zaps erweitern
- **NIP-98** HTTP Auth für APIs

### Mögliche Integrationen:
- **Weather API** für Standorte
- **Translation Service** für mehr Sprachen
- **E-Commerce** für Merchandise
- **Community Features** (Likes, Shares)

---

## 🎯 Kurzzusammenfassung für KI-Assistenten

**MojoBus** ist ein **highly-optimized Nostr-based travel blog** mit Fokus auf:
- ✅ Vanlife/Offgrid/Beachlife Content (DE/CH)
- ✅ Nostr als verteiltes Backend
- ✅ Geolocation & Karten (Leaflet)
- ✅ PWA mit Service Worker
- ✅ Performance-optimiert (Vite + Tailwind)

**Wichtigste Dateien für Modifikationen:**
- `src/config/` - Alle Konfigurationen
- `src/pages/` - Seiten-Logik
- `src/components/` - UI-Komponenten
- `vite.config.ts` - Build-Optimierungen

**Nostr-spezifisch:**
- Relays: `src/config/relays.ts`
- Autoren: `src/config/relays.ts` (AUTHORS)
- Kinds: `src/config/app.ts` (NOSTR_CONFIG.kinds)

**Design-System:**
- Farben: `src/index.css` (CSS Custom Properties)
- Komponenten: `src/components/ui/`
- Typografie: Self-hosted Fonts

**Performance:**
- Code-Splitting: `vite.config.ts` (manualChunks)
- Caching: Service Worker + Nostr-Cache
- Bilder: Automatische Optimierung