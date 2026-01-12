# Performance Tuning Guide für MojoBus

## Übersicht der durchgeführten Optimierungen

### ✅ Bereits implementiert (Jan 2025)

1. **Code Splitting & Lazy Loading für Routes**
   - Alle Seiten außer Home werden jetzt lazy geladen
   - Reduziert initiales Bundle signifikant
   - Datei: `src/AppRouter.tsx`

2. **Verbessertes Chunking-Strategy**
   - Granulareres Splitting von Radix UI Komponenten
   - Getrennte Chunks für Nostr, Query, Icons
   - Reduziert Bundle-Größe für einzelne Pages
   - Datei: `vite.config.ts`

3. **Optimierte Performance-Konfiguration**
   - itemsPerPage: 25 → 20 (weniger Daten pro Request)
   - preloadThreshold: 100 → 200px (späteres Laden)
   - staleTime: 10 → 15 Minuten (weniger Requests)
   - gcTime: 1 → 2 Stunden (längerer Cache)
   - queryTimeout: 2000 → 1500ms (schnellere Fehlerbehandlung)
   - Cache-Strategie: 'stale-while-revalidate' → 'cache-first'
   - Datei: `src/config/performance.ts`

4. **Entfernung von console.log**
   - Alle debug-log Anweisungen aus `useLongformArticles.ts` entfernt
   - Verbessert Production Performance

---

## 🚧 Noch zu implementierende Optimierungen

### 1. Image Optimization (HOCHPRIORITÄT) ⚠️

**Problem:**
- `bangkok.png` ist 3.1 MB! (extrem groß)
- Keine Lazy Loading für Bilder
- Keine Responsive Images (srcset)
- Keine Next-Gen Formate (WebP/AVIF)

**Lösungen:**

#### A. Bild-Kompression
```bash
# Installiere Bildoptimierungs-Tools
npm install --save-dev sharp imagemin imagemin-webp imagemin-mozjpeg imagemin-pngquant

# Oder verwende Cloudflare Images für automatische Optimierung
```

#### B. Lazy Loading für Bilder implementieren
Erstelle eine neue Komponente `LazyImage.tsx`:

```tsx
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export function LazyImage({ src, alt, className, placeholder }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
      />
    </div>
  );
}
```

#### C. Cloudflare Images Worker
Verwende den bereits vorhandenen Worker für automatische Bildoptimierung:

```javascript
// cloudflare-images-worker.js
// Implementiert automatische WebP-Konvertierung und Größenanpassung
```

### 2. Bundle-Größe weiter reduzieren (MITTEL)

**Aktuelle Größe:**
- main-HEEMNW5Z.js: ~2.76 MB
- shakespeare_tailwind.config-F3YY65ZZ.js: ~526 KB

**Lösungen:**

#### A. Tree Shaking optimieren
```typescript
// vite.config.ts - aktiviere aggressive tree shaking
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Lucide Icons - Tree Shake unused icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // ...
        }
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
  },
});
```

#### B. Icon-Importe optimieren
Statt:
```tsx
import * as Icons from 'lucide-react';
```

Verwenden:
```tsx
// Importiere nur benötigte Icons
import { Menu, Home, FileText, Camera, Info } from 'lucide-react';
```

#### C. Tailwind Reduzieren
```css
/* src/index.css - Entferne unused utilities */
@tailwind base;
@tailwind components;
/* Nur die wirklich benötigten utilities laden */
@layer utilities {
  @tailwind utilities !important;
}
```

### 3. Header-Optimierung (MITTEL)

**Problem:**
- Header rendert alle Dropdown-Menüs sofort im DOM
- Zu viele Sub-Menü-Einträge werden gerendert

**Lösung:**

Implementiere Virtualisierung für Dropdown-Menüs oder lade Menü-Einträge lazy.

```tsx
// Header.tsx - Lazy load Dropdown Items
import { lazy } from 'react';

const CountryDropdown = lazy(() => import('./CountryDropdown'));
const NatureDropdown = lazy(() => import('./NatureDropdown'));
const DIYDropdown = lazy(() => import('./DIYDropdown'));
```

### 4. Service Worker Optimierung (NIEDRIG)

**Verbesserungen:**
- Pre-caching der wichtigsten Assets beim Install
- Stale-while-revalidate Strategie für HTML
- Cache-First für Bilder

### 5. React Performance (NIEDRIG)

**Memoization hinzufügen:**

```tsx
// ArtikelCard.tsx - React.memo hinzufügen
import { memo } from 'react';

export const ArticleCard = memo(({ article }: { article: NostrEvent }) => {
  // ...
});

// Home.tsx - useCallback für Event-Handler
const handleClick = useCallback((id: string) => {
  // ...
}, []);
```

---

## 📊 Performance-Goals

### Zielwerte (Lighthouse Scores)
- Performance: 90+ (aktuell: ?)
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Total Blocking Time (TBT): < 200ms
- Cumulative Layout Shift (CLS): < 0.1

### Bundle-Größe Goals
- Initial JS Bundle: < 500 KB
- Total JS (nach lazy loading): < 1 MB
- CSS: < 50 KB
- Bilder: < 100 KB pro Bild

---

## 🛠️ Monitoring & Debugging

### 1. Bundle-Analysis
```bash
# Analyse Bundle-Größe
npm run build:analyze

# Öffne stats.html im Browser
```

### 2. Performance-Monitoring

Installiere Web Vitals Library:

```bash
npm install web-vitals
```

```tsx
// src/main.tsx - Performance Monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 3. React DevTools Profiler

Verwende React DevTools Profiler, um langsame Komponenten zu identifizieren.

---

## 🔄 Automatische Optimierungen

### Pre-commit Hook für Bundle-Größe

```bash
# .git/hooks/pre-commit
#!/bin/bash
npm run build

BUNDLE_SIZE=$(wc -c < dist/main-*.js | tr -d ' ')
MAX_SIZE=500000 # 500 KB

if [ $BUNDLE_SIZE -gt $MAX_SIZE ]; then
  echo "❌ Bundle size exceeds limit: $BUNDLE_SIZE bytes"
  exit 1
fi

echo "✅ Bundle size OK: $BUNDLE_SIZE bytes"
```

---

## 📋 Checkliste für Releases

Vor jedem Release prüfen:

- [ ] Bundle-Größe < 500 KB (Initial)
- [ ] Alle console.log entfernt
- [ ] Lazy Loading aktiviert für alle Seiten
- [ ] Bilder optimiert und komprimiert
- [ ] Lighthouse Score > 90
- [ ] Keine Memory Leaks in DevTools
- [ ] Service Worker korrekt konfiguriert
- [ ] Cache-Strategien optimal
- [ ] Alle Tests bestanden

---

## 🔗 Nützliche Links

- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
