# Cloudflare Images Setup Guide

## Problem
Blossom-Server liefern keine Thumbnails, und externe Services blockieren Blossom-Domains.
Lösung: Cloudflare Images für echte Bild-Optimierung.

## Option 1: Cloudflare Images (Empfohlen - Kostenlos)

### Schritt 1: Cloudflare Images aktivieren

1. Gehe zu Cloudflare Dashboard: https://dash.cloudflare.com
2. Wähle deine Domain: `mojobus.cc`
3. Gehe zu: **Images** (unter "Optimization")
4. Klicke auf **"Set up Images"** oder **"Purchase Images"**

### Schritt 2: Images Konfigurieren

Während der Einrichtung:

1. **Pricing**: Wähle **"Free"** (oder bezahlt, falls mehr Features nötig)
   - Free: 100.000 Bilder/Monat
   - Genügt für einen Blog

2. **Domain**: Bestätige `mojobus.cc`

3. **Storage**: 
   - 10GB Speicher inklusive (Free)
   - Für Thumbnails mehr als genug

### Schritt 3: Cloudflare API Keys holen

1. Gehe zu: **Manage Account** → **API Tokens**
2. Klicke auf **"Create Token"**
3. Wähle Template: **"Edit Cloudflare Images"** oder **"Custom token"**
4. Permissions:
   - Account → Cloudflare Images → Edit
   - Account → Cloudflare Images → Read
5. Zonen-Resources: Wähle `mojobus.cc`
6. Klicke auf **"Continue to summary"**
7. Kopiere den **API Token** (brauchst du später)

### Schritt 4: Variablen im Worker einrichten

Gehe zu: **Workers & Pages** → **Create Application** → **Create Worker**

1. **Worker Name**: `mojobus-images`
2. **Create Worker**
3. Gehe zu **Settings** → **Variables and Secrets**
4. **Add Variable**:
   - Variable Name: `CLOUDFLARE_ACCOUNT_ID`
   - Wert: Deine Account ID (findest du auf der Dashboard-Homepage rechts oben)
5. **Add Secret**:
   - Variable Name: `CLOUDFLARE_API_TOKEN`
   - Wert: Der API Token aus Schritt 3

### Schritt 5: Worker Code deployen

Erstelle einen neuen Worker mit diesem Code (oder nutze den bestehenden):

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Prüfe ob Bildanfrage
    if (!url.searchParams.has('url')) {
      return new Response('Missing url parameter', { status: 400 });
    }
    
    const imageUrl = url.searchParams.get('url');
    const width = url.searchParams.get('w') || '200';
    const quality = url.searchParams.get('q') || '80';
    const format = url.searchParams.get('output') || 'webp';
    
    try {
      // Cloudflare Images API nutzen
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1/resize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: imageUrl,
          width: parseInt(width),
          height: parseInt(width), // Quadratisch für Thumbnails
          fit: 'cover',
          format: format,
          quality: parseInt(quality),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return new Response(JSON.stringify(data), { status: response.status });
      }
      
      // Bilddaten zurückgeben
      const imageResponse = await fetch(data.result.variants[0]);
      return new Response(imageResponse.body, {
        headers: {
          'Content-Type': `image/${format}`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
      
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
};
```

### Schritt 6: Worker an Domain binden

1. Gehe zu **Triggers** → **Custom Domains**
2. Klicke **"Add Custom Domain"**
3. Domain: `images.mojobus.cc` (oder `img.mojobus.cc`)
4. Wähle Zone: `mojobus.cc`
5. Klicke **"Add Domain"**

### Schritt 7: DNS einrichten

1. Gehe zu DNS → **Records**
2. CNAME erstellen:
   - Type: **CNAME**
   - Name: **images**
   - Target: **(Dein Worker Endpunkt)** → siehe im Worker Dashboard
   - Proxy: **Proxied (Orange Wolke)**

### Schritt 8: Worker testen

```bash
# Teste den Worker
curl "https://images.mojobus.cc/?url=https://blossom.primal.net/...jpg&w=200&q=80&output=webp" -o test.jpg
ls -lh test.jpg
```

### Schritt 9: Code anpassen

Ändere `src/lib/imageUtils.ts`:

```typescript
export function getThumbnailUrl(
  imageUrl: string,
  width = 300,
  quality = 80
): string {
  if (!imageUrl) return '';
  
  try {
    const params = `url=${imageUrl}&w=${width}&q=${quality}&output=webp`;
    return `https://images.mojobus.cc/?${params}`;
  } catch (error) {
    return imageUrl;
  }
}
```

---

## Option 2: Cloudflare Image Resizing (Einfacher, aber weniger Features)

Wenn du Cloudflare Images nicht aktivieren möchtest, nutze **Image Resizing**:

1. Gehe zu **Speed** → **Optimization** → **Image Resizing**
2. Klicke **"Enable"** (oft schon aktiv)
3. Nutze im Worker:

```javascript
// Alternative mit Image Resizing
const response = await fetch(imageUrl, {
  cf: {
    image: {
      width: parseInt(width),
      quality: parseInt(quality),
      format: 'webp',
    },
  },
});
```

**Hinweis**: Image Resizing ist einfacher, aber weniger mächtig als Cloudflare Images.

---

## Option 3: imgproxy selbst hosten (Open Source)

Wenn du Cloudflare nicht nutzen möchtest:

### Was ist imgproxy?

imgproxy ist ein schneller, sicherer Image-Resizing-Service written in Go.

### Installation

```bash
# Docker (empfohlen)
docker run -d \
  -p 8080:8080 \
  -e IMGPROXY_SECRET_KEY=$(openssl rand -hex 16) \
  darthsim/imgproxy:latest
```

### Konfiguration

```bash
# environment variables
IMGPROXY_BIND=:8080
IMGPROXY_LOCAL_URLS_ENABLED=true
IMGPROXY_ENFORCE_WEBP=true
IMGPROXY_QUALITY=80
IMGPROXY_MAX_SRC_RESOLUTION=50000000
```

### Nutzung

```typescript
// In getThumbnailUrl()
const params = `url=${imageUrl}&w=${width}&q=${quality}&output=webp`;
return `https://img.mojobus.cc/?${params}`;
```

**Vorteil**: Kein Blocking, komplett unter deiner Kontrolle
**Nachteil**: Server muss selbst gehostet werden

---

## Empfehlung

### Für sofortige Lösung:
- **Option 1 (Cloudflare Images)** - Beste Balance zwischen Leistung und Aufwand

### Für langfristige Lösung:
- **Option 3 (imgproxy selbst)** - Vollständig unter deiner Kontrolle

### Wenn du Cloudflare schon nutzt:
- Nutze **Option 1** - Es ist kostenlos und gut integriert

---

## Troubleshooting

### Problem: "Account ID not found"
- Check: Account ID in Worker Variables
- Finde ID: Dashboard → rechts oben oben

### Problem: "Unauthorized"
- Check: API Token Permissions
- Erneuere Token wenn nötig

### Problem: Bilder werden nicht komprimiert
- Check: Image Format in URL (`&output=webp`)
- Prüfe ob Cloudflare Images aktiv ist

### Problem: Langsame Ladezeiten
- Cache Headers prüfen (`max-age=31536000`)
- DNS Proxy aktivieren (Orange Wolke)

---

## Kostenvergleich

| Service | Preis | Limits |
|---------|-------|--------|
| Cloudflare Images (Free) | Kostenlos | 100k Bilder/Monat, 10GB Storage |
| Cloudflare Images (Paid) | ~$5/Monat | Unbegrenzt |
| imgproxy (Self-host) | Server-Kosten | Unbegrenzt |
| wsrv.nl (extern) | Kostenlos | **Blockiert Blossom!** ❌ |

---

## Links

- Cloudflare Images Docs: https://developers.cloudflare.com/images/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- imgproxy GitHub: https://github.com/imgproxy/imgproxy
