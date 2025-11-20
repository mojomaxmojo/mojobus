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
import { Calendar, ArrowLeft, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotFound from '@/pages/NotFound';

interface NoteViewProps {
  eventId: string;
}

export function NoteView({ eventId }: NoteViewProps) {
  const { nostr } = useNostr();

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
              <Skeleton className="h-4 w-3/4" />
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
          {/* Back Button */}
          <Button asChild variant="ghost" size="sm">
            <Link to="/notes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu den Notes
            </Link>
          </Button>

          {/* Note Card */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Author Info */}
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

              {/* Content */}
              <div className="whitespace-pre-wrap break-words text-base leading-relaxed">
                <NoteContent event={note} />
              </div>

              {/* Images */}
              {images.length > 0 && (
                <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {images.map((img, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden">
                      <img
                        src={img}
                        alt=""
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Hash className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <CommentsSection
            root={note}
            title="Kommentare"
            emptyStateMessage="Noch keine Kommentare"
            emptyStateSubtitle="Sei der Erste, der einen Kommentar hinterlässt!"
          />
        </div>
      </div>
    </div>
  );
}
