import { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  threshold?: number;
}

/**
 * LazyImage Komponente für performantes Bild-Laden
 *
 * Features:
 * - Lazy Loading mit Intersection Observer
 * - Blur-Up Placeholder
 * - Smooth Fade-In Animation
 * - Responsive Größen
 */
export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  placeholder,
  threshold = 0.1,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: '100px', // Lade Bilder 100px vor dem Viewport
      }
    );

    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(true); // Zeige Skeleton bei Error
  };

  const style = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
    opacity: isLoaded && !error ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
  };

  return (
    <div className={cn('relative overflow-hidden', className)} style={style}>
      {!isLoaded && !error && (
        <div className="absolute inset-0">
          {placeholder ? (
            <img
              src={placeholder}
              alt={alt}
              className="w-full h-full object-cover filter blur-xl"
            />
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>
      )}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover',
            error && 'hidden'
          )}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-sm">Bild konnte nicht geladen werden</span>
        </div>
      )}
    </div>
  );
}
