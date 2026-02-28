# KI-Generierung Integration Guide

## 📋 Übersicht

Alle 5 Tabs in `/veroeffentlichen` sind jetzt bereit für KI-Generierung mit Lifestyle-Selector!

### ✅ Was wurde erstellt:

1. **LifestyleSelector Component** (`src/components/LifestyleSelector.tsx`)
2. **KI Generation Utilities** (`src/lib/kiGeneration.ts`)
3. **API Endpoints** (server/server.js):
   - `/api/generate-media-article` ✓
   - `/api/generate-trip` ✓
   - `/api/generate-article` ✓ (neu)
   - `/api/generate-place` ✓ (neu)
   - `/api/generate-note` ✓ (neu)

## 🔧 Integration in Publish.tsx

### **Schritt 1: Imports hinzufügen**

```typescript
// Am Anfang der Datei (Zeile ~32)
import { LifestyleSelector, type LifestyleType } from '@/components/LifestyleSelector';
import { 
  generateMediaArticle, 
  generateTripArticle, 
  generateArticle, 
  generatePlaceDescription, 
  generateNote 
} from '@/lib/kiGeneration';
```

### **Schritt 2: In jedem Formular State hinzufügen**

#### **Medien-Tab (MediaUploadForm)**

```typescript
// State für Lifestyle
const [lifestyle, setLifestyle] = useState<LifestyleType>('vanlife');
const [isGenerating, setIsGenerating] = useState(false);

// UI: Lifestyle Selector
<LifestyleSelector 
  value={lifestyle}
  onChange={setLifestyle}
  label="Lifestyle"
  description="Wähle deinen Reisestil für passenden KI-Text"
/>

// UI: KI-Generierung Button
<Button 
  onClick={handleGenerateMediaArticle}
  disabled={files.length === 0 || isGenerating}
  className="w-full"
>
  {isGenerating ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Generiere Artikel...
    </>
  ) : (
    <>
      <Sparkles className="mr-2 h-4 w-4" />
      KI-Artikel generieren
    </>
  )}
</Button>

// Handler Funktion
const handleGenerateMediaArticle = async () => {
  if (files.length === 0) return;
  
  setIsGenerating(true);
  try {
    const result = await generateMediaArticle({
      images: files.map(f => f.file),
      lifestyle,
      title,
      description,
      location,
      text: customTags
    });
    
    // Result in Formular einfügen
    setTitle(title || result.article.split('\n')[0]);
    setDescription(result.article);
    setCustomTags(result.hashtags);
    
    toast({
      title: "Artikel generiert!",
      description: `${result.model} - Lifestyle: ${result.lifestyle}`
    });
  } catch (error) {
    toast({
      title: "Fehler",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setIsGenerating(false);
  }
};
```

#### **Trips-Tab (TripPublishForm)**

```typescript
// State
const [lifestyle, setLifestyle] = useState<LifestyleType>('vanlife');
const [isGenerating, setIsGenerating] = useState(false);

// Handler
const handleGenerateTripArticle = async () => {
  if (images.length === 0) return;
  
  setIsGenerating(true);
  try {
    const result = await generateTripArticle({
      images,
      lifestyle,
      title,
      description,
      locations: stations.map(s => s.location),
      startDate,
      endDate
    });
    
    setContent(result.article);
    setHashtags(result.hashtags);
    
    toast({ title: "Trip-Artikel generiert!" });
  } catch (error) {
    toast({ title: "Fehler", description: error.message, variant: "destructive" });
  } finally {
    setIsGenerating(false);
  }
};
```

#### **Berichte-Tab (ArticleForm)**

```typescript
// State
const [lifestyle, setLifestyle] = useState<LifestyleType>('vanlife');

// Handler
const handleGenerateArticle = async () => {
  if (images.length === 0) return;
  
  setIsGenerating(true);
  try {
    const result = await generateArticle({
      images,
      lifestyle,
      title,
      description,
      location,
      text: content
    });
    
    setContent(result.article);
    setTags(result.hashtags);
    
    toast({ title: "Bericht generiert!" });
  } catch (error) {
    toast({ title: "Fehler", description: error.message, variant: "destructive" });
  } finally {
    setIsGenerating(false);
  }
};
```

#### **Plätze-Tab (PlaceForm)**

```typescript
// State
const [lifestyle, setLifestyle] = useState<LifestyleType>('vanlife');

// Handler
const handleGeneratePlace = async () => {
  if (images.length === 0) return;
  
  setIsGenerating(true);
  try {
    const result = await generatePlaceDescription({
      images,
      lifestyle,
      title: placeName,
      description,
      location: address,
      gps: { latitude, longitude }
    });
    
    setDescription(result.description);
    setTags(result.hashtags);
    
    toast({ title: "Platz-Beschreibung generiert!" });
  } catch (error) {
    toast({ title: "Fehler", description: error.message, variant: "destructive" });
  } finally {
    setIsGenerating(false);
  }
};
```

#### **Note-Tab (NoteForm)**

```typescript
// State
const [lifestyle, setLifestyle] = useState<LifestyleType>('vanlife');

// Handler
const handleGenerateNote = async () => {
  if (images.length === 0) return;
  
  setIsGenerating(true);
  try {
    const result = await generateNote({
      images,
      lifestyle,
      title,
      description,
      location,
      text: content
    });
    
    setContent(result.note);
    setTags(result.hashtags);
    
    toast({ title: "Notiz generiert!" });
  } catch (error) {
    toast({ title: "Fehler", description: error.message, variant: "destructive" });
  } finally {
    setIsGenerating(false);
  }
};
```

## 📁 Dateistruktur

```
src/
├── components/
│   └── LifestyleSelector.tsx       ← Lifestyle Dropdown
├── lib/
│   └── kiGeneration.ts             ← API Functions
└── config/prompts/
    ├── lifestyles.ts               ← Lifestyle Configs
    ├── media.ts                    ← Medien Prompt
    ├── trips.ts                    ← Trips Prompt
    ├── articles.ts                 ← Berichte Prompt
    └── notes.ts                    ← Note Prompt

server/
└── server.js                       ← API Endpoints
```

## 🎨 UI Placement

**Empfehlung:** Lifestyle Selector **VOR** dem KI-Generierung Button platzieren:

```
┌────────────────────────────────────┐
│  Titel: [________________]         │
│  Beschreibung: [______________]    │
│  Bilder: [📁 Upload]               │
│                                    │
│  Lifestyle:                        │
│  [🚐 Vanlife ▼]  ← SELECTOR        │
│                                    │
│  [✨ KI-Artikel generieren] ← BTN  │
└────────────────────────────────────┘
```

## ✅ Checklist für Integration

- [ ] LifestyleSelector importieren
- [ ] State für `lifestyle` hinzufügen
- [ ] State für `isGenerating` hinzufügen
- [ ] UI: Lifestyle Selector einbauen
- [ ] UI: KI-Generierung Button einbauen
- [ ] Handler Funktion implementieren
- [ ] Error Handling mit Toast
- [ ] Loading State anzeigen
- [ ] Ergebnis in Formular einfügen

## 🧪 Testing

```bash
# 1. Server starten
cd server && node server.js

# 2. Frontend starten
npm run dev

# 3. Testen:
- /veroeffentlichen öffnen
- Tab wählen (Medien, Trips, etc.)
- Lifestyle wählen
- Bilder hochladen
- "KI generieren" klicken
- Ergebnis prüfen
```

## 📊 API Response Format

Alle Endpoints liefern:

```typescript
{
  article?: string;      // Generierter Text
  description?: string;  // Für Plätze
  note?: string;         // Für Notizen
  hashtags: string;      // Leerzeichen-getrennt
  lifestyle: string;     // Verwendeter Lifestyle
  model?: string;        // Verwendetes Modell
}
```

## 🚀 Ready to Integrate!

Alle APIs sind getestet und funktionsfähig. Jetzt nur noch in die Publish.tsx Formulare einbauen! 🎉
