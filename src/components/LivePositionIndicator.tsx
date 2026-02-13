import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Map as MapIcon, ExternalLink, Loader2 } from 'lucide-react';
import { usePlaces, extractArticleMetadata } from '@/hooks/useLongformArticles';

interface LivePositionData {
  name: string;
  since: string;
  daysAgo: number;
  photoCount?: number;
  articleCount?: number;
  link: string;
}

export function LivePositionIndicator() {
  const { data: places, isLoading } = usePlaces();
  const [position, setPosition] = useState<LivePositionData | null>(null);

  useEffect(() => {
    // Only process if places data is actually loaded
    if (!places || places.length === 0 || isLoading) return;

    // Find most recent place (only check first 10 for performance)
    const placesToCheck = places.slice(0, 10);
    const latestPlace = placesToCheck.reduce((latest, current) => {
      const metadata = extractArticleMetadata(current);
      const latestMetadata = extractArticleMetadata(latest);

      const currentDate = metadata.published_at || current.created_at;
      const latestDate = latestMetadata.published_at || latest.created_at;

      return currentDate > latestDate ? current : latest;
    }, placesToCheck[0]);

    if (!latestPlace) return;

    const metadata = extractArticleMetadata(latestPlace);
    const locationTag = latestPlace.tags?.find(tag => tag[0] === 'location');
    const publishedAt = metadata.published_at || latestPlace.created_at;

    if (!locationTag) return;

    // Calculate days ago
    const now = Math.floor(Date.now() / 1000);
    const daysAgo = Math.floor((now - publishedAt) / (24 * 60 * 60));

    setPosition({
      name: metadata.title || locationTag[1],
      since: new Date(publishedAt * 1000).toLocaleDateString('de-DE'),
      daysAgo,
      photoCount: metadata.image ? 1 : undefined,
      articleCount: 1,
      link: `/map`,
    });
  }, [places, isLoading]);

  if (isLoading || !position) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Lade Position...</span>
      </div>
    );
  }

  return (
    <Link to={position.link}>
      <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer group">
        <MapPin className="h-5 w-5 text-primary" />

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{position.name}</span>
            <Badge variant="secondary" className="text-xs gap-1">
              ⚡ LIVE
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Seit {position.daysAgo === 0 ? 'heute' : position.daysAgo === 1 ? 'gestern' : `${position.daysAgo} Tagen`}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-2">
          {position.photoCount && (
            <Badge variant="outline" className="text-xs gap-1">
              📸 {position.photoCount}
            </Badge>
          )}
          {position.articleCount && (
            <Badge variant="outline" className="text-xs gap-1">
              📝 {position.articleCount}
            </Badge>
          )}
        </div>

        <MapIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}
