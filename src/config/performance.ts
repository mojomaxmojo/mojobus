/**
 * Performance Configuration
 */

export const PERFORMANCE_CONFIG = {
  build: {
    minify: true,
    sourcemap: false,
    target: 'esnext',
  },
  caching: {
    defaultTTL: 300000, // 5 minutes in ms
    staleWhileRevalidate: true,
  },
  relay: {
    queryTimeout: 2000,
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  lazy: {
    rootMargin: '200px',
    threshold: 0.1,
  },
  image: {
    thumbnailWidth: 200,
    thumbnailHeight: 200,
    thumbnailQuality: 80,
    lazyLoad: true,
  },
};

export default PERFORMANCE_CONFIG;
