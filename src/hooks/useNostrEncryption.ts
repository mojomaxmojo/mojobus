/**
 * Nostr Encryption Hook
 *
 * Handles NIP-44 encryption/decryption for private cost tracker data
 */

import { useNostr } from '@nostrify/react';
import { useState, useCallback } from 'react';
import type { nip44 } from 'nostr-tools';

/**
 * Encrypt content using NIP-44
 */
export async function encryptContent(
  content: string,
  recipientPubkey: string,
  nostr: any
): Promise<string> {
  console.log('🔐 Verschlüsselung gestartet für:', recipientPubkey);

  if (!nostr) {
    throw new Error('Nostr nicht verfügbar');
  }

  if (!nostr.nip44) {
    console.error('❌ nostr.nip44 nicht verfügbar');
    throw new Error('NIP-44 nicht verfügbar: Bitte aktualisiere deinen Nostr-Client');
  }

  if (typeof nostr.nip44.encrypt !== 'function') {
    console.error('❌ nostr.nip44.encrypt ist keine Funktion');
    throw new Error('NIP-44-Verschlüsselung wird von deinem Nostr-Client nicht unterstützt');
  }

  try {
    // Note: This uses @nostrify/react's encryption
    // The actual implementation depends on NIP-07 signer or local private key
    const encrypted = await nostr.nip44.encrypt(content, recipientPubkey);
    console.log('✅ Verschlüsselung erfolgreich');
    return encrypted;
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Verschlüsselung fehlgeschlagen: ' + (error as Error).message);
  }
}

/**
 * Decrypt content using NIP-44
 */
export async function decryptContent(
  encryptedContent: string,
  senderPubkey: string,
  nostr: any
): Promise<string> {
  console.log('🔓 Entschlüsselung gestartet von:', senderPubkey);

  if (!nostr) {
    throw new Error('Nostr nicht verfügbar');
  }

  if (!nostr.nip44) {
    throw new Error('NIP-44 nicht verfügbar');
  }

  if (typeof nostr.nip44.decrypt !== 'function') {
    throw new Error('NIP-44-Entschlüsselung wird nicht unterstützt');
  }

  try {
    const decrypted = await nostr.nip44.decrypt(encryptedContent, senderPubkey);
    console.log('✅ Entschlüsselung erfolgreich');
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Entschlüsselung fehlgeschlagen: ' + (error as Error).message);
  }
}

/**
 * Hook for Nostr encryption operations
 */
export function useNostrEncryption() {
  const { nostr } = useNostr();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  /**
   * Encrypt content for a specific recipient
   */
  const encrypt = useCallback(async (
    content: string,
    recipientPubkey: string
  ): Promise<string> => {
    if (!nostr) {
      throw new Error('Nostr nicht verfügbar');
    }

    setIsEncrypting(true);
    try {
      const encrypted = await encryptContent(content, recipientPubkey, nostr);
      return encrypted;
    } finally {
      setIsEncrypting(false);
    }
  }, [nostr]);

  /**
   * Decrypt content from a specific sender
   */
  const decrypt = useCallback(async (
    encryptedContent: string,
    senderPubkey: string
  ): Promise<string> => {
    if (!nostr) {
      throw new Error('Nostr nicht verfügbar');
    }

    setIsDecrypting(true);
    try {
      const decrypted = await decryptContent(encryptedContent, senderPubkey, nostr);
      return decrypted;
    } finally {
      setIsDecrypting(false);
    }
  }, [nostr]);

  return {
    encrypt,
    decrypt,
    isEncrypting,
    isDecrypting,
  };
}

/**
 * Encrypt cost entry content
 */
export async function encryptCostEntry(
  entry: any,
  recipientPubkey: string,
  nostr: any
): Promise<string> {
  const content = JSON.stringify(entry);
  return encryptContent(content, recipientPubkey, nostr);
}

/**
 * Decrypt cost entry content
 */
export async function decryptCostEntry(
  encryptedContent: string,
  senderPubkey: string,
  nostr: any
): Promise<any> {
  try {
    const decrypted = await decryptContent(encryptedContent, senderPubkey, nostr);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to parse decrypted cost entry:', error);
    return null;
  }
}
