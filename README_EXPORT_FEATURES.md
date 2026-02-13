# 🎬 MojoBus GPX/KMZ Export + Google Earth Studio Integration

## 📋 Übersicht

Diese Feature-Integration ermöglicht es MojoBus-Nutzern, ihre Reisen als GPX oder KMZ zu exportieren und in professionelle YouTube-Videos mit Google Earth Studio umzuwandeln.

---

## 🚀 Schnellstart (5 Minuten)

### 1. GPX Exportieren

```
MojoBus Export-Seite (/export)
    ↓
"GPX Exportieren" Button klicken
    ↓
GPX exportieren (Bilder + Posts + Zeitstempel)
    ↓
✅ mojobus-export.gpx herunterladen
```

### 2. Google Earth Studio öffnen

```
earthstudio.google.com
    ↓
"Create Project" klicken
    ↓
GPX importieren
    ↓
✅ Route auf 3D-Globus
```

### 3. Video erstellen

```
Camera → Follow Path
    ↓
Timeline anpassen (2-5 min)
    ↓
Style anpassen (Cyan-Route)
    ↓
Export → 4K MP4
    ↓
✅ Fertiges Video für YouTube!
```

---

## 📁 Datei-Struktur

```
src/
├── lib/
│   ├── gpxExporter.ts          # GPX-Export Logik
│   └── kmzExporter.ts          # KMZ-Export Logik (ZIP mit Fotos)
├── components/
│   └── ExportDialog.tsx        # Export UI-Komponente
└── pages/
    └── Export.tsx              # Export-Seite mit Filtern

GOOGLE_EARTH_STUDIO_TUTORIAL.md  # Ausführliches Tutorial
README_EXPORT_FEATURES.md        # Diese Datei
```

---

## 🔧 Feature-Details

### GPX Export

**Was wird exportiert:**
- ✅ GPS-Koordinaten (Breitengrad, Längengrad)
- ✅ Zeitstempel (wann warst du wo?)
- ✅ Ortsnamen (Location-Tags)
- ✅ Bilder (als Links)
- ✅ Posts/Artikel (als Beschreibung)
- ✅ Hashtags (als Keywords)

**Export-Optionen:**
- Bilder einbinden (Ja/Nein)
- Posts einbinden (Ja/Nein)
- Zeitstempel (Ja/Nein)

**Dateigröße:** ~10-100 KB (sehr klein!)

**Ideal für:**
- Google Earth Studio (Web)
- GPX-Viewer (online/offline)
- Navigationssysteme (Garmin, etc.)

---

### KMZ Export

**Was wird exportiert:**
- ✅ Alles aus GPX
- ✅ KML-Datei (Google Earth Format)
- ✅ Alle Fotos heruntergeladen (lokal)
- ✅ README.txt mit Anleitung
- ✅ GPX-Datei (in /gpx/ Ordner)

**Export-Optionen:**
- Maximale Bilder (1-100)
- Vollauflösung oder komprimiert (1200x800)

**Dateigröße:** ~10-50 MB (abhängig von Foto-Anzahl)

**Ideal für:**
- Google Earth Pro (Desktop)
- Offline-Karten
- Archivierung

---

## 🎨 UI-Komponenten

### ExportDialog

Der Export-Dialog ist eine modale Komponente mit zwei Tabs:

**Tab 1: GPX Export**
- Checkbox für Bilder, Posts, Zeitstempel
- Download-Button
- Info-Text über Google Earth Studio

**Tab 2: KMZ Export**
- Foto-Statistiken (Anzahl, Posts)
- Slider für maximale Bilder
- Checkbox für Vollauflösung
- Download-Button (lädt Bilder + ZIP)

**State Management:**
- Loading-Spinners während Export
- Success/Error Toast Notifications
- Disabled Buttons während Export

---

## 📊 Datenmodell

### GPX Waypoint

```typescript
interface GPXWaypoint {
  latitude: number;
  longitude: number;
  elevation?: number;
  timestamp?: number;
  name?: string;
  description?: string;
  type?: 'photo' | 'post' | 'location';
  imageUrls?: string[];
  postUrl?: string;
  tags?: string[];
  location?: string;
}
```

### Export Options

```typescript
interface GPXExportOptions {
  includeImages: boolean;
  includePosts: boolean;
  includeTimestamps: boolean;
  includeElevation: boolean;
}

interface KMZExportOptions extends GPXExportOptions {
  includeFullResImages: boolean;
  includeThumbnails: boolean;
  maxImageCount: number;
}
```

---

## 🔄 Workflow-Diagramm

```
┌─────────────────────────────────────────────────┐
│  MojoBus Website                                │
│  ┌─────────────────────────────────────────┐  │
│  │ 1. /export Seite öffnen                 │  │
│  │ 2. Filter anwenden (Typ, Zeitraum)     │  │
│  │ 3. "GPX Exportieren" klicken            │  │
│  │ 4. Optionen konfigurieren               │  │
│  │ 5. Download starten                     │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Export-File                                    │
│  ┌─────────────────────────────────────────┐  │
│  │ GPX: mojobus-export.gpx (~10-100 KB)   │  │
│  │ KMZ: mojobus-export.kmz (~10-50 MB)    │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Google Earth Studio                           │
│  ┌─────────────────────────────────────────┐  │
│  │ 1. earthstudio.google.com öffnen        │  │
│  │ 2. "Create Project" klicken             │  │
│  │ 3. GPX importieren                      │  │
│  │ 4. Route anpassen (Styling)              │  │
│  │ 5. Camera-Animation erstellen            │  │
│  │ 6. Export Video (4K MP4)                │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  YouTube                                       │
│  ┌─────────────────────────────────────────┐  │
│  │ 1. Video hochladen                     │  │
│  │ 2. Metadaten hinzufügen                │  │
│  │ 3. Thumbnail erstellen                 │  │
│  │ 4. Musik hinzufügen                    │  │
│  │ 5. Veröffentlichen                     │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Use Cases

### Use Case 1: Vanlife Travel Blog

**Szenario:** Vanlifer dokumentiert Reisen und möchte professionelle Videos erstellen

**Lösung:**
1. Fotos mit GPS auf MojoBus hochladen
2. GPX exportieren
3. Google Earth Studio für epische Flug-Animationen
4. YouTube-Video: "Vanlife in Portugal 2024"

**Resultat:**
- Professionelles Video mit 3D-Terrain
- Route visualisiert
- Perfekt für YouTube-Channel

---

### Use Case 2: Instagram Reels

**Szenario:** Kurze, virale Clips für Social Media

**Lösung:**
1. GPX exportieren
2. Google Earth Studio: 30 Sekunden Clip erstellen
3. Portrait-Format (9:16) exportieren
4. Instagram Reels hochladen

**Resultat:**
- Virale, eye-catching Clips
- 3D-Route-Animationen
- Perfekt für kurze Aufmerksamkeit

---

### Use Case 3: YouTube Shorts

**Szenario:** Kurze Videos für YouTube Shorts

**Lösung:**
1. GPX exportieren
2. Google Earth Studio: 60 Sekunden Clip
3. Highlights der Reise (Lisboa → Lagos)
4. YouTube Shorts hochladen

**Resultat:**
- 60 Sekunden, vertikales Format
- Schnell konsumierbar
- Perfekt für mobile Zuschauer

---

### Use Case 4: Dokumentarfilm-Style

**Szenario:** Langformat-Dokumentation über ein Jahr Reisen

**Lösung:**
1. Alle Trips als GPX exportieren
2. Google Earth Studio: 10 Minuten Animation
3. Jeden Monat als Section
4. Voiceover und Musik hinzufügen

**Resultat:**
- 10 Minuten Dokumentation
- Epische Übersicht
- Perfekt für YouTube-Hauptvideo

---

## 📈 Performance-Optimierung

### GPX Export

- ⚡ **Schnell:** < 1 Sekunde (je nach Events)
- 💾 **Klein:** 10-100 KB
- 🌐 **Network:** Keine externen APIs

### KMZ Export

- ⚡ **Mittel:** 5-30 Sekunden (abhängig von Foto-Anzahl)
- 💾 **Mittel:** 10-50 MB
- 🌐 **Network:** Fotos werden einzeln heruntergeladen (parallel)

### Optimierung-Tipps:

1. **Limitiere Bilder:** Max 50-100 Bilder für KMZ
2. **Komprimiere Bilder:** 1200x800 statt Vollauflösung
3. **Cache nutzen:** Bilder werden nicht erneut heruntergeladen
4. **Async Download:** Paralleles Laden von Bildern

---

## 🔍 Troubleshooting

### Problem: GPX-Export schlägt fehl

**Mögliche Ursachen:**
- Keine GPS-Daten in Events
- Koordinaten außerhalb gültigem Bereich
- Event-Tags falsch formatiert

**Lösung:**
```typescript
// Überprüfe GPS-Daten vor Export
const hasGPS = event.tags.some(([name]) => name === 'g' || name === 'image');
if (!hasGPS) {
  console.warn('No GPS data in event');
}
```

---

### Problem: KMZ-Export lädt ewig

**Mögliche Ursachen:**
- Zu viele Bilder (>100)
- Langsame Internetverbindung
- Fotos sind zu groß

**Lösung:**
- Reduziere maxImageCount auf 50
- Deaktiviere includeFullResImages
- Besseres WLAN nutzen

---

### Problem: Google Earth Studio zeigt keine Route

**Mögliche Ursachen:**
- GPX-Datei beschädigt
- Koordinaten invalide
- GPX-Format falsch

**Lösung:**
- GPX-Datei mit GPX-Validatoren prüfen: https://www.gpsvisualizer.com/convert_input
- Koordinaten überprüfen:
  - Latitude: -90 bis 90
  - Longitude: -180 bis 180

---

## 🚀 Zukünftige Verbesserungen

### Phase 2: Mehr Export-Optionen

- [ ] **KML-Export** (ohne ZIP)
- [ ] **GeoJSON-Export** (für Web-Apps)
- [ ] **CSV-Export** (für Excel/Google Sheets)
- [ ] **PDF-Export** (für Reports)

### Phase 3: Automatisierung

- [ ] **Automatisches Video-Rendering** (Server-Side)
- [ ] **YouTube API Integration** (automatisch hochladen)
- [ ] **Thumbnail-Generator** (AI-basiert)
- [ ] **Musik-Empfehlungen** (basierend auf Reise-Stimmung)

### Phase 4: Integration

- [ ] **Nostr-Publishing** (GPX als Nostr-Event)
- [ ] **Map-Integration** (Live-Route auf MojoBus-Map)
- [ ] **Community-Sharing** (GPX mit anderen teilen)
- [ ] **Route-Import** (GPX von anderen Usern importieren)

---

## 📚 Dokumentation

- **Tutorial:** `GOOGLE_EARTH_STUDIO_TUTORIAL.md`
- **GPX-Spezifikation:** https://www.topografix.com/gpx/1/1/
- **KML-Spezifikation:** https://developers.google.com/kml/documentation/
- **Google Earth Studio Help:** https://support.google.com/earthstudio

---

## 🤝 Contributing

Wenn du dieses Feature verbessern möchtest:

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Implementiere deine Änderungen
4. Teste ausführlich (verschiedene GPX-Dateien)
5. Pull Request erstellen

---

## 📄 Lizenz

Dieses Feature ist Teil von MojoBus und unterliegt der gleichen Lizenz wie das Hauptprojekt.

---

## 👥 Credits

**Entwickelt für:** MojoBus (https://mojobus.org)
**Erstellt von:** Shakespeare AI
**Stand:** 2024
**Version:** 1.0.0

---

## 🎉 Viel Spaß beim Video-Createn!

Falls du Fragen hast oder Unterstützung brauchst:

- 📖 Tutorial lesen: `GOOGLE_EARTH_STUDIO_TUTORIAL.md`
- 💬 Community: Nostr (npub1...)
- 📧 Support: support@mojobus.org

---

**Viel Erfolg beim Erstellen professioneller Reise-Videos!** 🎬🌊✨
