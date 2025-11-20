import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import { ArticleView } from '@/components/ArticleView';
import NotFound from './NotFound';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type } = decoded;

  switch (type) {
    case 'npub':
    case 'nprofile':
      // TODO: Implement profile view
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Profil Ansicht</h1>
          <p className="text-muted-foreground">Profil-Ansicht ist noch nicht implementiert.</p>
        </div>
      );

    case 'note':
      // TODO: Implement note view
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Note Ansicht</h1>
          <p className="text-muted-foreground">Note-Ansicht ist noch nicht implementiert.</p>
        </div>
      );

    case 'nevent':
      // TODO: Implement event view
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Event Ansicht</h1>
          <p className="text-muted-foreground">Event-Ansicht ist noch nicht implementiert.</p>
        </div>
      );

    case 'naddr':
      // Addressable event view (articles)
      const naddr = decoded.data as nip19.AddressPointer;
      return <ArticleView naddr={naddr} />;

    default:
      return <NotFound />;
  }
}