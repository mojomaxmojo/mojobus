import { FileImage, Image as ImageIcon, Image as ImageIcon2, Film, FileText, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

type ImagePlaceholderVariant = 'article' | 'note' | 'place' | 'image' | 'diy' | 'rvlife' | 'leon' | 'default';

interface ImagePlaceholderProps {
  variant?: ImagePlaceholderVariant;
  className?: string;
  title?: string;
}

/**
 * Bildplatzhalter für Card-Ansichten
 * Wird angezeigt, wenn kein Bild verfügbar ist
 */
export function ImagePlaceholder({ 
  variant = 'default',
  className,
  title = 'Kein Bild',
}: ImagePlaceholderProps) {
  const iconMap = {
    article: FileText,
    note: FileText,
    place: MapPin,
    image: ImageIcon,
    diy: FileImage,
    rvlife: Film,
    leon: FileImage,
    default: ImageIcon2,
  };

  const Icon = iconMap[variant];

  return (
    <div className={cn(
      'aspect-video flex flex-col items-center justify-center bg-muted',
      'border-2 border-dashed border-muted-foreground/20',
      'hover:border-muted-foreground/40 transition-colors',
      className
    )}>
      <Icon className="h-12 w-12 text-muted-foreground/30 mb-2" />
      <div className="text-center px-4">
        <p className="text-sm text-muted-foreground/50 font-medium">
          Kein Bild
        </p>
      </div>
    </div>
  );
}
