/**
 * Image Service Configuration
 *
 * Konfiguration für den externen Bild-Optimierungs-Service
 *
 * Mögliche Services:
 * - images.weserv.nl (kostenlos, empfohlen)
 * - https://images.weserv.nl/?url={ENCODED_URL}&w={WIDTH}&h={HEIGHT}&q={QUALITY}&output=webp
 *
 * Alternative Services:
 * - imgproxy (self-hosted): https://imgproxy.mojobus.co/insecure/{BASE64_URL}/rs:fill:{WIDTH}:{HEIGHT}:0/q:{QUALITY}
 * - Cloudflare Images: https://your-cloudflare-images.cloudflare.com/cdn-cgi/image/{OPTIONS}/{URL}
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Image Service URL
 * Ändere dies zu einem anderen Service, wenn nötig
 *
 * Beispiele:
 * - images.weserv.nl: 'https://images.weserv.nl'
 * - imgproxy (self-hosted): 'https://imgproxy.mojobus.co'
 * - Cloudflare Images: 'https://your-cloudflare-images.cloudflare.com'
 */
export const IMAGE_SERVICE_URL = process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL || 'https://images.weserv.nl';

/**
 * Image Service Typ
 * Bestimmt das URL-Format für den Bild-Service
 *
 * Mögliche Werte:
 * - 'weserv' (Standard): images.weserv.nl Format
 * - 'imgproxy': imgproxy Format (self-hosted)
 * - 'cloudflare': Cloudflare Images Format
 */
export const IMAGE_SERVICE_TYPE: 'weserv' | 'imgproxy' | 'cloudflare' =
  (process.env.NEXT_PUBLIC_IMAGE_SERVICE_TYPE as any) || 'weserv';

/**
 * Enable/Disable den Image Service
 * Setze auf false, um Bild-Optimierung komplett zu deaktivieren
 * (Falleback zu Original-Bildern)
 */
export const ENABLE_IMAGE_SERVICE = process.env.NEXT_PUBLIC_ENABLE_IMAGE_SERVICE !== 'false';

/**
 * Standard-Bildqualität (1-100)
 * Kann in imageUtils.ts überschrieben werden
 */
export const DEFAULT_IMAGE_QUALITY = 85;

/**
 * Standard-Bildformat
 * Mögliche Werte: 'webp', 'avif', 'auto', 'jpeg', 'png'
 */
export const DEFAULT_IMAGE_FORMAT = 'webp';

// ============================================================================
// DEBUG LOGS
// ============================================================================

console.log('[imageService] Configuration:', {
  IMAGE_SERVICE_URL,
  IMAGE_SERVICE_TYPE,
  ENABLE_IMAGE_SERVICE,
  DEFAULT_IMAGE_QUALITY,
  DEFAULT_IMAGE_FORMAT,
  'Env vars': {
    NEXT_PUBLIC_IMAGE_SERVICE_URL: process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL,
    NEXT_PUBLIC_IMAGE_SERVICE_TYPE: process.env.NEXT_PUBLIC_IMAGE_SERVICE_TYPE,
    NEXT_PUBLIC_ENABLE_IMAGE_SERVICE: process.env.NEXT_PUBLIC_ENABLE_IMAGE_SERVICE,
  }
});

// ============================================================================
// URL GENERATION
// ============================================================================

/**
 * Generiert eine optimierte Bild-URL basierend auf dem Service-Typ
 *
 * @param imageUrl - Originalbild URL
 * @param width - Zielbreite
 * @param height - Zielhöhe (optional)
 * @param quality - Qualität (1-100)
 * @returns Optimierte Bild-URL
 */
export function generateImageUrl(
  imageUrl: string,
  width: number,
  height?: number,
  quality = DEFAULT_IMAGE_QUALITY
): string {
  if (!imageUrl || !ENABLE_IMAGE_SERVICE) {
    return imageUrl;
  }

  switch (IMAGE_SERVICE_TYPE) {
    case 'weserv':
      return generateWeservUrl(imageUrl, width, height, quality);
    case 'imgproxy':
      return generateImgproxyUrl(imageUrl, width, height, quality);
    case 'cloudflare':
      return generateCloudflareUrl(imageUrl, width, height, quality);
    default:
      return generateWeservUrl(imageUrl, width, height, quality);
  }
}

// ============================================================================
// WESERV.NL
// ============================================================================

/**
 * Generiert eine images.weserv.nl URL
 *
 * Format: https://images.weserv.nl/?url={ENCODED_URL}&w={WIDTH}&h={HEIGHT}&q={QUALITY}&output={FORMAT}
 *
 * Dokumentation: https://images.weserv.nl/
 */
function generateWeservUrl(
  imageUrl: string,
  width: number,
  height?: number,
  quality = DEFAULT_IMAGE_QUALITY
): string {
  if (!IMAGE_SERVICE_URL) {
    console.log('[imageService] No IMAGE_SERVICE_URL configured, returning original:', imageUrl);
    return imageUrl;
  }

  try {
    const h = height || width; // Quadratisch wenn height nicht angegeben
    const encodedUrl = encodeURIComponent(imageUrl);

    const params = new URLSearchParams({
      url: imageUrl,
      w: width.toString(),
      h: h.toString(),
      q: quality.toString(),
      output: DEFAULT_IMAGE_FORMAT,
    });

    const finalUrl = `${IMAGE_SERVICE_URL}/?${params.toString()}`;

    console.log('[imageService] Weserv URL generated:', {
      original: imageUrl,
      final: finalUrl,
      width,
      height: h,
      quality,
      format: DEFAULT_IMAGE_FORMAT,
    });

    return finalUrl;
  } catch (error) {
    console.error('[imageService] Failed to generate weserv.nl URL:', error);
    return imageUrl;
  }
}

// ============================================================================
// IMGPROXY (SELF-HOSTED)
// ============================================================================

/**
 * Generiert eine imgproxy URL (self-hosted)
 *
 * Format: https://imgproxy.mojobus.co/insecure/{BASE64_URL}/rs:fill:{WIDTH}:{HEIGHT}:0/q:{QUALITY}
 *
 * Dokumentation: https://github.com/imgproxy/imgproxy
 */
function generateImgproxyUrl(
  imageUrl: string,
  width: number,
  height?: number,
  quality = DEFAULT_IMAGE_QUALITY
): string {
  if (!IMAGE_SERVICE_URL) return imageUrl;

  try {
    // Base64 Encode URL (URL-safe)
    const utf8Bytes = new TextEncoder().encode(imageUrl);
    const base64 = btoa(String.fromCharCode(...utf8Bytes));
    const encodedUrl = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    if (!encodedUrl) return imageUrl;

    const h = height || width;
    const options = `rs:fill:${width}:${h}:0/q:${quality}`;

    return `${IMAGE_SERVICE_URL}/insecure/${encodedUrl}/${options}`;
  } catch (error) {
    console.error('Failed to generate imgproxy URL:', error);
    return imageUrl;
  }
}

// ============================================================================
// CLOUDFLARE IMAGES
// ============================================================================

/**
 * Generiert eine Cloudflare Images URL
 *
 * Format: https://your-domain.com/cdn-cgi/image/{OPTIONS}/{URL}
 *
 * Dokumentation: https://developers.cloudflare.com/images/
 */
function generateCloudflareUrl(
  imageUrl: string,
  width: number,
  height?: number,
  quality = DEFAULT_IMAGE_QUALITY
): string {
  if (!IMAGE_SERVICE_URL) return imageUrl;

  try {
    const h = height || width;
    const options = `width=${width},height=${h},quality=${quality},format=${DEFAULT_IMAGE_FORMAT}`;

    // Cloudflare Images erwarten die Original-URL ohne Encoding
    return `${IMAGE_SERVICE_URL}/cdn-cgi/image/${options}/${imageUrl}`;
  } catch (error) {
    console.error('Failed to generate Cloudflare Images URL:', error);
    return imageUrl;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  IMAGE_SERVICE_URL,
  IMAGE_SERVICE_TYPE,
  ENABLE_IMAGE_SERVICE,
  DEFAULT_IMAGE_QUALITY,
  DEFAULT_IMAGE_FORMAT,
  generateImageUrl,
};
