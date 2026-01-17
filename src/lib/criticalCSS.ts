/**
 * Critical CSS Extractor für MojoBus
 * Extrahiert und optimiert kritische CSS für Above-the-Fold Content
 */

/**
 * Critical CSS Selektoren für die Startseite
 * Diese werden inline in die index.html eingefügt
 */
export const CRITICAL_CSS = `
  /* Critical: Reset & Base */
  * {
    border-color: hsl(var(--border));
  }

  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-feature-settings: "rlig" 1, "calt" 1;
    font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
    margin: 0;
    padding: 0;
  }

  #root {
    min-height: 100vh;
  }

  /* Critical: Layout */
  .min-h-screen {
    min-height: 100vh;
  }

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* Critical: Typography */
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    line-height: 1.2;
  }

  h1 {
    font-size: 3rem;
    font-weight: 700;
  }

  h2 {
    font-size: 2rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    line-height: 1.6;
  }

  /* Critical: Background Gradient */
  .bg-gradient-to-b {
    background: linear-gradient(
      to bottom,
      hsl(var(--primary) / .1),
      hsl(var(--background)),
      hsl(var(--background))
    );
  }

  /* Critical: Spacing */
  .pt-20 {
    padding-top: 5rem;
  }

  .pb-2 {
    padding-bottom: 0.5rem;
  }

  .pb-16 {
    padding-bottom: 4rem;
  }

  .py-20 {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }

  .py-32 {
    padding-top: 8rem;
    padding-bottom: 8rem;
  }

  .space-y-6 > * + * {
    margin-top: 1.5rem;
  }

  .space-y-4 > * + * {
    margin-top: 1rem;
  }

  /* Critical: Text Styling */
  .text-center {
    text-align: center;
  }

  .text-4xl {
    font-size: 2.25rem;
  }

  .text-6xl {
    font-size: 3.75rem;
  }

  .text-2xl {
    font-size: 1.5rem;
  }

  .text-xl {
    font-size: 1.25rem;
  }

  .text-lg {
    font-size: 1.125rem;
  }

  .font-bold {
    font-weight: 700;
  }

  .text-muted-foreground {
    color: hsl(var(--muted-foreground));
  }

  .leading-relaxed {
    line-height: 1.75;
  }

  /* Critical: Background & Text Colors */
  .bg-primary\\/20 {
    background-color: hsl(var(--primary) / .2);
  }

  .text-primary {
    color: hsl(var(--primary));
  }

  .px-3 {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .py-1 {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }

  .rounded-full {
    border-radius: 9999px;
  }

  .text-sm {
    font-size: 0.875rem;
  }

  .font-medium {
    font-weight: 500;
  }

  /* Critical: Flexbox */
  .flex {
    display: flex;
  }

  .flex-wrap {
    flex-wrap: wrap;
  }

  .justify-center {
    justify-content: center;
  }

  .gap-2 {
    gap: 0.5rem;
  }

  .inline-flex {
    display: inline-flex;
  }

  .items-center {
    align-items: center;
  }

  .h-5 {
    height: 1.25rem;
  }

  .w-5 {
    width: 1.25rem;
  }

  /* Critical: Button Base Styles */
  button {
    cursor: pointer;
  }

  /* Critical: Loading States */
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }

  /* Critical: Wave Animation */
  @keyframes wave {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .wave-animation {
    animation: wave 3s ease-in-out infinite;
  }

  .h-16 {
    height: 4rem;
  }

  .w-16 {
    width: 4rem;
  }

  /* Critical: Max Width */
  .max-w-2xl {
    max-width: 42rem;
  }

  .max-w-4xl {
    max-width: 56rem;
  }

  .mx-auto {
    margin-left: auto;
    margin-right: auto;
  }

  /* Critical: Padding Top */
  .pt-4 {
    padding-top: 1rem;
  }

  .pt-6 {
    padding-top: 1.5rem;
  }

  /* Critical: Link Styling */
  a {
    color: inherit;
    text-decoration: none;
  }

  /* Critical: Skeleton Loading */
  .skeleton {
    background: hsl(var(--muted));
    min-height: 200px;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  /* Critical: Card Styles */
  .card {
    background: hsl(var(--card));
    color: hsl(var(--card-foreground));
  }

  /* Critical: Border */
  .border {
    border: 1px solid hsl(var(--border));
  }

  /* Critical: Rounded */
  .rounded-lg {
    border-radius: 0.5rem;
  }

  /* Critical: Gap */
  .gap-4 {
    gap: 1rem;
  }

  .gap-6 {
    gap: 1.5rem;
  }

  /* Critical: Grid */
  .grid {
    display: grid;
  }

  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .md\\:grid-cols-2 {
    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .md\\:grid-cols-3 {
    @media (min-width: 768px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
`;

/**
 * Critical CSS für den Above-the-Fold Content
 * Wird inline in die index.html eingefügt
 */
export const CRITICAL_ABOVE_THE_FOLD = `
  /* Critical CSS - Only for Above-the-Fold Content */
  ${CRITICAL_CSS}
`;

/**
 * Generiert den CSS String für die index.html
 */
export function generateCriticalCSS(): string {
  return CRITICAL_ABOVE_THE_FOLD;
}

/**
 * Gibt die geschätzte Größe des Critical CSS zurück
 */
export function getCriticalCSSSize(): number {
  return CRITICAL_CSS.length;
}

export default CRITICAL_CSS;
