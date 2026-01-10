# 🏷️ Tag-Konfigurationsübersicht für MojoBus

Diese Übersicht zeigt, welche Tags für welche Untermenüpunkte zuständig sind und wie die Tags organisiert sind.

---

## 📋 Inhaltsverzeichnis

1. [Untermenüpunkte und ihre Tag-Kategorien](#untermenüpunkte-und-ihre-tag-kategorien)
2. [Tag-Gruppenstruktur](#tag-gruppenstruktur)
3. [Automatische vs. Manuelle Tag-Zuweisung](#automatische-vs-manuelle-tag-zuweisung)
4. [Tag-Konfiguration pro Tab](#tag-konfiguration-pro-tab)
5. [Validierung und Regeln](#validierung-und-regeln)

---

## 📌 Untermenüpunkte und ihre Tag-Kategorien

### 1️⃣ **Länder** (Countries)
**Route**: `/plaetze/:country`, `/bilder/:country`, `/notes/:country`

**Verantwortliche Tag-Gruppen**:
- ✅ **Länder** (TAG_GROUPS[0])

**Verfügbare Tags**:
```javascript
// Länder-Tags
🇵🇹 Portugal
🇪🇸 Spanien  
🇮🇹 Italien
🇫🇷 Frankreich
🇩🇪 Deutschland
🇭🇷 Kroatien
🇬🇷 Griechenland
🇧🇪 Belgien
🇱🇺 Luxemburg
```

**Beschreibung**: 
- Tags werden automatisch basierend auf der gewählten Route hinzugefügt
- Werden für geografische Filterung auf allen Seiten (Plätze, Bilder, Notes) verwendet
- Beispiel: `/plaetze/portugal` → Filtert Plätze in Portugal

---

### 2️⃣ **DIY** (Do-It-Yourself)
**Route**: `/artikel/diy/:category`

**Verantwortliche Tag-Gruppen**:
- ✅ **Vanlife** (TAG_GROUPS[1]) - Camping, Wildcamping, Stellplatz, 4x4, Digital Nomade
- ✅ **Technik** (TAG_GROUPS[2]) - Solarenergie, Batterie, Strom, Internet, Navigation, Reparatur, 12V

**Verfügbare Tags**:
```javascript
// Vanlife-Tags
🏕️ Camping
🌲 Wildcamping
🅿️ Stellplatz
🚙 4x4
💻 Digital Nomade
🚐 Vanlife
🏠 Wohnmobil
⛺ Zelt

// Technik-Tags
☀️ Solarenergie
🔋 Batterie
⚡ Strom
📡 Internet
🧭 Navigation
🔧 Reparatur
🔌 12V System
⚙️ Elektronik
```

**Beschreibung**:
- Tags werden manuell beim Veröffentlichen von DIY-Artikeln ausgewählt
- Spezifisch für Vanlife- und Technik-bezogene Inhalte
- Unterstützt Unterfilterung innerhalb der DIY-Kategorie

---

### 3️⃣ **Nature** (Natur & Umwelt)
**Route**: `/bilder/natur/:category`

**Verantwortliche Tag-Gruppen**:
- ✅ **Natur & Umwelt** (TAG_GROUPS[4]) - Strand, Ocean, Berg, Natur, Offgrid, Wildnis, Meer, Küste

**Verfügbare Tags**:
```javascript
// Natur & Umwelt Tags
🏖️ Strand
🌊 Ocean
🏔️ Berg
🌲 Natur
🏡 Offgrid
🌿 Wildnis
🌊 Meer
🏖️ Küste
🌅 Sonne
🏖️ Wiese
🌄 Wald
🌲️ Wasserfall
🌲️ Wald
🏖️ Strand (Alternative)
```

**Beschreibung**:
- Tags werden automatisch basierend auf der gewählten Natur-Kategorie hinzugefügt
- Wird für Kategorisierung von Natur-Bildern verwendet
- Beispiel: `/bilder/natur/strand` → Filtert Strand-Bilder

---

## 🏷️ Tag-Gruppenstruktur

Die Tags sind in 7 Hauptgruppen organisiert:

### 1. 🌍 Länder (Countries)
- **Gruppen-ID**: `TAG_GROUPS[0]`
- **Zweck**: Geografische Kategorisierung
- **Anzahl Tags**: 12
- **Beispiel-Tags**: `portugal`, `spanien`, `italien`, `deutschland`

### 2. 🚐 Vanlife
- **Gruppen-ID**: `TAG_GROUPS[1]`
- **Zweck**: Wohnform- und Reiseart
- **Anzahl Tags**: 8
- **Beispiel-Tags**: `camping`, `wildcamping`, `stellplatz`, `vanlife`

### 3. ⚡ Technik
- **Gruppen-ID**: `TAG_GROUPS[2]`
- **Zweck**: Technische Ausrüstung und Systeme
- **Anzahl Tags**: 8
- **Beispiel-Tags**: `solarenergie`, `batterie`, `strom`, `internet`

### 4. 🧘 Lifestyle
- **Gruppen-ID**: `TAG_GROUPS[3]`
- **Zweck**: Lebensstil und Interessen
- **Anzahl Tags**: 8
- **Beispiel-Tags**: `kochen`, `fitness`, `freedom`, `minimalismus`

### 5. 🌲 Natur & Umwelt
- **Gruppen-ID**: `TAG_GROUPS[4]`
- **Zweck**: Naturlandschaften und Aktivitäten
- **Anzahl Tags**: 10
- **Beispiel-Tags**: `strand`, `berg`, `natur`, `offgrid`

### 6. 🏸️ Aktivitäten
- **Gruppen-ID**: `TAG_GROUPS[5]`
- **Zweck**: Freizeitaktivitäten und Hobbys
- **Anzahl Tags**: 8
- **Beispiel-Tags**: `wandern`, `surfen`, `klettern`, `fotografie`

### 7. 🐾 Pets
- **Gruppen-ID**: `TAG_GROUPS[6]`
- **Zweck**: Haustiere und Reisebegleiter
- **Anzahl Tags**: 6
- **Beispiel-Tags**: `leon`, `hund`, `camper-hund`

---

## 🤖 Automatische vs. Manuelle Tag-Zuweisung

### Automatisch Hinzugefügte Tags

Tags, die **automatisch vom System** basierend auf Kontext hinzugefügt werden:

| Tag-Typ | Wann automatisch hinzugefügt? | Beispiel |
|---------|--------------------------------|---------|
| **Länder-Tags** | Immer bei Länder-Routen | `/plaetze/portugal` → `#portugal` |
| **Untermenü-Tags** | Immer bei entsprechenden Untermenüpunkten | DIY-Route → `#diy` |
| **Content-Type-Tags** | Immer bei allen Inhalten | Artikel → `#artikel`, Notes → `#note` |
| **Standard-Tags** | Werden als Defaults verwendet | Artikel → `#story` |

### Manuell Ausgewählte Tags

Tags, die **vom User beim Veröffentlichen ausgewählt** werden:

| Inhaltstyp | Welche Tags kann User auswählen? | Wo stehen sie zur Verfügung? |
|-------------|--------------------------------|----------------------------------|
| **Artikel** | Vanlife-Tags, Technik-Tags, Lifestyle-Tags, Länder-Tags | Publish-Form: Tag-Select |
| **DIY-Artikel** | Vanlife-Tags, Technik-Tags | Publish-Form: Tag-Select (gefiltert) |
| **Plätze** | Ortstyp-Tags, Ausstattungs-Tags, Länder-Tags | Publish-Form: Tag-Select |
| **Bilder** | Natur-Tags, Qualität-Tags, Länder-Tags | Publish-Form: Tag-Select |
| **Notes** | Lifestyle-Tags, Vanlife-Tags, Länder-Tags | Publish-Form: Tag-Select |

---

## 📝 Tag-Konfiguration pro Tab

### 📖 Artikel Tab
**Route**: `/artikel`

**Verwendete Tags**:
```javascript
// Pflicht-Tags
#artikel, #article

// Optionale Tags (Auswahlmöglichkeit)
#vanlife, #technik, #reisen, #leben, #anleitung, #erfahrung,
#solar, #4x4, #navigation, #reparatur, #outdoor,
#europa, #portugal, #spanien, #italien, #griechenland

// Defaults (werden automatisch hinzugefügt)
#story, #travel
```

**Tag-Gruppen**:
- 🚐 Vanlife (auswählbar)
- ⚡ Technik (auswählbar)
- 🌍 Länder (auswählbar)
- 🧘 Lifestyle (auswählbar)

---

### 📍 Plätze Tab
**Route**: `/plaetze`

**Verwendete Tags**:
```javascript
// Pflicht-Tags
#location, #places, #place

// Optionale Tags (Auswahlmöglichkeit)
#campingplatz, #wildcamping, #stellplatz, #aussichtspunkt,
#strand, #berg, #see, #stadt, #natur,
#portugal, #spanien, #italien, #frankreich, #deutschland,
#algarve, #andalusien, #katalonien, #toskana,
#strom, #wasser, #wc, #dusche, #wlan, #shop,
#familien, #paare, #single, #wohnmobil, #zelt

// Defaults (werden automatisch hinzugefügt)
#location, #vanlife
```

**Tag-Gruppen**:
- 🏕️ Ortstypen (auswählbar)
- 🌍 Länder (auswählbar)
- 🏡 Ausstattung (auswählbar)

---

### 💬 Notes Tab
**Route**: `/notes`

**Verwendete Tags**:
```javascript
// Pflicht-Tags
#notes, #note

// Optionale Tags (Auswahlmöglichkeit)
#vanlife, #camping, #wildcamping, #stellplatz,
#solarenergie, #offgrid, #beachlife, #sunset,
#portugal, #spanien, #italien, #frankreich, #deutschland,
#kochen, #fitness, #travel, #nature

// Defaults (werden automatisch hinzugefügt)
#daily
```

**Tag-Gruppen**:
- 🚐 Vanlife (auswählbar)
- 🌍 Länder (auswählbar)
- 🧘 Lifestyle (auswählbar)
- 🌲 Natur (auswählbar)

---

### 🖼️ Bilder Tab
**Route**: `/bilder`

**Verwendete Tags**:
```javascript
// Pflicht-Tags
#medien, #media, #bilder, #images

// Optionale Tags (Auswahlmöglichkeit)
// Vanlife-spezifisch
#vanlife, #camping, #reise, #strand, #sunset, #natur,
#portugal, #spanien, #italien, #frankreich

// Medien-Typen
#photo, #video, #audio, #panorama, #timelapse

// Qualität
#4k, #hd, #drone, #professional

// Länder
#portugal, #spanien, #italien, #frankreich, #deutschland

// Defaults (werden automatisch hinzugefügt)
#photo
```

**Tag-Gruppen**:
- 🚐 Vanlife (auswählbar)
- 🌍 Länder (auswählbar)
- 📸 Medientypen (auswählbar)
- ⭐ Qualität (auswählbar)

---

## 🌲 Natur (Natur-Bilder) Tab
**Route**: `/bilder/natur/:category`

**Verwendete Tags**:
```javascript
// Pflicht-Tags (wird automatisch basierend auf Route gesetzt)
#natur + [kategorie-tag]

// Kategorien
#strand, #berg, #see, #wald, #wiese, #wasserfall, #tiere, #sunset

// Beispiel
/bilder/natur/strand → #natur, #strand
/bilder/natur/berg → #natur, #berg
```

**Natur-Kategorien**:
- 🏖️ Strand
- ⛰️ Berg
- 🌊 See
- 🌲 Wald
- 🏖️ Wiese
- 🌊 Wasserfall
- 🐾 Tiere
- 🌅 Sonne

---

## ✅ Validierung und Regeln

### Pflicht-Tags

Jedes Inhaltselement MUSS mindestens einen **Pflicht-Tag** haben:

| Inhaltstyp | Pflicht-Tag(s) |
|-------------|---------------|
| **Artikel** | `#artikel`, `#article` |
| **Plätze** | `#location`, `#places`, `#place` |
| **Bilder** | `#medien`, `#media`, `#bilder`, `#images` |
| **Notes** | `#notes`, `#note` |

### Tag-Regeln

1. **Pflicht-Tags** werden IMMER hinzugefügt
2. **Optionale Tags** können ausgewählt werden
3. **Länder-Tags** werden bei Länder-Routen automatisch hinzugefügt
4. **Untermenü-Tags** (`#diy`, `#nature`) werden bei entsprechenden Routen automatisch hinzugefügt
5. **Default-Tags** werden als Fallback verwendet (wenn keine optionalen Tags ausgewählt wurden)
6. Ein Inhalt kann mehrere Tags aus verschiedenen Gruppen haben (z.B. `#artikel` + `#vanlife` + `#portugal`)

### Duplicate-Vermeidung

Das System verhindert automatisch doppelte Tags. Wenn ein Tag bereits existiert, wird er nicht nochmal hinzugefügt.

### Tag-Syntax

Alle Tags werden in der Form `#tagname` ohne Leerzeichen gespeichert.

### Tag-Validierung

- Tags dürfen nur Buchstaben, Zahlen und Bindestriche enthalten
- Tags müssen mit einem Buchstaben beginnen
- Mindestens 2 Zeichen, maximal 30 Zeichen
- Groß-/Kleinschreibung wird für die Suche normalisiert

---

## 📊 Zusammenfassung der Tag-Organisation

### Alle Tag-Gruppen: 7
### Alle Tags gesamt: ~60
### Untermenüpunkte: 3
### Haupt-Tabs: 4 (Artikel, Plätze, Bilder, Notes)

### Tag-Hierarchie

```
Tag-System
├── Länder-Tags (12) - Geografisch
│   ├── Portugal
│   ├── Spanien
│   ├── Italien
│   ├── Frankreich
│   ├── Deutschland
│   └── ...
│
├── Untermenü-Tags (3) - Navigation
│   ├── DIY
│   ├── Nature
│   └── ...
│
├── Inhaltstyp-Tags (4) - Klassifikation
│   #artikel, #place, #medien, #note
│
└── Themen-Tags (~40) - Inhalt
    ├── Vanlife (8)
    ├── Technik (8)
    ├── Lifestyle (8)
    ├── Natur (10)
    ├── Aktivitäten (8)
    └── ...
```

### Verwendung im Code

```javascript
// Tag-Konfiguration importieren
import { TAG_GROUPS } from '@/config/tags';
import { getTabCategories } from '@/config/tagConfigs';

// Alle verfügbaren Tags für einen Tab
const availableTags = getTabCategories('article');

// Tags validieren
import { validateTabTags } from '@/config/tagConfigs';
const result = validateTabTags(['#vanlife', '#portugal'], 'article');
// Returns: { isValid: true, errors: [], warnings: [] }

// Tags gruppieren für UI
const groupedTags = TAG_GROUPS.reduce((acc, group) => {
  acc[group.name] = group.tags;
  return acc;
}, {});
```

### Best Practices

1. **Verwende Standard-Tags**: Nutze die definierten Tags statt neue zu erfinden
2. **Gruppiere logisch**: Wähle Tags aus den entsprechenden Gruppen für konsistente Kategorisierung
3. **Sei spezifisch**: Statt nur `#vanlife`, nutze `#vanlife` + `#camping` + `#portugal`
4. **Bleibe konsistent**: Nutze die gleichen Tags für ähnliche Inhalte
5. **Validiere vor dem Speichern**: Nutze die integrierte Validierungsfunktionen

---

## 🚀 Schnellreferenz

| Was tun? | Worauf achten? |
|-----------|---------------|
| **Länder-Seite besuchen** | Länder-Tags werden automatisch hinzugefügt |
| **DIY-Artikel veröffentlichen** | Vanlife- und Technik-Tags auswählen |
| **Natur-Bilder hochladen** | Entsprechende Natur-Kategorie wählen (Strand, Berg, etc.) |
| **Note schreiben** | Lifestyle-Tags oder Vanlife-Tags auswählen |
| **Platz hinzufügen** | Ortstyp-, Ausstattungs- und Länder-Tags auswählen |

---

*Diese Übersicht basiert auf der aktuellen Tag-Konfiguration in `/src/config/tags.ts`, `/src/config/tagConfigs.ts` und `/src/config/contentCategories.ts`*
