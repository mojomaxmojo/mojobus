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

export default function ImageDetail() {
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
          authors: NOSTR_CONFIG.authorPubkeys,
        }
      ], { signal: abortSignal });

      console.log('Found events:', allEvents.length);
      console.log('Events data:', allEvents);

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

  const extractImages = (content: string, tags?: string[][]): string[] => {
    // Extract images from content - improved regex that handles URLs with query parameters
    const urlRegex = /(https?:\/\/[^\s<>]+\.(?:jpg|jpeg|png|gif|webp))/gi;
    const contentImages = content.match(urlRegex) || [];

    // Also look for common image hosting patterns
    const hostingPatterns = [
      /https?:\/\/(?:www\.)?imgur\.com\/[a-zA-Z0-9]+(?:\.(?:jpg|jpeg|png|gif|webp))?/gi,
      /https?:\/\/i\.imgur\.com\/[a-zA-Z0-9]+\.(?:jpg|jpeg|png|gif|webp)/gi,
      /https?:\/\/cdn\.blossom\.[^\/\s]+\//gi,
      /https?:\/\/nostr\.build\/[^\/\s]+\.(?:jpg|jpeg|png|gif|webp)/gi,
      /https?:\/\/(?:www\.)?nostr\.img\.com\//gi,
    ];

    for (const pattern of hostingPatterns) {
      const matches = content.match(pattern) || [];
      contentImages.push(...matches);
    }

    // Also extract from 'url' tags (Nostr standard for file attachments)
    const tagImages = tags
      ?.filter(tag => tag[0] === 'url')
      ?.map(tag => tag[1])
      ?.filter(url => /\.(jpg|jpeg|png|gif|webp)/i.test(url)) || [];

    // Also extract from 'imeta' tags and get url
    const imetaImages: string[] = [];
    if (tags) {
      for (const tag of tags) {
        if (tag[0] === 'imeta' && tag.length > 1) {
          const imetaContent = tag[1];
          const urlMatch = imetaContent.match(/url\s+([^\s]+)/i);
          if (urlMatch && urlMatch[1]) {
            imetaImages.push(urlMatch[1]);
          }
        }
      }
    }

    // Combine and remove duplicates
    return [...new Set([...contentImages, ...tagImages, ...imetaImages])];
  };

  const extractTags = (event: ImageEvent): string[] => {
    console.log('Extracting tags from event:', event?.tags);
    const result = event.tags
      ?.filter(tag => tag[0] === 't')
      ?.map(tag => tag[1]) || [];
    console.log('Extracted tags:', result);
    return result;
  };

  const images = events ? extractImages(events.content, events.tags) : [];
  const tags = events ? extractTags(events) : [];

  // Determine if this should be treated as an image event
  const isValidImageEvent = events && (images.length > 0 || tags.some(tag =>
    ['medien', 'media', 'bilder', 'images', 'photo', 'image', 'video', 'audio', 'reise', 'travel', 'photography', 'nature', 'landscape', 'ocean', 'strand', 'beach', 'vanlife', 'offgrid'].includes(tag)
  ));

  console.log('Image validation:', {
    eventExists: !!events,
    imagesCount: images.length,
    tagsFound: tags,
    isValid: isValidImageEvent
  });

  console.log('Image validation:', {
    imagesFound: images.length,
    tagsFound: tags,
    isValid: isValidImageEvent
  });

  // Handle keyboard navigation for fullscreen
  useEffect(() => {
    if (!isImageFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageFullscreen(false);
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageFullscreen, images.length]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isImageFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isImageFullscreen]);

  const openFullscreen = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageFullscreen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  // Check loading state first
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

  // Check if event not found (error or null events)
  if (error || !events) {
    console.log('Error or no events found');
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

  // Check if event exists but is not a valid image event
  if (!isValidImageEvent) {
    console.log('Event exists but is not a valid image event');
    console.log('Debug info:', {
      event: events,
      imagesCount: images.length,
      tags: tags,
      isValid: isValidImageEvent
    });
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
                  Kein gültiges Bild
                </h3>
                <p className="text-muted-foreground mb-4">
                  Dieses Event wurde nicht als Bild-Ereignis klassifiziert.
                </p>
                <p className="text-sm text-gray-600">
                  Bitte navigieren Sie zur Bildergalerie, um gültige Bilder zu finden.
                </p>
                <div className="space-y-2">
                  <Button onClick={() => navigate('/bilder')}>
                    Zur Bildergalerie
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

        <div className="grid grid-cols-1 grid-cols-1 gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Image Display */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => openFullscreen(0)}
                >
                  <img
                    src={images[0]}
                    alt="Reisebild"
                    className="w-full object-cover bg-gray-100 dark:bg-gray-900 max-h-[800px]"
                    loading="lazy"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 flex flex-col items-center gap-2">
                      <ZoomIn className="h-8 w-8 text-gray-800 dark:text-white" />
                      <div className="text-gray-800 dark:text-white font-medium">
                        Klick für Vollbild
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Multiple Images Gallery */}
            {images.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Weitere Bilder ({images.length - 1})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.slice(1).map((img, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer rounded-lg overflow-hidden"
                        onClick={() => openFullscreen(index + 1)}
                      >
                        <img
                          src={img}
                          alt={`Bild ${index + 2}`}
                          className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex flex-col items-center gap-1">
                            <ZoomIn className="h-6 w-6 text-white" />
                            <span className="text-xs text-white">Vollbild</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content and Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-ocean-600" />
                  Beschreibung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <NoteContent event={events} className="text-base" />
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-ocean-600" />
                  Kommentare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentsSection root={events} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Autor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {metadata?.picture ? (
                    <div className="w-8 h-8 flex-shrink-0 relative overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <img
                        src={metadata.picture}
                        alt={metadata.name || 'Autor'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
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
                    <div className="font-medium text-sm">Download-Optionen:</div>
                    {images.map((img, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(img, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Bild {index + 1}
                        </Button>
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
                    <Share2 className="h-5 w-5 text-ocean-600" />
                    Tags
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

      {/* Fullscreen Image Viewer */}
      {isImageFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => setIsImageFullscreen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 z-50 text-white bg-black/50 px-3 py-1 rounded-md">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Download button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-16 z-50 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              window.open(images[currentImageIndex], '_blank');
            }}
          >
            <ExternalLink className="h-6 w-6" />
          </Button>

          {/* Previous button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Next button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Main image */}
          <img
            src={images[currentImageIndex]}
            alt={`Bild ${currentImageIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={() => setIsImageFullscreen(false)}
          />

          {/* Keyboard hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-white/70 text-sm bg-black/50 px-4 py-2 rounded-md">
            ESC zum Schließen {images.length > 1 && '• ← → zum Navigieren'}
          </div>
        </div>
      )}
    </div>
  );
}