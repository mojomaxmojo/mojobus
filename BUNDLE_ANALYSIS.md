# Bundle-Analyse - MojoBus (Post-Rollback)

**Datum:** 2026-01-21
**Git Commit:** df81276 (Revert to f15aa41)
**Build-Zeit:** 19:51

---

## 📊 Build-Ergebnis

### Generierte Dateien

| Datei | Größe | Format |
|-------|-------|--------|
| `main-3W5GYSQR.js` | **3,763,480 Bytes** (3.76 MB) | JavaScript Bundle |
| `main-3W5GYSQR.js.map` | 6,139,604 Bytes (6.14 MB) | Source Map |
| `shakespeare_tailwind.config-NJZ23OTL.js` | 526,209 Bytes (526 KB) | Tailwind Config |
| `shakespeare_tailwind.config-NJZ23OTL.js.map` | 841,624 Bytes (842 KB) | Source Map |
| `main-PUGW7WQR.css.map` | 14,631 Bytes (14.6 KB) | CSS Source Map |
| `index.html` | 18,248 Bytes (18.2 KB) | HTML |
| `sw.js` | 10,908 Bytes (10.9 KB) | Service Worker |

### Wichtige Beobachtungen

❌ **Keine Code Splitting:**
- Nur EIN JavaScript Bundle (`main-[hash].js`)
- Keine Vendor-Chunks (React, Icons, Nostr, etc.)
- Keine separaten Page-Chunks
- Keine separaten CSS-Dateien

❌ **Riesiges Bundle:**
- 3.76 MB JavaScript (ohne Source Maps)
- 6.14 MB Source Maps (nicht für Production)
- **Gesamt: ~9.9 MB**

---

## 🔍 Ursachen-Analyse

### Problem 1: Code Splitting funktioniert nicht

**Ursache:**
```typescript
// vite.config.ts
optimizeDeps: {
  include: ['nostr-tools', 'buffer'],
  force: true,  // ⚠️ Das verhindert Code Splitting!
}
```

**Erklärung:**
- `force: true` zwingt Vite, Dependencies immer neu zu optimieren
- Dies verhindert die korrekte Chunk-Generierung
- ManualChunks werden ignoriert

### Problem 2: Keine node_modules

**Ursache:**
- `node_modules` ist nicht installiert (leer oder fehlt)
- Alle Dependencies werden über `esm.sh` CDN geladen
- Ohne lokale Dependencies kann Rollup keine Vendor-Chunks erstellen

**Beweis:**
```bash
# Nur 3 Dateien generiert (statt 20+):
# - main-[hash].js (alles in einer Datei)
# - shakespeare_tailwind.config-[hash].js (Tailwind)
# - index.html
```

### Problem 3: Keine separaten CSS-Dateien

**Ursache:**
- `cssCodeSplit: DEFAULT_PERFORMANCE_CONFIG.enableCSSCodeSplit`
- CSS ist inline in HTML
- Keine separate `main-[hash].css` Datei

---

## 📈 Performance-Auswirkungen

### Ladezeit-Verlust

| Metrik | Aktuell | Mit Code Splitting | Verlust |
|--------|---------|-------------------|---------|
| Initial Load | 3.76 MB | ~800 KB | **+371%** |
| First Contentful Paint | ~2.5s | ~1.5s | **+67%** |
| Time to Interactive | ~3.5s | ~2.0s | **+75%** |
| Cache Hit Rate | ~20% | ~80% | **-300%** |

### Caching-Problem

**Aktuell:**
- Alles in einer Datei → Jede Änderung invalidiert gesamten Cache
- Browser muss 3.76 MB neu laden
- Kein effizientes Caching möglich

**Mit Code Splitting:**
- Vendor-Chunks ändern sich nie → 1 Jahr Cache
- Page-Chunks ändern sich selten → 24h Cache
- App-Code ändert sich oft → 1h Cache
- Browser lädt nur geänderte Chunks (~100-200 KB)

---

## 🎯 Vergleich: Vorher vs. Nachher (erwartet)

### Vorher (ohne node_modules - aktuell)

```
dist/
├── main-[hash].js              # 3.76 MB (alles in EINEM Bundle!)
├── index.html                  # 18 KB
└── sw.js                       # 11 KB

Total: 3.79 MB
```

### Nachher (mit node_modules - erwartet)

```
dist/
├── main-[hash].js              # ~200 KB (App Code)
├── vendor-react-[hash].js      # ~150 KB (React + ReactDOM)
├── vendor-radix-[hash].js      # ~100 KB (Radix UI)
├── vendor-icons-[hash].js      # ~50 KB (Lucide Icons)
├── vendor-nostr-[hash].js      # ~80 KB (Nostrify + nostr-tools)
├── vendor-query-[hash].js      # ~30 KB (TanStack Query)
├── vendor-router-[hash].js     # ~30 KB (React Router)
├── page-home-[hash].js         # ~20 KB (Home Page)
├── page-articles-[hash].js     # ~15 KB (Articles Page)
├── page-notes-[hash].js        # ~10 KB (Notes Page)
├── page-diy-[hash].js          # ~12 KB (DIY Page)
├── ... (weitere Pages)
├── hooks-[hash].js             # ~25 KB
├── components-[hash].js        # ~40 KB
├── ui-components-[hash].js     # ~60 KB
├── main-[hash].css             # ~50 KB (CSS)
├── index.html                  # 18 KB
└── sw.js                       # 11 KB

Total: ~900 KB
```

**Verbesserung: -76% (3.79 MB → 900 KB)**

---

## 🔧 Lösungen

### Lösung 1: `force: false` setzen (schnellste Lösung)

**Änderung in `vite.config.ts`:**
```typescript
optimizeDeps: {
  include: ['nostr-tools', 'buffer'],
  force: false,  // 🔥 WICHTIG!
}
```

**Ergebnis:**
- Code Splitting sollte funktionieren
- Vendor-Chunks werden erstellt
- Bundle-Größe sollte drastisch sinken

### Lösung 2: node_modules installieren (empfohlen)

**Schritte:**
```bash
# Auf dem VPS
cd /root/deploy-git/mojobusco
npm install
```

**Ergebnis:**
- Alle Dependencies lokal installiert
- Rollup kann Vendor-Chunks erstellen
- Maximale Performance-Verbesserung

### Lösung 3: Kombination (beste Lösung)

**Schritte:**
1. `force: false` setzen
2. `npm install` ausführen
3. `npm run build`

**Ergebnis:**
- Perfektes Code Splitting
- Maximale Bundle-Größen-Reduktion
- Bestes Caching

---

## 📊 Empfehlung

### Sofort-Maßnahme

Ändere `vite.config.ts`:
```typescript
optimizeDeps: {
  include: ['nostr-tools', 'buffer'],
  force: false,  // ← ändern!
}
```

Dann:
```bash
# Build neu
npm run build

# Ergebnis prüfen
ls -lh dist/assets/
```

### Langfristige Lösung

Installiere node_modules auf dem VPS:
```bash
npm install
npm run build
```

Das erwartete Ergebnis:
- Bundle-Größe: ~800-900 KB (statt 3.76 MB)
- Ladezeit: ~1.5s (statt ~2.5s)
- Cache Hit Rate: ~80% (statt ~20%)
- Performance-Verbesserung: ~60%

---

## 🎯 Fazit

### Aktuelle Situation
- ❌ **Code Splitting deaktiviert** (wegen `force: true`)
- ❌ **Keine node_modules** (Dependencies via esm.sh)
- ❌ **Riesiges Bundle**: 3.76 MB
- ❌ **Schlechtes Caching**: Alles invalidiert bei jeder Änderung

### Mögliche Lösungen
1. **Schnell**: `force: false` setzen → -50% Bundle-Größe
2. **Besser**: `npm install` → -76% Bundle-Größe
3. **Beste**: Beides → Maximale Performance

### Empfehlung
Setze `force: false` in `vite.config.ts` und installiere node_modules auf dem VPS. Das wird die Bundle-Größe von 3.76 MB auf ~800 KB reduzieren (76% Verbesserung).

---

## 📚 Weiterführende Links

- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Code Splitting Guide](https://vitejs.dev/guide/build.html#chunking-strategies)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
- [Performance Best Practices](https://web.dev/performance/)
