import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { NoteContent } from '@/components/NoteContent';
import { Calendar, ArrowLeft, Hash, Edit, Trash2, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHead } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { NKinds } from '@nostrify/nostrify';

interface NoteViewProps {
  eventId: string;
}

export function NoteView({ eventId }: NoteViewProps) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: deleteEvent } = useNostrPublish();

  const { data: event, isLoading } = useQuery({
    queryKey: ['note', eventId],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ ids: [eventId], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) }
      );
      return events[0] || null;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });

  const author = useAuthor(event?.pubkey || '');

  const handleDelete = () => {
    if (event && user?.pubkey === event.pubkey) {
      deleteEvent({ kind: 5, content: '', tags: [['e', event.id]] });
    }
  };

  useHead(() => {
    if (!event) return {};

    const authorName = author.data?.metadata?.name || genUserName(event.pubkey);
    const contentPreview = event.content.slice(0, 100);
    const date = new Date(event.created_at * 1000).toLocaleDateString('de-DE');

    return {
      title: `${authorName} - MojoBus Note`,
      meta: [
        { name: 'description', content: contentPreview },
        { property: 'og:title', content: `${authorName} - MojoBus Note` },
        { property: 'og:description', content: contentPreview },
        { property: 'og:type', content: 'article' },
      ],
      link: [
        { rel: 'canonical', href: `https://mojobus.cc/note/${eventId}` }
      ]
    };
  }, [event, author.data]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-10 w-32" />
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Note nicht gefunden.
                </p>
                <Button asChild variant="outline">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück zur Startseite
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const metadata = author.data?.metadata;
  const authorName = metadata?.name || metadata?.display_name || genUserName(event.pubkey);
  const authorAvatar = metadata?.picture;
  const nip05 = metadata?.nip05;
  const website = metadata?.website;

  const isOwnNote = user?.pubkey === event.pubkey;

  // Extract tags
  const tags = event.tags.filter(([name]) => name === 't').map(([, value]) => value);
  const images = event.tags.filter(([name]) => name === 'url' || name === 'imeta');
  const location = event.tags.find(([name]) => name === 'location' || name === 'place');

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Back Button */}
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Startseite
            </Link>
          </Button>

          {/* Main Note Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="h-12 w-12">
                    {authorAvatar && <AvatarImage src={authorAvatar} alt={authorName} />}
                    <AvatarFallback>{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/npub/${event.pubkey}`} className="font-semibold hover:underline">
                        {authorName}
                      </Link>
                      {nip05 && (
                        <Badge variant="secondary" className="text-xs">
                          ✓ {nip05}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.created_at * 1000).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {location[1]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isOwnNote && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/edit/${event.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Diese Note wirklich löschen?')) {
                          handleDelete();
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Content */}
              {event.content && (
                <div className="whitespace-pre-wrap break-words">
                  <NoteContent event={event} />
                </div>
              )}

              {/* Images */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img, index) => {
                    const url = img[1] || img.find((item: string) => item.startsWith('url='))?.split('=')[1];
                    if (!url) return null;

                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group"
                      >
                        <img
                          src={url}
                          alt={`Bild ${index + 1}`}
                          className="w-full h-48 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="h-8 w-8 text-white" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/tag/${tag}`}
                      className="flex items-center gap-1 text-sm text-ocean-600 dark:text-ocean-400 hover:underline"
                    >
                      <Hash className="h-3 w-3" />
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Website link if available */}
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-ocean-600 dark:text-ocean-400 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {website}
                </a>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <CommentsSection root={event} limit={100} />
        </div>
      </div>
    </div>
  );
}
