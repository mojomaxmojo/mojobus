# KI-Prompts Konfiguration

Diese Dateien enthalten die Foster Huntington Stil-Prompts für alle Tabs in `/veroeffentlichen`.

## 📁 Struktur

```
src/config/prompts/
├── index.ts              # Zentraler Export aller Prompts
├── lifestyles.ts         # Lifestyle-Konfigurationen (vanlife, rvlife, buslife, wohnmobil, perpetual-travelers)
├── media.ts              # Prompt für Medien-Tab (MediaUploadForm)
├── trips.ts              # Prompt für Trips-Tab (TripForm)
├── articles.ts           # Prompt für Berichte-Tab (ArticleForm)
└── notes.ts              # Prompt für Note-Tab (NoteForm)
```

## 🎯 Tabs und Prompts

| Tab | Datei | Beschreibung | API-Endpoint |
|-----|-------|--------------|--------------|
| **Medien** | `media.ts` | Artikel mit Bildern | `/api/generate-media-article` |
| **Trips** | `trips.ts` | Reiseberichte mit Stationen | `/api/generate-trip` |
| **Berichte** | `articles.ts` | Ausführliche Berichte | (geplant) |
| **Note** | `notes.ts` | Kurze Notizen | (geplant) |

## 🚀 Lifestyles

Verfügbare Lifestyles (alle im Foster Huntington Stil):

- **vanlife** - Van-Life (Standard)
- **rvlife** - RV/Recreational Vehicle
- **buslife** - Schulbus-Umbau/Skoolie
- **wohnmobil** - Wohnmobil/Camper (deutsch)
- **perpetual-travelers** - Permanent Reisende/Ortlos

## ✍️ Foster Huntington Stil

**Charakteristika:**
- ✓ Ehrlich und ungeschönt
- ✓ Persönlich und direkt
- ✓ Keine perfekten Instagram-Beschreibungen
- ✓ Kurze Sätze, echte Emotionen
- ✓ Selbstironie und Humor

**Vermeiden:**
- ✗ "Der wunderschöne Sonnenaufgang tauchte die Landschaft in goldenes Licht"
- ✗ "In diesem Artikel zeige ich dir..."
- ✗ Perfekte, polierte Sätze

## 🔧 Wartung

### Prompt ändern

1. Entsprechende Datei öffnen (z.B. `media.ts`)
2. `generateMediaPrompt()` Funktion anpassen
3. Server neu starten

### Neuen Lifestyle hinzufügen

1. `lifestyles.ts` öffnen
2. Neuen Lifestyle zu `lifestyles` Objekt hinzufügen
3. Beispiel-Texte im Foster Huntington Stil schreiben

### Prompt-Länge ändern

In der entsprechenden Prompt-Datei:
- `MAX 300 WÖRTER` ändern
- `max_tokens` im API-Call anpassen (Standard: 700)

## 📊 Server-Integration

Die `server/server.js` lädt die Konfigurationen:

```javascript
// Lifestyle-Konfiguration laden
const lifestyleConfig = getLifestyleConfig(lifestyle)

// Prompt generieren
const prompt = generateMediaPrompt(title, description, location, text, imageDescriptions, lifestyleConfig)
```

## 🎨 Beispiel

### Vanlife:
> "Du wachst morgens auf und der Van riecht nach letzter Nacht. Nicht glamourös, aber echt. Genau das macht Vanlife aus."

### Buslife:
> "Du fährst deinen umgebauten Schulbus auf einen Waldweg. 40 Fuß Stahl und Holz - dein Zuhause."

### Perpetual Travelers:
> "Du weißt nicht mehr, welcher Tag es ist. Perpetual Traveler zu sein bedeutet, die Zeit zu vergessen."

## 📝 Frontend-Nutzung

Im Frontend kann der Lifestyle-Parameter übergeben werden:

```javascript
const formData = new FormData()
formData.append('lifestyle', 'rvlife')  // oder 'buslife', 'wohnmobil', etc.
formData.append('title', 'Mein RV-Abenteuer')
formData.append('images', imageFile)

const response = await fetch('/api/generate-media-article', {
  method: 'POST',
  body: formData
})
```

## 🔗 Links

- [Foster Huntington](https://instagram.com/fosterhunting) - Original-Stil-Vorbild
- [Vanlife](https://vanlife.com/) - Vanlife-Community
- API-Dokumentation: `server/server.js`
