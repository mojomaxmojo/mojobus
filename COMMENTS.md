# MojoBus Kommentar-System

## Übersicht

Das MojoBus Kommentar-System unterstützt sowohl **NIP-10 (kind:1)** als auch **NIP-22 (kind:1111)** für Kommentare. Diese duale Unterstützung maximiert die Kompatibilität mit verschiedenen Nostr-Clients wie Primal, Amethyst, Damus und anderen.

## Unterstützte Standards

### NIP-10 (kind:1) - Legacy Replies
- **Verwendet von**: Primal, Amethyst, Damus und den meisten existierenden Nostr-Clients
- **Event-Typ**: kind:1 (kurzer Text-Note)
- **Tag-Struktur**: `e` Tags mit Markern (`root`, `reply`)
- **Beispiel**:
  ```json
  {
    "kind": 1,
    "content": "Das ist ein Kommentar",
    "tags": [
      ["e", "<root-event-id>", "<relay>", "root", "<root-pubkey>"],
      ["p", "<root-pubkey>"]
    ]
  }
  ```

### NIP-22 (kind:1111) - Moderne Kommentare
- **Verwendet von**: Moderne Clients, die NIP-22 vollständig implementieren
- **Event-Typ**: kind:1111 (dedizierter Comment-Typ)
- **Tag-Struktur**: Uppercase Tags (`E`, `A`, `I`) für Root-Scope, lowercase (`e`, `a`, `i`) für Parent-Scope
- **Beispiel**:
  ```json
  {
    "kind": 1111,
    "content": "Das ist ein NIP-22 Kommentar",
    "tags": [
      ["E", "<root-event-id>", "<relay>", "<root-pubkey>"],
      ["K", "<root-kind>"],
      ["P", "<root-pubkey>", "<relay>"],
      ["e", "<root-event-id>", "<relay>", "<root-pubkey>"],
      ["k", "<parent-kind>"],
      ["p", "<parent-pubkey>", "<relay>"]
    ]
  }
  ```

## Architektur

### verwendete Relays

Das Kommentar-System verwendet eine dedizierte Gruppe von öffentlichen Relays, die NIP-22 und NIP-10 vollständig unterstützen:

```typescript
const COMMENT_RELAYS = [
  'wss://relay.mojobus.co',      // Eigener privater Relay
  'wss://relays.mojobus.co',      // Eigener privater Relay
  'wss://relay.primal.net',        // Öffentlicher Relay mit NIP-22 Support
  'wss://relay.damus.io',         // Öffentlicher Relay mit NIP-22 Support
  'wss://nos.lol',               // Öffentlicher Relay mit NIP-22 Support
];
```

### Query-Strategie

Das System führt **parallele Queries** mit verschiedenen Filtern aus, um alle Kommentar-Formate zu erfassen:

1. **NIP-22 Queries** (kind:1111):
   - `#E` und `#e` Tags mit Event-ID
   - `#A` und `#a` Tags mit Addressable-Events (für replaceable/addressable Events)
   - `#I` und `#i` Tags für URL-Scope

2. **NIP-10 Queries** (kind:1):
   - `#e` Tags mit Event-ID
   - Filterung nach "root" oder "reply" Markern

3. **Deduplizierung**:
   - Events werden nach ID dedupliziert
   - Unabhängig vom Relay, auf dem sie gefunden wurden

### Kommentar-Erkennung

#### Top-Level Kommentare

Ein Kommentar wird als Top-Level-Kommentar erkannt, wenn:

**NIP-10 (kind:1)**:
- Hat ein `e` Tag, das auf das Root-Event zeigt
- Der Marker ist "root" oder es ist das einzige `e` Tag

**NIP-22 (kind:1111)**:
- Hat ein `e` Tag, das auf das Root-Event zeigt
- Kein zusätzliches `a` Tag (bei regulären Events)
- Oder hat ein `a` Tag, das auf die korrekte Addresse zeigt (bei addressable Events)

#### Threaded Replies

Ein Kommentar wird als Reply erkannt, wenn:

**NIP-10 (kind:1)**:
- Hat ein `e` Tag, das auf ein anderes Kommentar zeigt
- Der Marker ist "reply" oder nicht gesetzt (bei mehreren `e` Tags)

**NIP-22 (kind:1111)**:
- Hat ein `e` Tag, das auf ein anderes Kommentar zeigt
- Der `k` Tag zeigt auf kind:1111

## Implementierungsdetails

### useComments Hook

Der `useComments` Hook (`src/hooks/useComments.ts`) ist der Kern des Kommentar-Systems:

```typescript
export function useComments(root: NostrEvent | URL, limit?: number) {
  // ...
  return {
    allComments: NostrEvent[],           // Alle gefundenen Events
    topLevelComments: NostrEvent[],       // Top-Level Kommentare (sortiert nach neuem)
    getDescendants: (id) => NostrEvent[], // Alle Nachkommen eines Kommentars
    getDirectReplies: (id) => NostrEvent[] // Direkte Antworten auf einen Kommentar
  };
}
```

### usePostComment Hook

Der `usePostComment` Hook (`src/hooks/usePostComment.ts`) erstellt NIP-22-konforme Kommentare:

```typescript
{
  kind: 1111,
  content: "<Kommentar-Text>",
  tags: [
    // Root-Scope (uppercase)
    ["E", "<root-id>", "", "<root-pubkey>"],
    ["K", "<root-kind>"],
    ["P", "<root-pubkey>"],
    // Parent-Scope (lowercase)
    ["e", "<root-id>", "", "<root-pubkey>"],
    ["k", "<parent-kind>"],
    ["p", "<parent-pubkey>"]
  ]
}
```

### CommentsSection Komponente

Die `CommentsSection` Komponente (`src/components/comments/CommentsSection.tsx`) rendert:

- **Kommentar-Formular** (nur für eingeloggte User)
- **Top-Level Kommentare** (sortiert nach neuem zuerst)
- **Threaded Replies** (verschachtelt und einklappbar)
- **Empty State** (keine Kommentare vorhanden)

## Tag-Struktur Details

### NIP-10 Tags (kind:1)

```json
{
  "kind": 1,
  "tags": [
    // Root-Referenz
    ["e", "<root-event-id>", "<relay>", "root", "<root-pubkey>"],
    // Autor-Referenz
    ["p", "<root-pubkey>", "<relay>"]
  ]
}
```

**Marker-Werte**:
- `"root"` - Top-Level Kommentar auf das Haupt-Event
- `"reply"` - Antwort auf einen anderen Kommentar
- Kein Marker - Ältere Clients ohne Marker

### NIP-22 Tags (kind:1111)

```json
{
  "kind": 1111,
  "tags": [
    // Root-Scope (uppercase)
    ["E", "<root-event-id>", "<relay>", "<root-pubkey>"],
    ["K", "<root-kind>"],
    ["P", "<root-pubkey>", "<relay>"],
    
    // Parent-Scope (lowercase) - gleich wie Root bei Top-Level-Kommentaren
    ["e", "<parent-event-id>", "<relay>", "<parent-pubkey>"],
    ["k", "<parent-kind>"],
    ["p", "<parent-pubkey>", "<relay>"]
  ]
}
```

### Addressable/Replaceable Events

Für addressable (kind 30000-39999) und replaceable (kind 10000-19999) Events müssen **sowohl `a` als auch `e` Tags** verwendet werden (gemäß NIP-22):

```json
{
  "kind": 1111,
  "tags": [
    // Addressable-Referenz
    ["A", "<kind>:<pubkey>:<identifier>"],
    ["e", "<event-id>", "", "<pubkey>"],
    ["K", "<kind>"],
    ["P", "<pubkey>"],
    
    // Parent-Referenz (gleich)
    ["a", "<kind>:<pubkey>:<identifier>"],
    ["e", "<event-id>", "", "<pubkey>"],
    ["k", "<kind>"],
    ["p", "<pubkey>"]
  ]
}
```

## Kompatibilität

### Unterstützte Clients

| Client | Standard | Status |
|--------|----------|--------|
| Primal | NIP-10 (kind:1) | ✅ Vollständig |
| Amethyst | NIP-10 (kind:1) | ✅ Vollständig |
| Damus | NIP-10 (kind:1) | ✅ Vollständig |
| MojoBus | NIP-22 (kind:1111) | ✅ Vollständig |
| Nostrgram | NIP-10 (kind:1) | ✅ Vollständig |
| Snort | NIP-10 (kind:1) | ✅ Vollständig |

### Interoperabilität

**Schreiben in MojoBus** → **Lesen in Primal/Amethyst**:
- ✅ Funktioniert (NIP-22 Events werden als kind:1111 angezeigt)
- ⚠️ Primal/Amethyst zeigen NIP-22 Events als reguläre Notes an

**Schreiben in Primal/Amethyst** → **Lesen in MojoBus**:
- ✅ Funktioniert (NIP-10 Events werden erkannt und als Kommentare angezeigt)
- ✅ Full Threading-Unterstützung

**Schreiben in MojoBus** → **Lesen in MojoBus**:
- ✅ Funktioniert (NIP-22 Events werden korrekt angezeigt)
- ✅ Full Threading-Unterstützung

## Performance

### Optimierung

- **Parallele Queries**: Alle Filter werden parallel abgefragt
- **Event-Deduplizierung**: Events werden nach ID dedupliziert
- **Relay-Gruppierung**: Kommentare nutzen dedizierte Relay-Gruppe statt Standard-Pool
- **Timeout**: 8 Sekunden für alle Queries (5 Relays)
- **Limit**: Max 500 Kommentare pro Query

### Cache-Strategie

React Query cached die Ergebnisse mit dem Query-Key:
```typescript
queryKey: ['comments', rootId, limit]
```

Cache wird invalidiert, wenn:
- Ein neuer Kommentar gepostet wird
- Manuell via `queryClient.invalidateQueries()`

## Best Practices

### Für Entwickler

1. **NIP-22 verwenden** (wenn möglich):
   - Expliziter Comment-Typ (kind:1111)
   - Bessere Semantik für Kommentare
   - Vollständige Tag-Struktur

2. **Sowohl `a` als auch `e` Tags** (für addressable Events):
   ```typescript
   tags.push(['A', `${kind}:${pubkey}:${identifier}`]);
   tags.push(['e', eventId, '', pubkey]);
   ```

3. **Pubkey im `e` Tag**:
   ```typescript
   tags.push(['e', eventId, '', pubkey]);  // 4. Element = pubkey
   ```

4. **Marker für Replies**:
   - NIP-10: `"root"` für Top-Level, `"reply"` für Antworten
   - NIP-22: Uppercase für Root-Scope, lowercase für Parent-Scope

### Für Nutzer

1. **Kommentare schreiben**:
   - Erfordert Login (Nostr-Authentifizierung)
   - Kommentare werden auf alle konfigurierten Write-Relays gepostet

2. **Kommentare lesen**:
   - Automatisch von 5 öffentlichen Relays abgerufen
   - Sowohl NIP-10 als auch NIP-22 Kommentare werden angezeigt
   - Threaded Ansicht mit einklappbaren Replies

## Fehlerbehebung

### Keine Kommentare angezeigt

1. **Prüfe die Browser Console**:
   - Gibt es Fehlermeldungen?
   - Werden Relays erfolgreich verbunden?

2. **Prüfe die Event-ID**:
   - Stimmt die Event-ID überein?
   - Wurde das Event korrekt geladen?

3. **Prüfe das Relay**:
   - Unterstützt das Relay NIP-22?
   - Werden kind:1111 Events gespeichert?

4. **Prüfe den Tag-Filter**:
   - Wird der korrekte Filter verwendet?
   - Werden sowohl `#E` als auch `#e` abgefragt?

### Kommentare nicht synchronisiert

1. **Prüfe Write-Relays**:
   - Werden Kommentare auf alle Write-Relays gepostet?
   - Sind die Write-Relays erreichbar?

2. **Prüfe Read-Relays**:
   - Werden Kommentare von den Read-Relays abgerufen?
   - Haben die Read-Relays die Events erhalten?

3. **Prüfe Event-Duplizierung**:
   - Werden Events korrekt dedupliziert?
   - Gibt es Konflikte zwischen Events?

## Zukunft

### Mögliche Verbesserungen

1. **NIP-22 Vollständigkeit**:
   - Unterstützung für mehr NIP-22 Features
   - Bessere Integration mit addressable Events

2. **Performance**:
   - Optimierte Query-Strategie
   - Bessere Caching-Strategie
   - Lazy Loading für viele Kommentare

3. **UI/UX**:
   - Bessere Thread-Ansicht
   - Mehr Interaktionsmöglichkeiten
   - Integration mit anderen Nostr-Features (Zaps, Reactions)

4. **Kompatibilität**:
   - Unterstützung für mehr Nostr-Clients
   - Bessere Erkennung von verschiedenen Tag-Formaten
   - Fallback-Strategien für ältere Relays

## Referenzen

- **NIP-10**: Text Notes and Threads
- **NIP-22**: Comment
- **NIP-94**: File Metadata
- **Nostr Protocol**: https://github.com/nostr-protocol/nostr
- **NIP Registry**: https://github.com/nostr-protocol/nips

## Lizenz

Diese Dokumentation ist Teil des MojoBus Projekts und steht unter derselben Lizenz wie das Projekt selbst.
