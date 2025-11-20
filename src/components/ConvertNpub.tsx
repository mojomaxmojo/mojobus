import { nip19 } from 'nostr-tools';
import { useEffect, useState } from 'react';

export function ConvertNpub() {
  const [results, setResults] = useState<{ npub: string; hex: string }[]>([]);

  useEffect(() => {
    const npubs = [
      'npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf',
      'npub1jn4arsy5pzqausut0u79x2mnur2dd34szcxnlc5c5407f828002qdls5wz',
    ];

    const converted = npubs.map(npub => {
      try {
        const decoded = nip19.decode(npub);
        return {
          npub,
          hex: decoded.data as string,
        };
      } catch (e) {
        return {
          npub,
          hex: 'ERROR: ' + String(e),
        };
      }
    });

    setResults(converted);
  }, []);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">NPub zu Hex Konvertierung</h3>
      {results.map((r, i) => (
        <div key={i} className="mb-2 text-xs">
          <div className="font-mono">{r.npub}</div>
          <div className="font-mono text-primary">{r.hex}</div>
        </div>
      ))}
    </div>
  );
}
