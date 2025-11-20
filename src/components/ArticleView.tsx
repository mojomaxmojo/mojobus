import { type AddressPointer } from 'nostr-tools/nip19';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useLongformArticle, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { RelaySelector } from '@/components/RelaySelector';
import { Calendar, User, ArrowLeft, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import NotFound from '@/pages/NotFound';

interface ArticleViewProps {
  naddr: AddressPointer;
}

export function ArticleView({ naddr }: ArticleViewProps) {
  const { data: article, isLoading } = useLongformArticle(naddr.identifier, naddr.pubkey);
  const author = useAuthor(naddr.pubkey);

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <Skeleton className="h-12 w-3/4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-96 w-full" />
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

  if (!article) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <p className="text-muted-foreground">
                    Artikel nicht gefunden. Versuche es mit einem anderen Relay?
                  </p>
                  <RelaySelector className="w-full" />
                  <Button asChild variant="outline">
                    <Link to="/artikel">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Zurück zu den Artikeln
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

  const metadata = extractArticleMetadata(article);
  const authorName = author.data?.metadata?.name || genUserName(article.pubkey);
  const authorAvatar = author.data?.metadata?.picture;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-muted/30 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link to="/artikel">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zu den Artikeln
              </Link>
            </Button>

            {/* Tags */}
            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Hash className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {metadata.title}
            </h1>

            {/* Summary */}
            {metadata.summary && (
              <p className="text-xl text-muted-foreground leading-relaxed">
                {metadata.summary}
              </p>
            )}

            {/* Author Info */}
            <div className="flex items-center gap-3 pt-4">
              <Avatar className="h-12 w-12">
                {authorAvatar && <AvatarImage src={authorAvatar} alt={authorName} />}
                <AvatarFallback>{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 font-semibold">
                    <User className="h-3 w-3" />
                    <span>{authorName}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <time>
                      {new Date(metadata.publishedAt * 1000).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </div>
                {author.data?.metadata?.nip05 && (
                  <p className="text-xs text-muted-foreground">✓ {author.data.metadata.nip05}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Featured Image */}
            {metadata.image && (
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img
                  src={metadata.image}
                  alt={metadata.title}
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
            )}

            {/* Article Body */}
            <article className="prose prose-slate dark:prose-invert prose-lg max-w-none">
              <ReactMarkdown>{metadata.content}</ReactMarkdown>
            </article>

            {/* Divider */}
            <div className="border-t my-12" />

            {/* Comments */}
            <CommentsSection
              root={article}
              title="Kommentare"
              emptyStateMessage="Noch keine Kommentare"
              emptyStateSubtitle="Sei der Erste, der einen Kommentar hinterlässt!"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
