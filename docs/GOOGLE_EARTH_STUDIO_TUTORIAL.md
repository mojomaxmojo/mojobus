# GPS Export + Google Earth Studio: Kompletter Ablauf

## 🎬 Übersicht

Diese Anleitung zeigt dir, wie du GPS-Daten aus MojoBus exportierst und mit Google Earth Studio professionelle Videos erstellst.

### Was du brauchst

- ✅ MojoBus-Konto mit Location-Daten (Events mit GPS-Koordinaten)
- ✅ Google Earth Studio (kostenlos): https://www.google.com/earth/studio/
- ✅ Google-Konto (für Earth Studio)
- ✅ Optional: Google Earth Pro (Desktop-App, kostenlos): https://www.google.com/earth/versions/

## 📋 Inhaltsverzeichnis

1. [GPS-Export aus MojoBus](#1-gps-export-aus-mojobus)
2. [Google Earth Studio Einrichtung](#2-google-earth-studio-einrichtung)
3. [GPX-Import in Earth Studio](#3-gpx-import-in-earth-studio)
4. [Kamera-Animation erstellen](#4-kamera-animation-erstellen)
5. [Video-Export](#5-video-export)
6. [Erweiterte Techniken](#6-erweiterte-techniken)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. GPS-Export aus MojoBus

### Schritt 1.1: Location-Seite öffnen

1. Gehe zu einer Location- oder Trip-Seite in MojoBus
2. Klicke auf den **"GPS Export"** Button
   - Button ist meistens oben rechts oder im Actions-Menü

### Schritt 1.2: Export-Optionen wählen

Der Export-Dialog öffnet sich mit folgenden Optionen:

#### Export-Ziel wählen:
- **Google Earth Studio** ⭐ (Empfohlen für professionelle Videos)
- **Google Earth Pro** (Desktop-App, einfacher für Einsteiger)
- **Anderes Tool** (GPX Viewer, Strava, etc.)

#### Export-Format wählen:
- **GPX Datei** (Standard, kompatibel mit allen Tools)
- **KMZ Datei** (Google Earth Format mit eingebetteten Bildern)

#### Export-Optionen:
- ✅ **Bilder einschließen** - Fotos werden im GPX als Links referenziert
- ✅ **Höhendaten einschließen** - Altitude-Daten (wenn verfügbar)
- ✅ **Track vereinfachen** - Entfernt zu nahe Punkte für glattere Animation

### Schritt 1.3: Export starten

1. Klicke auf **"Exportieren"**
2. Die Datei wird automatisch heruntergeladen:
   - `MojoBus_Trip_2024-02-13.gpx` oder
   - `MojoBus_Trip_2024-02-13.kmz`

### Schritt 1.4: Prüfe die exportierte Datei

Öffne die GPX-Datei in einem Text-Editor, um sicherzustellen, dass sie Koordinaten enthält:

```xml
<wpt lat="37.774900" lon="-122.419400">
  <name>Van am Strand</name>
  <desc>Wunderschöner Campingplatz...</desc>
  <time>2024-02-13T10:30:00Z</time>
</wpt>
```

---

## 2. Google Earth Studio Einrichtung

### Schritt 2.1: Google Earth Studio öffnen

1. Gehe zu: https://www.google.com/earth/studio/
2. Melde dich mit deinem Google-Konto an
3. Akzeptiere die Nutzungsbedingungen (wenn gefragt)

### Schritt 2.2: Projekt erstellen

1. Klicke auf **"New Project"** oder **"Neues Projekt"**
2. Gib deinem Projekt einen Namen (z.B. "Portugal Trip 2024")
3. Earth Studio öffnet sich mit einer leeren 3D-Welt

### Schritt 2.3: Bedienung verstehen

**Wichtige Bedienelemente:**

- **Linke Sidebar**: Projekt-Einstellungen, Keyframes, Export
- **Rechte Sidebar**: Kamera-Werkzeuge, 3D-Objekte, Ebenen
- **Mitte**: 3D-Welt-Vorschau
- **Timeline unten**: Animation-Zeitleiste

**Navigation:**
- Mausrad: Zoom
- Linksklick + Ziehen: Welt drehen
- Rechtsklick + Ziehen: Kamera schwenken

---

## 3. GPX-Import in Earth Studio

### Schritt 3.1: GPX-Datei hochladen

**Option A: Import über URL (empfohlen)**
1. Lade deine GPX-Datei auf einen Cloud-Dienst hoch (z.B. GitHub, Cloudflare R2)
2. Kopiere die öffentliche URL der GPX-Datei
3. In Earth Studio: **Klick auf "Import" > "URL"**
4. Füge die URL ein und klicke "Importieren"

**Option B: Import über Datei (nur mit Workaround)**
Google Earth Studio unterstützt keinen direkten GPX-Datei-Import.
Lösung: Konvertiere GPX zu KML (siehe unten).

### Schritt 3.2: GPX zu KML konvertieren (nur für Option B)

Wenn du GPX direkt importieren musst, konvertiere es zu KML:

**Methode 1: Online-Konverter**
1. Gehe zu: https://www.gpsvisualizer.com/convert_input
2. Wähle "GPX" als Eingabeformat
3. Lade deine GPX-Datei hoch
4. Wähle "KML" als Ausgabeformat
5. Klicke "Convert"
6. Lade die KML-Datei herunter

**Methode 2: MojoBus KMZ-Export**
1. Exportiere aus MojoBus als **KMZ** statt GPX
2. KMZ enthält bereits KML + Bilder
3. Lade KMZ direkt in Google Earth Pro ein

### Schritt 3.3: Route in Earth Studio anzeigen

Nach dem Import:

1. Die Route erscheint als **orange Linie** auf der 3D-Welt
2. **Waypoints** (Markierungen) zeigen die einzelnen Locations
3. Du kannst die Route anklicken und Eigenschaften sehen:
   - Name
   - Beschreibung
   - Timestamp
   - Bild-Link (falls vorhanden)

### Schritt 3.4: Route anpassen

**Markierungen anpassen:**
1. Klicke auf einen Waypoint
2. Rechtsklick > "Edit Marker"
3. Ändere:
   - Name
   - Beschreibung
   - Icon
   - Größe

**Route-Stil ändern:**
1. Rechtsklick auf Route
2. "Edit Path"
3. Ändere:
   - Linienfarbe
   - Linienstärke
   - Transparenz

---

## 4. Kamera-Animation erstellen

### Schritt 4.1: Grundlegende Animation

Google Earth Studio verwendet **Keyframes** für Animationen.

**Schritt 1: Start-Keyframe hinzufügen**
1. Bewege die Kamera zum Startpunkt deiner Route
2. Klicke auf **"Add Keyframe"** (Button unten im Timeline)
3. Wähle Keyframe-Typ: **"Orbit"** (Kamera kreist um Punkt)

**Schritt 2: End-Keyframe hinzufügen**
1. Bewege die Kamera zum Endpunkt der Route
2. Klicke wieder auf **"Add Keyframe"**
3. Earth Studio erstellt automatisch einen Übergang zwischen Keyframes

### Schritt 4.2: Kamera-Pfade-Typen

**Orbit (Kreisbahn):**
- Kamera dreht sich um einen Punkt
- Perfekt für 360°-Übersichten
- Dauer: 5-30 Sekunden

**Fly-To (Flug):**
- Kamera fliegt von A nach B
- Glatter Übergang zwischen Orten
- Dauer: 2-10 Sekunden

**Zoom:**
- Kamera nähert sich einem Ort
- Perfekt für Detail-Aufnahmen
- Dauer: 3-8 Sekunden

### Schritt 4.3: Beispiel-Animation erstellen

**Szenario: Portugal Van-Trip**

**Keyframe 1: Start (Lissabon)**
- Position: Lissabon, Hohe Ansicht
- Typ: Orbit
- Dauer: 0s

**Keyframe 2: Zoom auf Campingplatz**
- Position: Campingplatz, Detail-Ansicht
- Typ: Zoom
- Dauer: 3s

**Keyframe 3: Flug nach Porto**
- Position: Porto, Mittel-Ansicht
- Typ: Fly-To
- Dauer: 8s

**Keyframe 4: Orbit über Stadt**
- Position: Porto, Überflug-Ansicht
- Typ: Orbit
- Dauer: 5s

**Keyframe 5: Ende (Fernblick)**
- Position: Portugal, Satelliten-Ansicht
- Typ: Orbit
- Dauer: 10s

**Gesamtdauer:** 26 Sekunden

### Schritt 4.4: Easing-Funktionen (Geschwindigkeits-Kurven)

Earth Studio bietet verschiedene Easing-Optionen:

- **Ease In Out** (Standard): Langsam starten, beschleunigen, langsam stoppen
- **Linear**: Konstante Geschwindigkeit (nicht empfohlen für natürliche Bewegungen)
- **Ease In**: Langsam starten, schnell stoppen
- **Ease Out**: Schnell starten, langsam stoppen

**Empfehlung:**
- Für Fly-To: Ease In Out
- Für Orbit: Linear
- Für Zoom: Ease In Out

### Schritt 4.5: Timeline bearbeiten

1. **Keyframes verschieben:** Drag & Drop auf Timeline
2. **Dauer ändern:** Keyframe-Ende nach links/rechts ziehen
3. **Keyframe löschen:** Rechtsklick > "Delete"

---

## 5. Video-Export

### Schritt 5.1: Export-Einstellungen konfigurieren

1. Klicke auf **"Export"** (oben rechts)
2. Export-Dialog öffnet sich mit folgenden Optionen:

#### Video-Einstellungen:
- **Resolution**:
  - 4K (3840x2160) - Beste Qualität (empfohlen)
  - 1080p (1920x1080) - Standard
  - 720p (1280x720) - Kleinere Datei

- **Frame Rate**:
  - 60 fps (Flüssige Animation)
  - 30 fps (Standard)
  - 24 fps (Cinematic)

- **Codec**: H.264 (Standard)

- **Format**: MP4

#### Audio:
- **Background Music**: Wähle aus Earth Studio Library
- **Voice Over**: Upload deine Audio-Datei
- **Sound Effects**: Naturgeräusche, Wind, Wellen

### Schritt 5.2: Render starten

1. Klicke auf **"Render"**
2. Earth Studio rendert das Video
3. Dauer: 2-10 Minuten (abhängig von Länge und Qualität)

### Schritt 5.3: Video herunterladen

1. Nach dem Render: Klicke auf **"Download"**
2. Video wird als MP4-Datei heruntergeladen

### Schritt 5.4: Video teilen

- YouTube Upload: Direkt über Earth Studio
- Social Media: TikTok, Instagram, Facebook
- Website: Einbetten auf MojoBus oder eigene Webseite

---

## 6. Erweiterte Techniken

### 6.1: Bilder einblenden (Photo Overlays)

Google Earth Studio unterstützt keine direkten Photo Overlays.

**Lösung: Post-Produktion**

1. Exportiere Video aus Earth Studio
2. Öffne in Video-Editor (z.B. DaVinci Resolve, Premiere Pro)
3. Füge Bilder als Overlays hinzu
4. Synchronisiere Bilder mit GPS-Waypoints

**Alternative: Google Earth Pro**

Google Earth Pro Desktop-App unterstützt Photo Overlays:

1. Importiere GPX in Google Earth Pro
2. Klicke auf "Add" > "Photo Overlay"
3. Wähle Bild-Datei von deiner Festplatte
4. Positioniere Bild an GPS-Koordinaten
5. Aktiviere "Fade In/Out" für Übergänge
6. Exportiere Video mit Tour-Recorder

### 6.2: Mehrere Routen kombinieren

**Beispiel: Nordportugal + Südportugal**

1. Exportiere zwei separate GPX-Dateien:
   - `Nordportugal.gpx`
   - `Suedportugal.gpx`

2. Importiere beide in Earth Studio

3. Weise verschiedene Farben zu:
   - Nordportugal: Rot
   - Südportugal: Blau

4. Animiere Kamera zwischen beiden Routen

### 6.3: 3D-Objekte hinzufügen

1. Rechtsklick auf 3D-Welt
2. "Add 3D Model"
3. Wähle aus:
   - Buildings (Gebäude)
   - Trees (Bäume)
   - Landmarks (Wahrzeichen)
   - Custom (eigene Modelle - nur Pro)

### 6.4: Labels und Text-Overlays

1. Rechtsklick auf Waypoint
2. "Add Label"
3. Text eingeben (z.B. "Campingplatz Algarve")
4. Formatierung ändern:
   - Font
   - Farbe
   - Größe
   - Hintergrund

### 6.5: Zeitraffer-Aufnahmen (Timelapse)

Earth Studio unterstützt keine automatischen Timelapses.

**Workaround:**

1. Erstelle mehrere Videos (eines pro Tag/Woche)
2. Schneide Videos in Video-Editor zusammen
3. Füge Zeitraffer-Übergänge hinzu

---

## 7. Troubleshooting

### Problem: GPX-Import funktioniert nicht

**Symptom:** "Invalid GPX file" Fehler

**Lösung:**
1. Prüfe GPX-Datei in Text-Editor
2. Stelle sicher, dass Koordinaten im XML vorhanden sind:
   ```xml
   <wpt lat="37.7749" lon="-122.4194">
   ```
3. Konvertiere GPX zu KML (siehe Schritt 3.2)

### Problem: Route wird nicht angezeigt

**Symptom:** GPX importiert, aber keine Route sichtbar

**Lösung:**
1. Prüfe Layer-Sidebar (rechts)
2. Stelle sicher, dass GPX-Layer aktiviert ist (Checkbox markiert)
3. Zoom in/out, um Route zu finden

### Problem: Kamera-Animation ruckelt

**Symptom:** Animation springt anstelle von smooth Übergang

**Lösung:**
1. Prüfe Keyframes in Timeline
2. Erhöhe Abstand zwischen Keyframes (mindestens 2 Sekunden)
3. Ändere Easing auf "Ease In Out"

### Problem: Export dauert ewig

**Symptom:** Render > 30 Minuten

**Lösung:**
1. Reduziere Video-Qualität (4K → 1080p)
2. Verkürze Video-Dauer
3. Reduziere Keyframes
4. Verwende Frame Rate 24 oder 30 statt 60

### Problem: Bilder werden nicht angezeigt

**Symptom:** Im GPX referenzierte Bilder fehlen im Video

**Lösung:**
- Google Earth Studio zeigt Bilder NICHT automatisch an
- Verwende Post-Produktion (siehe 6.1)
- Oder nutze Google Earth Pro für Photo Overlays

### Problem: Video-Export schlägt fehl

**Symptom:** "Export failed" Fehler

**Lösung:**
1. Prüfe Internetverbindung
2. Versuche kleineres Video (720p statt 4K)
3. Lösche Browser-Cache
4. Nutze anderen Browser (Chrome empfohlen)

---

## 🎯 Schnellstart-Checkliste

Für Anfänger: Schritt-für-Schritt in 15 Minuten

- [ ] MojoBus: GPS-Export als GPX
- [ ] Google Earth Studio: Projekt erstellen
- [ ] GPX importieren (via URL oder nach KML konvertieren)
- [ ] Start-Keyframe hinzufügen
- [ ] End-Keyframe hinzufügen
- [ ] Timeline prüfen
- [ ] Preview abspielen
- [ ] Export-Einstellungen (1080p, 30fps)
- [ ] Video rendern und downloaden

**Gesamtdauer:** 10-15 Minuten für erstes Video!

---

## 📚 Weiterführende Ressourcen

### Offizielle Dokumentation:
- Google Earth Studio Help: https://support.google.com/earth/studio
- Google Earth Pro Download: https://www.google.com/earth/versions/

### Video-Tutorials:
- YouTube Suche: "Google Earth Studio Tutorial"
- Empfohlener Kanal: "Google Earth Studio" (Offiziell)

### Konverter-Tools:
- GPS Visualizer: https://www.gpsvisualizer.com/convert_input
- KML to GPX Converter: https://kml2gpx.com/

### Community:
- Reddit: r/googleearth
- Discord: Google Earth Studio Community

---

## 🏆 Beispiel-Projekt

Hier ist ein Beispiel für ein Portugal Van-Trip Video:

```
Dauer: 30 Sekunden
Auflösung: 4K
Frame Rate: 60 fps

Timeline:
0s:    Start (Lissabon, Orbit)
3s:    Zoom auf Campingplatz 1
5s:    Flug nach Porto
12s:   Orbit über Porto
17s:   Flug nach Algarve
22s:   Zoom auf Strand
25s:   Fernblick (Portugal-Satellit)
30s:   End (Fade to black)

Audio:
- Background: "Calm Coastal" (Earth Studio Library)
- Sound Effects: Wind, Wellen
```

**Ergebnis:** Professionelles, filmisches Reisevideo mit 3D-GPS-Route!

---

## 💡 Tipps und Tricks

1. **Vorgeschlagene Dauer:**
   - 15-60 Sekunden für Social Media (TikTok, Instagram)
   - 1-3 Minuten für YouTube
   - 5-10 Minuten für Dokumentationen

2. **Kamera-Bewegungen:**
   - Verwende hauptsächlich "Fly-To" und "Orbit"
   - Vermeide zu schnelle Kamera-Schwenks
   - Halte horizontale Linien für natürliche Bewegungen

3. **Musik:**
   - Wähle ruhige, instrumentale Musik
   - Keine vocals, wenn du Voiceover hinzufügst
   - Achte auf Tempo (BPM) - passend zur Kamera-Bewegung

4. **Farben:**
   - Warme Farben für sonnige Orte
   - Kalte Farben für Winter/Schnee
   - Kontrastreiche Farben für bessere Sichtbarkeit

5. **Storytelling:**
   - Start: Überblick (Fernblick)
   - Mitte: Details und Highlights
   - Ende: Zusammenfassung (Fernblick mit Fade)

---

## 🔧 Systemanforderungen

### Für Google Earth Studio:
- Browser: Google Chrome (empfohlen) oder Firefox
- Internet: Stabile Verbindung (mindestens 10 Mbps)
- RAM: 4GB oder mehr
- GPU: Moderne Grafikkarte für 4K-Rendering

### Für Google Earth Pro:
- OS: Windows, macOS, oder Linux
- RAM: 4GB oder mehr
- GPU: Unterstützt OpenGL 2.0+
- Speicher: 2GB für Installation

---

## 📞 Support

Bei Problemen:
1. Prüfe Troubleshooting-Abschnitt (siehe oben)
2. Konsultiere Google Earth Studio Help Center
3. Suche im Community Forum
4. Kontaktiere MojoBus Support (falls Export-Probleme)

---

Viel Spaß beim Erstellen deiner GPS-Videos! 🎬✨
