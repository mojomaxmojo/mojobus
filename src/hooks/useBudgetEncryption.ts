/**
 * Hook für NIP-44 Verschlüsselung im Haushaltsbuch
 * 
 * Ermöglicht verschlüsselte Speicherung von Budget-Daten
 * Nur die 2 autorisierten Autoren können lesen/schreiben
 */

import { useCallback } from 'react';
import { nip44 } from 'nostr-tools';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { BUDGET_AUTHORIZED_PUBKEYS } from '@/config/budget';

/**
 * Verschlüsselt Daten für alle berechtigten Autoren
 * 
 * NIP-44 unterstützt nur 1 Empfänger pro Nachricht.
 * Daher speichern wir den Content einmal verschlüsselt und
 * verwenden ein gemeinsames Secret (aus den 2 Pubkeys abgeleitet).
 */
export function useBudgetEncryption() {
  
  /**
   * Verschlüsselt einen String mit NIP-44 für einen bestimmten pubkey
   */
  const encryptForPubkey = useCallback((plaintext: string, pubkey: string, privkey: string): string => {
    try {
      const conversationKey = nip44.v2.getConversationKey(privkey, pubkey);
      const encrypted = nip44.v2.encrypt(plaintext, conversationKey);
      return encrypted;
    } catch (error) {
      console.error('[BudgetEncryption] Encrypt error:', error);
      throw new Error('Verschlüsselung fehlgeschlagen');
    }
  }, []);

  /**
   * Entschlüsselt einen NIP-44 verschlüsselten String
   */
  const decryptFromPubkey = useCallback((ciphertext: string, pubkey: string, privkey: string): string => {
    try {
      const conversationKey = nip44.v2.getConversationKey(privkey, pubkey);
      const decrypted = nip44.v2.decrypt(ciphertext, conversationKey);
      return decrypted;
    } catch (error) {
      console.error('[BudgetEncryption] Decrypt error:', error);
      throw new Error('Entschlüsselung fehlgeschlagen');
    }
  }, []);

  /**
   * Verschlüsselt JSON-Daten für alle autorisierten Autoren
   * 
   * Rückgabe: Map von pubkey zu verschlüsseltem Content
   * Dies ermöglicht es jedem Autor, mit seinem eigenen Key zu entschlüsseln
   */
  const encryptForAllAuthors = useCallback((data: unknown, currentPrivkey: string): Record<string, string> => {
    const plaintext = JSON.stringify(data);
    const encryptedMap: Record<string, string> = {};

    // Für jeden autorisierten Autor verschlüsseln
    BUDGET_AUTHORIZED_PUBKEYS.forEach(pubkey => {
      try {
        encryptedMap[pubkey] = encryptForPubkey(plaintext, pubkey, currentPrivkey);
      } catch (error) {
        console.error(`[BudgetEncryption] Failed to encrypt for ${pubkey}:`, error);
      }
    });

    return encryptedMap;
  }, [encryptForPubkey]);

  /**
   * Entschlüsselt Daten aus einem verschlüsselten Event
   * 
   * Der Event-Content enthält eine Map von pubkey -> encrypted_content
   * Wir suchen unseren Eintrag und entschlüsseln ihn
   */
  const decryptFromEvent = useCallback(<T,>(
    encryptedMap: Record<string, string>, 
    currentPubkey: string,
    currentPrivkey: string,
    authorPubkey: string  // pubkey des Autors der das Event erstellt hat
  ): T | null => {
    try {
      // Unser verschlüsselter Content
      const ourEncrypted = encryptedMap[currentPubkey];
      if (!ourEncrypted) {
        console.error('[BudgetEncryption] No encrypted content for our pubkey');
        return null;
      }

      // Entschlüsseln mit dem Key des Autors
      const decrypted = decryptFromPubkey(ourEncrypted, authorPubkey, currentPrivkey);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('[BudgetEncryption] Decrypt from event failed:', error);
      return null;
    }
  }, [decryptFromPubkey]);

  return {
    encryptForPubkey,
    decryptFromPubkey,
    encryptForAllAuthors,
    decryptFromEvent,
    authorizedPubkeys: BUDGET_AUTHORIZED_PUBKEYS
  };
}

export default useBudgetEncryption;
