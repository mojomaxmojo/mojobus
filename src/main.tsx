import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Lazy load Leaflet CSS (only when needed)
// This prevents impacting initial bundle size
const loadLeafletCSS = () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
};

// Load CSS when visiting /map
if (window.location.pathname === '/map') {
  loadLeafletCSS();
}

// Listen for route changes to load Leaflet CSS dynamically
window.addEventListener('popstate', () => {
  if (window.location.pathname === '/map') {
    loadLeafletCSS();
  }
});

// Register Service Worker
import '@/lib/serviceWorker';

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
