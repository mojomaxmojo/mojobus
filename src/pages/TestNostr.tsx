import { useNostr } from '@/hooks/useNostr';
import { useQuery } from '@tanstack/react-query';
import { NOSTR_CONFIG } from '@/config/nostr';
import { ConvertNpub } from '@/components/ConvertNpub';

export function TestNostr() {
  const { nostr } = useNostr();

  const { data: articles, isLoading: articlesLoading, error: articlesError } = useQuery({
    queryKey: ['test-articles'],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [
          {
            kinds: [30023],
            authors: NOSTR_CONFIG.authorPubkeys,
            limit: 10,
          },
        ],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );
      return events;
    },
  });

  const { data: notes, isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ['test-notes'],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [
          {
            kinds: [1],
            authors: NOSTR_CONFIG.authorPubkeys,
            limit: 10,
          },
        ],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );
      return events;
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Nostr Test</h1>

      <div className="space-y-8">
        {/* NPub Converter */}
        <ConvertNpub />

        {/* Config */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-bold mb-4">Konfiguration</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(NOSTR_CONFIG, null, 2)}</pre>
        </div>

        {/* Articles */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-bold mb-4">Artikel (kind 30023)</h2>
          {articlesLoading && <p>Lade Artikel...</p>}
          {articlesError && <p className="text-red-500">Fehler: {String(articlesError)}</p>}
          {articles && (
            <div>
              <p className="mb-2">Gefunden: {articles.length} Artikel</p>
              <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(articles, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-bold mb-4">Notes (kind 1)</h2>
          {notesLoading && <p>Lade Notes...</p>}
          {notesError && <p className="text-red-500">Fehler: {String(notesError)}</p>}
          {notes && (
            <div>
              <p className="mb-2">Gefunden: {notes.length} Notes</p>
              <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(notes, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
