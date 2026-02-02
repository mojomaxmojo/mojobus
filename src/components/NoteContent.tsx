import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';
import { VideoEmbed, isVideoContent } from './VideoEmbed';
import ReactMarkdown from 'react-markdown';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

/** Parses content of text note events with Markdown support. */
export function NoteContent({
  event,
  className,
}: NoteContentProps) {
  return (
    <div className={cn("prose prose-gray dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="my-3">{children}</p>,
          a: ({ href, children }) => {
            // Check if it's a video URL
            if (href && isVideoContent(href)) {
              return (
                <div className="my-4">
                  <VideoEmbed url={href} />
                </div>
              );
            }
            // Check if it's a Nostr reference
            if (href && (href.startsWith('nostr:') || /^(npub1|note1|nprofile1|nevent1|naddr1)/.test(href))) {
              try {
                const nostrId = href.startsWith('nostr:') ? href.slice(6) : href;
                const decoded = nip19.decode(nostrId);

                if (decoded.type === 'npub') {
                  return <NostrMention pubkey={decoded.data} />;
                }
                return (
                  <Link
                    to={`/${nostrId}`}
                    className="text-primary hover:underline"
                  >
                    {children}
                  </Link>
                );
              } catch {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {children}
                  </a>
                );
              }
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            );
          },
          code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{children}</code>,
          pre: ({ children }) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-muted pl-4 italic">{children}</blockquote>,
          ul: ({ children }) => <ul className="list-disc list-inside my-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
        }}
      >
        {event.content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Einfachere Version von NoteContent, die TextWithLinks für grundlegende Link-Konvertierung verwendet
 */
export function SimpleNoteContent({ event, className }: NoteContentProps) {
  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {event.content}
    </div>
  );
}

// Default export für lazy loading
export default NoteContent;


// Helper component to display user mentions
function NostrMention({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const hasRealName = !!author.data?.metadata?.name;
  const displayName = author.data?.metadata?.name ?? genUserName(pubkey);

  return (
    <Link
      to={`/${npub}`}
      className={cn(
        "font-medium hover:underline",
        hasRealName
          ? "text-blue-500"
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      @{displayName}
    </Link>
  );
}
