import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RelaySelector } from '@/components/RelaySelector';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Calendar, Download, Share2, Heart, MessageSquare, X, ZoomIn, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAuthor } from '@/hooks/useAuthor';
import { PostActions } from '@/components/PostActions';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { NoteContent } from '@/components/NoteContent';
import { NOSTR_CONFIG } from '@/config/nostr';
import { nip19 } from 'nostr-tools';

interface ImageEvent {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  tags: string[][];
}

export function ImageDetail() {
  const { nip19: noteId } = useParams();
  const navigate = useNavigate();
  const { nostr } = useNostr();
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Decode nip19 to get event ID
  let eventId = noteId;
  try {
    if (noteId?.startsWith('note1')) {
      const decoded = nip19.decode(noteId);
      eventId = decoded.data;
    }
  } catch (error) {
    console.error('Error decoding nip19:', error);
    navigate('/bilder');
  }

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['image-detail', eventId],
    queryFn: async ({ signal }) => {
      if (!eventId) return null;

      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(3000)]);

      console.log('Querying for event with ID:', eventId);

      const allEvents = await nostr.query([
        {
          ids: [eventId],
        }
      ], { signal: abortSignal });

      console.log('Found events:', allEvents.length);

      const event = allEvents[0];

      if (!event) {
        console.log('No event found with ID:', eventId);
        return null;
      }

      return event;
    },
    enabled: !!eventId,
  });

  const author = useAuthor(events?.pubkey);
  const metadata = author.data?.metadata;

  const extractImages = (content: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
    const matches = content.match(urlRegex) || [];
    return matches;
  };

  const extractTags = (event: ImageEvent): string[] => {
    console.log('Extracting tags from event:', event?.tags);
    const result = event.tags
      ?.filter(tag => tag[0] === 't')
      ?.map(tag => tag[1]) || [];
    console.log('Extracted tags:', result);
    return result;
  };

  const contentHasImages = (content: string): boolean => {
    if (!content) return false;
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|webm))/gi;
    return urlRegex.test(content);
  };

  const images = events ? extractImages(events.content) : [];
  const tags = events ? extractTags(events) : [];

  // Determine if this should be treated as an image event
  const hasImagesInContent = events && contentHasImages(events.content);
  const hasMediaTags = tags.some(tag =>
    ['medien', 'media', 'bilder', 'images', 'photo', 'image', 'video', 'audio'].includes(tag)
  );
  const isValidImageEvent = events && (hasImagesInContent || hasMediaTags || images.length > 0);

  console.log('Image validation:', {
    eventExists: !!events,
    imagesCount: images.length,
    hasImagesInContent,
    hasMediaTags,
    tagsFound: tags,
    isValid: isValidImageEvent
  });

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/bilder')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Bilder
          </Button>

          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    console.log('Error occurred:', error);
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/bilder')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Bilder
          </Button>

          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <h3 className="text-lg font-semibold text-red-600">
                  Fehler beim Laden
                </h3>
                <p className="text-muted-foreground mb-4">
                  Beim Laden des Bildes ist ein Fehler aufgetreten.
                </p>
                <div className="space-y-2">
                  <Button onClick={() => navigate('/bilder')}>
                    Zurück zur Bildergalerie
                  </Button>
                  <RelaySelector className="w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render no event found state
  if (!events) {
    console.log('No events found');
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/bilder')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Bilder
          </Button>

          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <h3 className="text-lg font-semibold text-red-600">
                  Bild nicht gefunden
                </h3>
                <p className="text-muted-foreground mb-4">
                  Das angegebene Bild konnte nicht geladen werden oder wurde bereits gelöscht.
                </p>
                <p className="text-sm text-gray-600">
                  Möglicherweise ist die ID ungültig oder das Bild wurde entfernt.
                </p>
                <div className="space-y-2">
                  <Button onClick={() => navigate('/bilder')}>
                    Zurück zur Bildergalerie
                  </Button>
                  <RelaySelector className="w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render the event detail page
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/bilder')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Bilder
        </Button>

        {/* Warning if not classified as image */}
        {!isValidImageEvent && (
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
            <CardContent className="py-4 px-6">
              <div className="flex items-start gap-3">
                <div className="text-orange-600 dark:text-orange-400 mt-0.5">
                  ⚠️
                </div>
                <div className="flex-1">
                  <p className="font-medium text-orange-900 dark:text-orange-200">
                    Event nicht als Bild klassifiziert
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Dieses Event enthält möglicherweise keine Bild-Tags, wird aber trotzdem angezeigt.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        <Card className="mb-6">
          <CardContent className="py-4 px-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Debug Info:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li>Event ID: {events.id?.substring(0, 12)}...</li>
                <li>Pubkey: {events.pubkey?.byteLength} bytes</li>
                <li>Kind: {events.kind}</li>
                <li>Bilder gefunden: {images.length}</li>
                <li>Tags gefunden: {tags.length}</li>
                <li>Validiert: {isValidImageEvent ? '✅' : '❌'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Event Content */}
        <div className="space-y-6">
          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-ocean-600" />
                Autor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {metadata?.picture ? (
                  <img
                    src={metadata.picture}
                    alt={metadata.name || 'Anonymous'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{metadata?.name || 'Anonymous'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {metadata?.nip05 || 'Kein NIP-05'}
                  </p>
                </div>
              </div>

              {metadata?.about && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metadata.about}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Image Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-ocean-600" />
                Bild-Informationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(events.created_at * 1000).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>

              <div className="text-sm">
                <span className="font-medium">Anzahl Bilder:</span> {images.length}
              </div>

              {images.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Bilder:</div>
                  {images.map((img, index) => (
                    <div key={index} className="text-xs text-ocean-600 hover:text-ocean-700 cursor-pointer truncate">
                      {img}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="text-xs">Tags</Badge>
                  Bild-Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-ocean-600" />
                Aktionen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share?.({
                      title: 'Bild von MojoBus',
                      text: events.content,
                      url: window.location.href
                    });
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Teilen
              </Button>

              <PostActions
                event={events}
                onDelete={() => {
                  setTimeout(() => navigate('/bilder'), 1000);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
