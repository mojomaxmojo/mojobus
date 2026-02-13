# 🎬 Google Earth Studio: Komplettes Tutorial

## 📋 Übersicht

Dieses Tutorial zeigt dir, wie du deine MojoBus-Reisen in professionelle YouTube-Videos verwandelst!

**Was du brauchst:**
- ✅ MojoBus-Website (du bist hier!)
- ✅ Google Account (kostenlos)
- ✅ Google Earth Studio (kostenlos)
- ✅ 30-60 Minuten Zeit für das erste Video

---

## 🚀 SCHNITT 1: Export von MojoBus

### Schritt 1.1: Zur Export-Seite navigieren

1. Klicke oben rechts im Header auf **"Account"**
2. Wähle **"GPX/KMZ Export"** aus dem Dropdown-Menü
3. Du bist jetzt auf der Export-Seite: `mojobus.org/export`

### Schritt 1.2: Inhalte filtern

Die Export-Seite zeigt alle deine Inhalte an:

**Statistik-Cards:**
- 📝 **Inhalte**: Anzahl der Artikel, Bilder und Notes
- 📸 **Bilder**: Anzahl aller Fotos
- 📍 **Orte**: Anzahl der einzigartigen Standorte
- 🌍 **Länder**: Anzahl der besuchten Länder

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
   - Klicke auf den **"Filter anwenden"** Button
   - Die Liste wird aktualisiert

### Schritt 1.3: GPX oder KMZ exportieren

Du hast zwei Export-Optionen:

#### **Option A: GPX Export (Empfohlen für Google Earth Studio)**

**Wann verwenden:**
- Für Google Earth Studio (Web)
- Wenn du schnell exportieren willst
- Wenn die Datei klein sein soll

**Vorteile:**
- ✅ Kleine Datei (~10-100 KB)
- ✅ Schneller Download (< 1 Sekunde)
- ✅ Perfekt für Google Earth Studio

**Nachteile:**
- ⚠️ Fotos sind nur Links (nicht lokal)

**So geht's:**
1. Klicke auf **"GPX Exportieren"**
2. Wähle Export-Optionen im Dialog:
   - **Bilder einbinden**: ✅ Aktivieren
   - **Posts/Texte einbinden**: ✅ Aktivieren
   - **Zeitstempel**: ✅ Aktivieren
3. Klicke auf **"GPX herunterladen"**
4. Warte auf Download - Fertig! ✅

**Datei-Beispiel:** `mojobus-export-123456789.gpx`

#### **Option B: KMZ Export (Für Google Earth Pro)**

**Wann verwenden:**
- Für Google Earth Pro (Desktop)
- Wenn du Fotos lokal haben willst
- Für Offline-Nutzung

**Vorteile:**
- ✅ Alle Fotos lokal heruntergeladen
- ✅ Perfekt für Google Earth Pro Desktop
- ✅ Offline nutzbar

**Nachteile:**
- ⚠️ Große Datei (10-50 MB+)
- ⚠️ Download dauert länger (abhängig von Foto-Anzahl)

**So geht's:**
1. Klicke auf **"KMZ Exportieren"**
2. Wähle Export-Optionen im Dialog:
   - **Maximale Bilder**: 1-100 (standard: 50)
   - **Vollauflösung**: 🚫 Deaktivieren (für schnellere Downloads)
   - **Bilder einbinden**: ✅ Aktivieren
   - **Posts/Texte einbinden**: ✅ Aktivieren
3. Klicke auf **"KMZ herunterladen"**
4. Warte auf Download aller Bilder (5-30 Sekunden) - Fertig! ✅

**Datei-Beispiel:** `mojobus-export-123456789.kmz`

---

## 🌍 SCHNITT 2: Google Earth Studio einrichten

### Schritt 2.1: Google Earth Studio öffnen

1. Öffne: https://earthstudio.google.com
2. Melde dich mit deinem Google Account an (oder erstelle einen kostenlosen Account)
3. Klicke auf **"Create Project"**

### Schritt 2.2: Neue Projekt erstellen

1. Wähle Project-Name: `MojoBus Portugal Tour 2024`
2. Wähle Template:
   - **Recommended**: "Quick Start" (für Anfänger)
   - **Advanced**: "Blank Project" (für Profis)
3. Klicke auf **"Create"**

---

## 📥 SCHNITT 3: GPX importieren

### Schritt 3.1: Import Dialog öffnen

1. Klicke links auf das **"Assets"**-Tab
2. Klicke auf **"Add File"** oder **"+ Import"**
3. Wähle **"GPX File"** aus dem Dropdown

### Schritt 3.2: GPX-Datei hochladen

1. Klicke auf **"Choose File"**
2. Navigiere zu deinem heruntergeladenen GPX-File:
   - `mojobus-export-123456789.gpx`
3. Klicke auf **"Open"**
4. Warte auf Upload (meistens Sekunden)

### Schritt 3.3: GPX-Styling anpassen

Nach dem Import siehst du:

```
📍 Route auf dem 3D-Globus
   ↓
─ Cyan-Route-Linie (Standard)
   ↓
⭐ Marker bei jedem Stop
```

**Route-Styling:**

1. Klicke auf die Route im Assets-Panel
2. Öffne **"Style"**-Panel rechts:
   - **Line Color**: Cyan (#0891B2) - passt zu MojoBus Branding!
   - **Line Width**: 3px
   - **Line Opacity**: 80%
   - **Glow Effect**: ✅ Aktivieren

**Marker-Styling:**

1. Klicke auf die Marker im Assets-Panel
2. Öffne **"Style"**-Panel:
   - **Marker Style**: Custom Icon
   - **Icon**: Van-Symbol 🚐 oder Camera-Symbol 📷
   - **Size**: Medium
   - **Label**: ✅ Aktivieren (zeigt Ortsnamen)

---

## 🎥 SCHNITT 4: Kamera-Animation erstellen

### Schritt 4.1: Kamera-Modus wählen

Google Earth Studio hat 3 Kamera-Modi:

| Modus | Wann verwenden? | Dauer |
|-------|----------------|-------|
| **Follow Path** | Route entlang fliegen | 5-10 min |
| **Orbit** | Um einen Ort kreisen | 2-5 min |
| **Fly to** | Von A nach B fliegen | 2-5 min |

**Empfehlung:** Starte mit **"Follow Path"**

### Schritt 4.2: Follow Path Animation

1. Klicke auf **"Camera"**-Tab links
2. Wähle **"Follow Path"** aus Dropdown
3. Klicke auf die Route in der 3D-Ansicht
4. Wähle Optionen:

   **Height (Höhe):**
   - Start: `10,000 ft` (Europa-Übersicht)
   - End: `2,000 ft` (Detailansicht)

   **Speed (Geschwindigkeit):**
   - **Cinematic**: Langsam (2-3x)
   - **Standard**: Normal (5-10x)
   - **Fast Travel**: Schnell (20-50x)

   **Direction (Richtung):**
   - Forward (von Nord nach Süd)
   - Backward (von Süd nach Nord)
   - Bidirectional (hin und her)

5. Klicke auf **"Apply"**

### Schritt 4.3: Timeline bearbeiten

Unterhalb des 3D-View siehst du die **Timeline**:

```
┌─────────────────────────────────────────────────┐
│  Timeline (30 seconds)                          │
│                                                 │
│  ├─ Start (Lisboa)          ──────► End (Lagos)│
│  │                                              │
│  0:00              0:15              0:30        │
└─────────────────────────────────────────────────┘
```

**Timeline-Tools:**

- **Play**: ▶️ Vorschau abspielen
- **Pause**: ⏸️ Animation pausieren
- **Trim Start**: Startpunkt verschieben
- **Trim End**: Endpunkt verschieben
- **Add Keyframe**: Neues Keyframe hinzufügen

**Empfohlene Video-Länge:**
- Kurz: 30-60 Sekunden (für Instagram/TikTok)
- Mittel: 2-3 Minuten (für YouTube Short/Shorts)
- Lang: 5-10 Minuten (für YouTube regulär)

---

## 🎨 SCHNITT 5: Cinematic Effects

### Schritt 5.1: Smooth Transitions

**Problem:** Route springt abrupt von einem Ort zum anderen

**Lösung: Smooth Curves**

1. Wähle die Route im Assets-Panel
2. Öffne **"Path"**-Panel
3. Aktiviere **"Smooth Curves"**
4. Adjust **Curve Tension**: 0.5-0.7 (medium)

### Schritt 5.2: Cinematic Zoom

1. Setze Keyframes für verschiedene Höhen:
   - Keyframe 1: 20,000 ft (Start - Europa-Übersicht)
   - Keyframe 2: 10,000 ft (Mitte - Portugal-Übersicht)
   - Keyframe 3: 2,000 ft (Ende - Detailansicht Lagos)

2. Adjust **Easing**:
   - Start: Ease Out (langsam beginnen)
   - Mit: Linear (gleichbleibend)
   - End: Ease In (langsam enden)

### Schritt 5.3: Panoramic Views

Für epische Landschaftsaufnahmen:

1. Klicke auf **"Orbit"** im Camera-Panel
2. Setze Center-Point auf interessante Orte (z.B. Sagres Klippen)
3. Adjust **Orbit Duration**: 5-10 Sekunden
4. Adjust **Orbit Angle**: 360° (vollständige Drehung)

---

## 📸 SCHNITT 6: Fotos und Content

### Schritt 6.1: Foto-Overlays

Da GPX-Export nur Fotos als Links enthält, musst du manuell Overlay-Effekte erstellen:

**Option A: Foto-Popups bei Markern**

1. Klicke auf einen Marker in der Route
2. Öffne **"Label"**-Panel
3. Aktiviere **"Show Label"**
4. Füge Text ein:
   ```
   📍 Lagos
   ────────────
   📷 15 Fotos
   🗓️ 14 Tage
   🏄 3 Surfsessions
   ```

**Option B: Foto-Einblendung als Overlay**

1. Klicke auf **"Overlay"**-Tab
2. Klicke auf **"+ Add Overlay"**
3. Wähle **"Image"**
4. Lade Foto von MojoBus-Website hoch
5. Adjust Position und Size

### Schritt 6.2: Text-Overlays

Für Storytelling:

1. Klicke auf **"Overlay"**-Tab
2. Klicke auf **"+ Add Overlay"**
3. Wähle **"Text"**
4. Füge Text ein:
   ```
   🇵🇹 Portugal Adventure 2024

   🚐 30 Tage unterwegs
   📍 15 Orte besucht
   📷 150 Fotos
   🏄 12 Surfsessions
   ```

5. Adjust:
   - **Font**: Roboto oder Montserrat
   - **Size**: 24-32pt
   - **Color**: White (#FFFFFF)
   - **Background**: Semi-transparent black (rgba(0,0,0,0.5))
   - **Position**: Bottom-Center oder Top-Right

---

## ⏱️ SCHNITT 7: Video-Export

### Schritt 7.1: Export-Einstellungen

1. Klicke oben rechts auf **"Export"**
2. Wähle Format:

   **YouTube Optimiert:**
   - **Resolution**: 3840x2160 (4K) oder 1920x1080 (1080p)
   - **Frame Rate**: 30fps (Standard) oder 60fps (Smooth)
   - **Format**: MP4 (H.264)
   - **Quality**: High

   **Instagram/TikTok:**
   - **Resolution**: 1080x1920 (9:16 Portrait)
   - **Frame Rate**: 30fps
   - **Format**: MP4

### Schritt 7.2: Export starten

1. Überprüfe Vorschau (Play Button)
2. Klicke auf **"Export"**
3. Warte auf Rendering:
   - 30 Sekunden Video: ~2-5 Minuten
   - 2 Minuten Video: ~10-15 Minuten
   - 5 Minuten Video: ~30-60 Minuten

4. Download automatisch starten
5. Datei-Beispiel: `mojobus-portugal-2024.mp4`

---

## 🎬 SCHNITT 8: Post-Production (Optional)

### Schritt 8.1: YouTube hochladen

1. Gehe zu https://studio.youtube.com
2. Klicke auf **"+ Upload"**
3. Wähle deine exportierte MP4-Datei
4. Füge Metadaten hinzu:

   **Title:**
   ```
   Vanlife in Portugal: Unsere 30-Tage-Tour 🚐🌊
   | 1500km | 15 Orte | Epische Strände
   ```

   **Description:**
   ```
   🔥 Wir reisten 30 Tage durch Portugal!

   🗺️ ROUTE:
   Lisboa → Évora → Alentejo → Algarve → Lagos → Sagres

   📊 STATS:
   🚐 1500km gefahren
   📍 15 Orte besucht
   📷 150 Fotos
   🏄 12 Surfsessions
   ⚡ 47 Nächte im Van

   💡 TIPPS für Vanlife in Portugal:
   ✅ Beste Zeit: Mai-September
   ✅ Wildcamping: Legal mit Natura 2000
   ✅ Kosten: ~€12/Tag (Diesel + Essen)
   ✅ Beste Strände: Algarve (Sagres, Lagos)

   📍 Folge uns: https://mojobus.org
   🌊 Nostr: npub1...
   🔗 Map: https://mojobus.org/map

   #Vanlife #Portugal #Travel #RoadTrip #VanlifeEurope
   ```

   **Tags:**
   ```
   vanlife, portugal, travel, roadtrip,
   adventure, camping, nomad, digitalnomad,
   europe, van, vanlifeeurope, motorhome
   ```

### Schritt 8.2: Musik hinzufügen (YouTube Studio)

1. In YouTube Studio, öffne **"Audio Library"**
2. Suche nach: "Cinematic Travel", "Ambient", "Surf"
3. Filter: "Free to use" / "Attribution required"
4. Wähle passenden Track
5. Adjust Volume: 30-50%

### Schritt 8.3: YouTube-Thumbnail erstellen

**Option A: YouTube Studio Thumbnailer**

1. Öffne YouTube Studio
2. Video → "Edit"
3. Klicke auf Thumbnail
4. Wähle 1-3 Video-Momente

**Option B: DIY Thumbnail (Photoshop/Canva)**

1. Exportiere Screenshot aus Google Earth Studio
2. Öffne in Canva (1080x1920)
3. Füge Elemente hinzu:
   - 🚐 Van-Symbol
   - 🇵🇹 Portugal-Flagge
   - 🌊 Ozean-Texturen
   - ✨ Text: "30 Days in Portugal"

---

## 🎓 Pro-Tips & Tricks

### Tip 1: Wartezeiten nutzen

Google Earth Studio Rendering kann dauern:

- ⏰ In der Zeit:
  - YouTube Thumbnail erstellen
  - Description schreiben
  - Tags recherchieren
  - Social Media Posts vorbereiten

### Tip 2: Mehrere Videos

Ein Trip = mehrere Videos:

- **Teaser**: 30 Sekunden (Instagram Reels)
- **Main Video**: 3-5 Minuten (YouTube)
- **Highlight Reel**: 2 Minuten (YouTube Shorts)
- **Tutorial**: "How to plan a van trip in Portugal" (10 min)

### Tip 3: Automatisierung

Speichere Presets für zukünftige Videos:

1. Project Settings → **"Save as Preset"**
2. Name: `MojoBus Portugal Style`
3. Beinhaltet:
   - Cyan-Route (#0891B2)
   - Van-Marker
   - Cinematic Zoom
   - Font: Montserrat

### Tip 4: Konsistentes Branding

Verwende immer:
- ✅ Cyan (#0891B2) als Hauptfarbe
- ✅ Van-Symbol 🚐
- ✅ MojoBus-Logo (wenn vorhanden)
- ✅ Gleiche Font-Familie

---

## 🚨 Häufige Probleme (FAQ)

### Problem 1: "GPX-Import fehlgeschlagen"

**Lösung:**
- Überprüfe GPX-Datei mit Text-Editor
- Validiere XML-Struktur
- Versuche kleinere GPX-Datei (max 10 Marker)

### Problem 2: "Route wird nicht angezeigt"

**Lösung:**
- GPX-Koordinaten überprüfen
- Validiere Breitengrad: -90 bis 90
- Validiere Längengrad: -180 bis 180

### Problem 3: "Export dauert ewig"

**Lösung:**
- Reduziere Auflösung (4K → 1080p)
- Kürzere Video-Länge (5 min → 2 min)
- Weniger Keyframes

### Problem 4: "Video ist ruckelig"

**Lösung:**
- Erhöhe Frame Rate (30fps → 60fps)
- Aktiviere "Smooth Curves"
- Reduziere Kamera-Geschwindigkeit

---

## 📊 Checklist für professionelle Videos

- [x] GPX von MojoBus exportiert
- [x] Google Earth Studio Account erstellt
- [x] GPX importiert und validiert
- [x] Route gestylt (Cyan-Route, Van-Marker)
- [x] Kamera-Animation erstellt (Follow Path)
- [x] Timeline angepasst (2-5 Minuten)
- [x] Cinematic Effects hinzugefügt (Zoom, Orbit)
- [x] Foto-Overlays erstellt (Labels, Text)
- [x] Export-Einstellungen konfiguriert (4K, 30fps)
- [x] Video gerendert und heruntergeladen
- [x] YouTube hochgeladen
- [x] Metadaten hinzugefügt (Title, Description, Tags)
- [x] Musik hinzugefügt
- [x] Thumbnail erstellt
- [x] YouTube-Kanal gepostet
- [x] Social Media geteilt (Nostr, Twitter, Instagram)

---

## 🎉 Fertig!

Du hast nun dein erstes professionelles Vanlife-Video erstellt! 🚀

**Was als Nächstes?**
1. Erstelle eine Playlist für alle MojoBus-Videos
2. Teile Videos auf Nostr (npub1...)
3. Füge Videos zu MojoBus-Trip-Seiten hinzu
4. Sammile Viewer-Feedback
5. Verbessere zukünftige Videos

**Viel Erfolg beim Video-Createn!** 🎬🌊✨

---

## 📚 Weitere Ressourcen

- **Google Earth Studio Help**: https://support.google.com/earthstudio
- **GPX Validator**: https://www.gpsvisualizer.com/convert_input
- **YouTube Creator Academy**: https://creatoracademy.youtube.com
- **Thumbnail Templates**: https://www.canva.com/templates/s/youtube-thumbnail

---

**Erstellt von:** MojoBus Team
**Stand:** 2024
**Version:** 1.0
