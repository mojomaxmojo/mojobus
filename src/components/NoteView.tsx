import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { RelaySelector } from '@/components/RelaySelector';
import { NoteContent } from '@/components/NoteContent';
import { extractNoteTags, extractNoteImages } from '@/hooks/useNotes';
import { Calendar, ArrowLeft, Hash, Edit, Trash2, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useHead } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { nip19 } from 'nostr-tools';

interface NoteViewProps {
  eventId: string;
}

// Parse position string to detect GPS coordinates
const parsePosition = (position: string) => {
  // GPS coordinate patterns
  const gpsPatterns = [
    /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/, // 13.7563, 100.5018
    /^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/,  // 13.7563 100.5018
  ];

  for (const pattern of gpsPatterns) {
    const match = position.match(pattern);
    if (match) {
      const [, lat, lng] = match.map(parseFloat);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng, isGPS: true };
      }
    }
  }

  return { lat: null, lng: null, isGPS: false };
};

// Generate OpenStreetMap URL for GPS coordinates
const generateOSMUrl = (lat: number, lng: number) => {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;
};

// Generate OpenStreetMap search URL for text locations
const generateOSMSearchUrl = (position: string) => {
  // Clean and encode the position for search
  const searchQuery = encodeURIComponent(position);
  return `https://www.openstreetmap.org/search?query=${searchQuery}`;
};

export function NoteView({ eventId }: NoteViewProps) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', eventId],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [
          {
            ids: [eventId],
            limit: 1,
          },
        ],
        {
          signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
        }
      );

      return events[0] || null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  const author = useAuthor(note?.pubkey || '');
  const isAuthor = user?.pubkey === note?.pubkey;

  // Extract location from note
  const locationTag = note?.tags.find(([name]) => name === 'location');
  const position = locationTag?.[1] || '';
  const { lat, lng, isGPS } = position ? parsePosition(position) : { lat: null, lng: null, isGPS: false };

  // Dynamic SEO Meta Tags
  useHead(() => {
    if (!note) return {};

    const authorName = author.data?.metadata?.name || 'Mojo';
    const title = `Note von ${authorName}`;
    const description = `${note.content.substring(0, 160)}${note.content.length > 160 ? '...' : ''}`;
    const tags = extractNoteTags(note);
    const keywords = ['perpetual traveler', 'vanlife', 'offgrid', 'note', 'blog', ...tags];

    return {
      title: `${title} - MojoBus Perpetual Traveler Blog`,
      meta: [
        { name: 'description', content: description },
        { name: 'keywords', content: keywords.join(', ') },
        { property: 'og:title', content: `${title} - MojoBus` },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'article' },
        { property: 'og:image', content: 'https://mojobus.org/mojobuslogo.png' },
        { property: 'article:author', content: authorName },
        { property: 'article:published_time', content: new Date(note.created_at * 1000).toISOString() },
        { property: 'article:tag', content: tags },
        { name: 'twitter:title', content: `${title} - MojoBus` },
        { name: 'twitter:description', content: description },
        { name: 'twitter:card', content: 'summary' },
      ],
      link: [
        { rel: 'canonical', href: `https://mojobus.org/${nip19.noteEncode(eventId)}` }
      ]
    };
  });

  const handleDelete = async () => {
    if (!note) return;

    try {
      createEvent(
        {
          kind: 5, // Event deletion kind
          content: 'Note deleted',
          tags: [['e', note.id]],
        },
        {
          onSuccess: () => {
            toast({
              title: 'Erfolgreich gelöscht!',
              description: 'Die Note wurde von Nostr entfernt.',
            });
            setDeleteDialogOpen(false);
            window.location.href = '/notes';
          },
          onError: (error) => {
            toast({
              title: 'Fehler beim Löschen',
              description: error.message,
              variant: 'destructive',
            });
          },
        }
      );
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Die Note konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <Skeleton className="h-10 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <p className="text-muted-foreground">
                    Note nicht gefunden. Versuche es mit einem anderen Relay?
                  </p>
                  <RelaySelector className="w-full" />
                  <Button asChild variant="outline">
                    <Link to="/notes">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Zurück zu den Notes
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const authorName = author.data?.metadata?.name || genUserName(note.pubkey);
  const authorAvatar = author.data?.metadata?.picture;
  const tags = extractNoteTags(note);
  const images = extractNoteImages(note);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link to="/notes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zu den Notes
              </Link>
            </Button>

            {isAuthor && (
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/veroeffentlichen?edit=${note.id}&type=note`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  {authorAvatar && <AvatarImage src={authorAvatar} alt={authorName} />}
                  <AvatarFallback>{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{authorName}</div>
                  {author.data?.metadata?.nip05 && (
                    <p className="text-xs text-muted-foreground">✓ {author.data.metadata.nip05}</p>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <time>
                      {new Date(note.created_at * 1000).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              </div>



              <div className="space-y-2">
                <div className="whitespace-pre-wrap break-words">
                  <NoteContent event={note} className="text-sm" />
                </div>
              </div>

              {images.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Note image ${index + 1}`}
                        className="w-full h-auto rounded-lg"
                        loading="lazy"
                      />
                    ))}
                  </div>
                </div>
              )}

              {tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        <Hash className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Position Display */}
          {position && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-ocean-600" />
                  <span className="font-medium">Position</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-6 px-2 text-xs"
                >
                  <a
                    href={generateOSMSearchUrl(position)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Karte
                  </a>
                </Button>
              </div>
              <p className="mt-2 text-sm">{position}</p>
            </div>
          )}

          <CommentsSection
            root={note}
            title="Kommentare"
            emptyStateMessage="Noch keine Kommentare"
            emptyStateSubtitle="Sei der Erste, der einen Kommentar hinterlässt!"
          />
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Note löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dies wird die Note permanent von Nostr entfernen. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}