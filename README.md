# MojoBus Blog

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=nostr%3A%2F%2Fnpub1jvnpg4c6ljadf5t6ry0w9q0rnm4mksde87kglkrc993z46c39axsgq89sc%2Fgit.shakespeare.diy%2Fpixel-diary)

Ein vollständig Nostr-integrierter Blog für Perpetual Traveler – Unser Leben am Meer.

## 🌊 Über das Projekt

Kein fester Wohnsitz, kein Alltag im Hamsterrad – nur wir und Leon (Lionhunter), unser RV und das Meer. Wir leben als Perpetual Traveler, meist direkt am Strand, autark mit Solarstrom und minimalistisch unterwegs.

Das Rauschen der Wellen ist unser Wecker, Sonnenuntergänge sind unser Alltag. Jeder Tag bringt neue Orte, neue Begegnungen und das Gefühl, wirklich frei zu sein.

Auf Nostr teilen wir Geschichten, Tipps und Einblicke in dieses Leben zwischen Sand und Horizont. Vielleicht ruft es auch dich – nach Abenteuer, Einfachheit und Freiheit. 🌊🚐✨

## ✨ Features

- **Vollständige Nostr-Integration**: Alle Inhalte werden auf Nostr veröffentlicht und geladen
- **Longform Artikel**: Ausführliche Artikel (NIP-23, kind 30023) mit Markdown-Unterstützung
- **Short Notes**: Kurze Updates und Gedanken (kind 1) mit Infinite Scroll
- **Nostr-Login**: Sichere Authentifizierung über Nostr-Signers
- **Kommentare**: Dezentrales Kommentarsystem mit NIP-22
- **Responsive Design**: Optimiert für Mobile, Tablet und Desktop
- **Ocean Theme**: Angepasstes Farbschema inspiriert vom Meer
- **Caching**: Intelligentes Caching für optimale Performance

## 🎨 Design

Das Design verwendet ein Ocean-Theme mit Farben inspiriert vom Meer:
- Primärfarbe: Ocean Blue (#0891B2)
- Akzentfarbe: Tropical Aqua (#00BCD4)
- Sanfte Übergänge und Wave-Animationen

## 🚀 Tech Stack

- **React 18** mit TypeScript
- **Nostrify** für Nostr-Integration
- **TailwindCSS** für Styling
- **TanStack Query** für State Management und Caching
- **React Router** für Navigation
- **shadcn/ui** für UI-Komponenten
- **React Markdown** für Artikel-Rendering

## 📝 Nostr-Konfiguration

Die Autoren sind in `src/config/nostr.ts` konfiguriert:

```typescript
authors: {
  mojo: 'npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf',
  partner: 'npub1jn4arsy5pzqausut0u79x2mnur2dd34szcxnlc5c5407f828002qdls5wz',
}
```

## 🏗️ Projektstruktur

```
src/
├── components/       # React-Komponenten
│   ├── Header.tsx   # Haupt-Navigation
│   ├── Footer.tsx   # Footer mit Kontaktinfos
│   └── ArticleView.tsx # Artikel-Anzeige
├── pages/           # Seiten-Komponenten
│   ├── Home.tsx     # Startseite
│   ├── Articles.tsx # Artikel-Übersicht
│   ├── Notes.tsx    # Notes Feed
│   ├── About.tsx    # Über uns
│   └── Publish.tsx  # Veröffentlichungs-Formular
├── hooks/           # Custom Hooks
│   ├── useLongformArticles.ts # Longform-Artikel laden
│   └── useNotes.ts  # Notes mit Infinite Scroll
└── config/          # Konfiguration
    └── nostr.ts     # Nostr-Konfiguration
```

## 📱 Hauptmenü

- **Home**: Startseite mit Hero-Section und aktuellen Artikeln
- **Artikel**: Übersicht aller Longform-Artikel mit Suche und Filter
- **Notes**: Feed mit kurzen Updates (Infinite Scroll)
- **About**: Über uns mit Kontaktmöglichkeiten
- **Login**: Nostr-Login mit Untermenü für "Sign up" und "Veröffentlichen"

## ✍️ Veröffentlichen

Eingeloggte Benutzer können über das Menü "Veröffentlichen" auf zwei Arten Inhalte erstellen:

### Notes (kind 1)
- Kurze Texte und Updates
- Tags für Kategorisierung
- Schnelles Teilen von Gedanken

### Artikel (kind 30023)
- Ausführliche Artikel mit Markdown
- Titel, Zusammenfassung und Bild
- Tags für bessere Auffindbarkeit
- Automatische URL-Generierung

## 🔍 Artikel-Anzeige

Artikel werden über NIP-19 `naddr1`-Identifier aufgerufen:
- Route: `/:naddr1...`
- Markdown-Rendering
- Autor-Informationen
- Kommentar-Sektion
- Responsive Bilder

## 🎯 Hashtags

Das Projekt verwendet folgende Hashtags:
- #offgridlife
- #beachlife
- #vanlife
- #oceanview
- #btc

## 📧 Kontakt

- **Lightning**: wiseboot30@zeusnuts.com
- **NIP-05**: mojomojo@iris.to
- **Website**: mojobus.org

## 🛠️ Entwicklung

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Typecheck
npm run typecheck

# Build
npm run build
```

## 📄 Lizenz

Open Source – anpassbar und transparent.

---

**Vibed with ❤️ using [MKStack](https://soapbox.pub/mkstack)**
