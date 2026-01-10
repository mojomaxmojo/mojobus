import React from 'react';
import { convertTextLinksSecure } from '@/lib/utils';

interface TextWithLinksProps {
  text: string;
  className?: string;
  supportNostr?: boolean;
}

/**
 * React-Komponente, die Text mit automatisch konvertierten Links anzeigt
 * Verwendet dangerouslySetInnerHTML für die HTML-Link-Konvertierung
 * Unterstützt URLs, E-Mail-Adressen und optional Nostr-Bech32-Adressen
 */
export function TextWithLinks({ text, className = '', supportNostr = true }: TextWithLinksProps) {
  if (!text) {
    return <span className={className}></span>;
  }

  return (
    <span
      className={`whitespace-pre-wrap break-words ${className}`}
      dangerouslySetInnerHTML={convertTextLinksSecure(text)}
    />
  );
}

/**
 * Einfache Version ohne Nostr-Unterstützung
 */
export function TextWithWebLinks({ text, className = '' }: { text: string; className?: string }) {
  return <TextWithLinks text={text} className={className} supportNostr={false} />;
}

export default TextWithLinks;