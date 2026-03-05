/**
 * Expense Encryption Utilities
 * NIP-04 based encryption for Mojo & Susanne's household book
 */

import { nip04, nip19 } from 'nostr-tools';
import { MOJO_PUBKEY, SUSANNE_PUBKEY, AUTHOR_PUBKEYS } from '@/config/expenseTypes';

// ============================================================================
// ENCRYPTION INTERFACES
// ============================================================================

export interface EncryptedExpense {
  /** AES-encrypted expense data (base64) */
  encryptedContent: string;
  
  /** Encrypted AES keys for each recipient (hex pubkey -> base64 key) */
  keys: Record<string, string>;
  
  /** IV for AES encryption (base64) */
  iv: string;
}

export interface MultiRecipientEncryptionResult {
  /** Combined encrypted data ready for Nostr event */
  encryptedData: string;
  
  /** Public tags for the Nostr event */
  publicTags: string[][];
}

// ============================================================================
// ENCRYPTION FUNCTIONS
// ============================================================================

/**
 * Encrypt expense data for multiple recipients (Mojo & Susanne)
 */
export async function encryptForBothAuthors(
  expenseData: any,
  senderPrivateKey: string
): Promise<MultiRecipientEncryptionResult> {
  try {
    // Convert data to JSON string
    const dataString = JSON.stringify(expenseData);
    
    // For each recipient, encrypt with NIP-04
    const encryptionPromises = AUTHOR_PUBKEYS.map(async (recipientPubkey) => {
      try {
        const encrypted = await nip04.encrypt(
          senderPrivateKey,
          recipientPubkey,
          dataString
        );
        return { recipientPubkey, encrypted };
      } catch (error) {
        console.error(`Failed to encrypt for ${recipientPubkey}:`, error);
        throw new Error(`Encryption failed for ${recipientPubkey}`);
      }
    });
    
    // Wait for all encryptions to complete
    const encryptionResults = await Promise.all(encryptionPromises);
    
    // Create the combined encrypted data structure
    const encryptedData: EncryptedExpense = {
      encryptedContent: '', // Will be set with first encryption
      keys: {},
      iv: '', // Not used in NIP-04, but kept for compatibility
    };
    
    // Use the first encryption as the main content
    // (All encryptions should be the same since NIP-04 does sender-recipient encryption)
    encryptedData.encryptedContent = encryptionResults[0].encrypted;
    
    // For NIP-04, we store each encrypted message separately
    // In practice, we just need one since it's the same data encrypted for each recipient
    encryptionResults.forEach(result => {
      // Store the encrypted content for each recipient
      encryptedData.keys[result.recipientPubkey] = result.encrypted;
    });
    
    // Generate public tags for filtering
    const publicTags = generatePublicTags(expenseData);
    
    return {
      encryptedData: JSON.stringify(encryptedData),
      publicTags,
    };
    
  } catch (error) {
    console.error('Multi-recipient encryption failed:', error);
    throw new Error('Failed to encrypt expense data');
  }
}

/**
 * Decrypt expense data for the current user
 */
export async function decryptExpenseData(
  encryptedDataStr: string,
  recipientPrivateKey: string,
  senderPubkey: string
): Promise<any> {
  try {
    const encryptedData: EncryptedExpense = JSON.parse(encryptedDataStr);
    
    // Try to find the encrypted content for this recipient
    const encryptedContent = encryptedData.keys[senderPubkey] || encryptedData.encryptedContent;
    
    if (!encryptedContent) {
      throw new Error('No encrypted content found for this recipient');
    }
    
    // Decrypt using NIP-04
    const decryptedString = await nip04.decrypt(
      recipientPrivateKey,
      senderPubkey,
      encryptedContent
    );
    
    return JSON.parse(decryptedString);
    
  } catch (error) {
    console.error('Expense decryption failed:', error);
    throw new Error('Failed to decrypt expense data');
  }
}

/**
 * Check if the current user can decrypt this expense
 */
export function canUserDecryptExpense(
  encryptedDataStr: string,
  userPubkey: string
): boolean {
  try {
    const encryptedData: EncryptedExpense = JSON.parse(encryptedDataStr);
    return userPubkey in encryptedData.keys;
  } catch {
    return false;
  }
}

/**
 * Generate public tags for filtering (without sensitive data)
 */
function generatePublicTags(expenseData: any): string[][] {
  const tags: string[][] = [];
  
  // Add recipient tags
  tags.push(['p', MOJO_PUBKEY]);
  tags.push(['p', SUSANNE_PUBKEY]);
  
  // Add date-based tags (year and month for filtering)
  if (expenseData.date) {
    try {
      const date = new Date(expenseData.date);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const yearMonth = `${year}-${month}`;
      
      tags.push(['year', year]);
      tags.push(['month', month]);
      tags.push(['yearmonth', yearMonth]);
    } catch (error) {
      console.warn('Failed to parse date for tags:', error);
    }
  }
  
  // Add category tag (only main category, no subcategories)
  if (expenseData.category) {
    // Only add if it's a main category (not subcategory like 'fuel')
    const mainCategories = ['transport', 'camping', 'groceries', 'restaurant', 'communication', 'energy', 'activities', 'maintenance', 'shopping', 'health', 'other'];
    if (mainCategories.includes(expenseData.category)) {
      tags.push(['category', expenseData.category]);
    } else {
      // Map subcategory to main category
      const categoryMap: Record<string, string> = {
        'fuel': 'transport',
        'accommodation': 'camping',
      };
      const mainCategory = categoryMap[expenseData.category] || 'other';
      tags.push(['category', mainCategory]);
    }
  }
  
  // Add amount range for very basic filtering (without exposing exact amount)
  if (typeof expenseData.amount === 'number') {
    const amount = expenseData.amount;
    let range = 'other';
    
    if (amount < 10) range = 'small';
    else if (amount < 50) range = 'medium';
    else if (amount < 100) range = 'large';
    else range = 'xlarge';
    
    tags.push(['amount_range', range]);
  }
  
  // Add d-tag for replaceable events
  const timestamp = expenseData.createdAt || Date.now();
  const dTag = `expense_${timestamp}`;
  tags.push(['d', dTag]);
  
  return tags;
}

/**
 * Create a Nostr event for an expense
 */
export async function createExpenseEvent(
  expenseData: any,
  signer: any, // Nostr signer (NIP-07 or other)
  senderPrivateKey: string
): Promise<any> {
  try {
    // Encrypt the data
    const { encryptedData, publicTags } = await encryptForBothAuthors(
      expenseData,
      senderPrivateKey
    );
    
    // Create the event
    const unsignedEvent = {
      kind: 40000,
      content: encryptedData,
      tags: publicTags,
      created_at: Math.floor(Date.now() / 1000),
    };
    
    // Sign the event
    const signedEvent = await signer.signEvent(unsignedEvent);
    
    return signedEvent;
    
  } catch (error) {
    console.error('Failed to create expense event:', error);
    throw new Error('Failed to create expense event');
  }
}

/**
 * Parse and validate an expense event
 */
export function parseExpenseEvent(event: any): {
  isValid: boolean;
  canDecrypt: boolean;
  publicData: {
    id: string;
    author: string;
    createdAt: number;
    tags: string[][];
  };
} {
  try {
    // Basic validation
    if (event.kind !== 40000) {
      return {
        isValid: false,
        canDecrypt: false,
        publicData: {
          id: event.id || '',
          author: event.pubkey || '',
          createdAt: event.created_at || 0,
          tags: event.tags || [],
        },
      };
    }
    
    // Try to parse the encrypted data
    const encryptedData = JSON.parse(event.content);
    if (!encryptedData.encryptedContent || !encryptedData.keys) {
      return {
        isValid: false,
        canDecrypt: false,
        publicData: {
          id: event.id || '',
          author: event.pubkey || '',
          createdAt: event.created_at || 0,
          tags: event.tags || [],
        },
      };
    }
    
    return {
      isValid: true,
      canDecrypt: false, // Will be set by caller with user's pubkey
      publicData: {
        id: event.id,
        author: event.pubkey,
        createdAt: event.created_at,
        tags: event.tags,
      },
    };
    
  } catch (error) {
    console.error('Failed to parse expense event:', error);
    return {
      isValid: false,
      canDecrypt: false,
      publicData: {
        id: event.id || '',
        author: event.pubkey || '',
        createdAt: event.created_at || 0,
        tags: event.tags || [],
      },
    };
  }
}

/**
 * Get readable category from tags
 */
export function getCategoryFromTags(tags: string[][]): string {
  const categoryTag = tags.find(tag => tag[0] === 'category');
  return categoryTag ? categoryTag[1] : 'other';
}

/**
 * Get date from tags
 */
export function getDateFromTags(tags: string[][]): string | null {
  const yearTag = tags.find(tag => tag[0] === 'year');
  const monthTag = tags.find(tag => tag[0] === 'month');
  
  if (yearTag && monthTag) {
    return `${yearTag[1]}-${monthTag[1].padStart(2, '0')}-01`;
  }
  
  return null;
}

export default {
  encryptForBothAuthors,
  decryptExpenseData,
  canUserDecryptExpense,
  createExpenseEvent,
  parseExpenseEvent,
  getCategoryFromTags,
  getDateFromTags,
};