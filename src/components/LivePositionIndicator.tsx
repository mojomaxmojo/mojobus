import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2 } from 'lucide-react';
import { usePlaces, useLongformArticles, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useNostr } from '@nostrify/react';
import { NOSTR_CONFIG } from '@/config/nostr';

interface LivePositionData {
  name: string;
  since: string;
  daysAgo: number;
  type?: 'place' | 'article' | 'image' | 'note';
}

export function LivePositionIndicator() {
  const { nostr } = useNostr();
  const { data: places, isLoading } = usePlaces();
  const [position, setPosition] = useState<LivePositionData | null>(null);

  useEffect(() => {
    // Only process if places data is actually loaded
    if (!places || places.length === 0 || isLoading) return;

    // Fetch all content types to find most recent
    const fetchAllContent = async () => {
      try {
        const [articles, notes, media] = await Promise.all([
          nostr.query([
            {
              kinds: [30023],
              authors: NOSTR_CONFIG.authorPubkeys,
              limit: 20,
            }
          ]),
          nostr.query([
            {
              kinds: [1],
              authors: NOSTR_CONFIG.authorPubkeys,
              '#t': ['note', 'notiz'],
              limit: 20,
            }
          ]),
          nostr.query([
            {
              kinds: [1, 30023],
              authors: NOSTR_CONFIG.authorPubkeys,
              '#t': ['medien', 'media', 'bilder', 'images'],
              limit: 20,
            }
          ]),
        ]);

        // Combine all events
        const allEvents = [
          ...places.map(e => ({ ...e, type: 'place' })),
          ...articles.map(e => ({ ...e, type: 'article' })),
          ...notes.map(e => ({ ...e, type: 'note' })),
          ...media.map(e => ({ ...e, type: 'image' })),
        ];

        // Find most recent with GPS
        let latestWithGPS = null;
        let latestDate = 0;

        for (const event of allEvents) {
          const metadata = extractArticleMetadata(event);
          const locationTag = event.tags?.find(tag => tag[0] === 'location');

          if (!locationTag || !locationTag[1]) continue;

          const coords = locationTag[1].match(/lat=([0-9.-]+),lon=([0-9.-]+)/);
          if (!coords) continue;

          const eventDate = metadata.published_at || event.created_at;
          if (eventDate > latestDate) {
            latestDate = eventDate;
            latestWithGPS = {
              name: metadata.title || locationTag[1].split(',').slice(0, 2).join(','),
              since: new Date(eventDate * 1000).toLocaleDateString('de-DE'),
              daysAgo: Math.floor((Date.now() / 1000 - eventDate) / (24 * 60 * 60)),
              type: event.type,
            };
          }
        }

        if (latestWithGPS) {
          setPosition(latestWithGPS);
        }
      } catch (error) {
        console.error('Error fetching all content:', error);
      }
    };

    fetchAllContent();
  }, [places, isLoading, nostr]);

  if (isLoading || !position) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-1 bg-muted/30 rounded-full text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Lade Position...</span>
      </div>
    );
  }

  const getTypeBadge = () => {
    switch (position.type) {
      case 'place': return '📍 Ort';
      case 'article': return '📝 Artikel';
      case 'image': return '📷 Bild';
      case 'note': return '📝 Note';
      default: return '📍 Ort';
    }
  };

  return (
    <Link to="/map" className="inline-block">
      <div className="inline-flex items-center gap-3 px-5 py-1.25 bg-primary/10 hover:bg-primary/20 rounded-full transition-all duration-300 cursor-pointer group">
        <MapPin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />

        <span className="font-semibold text-sm text-foreground">
          {position.name}
        </span>

        <Badge variant="secondary" className="gap-1 px-2 py-0.5">
          ⚡ LIVE
        </Badge>

        <span className="text-sm text-muted-foreground">
          Seit {position.daysAgo === 0 ? 'heute' : position.daysAgo === 1 ? 'gestern' : `${position.daysAgo} Tagen`}
        </span>

        <span className="text-sm text-muted-foreground">
          •
        </span>

        <Badge variant="outline" className="gap-1 px-2 py-0.5 text-xs">
          {getTypeBadge()}
        </Badge>
      </div>
    </Link>
  );
}
