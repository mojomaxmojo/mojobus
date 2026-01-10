/**
 * Cloudflare Workers Image Caching Strategy
 * 
 * Provides edge-optimized image delivery with different caching
 * strategies based on image type, source, and access patterns.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Image caching strategies
    const CACHE_STRATEGIES = {
      // User-uploaded images - very stable, long-term cache
      USER_UPLOADED: {
        edgeTTL: 365 * 24 * 60 * 60, // 1 year
        browserTTL: 31536000, // 1 year
        cacheKey: 'USER_UPLOAD_PERMANENT',
        cacheControl: 'public, max-age=31536000, immutable',
        priority: 'high'
      },
      
      // System branding images - stable, long-term cache
      SYSTEM_BRANDING: {
        edgeTTL: 30 * 24 * 60 * 60, // 30 days
        browserTTL: 2592000, // 30 days
        cacheKey: 'SYSTEM_BRANDING_STABLE',
        cacheControl: 'public, max-age=2592000, immutable',
        priority: 'high'
      },
      
      // Generated thumbnails - medium-term cache
      THUMBNAILS: {
        edgeTTL: 7 * 24 * 60 * 60, // 7 days
        browserTTL: 604800, // 7 days
        cacheKey: 'THUMBNAIL_MEDIUM_TERM',
        cacheControl: 'public, max-age=604800, immutable',
        priority: 'medium'
      },
      
      // User avatars - may change, short cache
      AVATARS: {
        edgeTTL: 24 * 60 * 60, // 24 hours
        browserTTL: 86400, // 24 hours
        cacheKey: 'AVATAR_SHORT_TERM',
        cacheControl: 'public, max-age=86400, must-revalidate',
        priority: 'low'
      },
      
      // Temporary uploads - very short cache
      TEMPORARY: {
        edgeTTL: 300, // 5 minutes
        browserTTL: 300, // 5 minutes
        cacheKey: 'TEMP_UPLOAD',
        cacheControl: 'private, max-age=300, must-revalidate',
        priority: 'very-low'
      },
      
      // Fallback images - medium-term cache
      FALLBACK: {
        edgeTTL: 30 * 24 * 60 * 60, // 30 days
        browserTTL: 2592000, // 30 days
        cacheKey: 'FALLBACK_IMAGES',
        cacheControl: 'public, max-age=2592000, immutable',
        priority: 'medium'
      }
    };

    // Detect image strategy based on path
    function getCacheStrategy(pathname) {
      // User uploaded images
      if (pathname.startsWith('/uploads/')) {
        return CACHE_STRATEGIES.USER_UPLOADED;
      }
      
      // System branding
      if (pathname.includes('/mojobuslogo.') || 
          pathname.includes('/bangkok.') || 
          pathname.includes('/system/')) {
        return CACHE_STRATEGIES.SYSTEM_BRANDING;
      }
      
      // Generated thumbnails
      if (pathname.startsWith('/thumbnails/') || 
          pathname.includes('/generated/')) {
        return CACHE_STRATEGIES.THUMBNAILS;
      }
      
      // User avatars
      if (pathname.startsWith('/avatars/')) {
        return CACHE_STRATEGIES.AVATARS;
      }
      
      // Temporary uploads
      if (pathname.startsWith('/temp/') || 
          pathname.includes('/temp-upload/')) {
        return CACHE_STRATEGIES.TEMPORARY;
      }
      
      // Fallback/default images
      if (pathname.startsWith('/fallback/') || 
          pathname.includes('/default/')) {
        return CACHE_STRATEGIES.FALLBACK;
      }
      
      // Default to user uploaded
      return CACHE_STRATEGIES.USER_UPLOADED;
    }

    function detectImageType(pathname) {
      const ext = pathname.toLowerCase().split('.').pop();
      const types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'avif': 'image/avif',
        'ico': 'image/x-icon',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff'
      };
      return types[ext] || 'application/octet-stream';
    }

    function getOptimizationSettings(pathname, strategy) {
      const ext = pathname.toLowerCase().split('.').pop();
      
      // Auto-WebP conversion for eligible images
      const canAutoWebP = ['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(ext);
      
      return {
        autoWebP: canAutoWebP && strategy.priority !== 'very-low',
        webpQuality: 80,
        jpegQuality: 85,
        stripMetadata: strategy.priority !== 'high',
        optimizeForWeb: true
      };
    }

    function createImageResponse(response, request, strategy, options = {}) {
      const content = response.body;
      const contentType = detectImageType(request.url);
      const imageOptimization = getOptimizationSettings(request.url, strategy);
      
      const headers = {
        'Content-Type': contentType,
        'Content-Length': content.length.toString(),
        'Cache-Control': strategy.cacheControl,
        'ETag': getETag(content),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, If-Modified-Since, If-None-Match',
        
        // Caching metadata
        'X-Edge-Cache-Key': strategy.cacheKey,
        'X-Edge-Cache-TTL': strategy.edgeTTL.toString(),
        'X-Edge-Cache-Browser-TTL': strategy.browserTTL.toString(),
        'X-Image-Cache-Strategy': strategy.priority,
        
        // Image optimization metadata
        'X-Image-Optimization': JSON.stringify(imageOptimization),
        'X-Image-Auto-WebP': imageOptimization.autoWebP.toString(),
        'X-Image-Strip-Metadata': imageOptimization.stripMetadata.toString(),
        
        // Security headers
        'X-Content-Security-Policy': "default-src 'none'; frame-src 'none';",
        'X-Frame-Options': 'DENY',
        'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
        
        // Performance headers
        'Timing-Allow-Origin': '*',
        
        // Image processing headers
        'Accept-Ranges': 'bytes',
        'X-Image-Serve-Method': 'edge-cache',
      };

      // Handle conditional requests
      if (request.headers.get('if-none-match')) {
        if (request.headers.get('if-none-match') === headers.get('etag')) {
          return new Response(null, {
            status: 304,
            headers: {
              'Cache-Control': strategy.cacheControl,
              'ETag': headers.get('etag'),
              'X-Edge-Cache-Status': 'HIT'
            }
          });
        }
      }

      return new Response(content, {
        status: 200,
        headers
      });
    }

    function getETag(content) {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return `"${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}"`;
    }

    // Handle range requests for large images
    function handleRangeRequest(request, response, strategy) {
      const range = request.headers.get('range');
      if (!range) {
        return null; // Not a range request
      }

      const content = response.body;
      const contentLength = content.length;
      
      const rangeParts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(rangeParts[0], 10);
      const end = parseInt(rangeParts[1], 10);
      
      if (isNaN(start) || isNaN(end) || start >= contentLength || end >= contentLength || start > end) {
        return null; // Invalid range
      }

      const chunk = content.slice(start, end + 1);
      const contentLength2 = end - start + 1;
      
      return new Response(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${contentLength}`,
          'Content-Length': contentLength2.toString(),
          'Content-Type': detectImageType(request.url),
          'Accept-Ranges': 'bytes',
          'Cache-Control': strategy.cacheControl,
          'X-Edge-Range-Start': start.toString(),
          'X-Edge-Range-End': end.toString(),
          'X-Edge-Range-Total': contentLength.toString()
        }
      });
    }

    // Handle HEAD requests
    function handleHeadRequest(request, response, strategy) {
      const content = response.body;
      const contentLength = content.length;
      
      return new Response(null, {
        status: 200,
        headers: {
          'Content-Length': contentLength.toString(),
          'Content-Type': detectImageType(request.url),
          'Cache-Control': strategy.cacheControl,
          'ETag': getETag(content),
          'Accept-Ranges': 'bytes',
          'X-Image-Cache-Strategy': strategy.priority
        }
      });
    }

    // Handle OPTIONS requests (CORS preflight)
    function handleOptionsRequest(strategy) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, PUT, PATCH',
          'Access-Control-Allow-Headers': 'Range, If-Modified-Since, If-None-Match, Content-Type',
          'Access-Control-Max-Age': '86400',
          'X-Image-Cache-Strategy': strategy.priority
        }
      });
    }

    // Main request processing
    try {
      // CORS preflight
      if (request.method === 'OPTIONS') {
        const strategy = getCacheStrategy(request.url);
        return handleOptionsRequest(strategy);
      }

      // Only handle image requests
      if (!request.url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico|bmp|tiff)$/i)) {
        return fetch(request); // Pass through non-image requests
      }

      const strategy = getCacheStrategy(request.url);
      const originResponse = await fetch(request);

      if (!originResponse.ok) {
        return new Response('Image not found', {
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Edge-Cache-Status': 'MISSING'
          }
        });
      }

      // Handle different request methods
      if (request.method === 'HEAD') {
        return handleHeadRequest(request, originResponse, strategy);
      }

      if (request.method === 'GET') {
        // Handle range requests
        const rangeResponse = handleRangeRequest(request, originResponse, strategy);
        if (rangeResponse) {
          return rangeResponse;
        }

        return createImageResponse(originResponse, request, strategy);
      }

    } catch (error) {
      console.error('Image processing error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Edge-Cache-Status': 'ERROR'
        }
      });
    }
  }
};