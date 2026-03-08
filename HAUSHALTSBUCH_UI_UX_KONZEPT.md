# Haushaltsbuch UI/UX Konzept

## Übersicht
Das Haushaltsbuch ist eine private Finanzverwaltung nur für Mojo und Susanne, die auf Nostr Events basiert und auf dem privaten Relay `wss://relay.mojobus.co/private` gespeichert wird.

## Zugriffskontrolle
- **Nur für autorisierte Benutzer**: Mojo und Susanne
- **Login erforderlich**: Mit Nostr-Identität (NIP-07/NIP-46)
- **Private Daten**: Alle Daten sind verschlüsselt und nur für die beiden Autoren zugänglich
- **Route**: `/account/budget` - Nur nach Login im Account-Menü sichtbar

## Hauptfunktionen

### 1. Dashboard-Übersicht
- **Monatsauswahl**: Kalender für Zeitraum-Filterung
- **Schnellstatistiken**: 
  - Gesamtbilanz (Einnahmen vs. Ausgaben)
  - Monatliche Budget-Übersicht
  - Top-Kategorien als Visualisierung
- **Letzte Einträge**: Tabelle der neuesten Transaktionen

### 2. Budget-Einträge verwalten
- **CRUD-Operationen**: Erstellen, Lesen, Aktualisieren, Löschen (Soft-Delete)
- **Formular mit Validierung**:
  - Datumspicker mit Kalender
  - Betrag mit Währungsauswahl (EUR, USD, CHF, GBP)
  - Kategorie-Auswahl mit Icons
  - Beschreibung mit Auto-Vervollständigung
  - Tags für Filterung
  - Bezahlt von (Mojo/Susanne)
  - Gemeinschaftsausgabe-Flag
  - Beleg-Upload über Blossom
- **Tabellenansicht**:
  - Sortierbare Spalten
  - Filter nach Kategorien, Tags, Zeitraum
  - Suche in Beschreibungen
  - Aktionsmenü (Bearbeiten/Löschen)

### 3. Statistik und Analysen
- **Detaillierte Statistiken**:
  - Einnahmen/Ausgaben Verteilung
  - Kategorie-Breakdown (Pie-Charts)
  - Monatlicher Trend (Line-Charts)
  - Budget-Auslastung (Progress-Bars)
- **Export-Funktion**: CSV-Export für Steuerzwecke
- **Filter und Vergleiche**: Zeitraum, Kategorien, Personen

### 4. Echtzeit-Funktionen
- **Live-Updates**: Automatische Synchronisation bei Änderungen
- **Offline-First**: Lokale Speicherung mit Background-Sync
- **Konflikt-Auflösung**: Bei parallelen Änderungen

## UI-Komponenten

### Hauptkomponenten
1. **BudgetPage** (`/account/budget`):
   - Container-Komponente mit Tab-Navigation
   - Integriert alle Unterkomponenten
   - Zugriffskontrolle über BudgetAuthGuard

2. **BudgetAuthGuard**:
   - Prüft Nostr-Identität
   - Nur Mojo/Susanne haben Zugriff
   - Zeigt Login/Authorization-UI für nicht-autorisierte Benutzer

3. **BudgetTable**:
   - Responsive Tabelle mit Sortierung
   - Inline-Aktionen (Bearbeiten/Löschen)
   - Farbkodierung für Einnahmen/Ausgaben
   - Mobile-optimierte Ansicht

4. **BudgetEntryForm**:
   - Umfassendes Formular mit React Hook Form + Zod
   - Echtzeit-Validierung
   - Auto-Vervollständigung für Tags/Kategorien
   - Beleg-Upload-Integration

5. **BudgetStats**:
   - Visualisierung mit Charts (Progress, Pie, Bar)
   - Responsive Dashboard-Karten
   - Trend-Analysen

6. **BudgetFilters**:
   - Erweiterte Filter-Sidebar
   - Datumsbereich-Picker
   - Kategorie- und Tag-Filter
   - Suchfunktion

### UI/UX-Prinzipien

#### 1. **Privatsphäre First**
- Klare Indikatoren für private Daten
- Zugriff nur nach expliziter Autorisierung
- Verschlüsselte Kommunikation mit privatem Relay

#### 2. **Mobile First Design**
- Responsive Layout für alle Bildschirmgrößen
- Touch-optimierte Steuerelemente
- Mobile-Menü-Integration

#### 3. **Performance**
- Lazy Loading von Statistiken
- Client-seitiges Caching mit React Query
- Optimistic Updates für schnelle UI

#### 4. **Barrierefreiheit**
- ARIA-Labels für Screenreader
- Tastatur-Navigation
- Hoher Kontrast für bessere Lesbarkeit

#### 5. **User Experience**
- **Onboarding**: Klare Anleitung für neue Nutzer
- **Feedback**: Sofortiges Feedback bei Aktionen (Toasts)
- **Fehlerbehandlung**: Verständliche Fehlermeldungen
- **Leere Zustände**: Hilfreiche Meldungen bei keinen Daten

## Navigation und Zugang

### Desktop
1. **Login** mit Nostr-Identität
2. **Account-Menü** in Header öffnen
3. **"Haushaltsbuch"** auswählen (Wallet-Icon)
4. Direkte Weiterleitung zu `/account/budget`

### Mobile
1. **Login** mit Nostr-Identität
2. **Hamburger-Menü** öffnen
3. **"Haushaltsbuch"** in User Actions-Bereich auswählen
4. Direkte Weiterleitung zu `/account/budget`

### Zugriff ohne Berechtigung
- **Nicht eingeloggt**: Login-Formular mit Hinweis auf benötigte Accounts
- **Falscher Account**: Klare Fehlermeldung mit Liste der autorisierten Accounts
- **Keine Berechtigung**: Redirect zu Login/Account-Wechsel

## Datenmodell und Speicherung

### Nostr Events
- **Kind 9041**: Budget-Einträge
- **Kind 9042**: Kategorie-Definitionen (replaceable)
- **Kind 9043**: Einstellungen (replaceable)

### Event-Struktur
```typescript
interface BudgetEntry {
  id: string;           // UUID
  date: number;         // Unix timestamp
  amount: number;       // Cent (negativ = Ausgabe)
  currency: string;     // "EUR"
  category: string;     // Kategorie-ID
  description: string;  // Beschreibung
  tags: string[];       // Filter-Tags
  payer: 'mojo' | 'susanne';
  shared: boolean;      // Gemeinschaftsausgabe
  attachment?: string;  // Blossom-URL für Beleg
  createdAt: number;    // Erstellungszeit
  deleted?: boolean;    // Soft-Delete
}
```

### Tags für Organisation
- `d`: `budget:YYYY-MM` für monatliche Gruppierung
- `t`: Kategorie und zusätzliche Tags
- `type`: `income`/`expense` für Einnahmen/Ausgaben
- `payer`: `mojo`/`susanne`
- `shared`: `true`/`false`
- `currency`: Währungscode
- `attachment`: Beleg-URL
- `deleted`: Soft-Delete-Flag

## Sicherheitskonzept

### 1. **Authentifizierung**
- Nostr NIP-07/NIP-46 Login
- Nur signierte Events werden akzeptiert
- Pubkey-Validierung gegen Autoren-Liste

### 2. **Autorisierung**
- Server-seitige Filterung auf Relay-Ebene
- Client-seitige Validierung der Pubkeys
- Separate Relay-Konfiguration für Budget-Daten

### 3. **Datenintegrität**
- Immutable Events für Audit-Trail
- Digitale Signaturen aller Events
- Versionskontrolle durch neue Events (nicht Updates)

### 4. **Privatsphäre**
- Private Relay mit Authentifizierung
- Optional: NIP-04 Verschlüsselung für sensitive Daten
- Keine öffentliche Exposition der Daten

## Technische Integration

### Bestehende Hooks
- `useNostr()`: Nostr-Verbindung
- `useNostrPublish()`: Event-Publishing
- `useAuthors()`: Autoren-Management
- `useCurrentUser()`: Aktueller Nutzer
- `useToast()`: Benutzerfeedback

### Neue Hooks
- `useBudget()`: Zentrale Budget-Logik
- `useBudgetEntries()`: Einträge abrufen
- `useCreateBudgetEntry()`: Neuen Eintrag erstellen
- `useBudgetStats()`: Statistiken berechnen

### Relay-Konfiguration
```typescript
const budgetRelayConfig = {
  relayUrls: ['wss://relay.mojobus.co/private'],
  maxRelays: 1,
  queryTimeout: 5000,
  allowedAuthors: [mojoPubkey, susannePubkey],
};
```

## Erweiterungsmöglichkeiten

### Kurzfristig (MVP+)
1. **Beleg-Upload**: Integration mit Blossom
2. **Währungsumrechnung**: Automatische Umrechnung bei Reisen
3. **Wiederkehrende Ausgaben**: Template für regelmäßige Zahlungen
4. **Budget-Alarme**: Benachrichtigungen bei Überschreitung

### Mittelfristig
1. **Kategorien-Management**: Benutzerdefinierte Kategorien
2. **Berichte**: PDF-Export mit Diagrammen
3. **Zielsetzungen**: Sparziele und Verfolgung
4. **KI-Kategorisierung**: Automatische Vorschläge

### Langfristig
1. **Steuer-Export**: Vorbereitete Steuerberichte
2. **Multiwährung**: Parallelführung mehrerer Währungen
3. **Investitionen-Tracking**: Wertentwicklung von Assets
4. **API-Integration**: Bank-APIs für automatische Importe

## Testing und Qualitätssicherung

### Unit Tests
- Form-Validierung mit Zod
- Hook-Logik mit React Testing Library
- Utility-Funktionen für Datenverarbeitung

### Integration Tests
- End-to-End-Tests für CRUD-Operationen
- Relay-Kommunikation Mocking
- Authentifizierungs-Flows

### Benutzertests
- Usability-Testing mit Mojo und Susanne
- Mobile-Experience-Validierung
- Accessibility-Audit

## Deployment und Wartung

### Build-Prozess
- TypeScript-Kompilierung
- Tree-Shaking für optimale Bundle-Größe
- Code-Splitting für Lazy Loading

### Monitoring
- Error Tracking mit Console-Logs
- Performance-Metriken
- User-Feedback-Sammlung

### Updates
- Backward-Compatible Event-Strukturen
- Migrations-Skripts für Daten-Updates
- Graduelle Rollouts neuer Features

---

**Letzte Aktualisierung**: {{ date }}
**Status**: Implementiert und integriert
**Zugänglich unter**: `/account/budget` (nach Login)
**Autoren**: Mojo, Susanne
**Daten-Speicher**: `wss://relay.mojobus.co/private`