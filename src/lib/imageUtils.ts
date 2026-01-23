/**
 * Image Utility Functions for Performance Optimization
 *
 * Uses imgproxy for ALL images (since Blossom servers don't support resize)
 *
 * imgproxy URL format:
 * https://imgproxy.mojobus.co/insecure/{BASE64_URL}/{OPTIONS}
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * imgproxy Server URL
 * Change this to your imgproxy instance URL
 */
const IMGPROXY_SERVER = process.env.NEXT_PUBLIC_IMGPROXY_URL || 'https://imgproxy.mojobus.co';

/**
 * Enable/Disable imgproxy
 * Set to false to disable imgproxy (fallback to original URLs)
 */
const ENABLE_IMGPROXY = true;

// ============================================================================
// IMGPROXY UTILITIES
// ============================================================================

/**
 * Base64 Encode eine URL für imgproxy
 * imgproxy nutzt URL-safe Base64
 */
function encodeUrlForImgproxy(url: string): string {
  try {
    // UTF-8 encode
    const utf8Bytes = new TextEncoder().encode(url);

    // Base64 encode
    const base64 = btoa(String.fromCharCode(...utf8Bytes));

    // URL-safe: + → -, / → _, = am Ende entfernen
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (error) {
    console.error('Failed to encode URL for imgproxy:', error);
    return '';
  }
}

/**
 * Generiert eine imgproxy-optimierte Bild-URL
 *
 * Format: https://imgproxy.mojobus.co/insecure/{BASE64_URL}/{OPTIONS}
 *
 * @param imageUrl - Originalbild URL
 * @param width - Zielbreite
 * @param height - Zielhöhe (optional)
 * @param quality - Qualität (1-100)
 * @returns imgproxy URL
 */
export function getImgproxyUrl(
  imageUrl: string,
  width: number,
  height?: number,
  quality = 80
): string {
  if (!imageUrl) return '';
  if (!ENABLE_IMGPROXY) return imageUrl;

  try {
    const encodedUrl = encodeUrlForImgproxy(imageUrl);
    if (!encodedUrl) return imageUrl;

    const h = height || width; // Quadratisch wenn height nicht angegeben
    const options = `rs:fill:${width}:${h}:0/q:${quality}`;

    return `${IMGPROXY_SERVER}/insecure/${encodedUrl}/${options}`;
  } catch (error) {
    console.error('Failed to generate imgproxy URL:', error);
    return imageUrl; // Fallback zur Original-URL
  }
}

// ============================================================================
// THUMBNAIL GENERATION
// ============================================================================

/**
 * Generates a thumbnail URL via imgproxy
 *
 * imgproxy wird für ALLE Bilder verwendet, da Blossom-Server
 * KEIN Image-Resize mit Query-Parametern unterstützen.
 *
 * @param imageUrl - Original image URL
 * @param width - Target width in pixels
 * @param quality - Image quality (1-100)
 * @returns Thumbnail URL via imgproxy
 */
export function getThumbnailUrl(
  imageUrl: string,
  width = 300,
  quality = 80
): string {
  if (!imageUrl) return '';

  return getImgproxyUrl(imageUrl, width, width, quality);
}

/**
 * Generates a responsive image URL for different breakpoints
 *
 * @param imageUrl - Original image URL
 * @param breakpoint - Size breakpoint: 'sm', 'md', 'lg', 'xl', '2xl'
 * @returns Resized image URL
 */
export function getResponsiveImageUrl(
  imageUrl: string,
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md'
): string {
  const sizes = {
    sm: { width: 300, quality: 80 },  // ~15KB
    md: { width: 600, quality: 85 },  // ~50KB
    lg: { width: 900, quality: 85 },  // ~100KB
    xl: { width: 1200, quality: 90 }, // ~180KB
    '2xl': { width: 1600, quality: 90 }, // ~300KB
  };

  const { width, quality } = sizes[breakpoint];
  return getThumbnailUrl(imageUrl, width, quality);
}

/**
 * Generates a thumbnail URL optimized for list/article cards
 *
 * @param imageUrl - Original image URL
 * @returns Thumbnail URL (200x200, quality 80)
 */
export function getListThumbnailUrl(imageUrl: string): string {
  return getThumbnailUrl(imageUrl, 200, 80);
}

/**
 * Generates a thumbnail URL optimized for article headers
 *
 * @param imageUrl - Original image URL
 * @returns Thumbnail URL (1200x630, quality 90)
 */
export function getArticleHeaderUrl(imageUrl: string): string {
  return getImgproxyUrl(imageUrl, 1200, 630, 90);
}

// ============================================================================
// RESPONSIVE IMAGES (SRCSET)
// ============================================================================

/**
 * Generates a set of srcset URLs for responsive images
 *
 * Uses imgproxy for ALL images
 *
 * @param imageUrl - Original image URL
 * @returns srcset string for img element
 */
export function generateSrcset(imageUrl: string): string {
  if (!imageUrl) return '';

  const sizes = [
    { width: 300, descriptor: '300w' },
    { width: 600, descriptor: '600w' },
    { width: 900, descriptor: '900w' },
    { width: 1200, descriptor: '1200w' },
  ];

  return sizes
    .map(({ width, descriptor }) => {
      const url = getThumbnailUrl(imageUrl, width, 85);
      return `${url} ${descriptor}`;
    })
    .join(', ');
}

/**
 * Generates sizes attribute for responsive images
 * Based on Tailwind breakpoints
 *
 * @param type - Image type: 'card', 'header', 'hero'
 * @returns sizes string for img element
 */
export function generateSizes(type: 'card' | 'header' | 'hero' = 'card'): string {
  const sizesMap = {
    card: '(max-width: 640px) 300px, (max-width: 1024px) 400px, 500px',
    header: '(max-width: 640px) 600px, (max-width: 1024px) 900px, 1200px',
    hero: '(max-width: 640px) 800px, (max-width: 1024px) 1200px, 1600px',
  };

  return sizesMap[type];
}

// ============================================================================
// IMAGE METADATA
// ============================================================================

/**
 * Extracts image dimensions from an imgproxy URL
 *
 * @param imageUrl - Image URL (imgproxy or original)
 * @returns Image dimensions { width, height } or null
 */
export function getImageDimensions(imageUrl: string): { width: number; height: number } | null {
  try {
    // Prüfe ob es ein imgproxy URL ist
    const imgproxyMatch = imageUrl.match(/\/insecure\/([a-zA-Z0-9_-]+)\/rs:fill:(\d+):(\d+):/);
    if (imgproxyMatch) {
      return {
        width: parseInt(imgproxyMatch[2], 10),
        height: parseInt(imgproxyMatch[3], 10),
      };
    }

    // Fallback für query-Parameter URLs (Blossom, obwohl sie nicht funktionieren)
    const url = new URL(imageUrl);
    const width = url.searchParams.get('w');
    const height = url.searchParams.get('h');

    if (width && height) {
      return {
        width: parseInt(width, 10),
        height: parseInt(height, 10),
      };
    }
  } catch (error) {
    // Parsing failed, return null
  }

  return null;
}

// ============================================================================
// PLACEHOLDERS
// ============================================================================

/**
 * Generates a placeholder color for image loading
 * Uses a blurred version of dominant color
 *
 * @param imageUrl - Image URL (for consistent hashing)
 * @returns CSS background color
 */
export function getImagePlaceholder(imageUrl: string): string {
  // Generate a consistent color based on URL hash
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    hash = imageUrl.charCodeAt(i) + ((hash << 5) - hash);
  }

  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;

  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Checks if a URL is from a Blossom server
 * (DEPRECATED - Blossom servers don't support resize, so this is no longer used)
 *
 * @param imageUrl - Image URL
 * @returns True if image is from a Blossom server
 * @deprecated Blossom servers don't support resize, use imgproxy instead
 */
export function isBlossomImage(imageUrl: string): boolean {
  try {
    const url = new URL(imageUrl);
    const hostname = url.hostname;

    // Common Blossom servers
    const blossomServers = [
      'blossom.primal.net',
      'cdn.blossom.nostr.land',
      'cdn.nostrcheck.me',
      'media.nostr.band',
    ];

    return blossomServers.some(server => hostname.includes(server));
  } catch (error) {
    return false;
  }
}

/**
 * Optimizes an image URL for better performance
 *
 * Uses imgproxy for ALL images now.
 *
 * @param imageUrl - Original image URL
 * @param context - Context: 'list' or 'article'
 * @returns Optimized image URL via imgproxy
 */
export function optimizeImageUrl(
  imageUrl: string,
  context: 'list' | 'article' = 'list'
): string {
  if (!imageUrl) return '';

  if (context === 'list') {
    // Use thumbnail for list views
    return getListThumbnailUrl(imageUrl);
  } else if (context === 'article') {
    // Use high-quality version for article views
    return getArticleHeaderUrl(imageUrl);
  }

  return imageUrl;
}

/**
 * Get imgproxy server URL
 *
 * @returns imgproxy server URL
 */
export function getImgproxyServer(): string {
  return IMGPROXY_SERVER;
}

/**
 * Check if imgproxy is enabled
 *
 * @returns true if imgproxy is enabled
 */
export function isImgproxyEnabled(): boolean {
  return ENABLE_IMGPROXY;
}
