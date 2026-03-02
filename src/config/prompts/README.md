# KI-Prompts Konfiguration

Diese Dateien enthalten die Foster Huntington Stil-Prompts für alle Tabs in `/veroeffentlichen`.

## 📁 Struktur

```
src/config/prompts/
├── index.js              # Zentraler Export aller Prompts
├── lifestyles.js         # Lifestyle-Konfigurationen (vanlife, rvlife, beachlife, wohnmobil, perpetual-travelers)
├── media.js              # Prompt für Medien-Tab (MediaUploadForm)
├── trips.js              # Prompt für Trips-Tab (TripForm)
├── articles.js           # Prompt für Berichte-Tab (ArticleForm)
├── notes.js              # Prompt für Note-Tab (NoteForm)
├── place.js              # Prompt für Plätze-Tab (PlaceForm)
└── README.md             # Diese Dokumentation
```

## 🎯 Tabs und Prompts

| Tab | Datei | Beschreibung | API-Endpoint | Kontext-Felder |
|-----|-------|--------------|--------------|----------------|
| **Medien** | `media.js` | Artikel mit Bildern | `/api/generate-media-article` | mainCategory, subCategories, detailedTags, manualTags, additionalImageUrls, country |
| **Trips** | `trips.js` | Reiseberichte mit Stationen | `/api/generate-trip` | tripType, stationDescriptions |
| **Berichte** | `articles.js` | Ausführliche Berichte | `/api/generate-article` | category, tags, country |
| **Note** | `notes.js` | Kurze Notizen | `/api/generate-note` | - |
| **Plätze** | `place.js` | Platz-Beschreibungen | `/api/generate-place` | gps_lat, gps_lon |

## 🚀 Lifestyles

Verfügbare Lifestyles (alle im Foster Huntington Stil):

- **vanlife** - Van-Life (Standard)
- **rvlife** - RV/Recreational Vehicle
- **beachlife** - Strand & Surf Lifestyle
- **wohnmobil** - Wohnmobil/Camper (deutsch)
- **perpetual-travelers** - Permanent Reisende/Ortlos

## 📊 Kontext-Felder

### Medien-Tab (media.ts)
```typescript
interface MediaPromptParams {
  title: string
  description?: string
  location?: string
  text?: string
  imageDescriptions: string[]
  lifestyleConfig: LifestyleConfig
  // Kontext-Felder
  mainCategory?: string        // Hauptkategorie
  subCategories?: string[]     // Unterkategorien
  detailedTags?: string[]      // Detail-Tags
  additionalImageUrls?: string // Zusätzliche Bild-URLs
  manualTags?: string[]        // Manuelle Tags
  country?: string             // Land
}
```

### Trips-Tab (trips.ts)
```typescript
interface TripPromptParams {
  title: string
  description?: string
  locations: string[]
  startDate?: string
  endDate?: string
  imageDescriptions: string[]
  lifestyleConfig: LifestyleConfig
  // Kontext-Felder
  tripType?: string            // Art der Reise
  stationDescriptions?: Array<{ location: string; description: string }>
}
```

### Berichte-Tab (articles.ts)
```typescript
interface ArticlePromptParams {
  title: string
  description?: string
  location?: string
  text?: string
  imageDescriptions: string[]
  lifestyleConfig: LifestyleConfig
  // Kontext-Felder
  category?: string            // Kategorie
  tags?: string[]              // Tags
  country?: string             // Land
}
```

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
3. **WICHTIG**: Auch `server/server.js` inline Prompts aktualisieren!
4. Server neu starten

### Neuen Lifestyle hinzufügen

1. `lifestyles.ts` öffnen
2. Neuen Lifestyle zu `lifestyles` Objekt hinzufügen
3. Beispiel-Texte im Foster Huntington Stil schreiben
4. Auch in `server/server.js` `getLifestyleConfig()` hinzufügen!

### Prompt-Länge ändern

In der entsprechenden Prompt-Datei:
- `MAX 300 WÖRTER` ändern
- `max_tokens` im API-Call anpassen (Standard: 700)

## 📊 Server-Integration

✅ **Prompts werden direkt importiert!**

Die `server/server.js` importiert alle Prompts aus diesem Verzeichnis:

```javascript
import {
  getLifestyleConfig,
  generateMediaPrompt,
  generateTripPrompt,
  generateArticlePrompt,
  generateNotePrompt,
  generatePlacePrompt,
  getMediaImageAnalysisPrompt,
  getTripImageAnalysisPrompt,
  getArticleImageAnalysisPrompt,
  getNoteImageAnalysisPrompt,
  getPlaceImageAnalysisPrompt
} from '../src/config/prompts/index.js'
```

**Bei Änderungen:** Nur die Dateien in `src/config/prompts/` bearbeiten!

## 🎨 Beispiel

### Vanlife:
> "Du wachst morgens auf und der Van riecht nach letzter Nacht. Nicht glamourös, aber echt. Genau das macht Vanlife aus."

### Beachlife:
> "Du wachst auf und hörst die Wellen. Sand überall - im Van, im Bett, im Essen. Aber genau das macht Beachlife aus."

### Perpetual Travelers:
> "Du weißt nicht mehr, welcher Tag es ist. Perpetual Traveler zu sein bedeutet, die Zeit zu vergessen."

## 📝 Frontend-Nutzung

Im Frontend können alle Parameter übergeben werden:

```javascript
const formData = new FormData()
formData.append('lifestyle', 'rvlife')  // oder 'beachlife', 'wohnmobil', etc.
formData.append('title', 'Mein RV-Abenteuer')
formData.append('images', imageFile)

// Kontext-Felder
formData.append('mainCategory', 'reise')
formData.append('subCategories', JSON.stringify(['strand', 'sonne']))
formData.append('detailedTags', JSON.stringify(['atlantik', 'wellen']))
formData.append('country', 'PT')

const response = await fetch('/api/generate-media-article', {
  method: 'POST',
  body: formData
})
```

## 🔗 Links

- [Foster Huntington](https://instagram.com/fosterhunting) - Original-Stil-Vorbild
- [Vanlife](https://vanlife.com/) - Vanlife-Community
- API-Dokumentation: `server/server.js`
