import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Register Service Worker
import '@/lib/serviceWorker';

import '@fontsource-variable/inter';
import '@fontsource-variable/playfair-display';

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
