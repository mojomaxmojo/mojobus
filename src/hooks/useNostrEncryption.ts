/**
 * Nostr Encryption Hook
 *
 * Handles NIP-44 encryption/decryption for private cost tracker data
 */

import { useNostr } from '@nostrify/react';
import { useState, useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { nip44 } from 'nostr-tools';

/**
 * Encrypt content using NIP-44
 */
export async function encryptContent(
  content: string,
  recipientPubkey: string
): Promise<string> {
  try {
    // Using nostr-tools nip44 encryption
    // This requires a secret key which we get from the NIP-07 signer
    const encrypted = await nip44.encrypt(content, recipientPubkey);
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
  senderPubkey: string
): Promise<string> {
  try {
    const decrypted = await nip44.decrypt(encryptedContent, senderPubkey);
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
  const { user } = useCurrentUser();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  /**
   * Encrypt content for a specific recipient
   * Note: This requires the user's private key from NIP-07 signer
   */
  const encrypt = useCallback(async (
    content: string,
    recipientPubkey: string
  ): Promise<string> => {
    if (!user?.signer) {
      throw new Error('Nicht eingeloggt: Bitte mit deinem Nostr-Account einloggen');
    }

    console.log('🔐 Verschlüsselung gestartet für:', recipientPubkey);

    setIsEncrypting(true);
    try {
      // Get the user's secret key from the signer
      const secretKey = await (user.signer as any).getSecretKey?.();
      
      if (!secretKey) {
        throw new Error('Private Key konnte nicht vom Signer abgerufen werden');
      }

      // Use nostr-tools nip44 encryption with secret key
      const encrypted = await nip44.encrypt(content, recipientPubkey, secretKey);
      console.log('✅ Verschlüsselung erfolgreich');
      return encrypted;
    } finally {
      setIsEncrypting(false);
    }
  }, [user]);

  /**
   * Decrypt content from a specific sender
   */
  const decrypt = useCallback(async (
    encryptedContent: string,
    senderPubkey: string
  ): Promise<string> => {
    if (!user?.signer) {
      throw new Error('Nicht eingeloggt: Bitte mit deinem Nostr-Account einloggen');
    }

    console.log('🔓 Entschlüsselung gestartet von:', senderPubkey);

    setIsDecrypting(true);
    try {
      // Get the user's secret key from the signer
      const secretKey = await (user.signer as any).getSecretKey?.();
      
      if (!secretKey) {
        throw new Error('Private Key konnte nicht vom Signer abgerufen werden');
      }

      // Use nostr-tools nip44 decryption with secret key
      const decrypted = await nip44.decrypt(encryptedContent, senderPubkey, secretKey);
      console.log('✅ Entschlüsselung erfolgreich');
      return decrypted;
    } finally {
      setIsDecrypting(false);
    }
  }, [user]);

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
  recipientPubkey: string
): Promise<string> {
  const content = JSON.stringify(entry);
  return encryptContent(content, recipientPubkey);
}

/**
 * Decrypt cost entry content
 */
export async function decryptCostEntry(
  encryptedContent: string,
  senderPubkey: string
): Promise<any> {
  try {
    const decrypted = await decryptContent(encryptedContent, senderPubkey);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to parse decrypted cost entry:', error);
    return null;
  }
}
