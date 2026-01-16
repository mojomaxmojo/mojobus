/**
 * Image Utility Functions for Performance Optimization
 *
 * Provides thumbnail generation, responsive image handling, and
 * image optimization utilities for the MojoBus blog.
 */

/**
 * Generates a thumbnail URL from a Blossom image URL
 * Uses images.weserv.nl for actual image resizing since Blossom servers
 * don't support query parameters for resizing.
 *
 * @param imageUrl - Original image URL
 * @param width - Target width in pixels
 * @param quality - Image quality (1-100)
 * @returns Thumbnail URL via images.weserv.nl
 */
export function getThumbnailUrl(
  imageUrl: string,
  width = 300,
  quality = 80
): string {
  if (!imageUrl) return '';

  try {
    // Build URL without URLSearchParams to avoid double-encoding
    // The imageUrl is already properly encoded (it's a valid URL)
    const params = `url=${imageUrl}&w=${width}&q=${quality}&fit=cover&output=webp`;
    return `https://images.weserv.nl/?${params}`;
  } catch (error) {
    // Fallback to original URL if encoding fails
    return imageUrl;
  }
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
  return getThumbnailUrl(imageUrl, 1200, 90);
}

/**
 * Generates a set of srcset URLs for responsive images
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
