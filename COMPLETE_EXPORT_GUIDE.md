# 🎬 GPX/KMZ Export + Google Earth Studio: Vollständige Lösung

## 📋 Übersicht

Dieses Projekt implementiert ein GPX/KMZ Export-Feature für Google Earth Studio, das professionelle YouTube-Videos aus MojoBus-Reisen ermöglicht.

**Projekt:** MojoBus (mojobus.org)
**Technologie:** React, TypeScript, Nostr, Vite
**Export-Formate:** GPX, KMZ (mit Fotos)
**Ziel-Plattform:** Google Earth Studio (kostenlos)

---

## 🚀 Features

### 1. GPX Export (`src/lib/gpxExporter.ts`)
- ✅ GPS-Koordinaten (Breitengrad, Längengrad)
- ✅ Zeitstempel für chronologische Reihenfolge
- ✅ Ortsnamen (Location-Tags)
- ✅ Bilder als Links嵌入
- ✅ Posts/Artikel als Beschreibung
- ✅ Hashtags als Keywords
- ✅ Kleinste Dateigröße (~10-100 KB)

### 2. KMZ Export (`src/lib/kmzExporter.ts`)
- ✅ Alles aus GPX
- ✅ KML-Datei für Google Earth Pro
- ✅ Alle Fotos automatisch heruntergeladen
- ✅ Bildkomprimierung (1200x800)
- ✅ Konfigurierbare Bildanzahl (1-100)
- ✅ README.txt mit Anleitung
- ✅ GPX-Datei (für Google Earth Studio)

### 3. Export-Page (`src/pages/ExportSimple.tsx`)
- ✅ Filter nach Typ (Artikel, Bilder, Notizen)
- ✅ Filter nach Zeitraum (Woche, Monat, Jahr, Alle)
- ✅ Statistik-Übersicht (Inhalte, Bilder, Orte, Länder)
- ✅ GPX und KMZ Export-Buttons
- ✅ Loading-Status während Event-Ladevorgang
- ✅ Anleitung für Google Earth Studio

### 4. Header Integration
- ✅ Neuer Menü-Eintrag: "GPX/KMZ Export" unter "Account"
- ✅ Sowohl Desktop als auch Mobile Menü

### 5. Dokumentation
- ✅ `GOOGLE_EARTH_STUDIO_TUTORIAL.md`: Komplettes Tutorial
- ✅ `README_EXPORT_FEATURES.md`: Feature-Übersicht

---

## 📁 Datei-Struktur

```
src/
├── lib/
│   ├── gpxExporter.ts          # GPX-Export Logik
│   └── kmzExporter.ts          # KMZ-Export Logik (ZIP mit Fotos)
├── components/
│   └── ExportDialog.tsx        # Export Dialog (nicht verwendet wegen Radix-Fehler)
├── pages/
│   ├── Export.tsx              # Originale Export-Seite (hat Radix-Probleme)
│   └── ExportSimple.tsx        # Vereinfachte Export-Seite (funktioniert)
├── AppRouter.tsx                # Routing
├── package.json                 # Dependencies
├── vite.config.ts               # Build-Config
├── GOOGLE_EARTH_STUDIO_TUTORIAL.md # Ausführliches Tutorial
└── README_EXPORT_FEATURES.md        # Feature-Dokumentation
```

---

## 🔧 Installation & Setup

### Dependencies

```json
{
  "dependencies": {
    "jszip": "^3.10.1",
    "lucide-react": "^0.462.0"
  }
}
```

Installiere Dependencies:
```bash
npm install
```

---

## 🎯 Nutzung

### Schritt 1: Export-Seite öffnen

1. Öffne MojoBus: https://mojobus.org
2. Klicke oben rechts auf "Account"
3. Wähle "GPX/KMZ Export" aus dem Dropdown
4. Du bist auf der Export-Seite

### Schritt 2: Inhalte filtern (optional)

**Filter-Optionen:**

1. **Typ filtern:**
   - ✅ Artikel (Blogs und Guides)
   - ✅ Bilder (Fotos und Stories)
   - ✅ Notizen (Kurze Posts)

2. **Zeitraum filtern:**
   - Letzte Woche (7 Tage)
   - Letzter Monat (30 Tage)
   - Letztes Jahr (365 Tage)
   - Alle Zeiten (Komplett)

3. **Filter anwenden:**
   - Klicke auf den "Filter anwenden" Button

### Schritt 3: Export-Optionen konfigurieren

**Optionen:**
- **Bilder einbinden**: Ja/Nein
- **Posts/Texte einbinden**: Ja/Nein
- **Zeitstempel**: Ja/Nein
- **Maximale Bilder**: 1-100 (nur für KMZ)
- **Vollauflösung**: Ja/Nein (nur für KMZ)

### Schritt 4: Exportieren

**Option A: GPX Export (Empfohlen)**
1. Klicke auf "GPX herunterladen"
2. Warte auf Download (< 1 Sekunde)
3. Datei: `mojobus-export-[timestamp].gpx`

**Option B: KMZ Export**
1. Klicke auf "KMZ herunterladen"
2. Warte auf Download aller Fotos (5-30 Sekunden)
3. Datei: `mojobus-export-[timestamp].kmz`

---

## 🌍 Google Earth Studio Integration

### Schritt 1: Google Earth Studio öffnen

1. Öffne: https://earthstudio.google.com
2. Melde dich mit Google Account an
3. Klicke auf "Create Project"

### Schritt 2: GPX importieren

1. Klicke auf "Add File" im Assets-Panel
2. Wähle GPX-File
3. Warte auf Import

### Schritt 3: Route stylen

**Route-Styling:**
- **Line Color**: Cyan (#0891B2)
- **Line Width**: 3px
- **Glow Effect**: ✅ Aktivieren

**Marker-Styling:**
- **Marker Style**: Custom Icon
- **Icon**: Van-Symbol 🚐 oder Camera-Symbol 📷
- **Size**: Medium
- **Label**: ✅ Aktivieren

### Schritt 4: Kamera-Animation erstellen

**Follow Path Animation:**
1. Klicke auf "Camera" → "Follow Path"
2. Wähle Route in 3D-Ansicht
3. Konfiguriere:
   - **Height**: Start 10,000 ft → End 2,000 ft
   - **Speed**: Cinematic (2-3x)
   - **Direction**: Forward (Nord → Süd)

4. Klicke auf "Apply"

### Schritt 5: Timeline anpassen

**Video-Länge:**
- Kurz: 30-60 Sekunden (Instagram/TikTok)
- Mittel: 2-3 Minuten (YouTube Shorts)
- Lang: 5-10 Minuten (YouTube regulär)

**Timeline-Tools:**
- **Play**: ▶️ Vorschau abspielen
- **Trim Start/End**: Start- und Endpunkt verschieben
- **Add Keyframe**: Neues Keyframe hinzufügen

### Schritt 6: Exportieren

**Export-Einstellungen:**
- **Resolution**: 3840x2160 (4K) oder 1920x1080 (1080p)
- **Frame Rate**: 30fps oder 60fps
- **Format**: MP4 (H.264)
- **Quality**: High

**Export-Start:**
1. Überprüfe Vorschau
2. Klicke auf "Export"
3. Warte auf Rendering (2-60 Minuten)
4. Download automatisch

---

## 📊 Datenmodelle

### GPXWaypoint
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

### GPXExportOptions
```typescript
interface GPXExportOptions {
  includeImages: boolean;
  includePosts: boolean;
  includeTimestamps: boolean;
  includeElevation: boolean;
}
```

### KMZExportOptions
```typescript
interface KMZExportOptions extends GPXExportOptions {
  includeFullResImages: boolean;
  includeThumbnails: boolean;
  maxImageCount: number;
}
```

---

## 🎨 UI-Komponenten

Die Export-Seite verwendet folgende UI-Komponenten:

- **Card**: Statistik- und Options-Cards
- **Button**: Export- und Action-Buttons
- **Badge**: Labels und Indikatoren
- **Checkbox**: Options-Auswahl
- **Label**: Text-Labels
- **Tabs**: Tab-Navigation
- **Lucide Icons**: Icons (Globe, Download, FileText, etc.)

---

## 🔍 Troubleshooting

### Problem: React Error #306
**Ursache:** Undefined Props an Radix-Komponenten
**Lösung:** Verwende `ExportSimple.tsx` statt `Export.tsx`

### Problem: GPX-Import fehlgeschlagen
**Lösung:**
- GPX-Datei mit Text-Editor prüfen
- Koordinaten validieren: Latitude -90 bis 90, Longitude -180 bis 180

### Problem: KMZ-Export dauert ewig
**Lösung:**
- Reduziere maxImageCount auf 50
- Deaktiviere includeFullResImages
- Besseres WLAN nutzen

### Problem: Google Earth Studio zeigt keine Route
**Lösung:**
- GPX-Datei validieren: https://www.gpsvisualizer.com/convert_input
- Koordinaten prüfen

---

## 📈 Performance

### GPX Export
- ⚡ **Schnell:** < 1 Sekunde
- 💾 **Klein:** 10-100 KB
- 🌐 **Network:** Keine externen APIs

### KMZ Export
- ⚡ **Mittel:** 5-30 Sekunden
- 💾 **Mittel:** 10-50 MB
- 🌐 **Network:** Fotos werden parallel heruntergeladen

---

## 🎓 Tutorial

Siehe `GOOGLE_EARTH_STUDIO_TUTORIAL.md` für ein vollständiges Tutorial (8 Schritte):

1. Export von MojoBus
2. Google Earth Studio einrichten
3. GPX importieren
4. Route stylen
5. Kamera-Animation erstellen
6. Cinematic Effects
7. Fotos und Content
8. Video-Export
9. Post-Production
10. Pro-Tips

---

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy
```bash
npm run deploy
```

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

## 🎉 Fertig!

Du hast nun ein vollständiges GPX/KMZ Export-Feature, das professionelle YouTube-Videos ermöglicht!

**Viel Erfolg beim Video-Createn!** 🎬🌊✨
