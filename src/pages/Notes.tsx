import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RelaySelector } from '@/components/RelaySelector';
import { NoteContent } from '@/components/NoteContent';
import { useNotes, extractNoteTags, extractNoteImages } from '@/hooks/useNotes';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Calendar, Hash } from 'lucide-react';

export function Notes() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotes();
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const notes = data?.pages.flat() || [];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Notes</h1>
            <p className="text-lg text-muted-foreground">
              Kurze Updates und Gedanken aus unserem Alltag am Meer
            </p>
          </div>

          {/* Notes Feed */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
              
              {/* Load More Trigger */}
              {hasNextPage && (
                <div ref={ref} className="py-4">
                  {isFetchingNextPage && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <p className="text-muted-foreground">
                    Keine Notes gefunden. Versuche es mit einem anderen Relay?
                  </p>
                  <RelaySelector className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteCard({ note }: { note: any }) {
  const author = useAuthor(note.pubkey);
  const authorName = author.data?.metadata?.name || genUserName(note.pubkey);
  const authorAvatar = author.data?.metadata?.picture;
  const tags = extractNoteTags(note);
  const images = extractNoteImages(note);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            {authorAvatar && <AvatarImage src={authorAvatar} alt={authorName} />}
            <AvatarFallback>{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold truncate">{authorName}</span>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <time>
                  {new Date(note.created_at * 1000).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content */}
        <div className="whitespace-pre-wrap break-words">
          <NoteContent event={note} className="text-sm" />
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
          <div className="flex flex-wrap gap-2 pt-2">
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
  );
}
