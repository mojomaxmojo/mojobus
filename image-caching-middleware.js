/**
 * Advanced Image Caching Middleware for Hosting Servers
 * 
 * This middleware provides intelligent image caching with different strategies
 * based on image type, upload status, and access patterns.
 * 
 * Usage:
 * - Vercel: Set this as middleware in vercel.json
 * - Netlify: Use edge functions with this logic
 * - Nginx: Adapt to nginx configuration
 * - Cloudflare: Transform to Cloudflare Workers rules
 */

const crypto = require('crypto');

// Image caching strategies
const CACHE_STRATEGIES = {
  // User-uploaded content (rarely changes, long-lived)
  UPLOADED: {
    maxAge: 31536000, // 1 year
    cacheControl: 'public, max-age=31536000, immutable',
    etag: true,
    vary: 'Accept-Encoding',
    compression: true,
    priority: 'high'
  },
  
  // System branding images (very stable)
  SYSTEM: {
    maxAge: 2592000, // 30 days
    cacheControl: 'public, max-age=2592000, immutable',
    etag: true,
    vary: 'Accept-Encoding',
    compression: true,
    priority: 'high'
  },
  
  // Generated thumbnails (medium stability)
  THUMBNAILS: {
    maxAge: 604800, // 7 days
    cacheControl: 'public, max-age=604800, immutable',
    etag: true,
    vary: 'Accept-Encoding',
    compression: true,
    priority: 'medium'
  },
  
  // User avatars (may change occasionally)
  AVATARS: {
    maxAge: 86400, // 1 day
    cacheControl: 'public, max-age=86400, must-revalidate',
    etag: true,
    vary: 'Accept-Encoding',
    compression: true,
    priority: 'medium'
  },
  
  // Temporary uploads (short-lived)
  TEMPORARY: {
    maxAge: 300, // 5 minutes
    cacheControl: 'private, no-cache, no-store, must-revalidate',
    etag: false,
    vary: 'Accept-Encoding',
    compression: false,
    priority: 'low'
  },
  
  // Fallback images (stable)
  FALLBACK: {
    maxAge: 2592000, // 30 days
    cacheControl: 'public, max-age=2592000, immutable',
    etag: true,
    vary: 'Accept-Encoding',
    compression: true,
    priority: 'medium'
  }
};

// Content type mappings
const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif'
  '.webp': 'image/webp',
  '.bmp': 'image/bmp'
};

// Image optimization settings
const OPTIMIZATION = {
  webp: {
    quality: 80,
    method: 'sharp',
  },
  jpeg: {
    quality: 85,
    method: 'sharp',
  },
  png: {
    compressionLevel: 9,
    method: 'sharp',
  },
  compression: {
    brotli: true,
    gzip: true,
  level: 6, // Higher compression
  },
  resizing: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 90,
  },
};

// Cache storage simulation (for development)
let cacheStore = new Map();

function generateETag(content, stats = {}) {
  const contentHash = crypto.createHash('sha256').update(content).digest('hex');
  const statsString = JSON.stringify(stats);
  const statsHash = crypto.createHash('sha256').update(statsString).digest('hex');
  return `W/"${contentHash}-${statsHash}"`;
}

function detectImageType(filePath) {
  const ext = filePath.toLowerCase().split('.').pop();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

function detectImageCacheStrategy(req, filePath, stats = {}) {
  const path = req.url || req.path;
  
  // User uploaded images (long caching)
  if (path.includes('/uploads/')) {
    return CACHE_STRATEGIES.UPLOADED;
  }
  
  // System images (branding, logo)
  if (filePath.includes('/mojobuslogo.png') || 
      filePath.includes('/bangkok.png') ||
      path.includes('/system/')) {
    return CACHE_STRATEGIES.SYSTEM;
  }
  
  // Generated thumbnails
  if (path.includes('/thumbnails/') || 
      path.includes('/generated/')) {
    return CACHE_STRATEGIES.THUMBNAILS;
  }
  
  // User avatars
  if (path.includes('/avatars/')) {
    return CACHE_STRATEGIES.AVATARS;
  }
  
  // Temporary uploads
  if (path.includes('/temp/') || 
      path.includes('/temp-upload/')) {
    return CACHE_STRATEGIES.TEMPORARY;
  }
  
  // Fallback/default images
  if (path.includes('/fallback/') || 
      path.includes('/default/')) {
    return CACHE_STRATEGIES.FALLBACK;
  }
  
  // Default to uploaded strategy
  return CACHE_STRATEGIES.UPLOADED;
}

function createImageResponse(req, filePath, content, stats, strategy) {
  const contentType = detectImageType(filePath);
  const etag = generateETag(content, stats);
  
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': strategy.cacheControl,
    'ETag': etag,
    'Vary': strategy.vary,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Content-Security-Policy': "default-src 'self'",
    'Accept-Ranges': 'bytes',
    
    // Image-specific headers
    'Last-Modified': new Date(stats.mtime || Date.now()).toUTCString(),
    'X-Image-Cache-Strategy': strategy.priority || 'medium',
    'X-Image-Cache-Age': strategy.maxAge.toString(),
    'X-Image-Size': stats.size ? stats.size.toString() : '0',
  };

  // Add compression headers if supported
  if (strategy.compression) {
    headers['Content-Encoding'] = 'br, gzip'; // Advertise both compressions
  }

  // Security headers
  if (strategy.etag) {
    headers['If-None-Match'] = etag;
  }

  // CORS headers for web applications
  headers['Access-Control-Allow-Origin'] = '*';
  headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Range, If-None-Match';

  return {
    statusCode: 200,
    headers,
    body: content,
  };
}

function handle304Response(req, strategy) {
  return {
    statusCode: 304,
    headers: {
      'Cache-Control': strategy.cacheControl,
      'ETag': req.headers['if-none-match'],
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Vary': strategy.vary,
      'X-Image-Cache-Strategy': strategy.priority || 'medium',
    },
    body: '',
  };
}

function handleImageRequest(req, res, next) {
  const filePath = req.path || req.url;
  const strategy = detectImageCacheStrategy(req, filePath);
  
  // In development, simulate cache storage
  if (process.env.NODE_ENV === 'development') {
    const cacheKey = `${filePath}:${strategy.priority}`;
    const cached = cacheStore.get(cacheKey);
    
    if (cached && req.headers['if-none-match'] === cached.etag) {
      return handle304Response(req, strategy);
    }
    
    cacheStore.set(cacheKey, cached);
  }

  // Check for If-None-Match header for conditional requests
  if (req.headers['if-none-match']) {
    // In production, this would check against stored ETags
    // For now, we'll let the next middleware handle it
    next();
    return;
  }

  // Add cache debug headers in development
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Debug-Cache-Strategy', strategy.priority || 'medium');
    res.setHeader('X-Debug-Cache-Age', strategy.maxAge.toString());
    res.setHeader('X-Debug-Image-Type', detectImageType(filePath));
  }

  next();
}

// CDN Configuration for different platforms
const CDN_CONFIGS = {
  vercel: {
    name: 'Vercel Edge Functions',
    rules: [
      {
        source: '/uploads/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        { key: 'X-Vercel-Cache', value: 'FORCE' }
        ]
      },
      {
        source: '/mojobuslogo.(png|svg)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, immutable' },
          { key: 'X-Vercel-Cache', value: 'FORCE' }
        ]
      },
      {
        source: '/thumbnails/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
          { key: 'X-Vercel-Cache', value: 'FORCE' }
        ]
      }
    ]
  },
  
  netlify: {
    name: 'Netlify Edge Functions',
    netlifyToml: `
[[headers]]
  for = "/uploads/*"
    X-Netlify-Cache = "FORCE"
    Cache-Control = "public, max-age=31536000, immutable"
    
  for = "/mojobuslogo.*"
    X-Netlify-Cache = "FORCE"
    Cache-Control = "public, max-age=2592000, immutable"
    
  for = "/thumbnails/*"
    X-Netlify-Cache = "FORCE"
    Cache-Control = "public, max-age=604800, immutable"
    
  [[headers]]
    for = "/avatars/*"
    Cache-Control = "public, max-age=86400, must-revalidate"
    
  [[headers]]
    for = "/*.{jpg,jpeg,png,webp,gif,svg}"
    X-Netlify-Cache = "STALE_WHILE_REVALIDATE=300"
    Cache-Control = "public, max-age=2592000, must-revalidate"
    `
  },
  
  cloudflare: {
    name: 'Cloudflare Workers',
    workerJs: `
addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const pathname = url.pathname;
  
  // Image caching strategies
  let cacheControl = 'public, max-age=2592000, immutable';
  let etag = null;
  
  // User uploaded images - 1 year cache
  if (pathname.startsWith('/uploads/')) {
    cacheControl = 'public, max-age=31536000, immutable';
  }
  
  // System images - 30 days cache
  else if (pathname.includes('mojobuslogo') || pathname.includes('bangkok')) {
    cacheControl = 'public, max-age=2592000, immutable';
  }
  
  // Generated thumbnails - 7 days cache
  else if (pathname.startsWith('/thumbnails/')) {
    cacheControl = 'public, max-age=604800, immutable';
  }
  
  // User avatars - 1 day cache with revalidation
  else if (pathname.startsWith('/avatars/')) {
    cacheControl = 'public, max-age=86400, must-revalidate';
  }
  
  // Handle image requests
  if (pathname.match(/\\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    const response = await fetch(event.request);
    
    if (response.ok) {
      const imageData = await response.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', imageData);
      etag = \`"\${Buffer.from(hash).toString('hex')}\`;
      
      // Check conditional request
      if (event.request.headers.get('if-none-match') === etag) {
        return new Response(null, { status: 304 });
      }
      
      return new Response(imageData, {
        headers: {
          'Content-Type': response.headers.get('Content-Type'),
          'Cache-Control': cacheControl,
          'ETag': etag,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      });
    }
  }
  
  return fetch(event.request);
});
    `
  },
  
  nginx: {
    name: 'Nginx Configuration',
    config: `
server {
    listen 80;
    server_name mojobus.org;
    root /var/www/mojobus;
    
    # Image caching strategies
    location ~* \\.(jpg|jpeg|png|gif|webp|svg)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
      add_header X-Content-Type-Options "nosniff";
      add_header X-Frame-Options "DENY";
      
      # Conditional request handling
      if_modified_since $sent_http_if_modified_since {
        add_header Cache-Control "no-cache";
        add_header Last-Modified "";
        break;
      }
    }
    
    # User uploaded images - 1 year cache
    location /uploads/ {
      expires 1y;
      add_header Cache-Control "public, immutable";
      add_header X-Content-Type-Options "nosniff";
      add_header X-Frame-Options "DENY";
      etag on;
      
      # Create ETag based on file hash
      location ~* \\.(jpg|jpeg|png|gif|webp)$ {
        try_files $uri = $document_root$uri;
        access_log off;
        expires max;
        break;
      }
    }
    
    # System images - 30 days cache
    location ~* (mojobuslogo|bangkok)\\.(png|svg)$ {
      expires 30d;
      add_header Cache-Control "public, immutable";
      add_header X-Content-Type-Options "nosniff";
      add_header X-Frame-Options "DENY";
    }
    
    # Generated thumbnails - 7 days cache
    location /thumbnails/ {
      expires 7d;
      add_header Cache-Control "public, immutable";
      add_header X-Content-Type-Options "nosniff";
      add_header X-Frame-Options "DENY";
    }
    
    # User avatars - 1 day cache with revalidation
    location /avatars/ {
      expires 1d;
      add_header Cache-Control "public, max-age=86400, must-revalidate";
      add_header X-Content-Type-Options "nosniff";
      add_header X-Frame-Options "DENY";
      etag on;
    }
    
    # Fallback/default images - 30 days cache
    location /assets/images/fallback/ {
      expires 30d;
      add_header Cache-Control "public, immutable";
      add_header X-Content-Type-Options "nosniff";
      add_header X-Frame-Options "DENY";
    }
    
    # Bypass cache for temporary uploads
    location /temp/ {
      add_header Cache-Control "no-cache, no-store, must-revalidate";
      add_header Pragma "no-cache";
      add_header Expires "Thu, 01 Jan 1970 00:00:00 GMT";
    }
    
    # Security headers for all image responses
    location ~* \\.(jpg|jpeg|png|gif|webp|svg)$ {
      add_header X-Frame-Options "DENY";
      add_header X-Content-Type-Options "nosniff";
      add_header X-XSS-Protection "1; mode=block";
    }
    
    # Gzip compression for images
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
      image/jpeg
      image/gif
      image/png
      image/webp;
      image/svg+xml;
  }
}
    `
  }
};

module.exports = {
  CACHE_STRATEGIES,
  CONTENT_TYPES,
  OPTIMIZATION,
  CDN_CONFIGS,
  createImageResponse,
  handleImageRequest,
  generateETag,
  detectImageType,
  detectImageCacheStrategy,
};