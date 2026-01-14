/**
 * LoadingSpinner Component
 * Wird für Lazy Loading und Suspense verwendet
 */

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ className, size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

/**
 * PageLoader - Vollständiger Page Loader mit Overlay
 */
export function PageLoader({ text = 'Laden...' }: { text?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

/**
 * InlineLoader - Kompakter Loader für inline Verwendung
 */
export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <LoadingSpinner size="sm" />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
}
