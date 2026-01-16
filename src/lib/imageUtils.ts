/**
 * Image Utility Functions for MojoBus Blog
 *
 * Note: Blossom servers don't support query-based image resizing.
 * External image optimization services block Blossom/Nostr domains.
 * All functions return original Blossom URLs without optimization.
 */

/**
 * Returns the original Blossom image URL without any resizing.
 * Blossom servers don't support query parameters for image optimization.
 *
 * @param imageUrl - Original Blossom image URL
 * @param width - Not used (Blossom doesn't support resizing)
 * @param quality - Not used (Blossom doesn't support resizing)
 * @returns Original Blossom URL
 */
export function getThumbnailUrl(
  imageUrl: string,
  width = 300,
  quality = 80
): string {
  // Return original URL - no resizing supported by Blossom
  if (!imageUrl) return '';
  return imageUrl;
}

/**
 * Returns original Blossom image URL (no resizing).
 *
 * @param imageUrl - Original Blossom image URL
 * @param breakpoint - Not used (Blossom doesn't support resizing)
 * @returns Original Blossom URL
 */
export function getResponsiveImageUrl(
  imageUrl: string,
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md'
): string {
  return getThumbnailUrl(imageUrl);
}

/**
 * Returns original Blossom image URL (no resizing).
 *
 * @param imageUrl - Original Blossom image URL
 * @returns Original Blossom URL
 */
export function getListThumbnailUrl(imageUrl: string): string {
  return getThumbnailUrl(imageUrl);
}

/**
 * Returns original Blossom image URL (no resizing).
 *
 * @param imageUrl - Original Blossom image URL
 * @returns Original Blossom URL
 */
export function getArticleHeaderUrl(imageUrl: string): string {
  return getThumbnailUrl(imageUrl);
}

/**
 * Generates srcset string (returns same URL for all sizes since no resizing).
 *
 * @param imageUrl - Original Blossom image URL
 * @returns srcset string for img element (all same URL)
 */
export function generateSrcset(imageUrl: string): string {
  if (!imageUrl) return '';

  const url = getThumbnailUrl(imageUrl);
  return `${url} 300w, ${url} 600w, ${url} 900w, ${url} 1200w`;
}

/**
 * Generates sizes attribute for responsive images
 * Based on the Tailwind breakpoints
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

/**
 * Extracts image dimensions from a URL if available
 *
 * @param imageUrl - Image URL
 * @returns Image dimensions { width, height } or null
 */
export function getImageDimensions(imageUrl: string): { width: number; height: number } | null {
  try {
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

/**
 * Generates a placeholder color for image loading
 * Uses a blurred version of the dominant color
 *
 * @param imageUrl - Image URL (for consistent hashing)
 * @returns CSS background color
 */
export function getImagePlaceholder(imageUrl: string): string {
  // Generate a consistent color based on the URL hash
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    hash = imageUrl.charCodeAt(i) + ((hash << 5) - hash);
  }

  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Checks if an image is from a Blossom server
 *
 * @param imageUrl - Image URL
 * @returns True if image is from a Blossom server
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
 * - Converts to WebP if supported
 * - Adds thumbnail parameters for list views
 * - Preserves high quality for article views
 *
 * @param imageUrl - Original image URL
 * @param context - Context: 'list' or 'article'
 * @returns Optimized image URL
 */
export function optimizeImageUrl(
  imageUrl: string,
  context: 'list' | 'article' = 'list'
): string {
  if (!imageUrl) return '';

  // Check if WebP is supported (always true for modern browsers)
  const supportsWebP = true;

  if (context === 'list') {
    // Use thumbnail for list views
    return getListThumbnailUrl(imageUrl);
  } else if (context === 'article') {
    // Use high-quality version for article views
    return getArticleHeaderUrl(imageUrl);
  }

  return imageUrl;
}
