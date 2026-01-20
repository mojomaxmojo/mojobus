import { AUTHORS } from '@/config/nostr';

/**
 * Returns all valid authors from the config
 */
export function getValidAuthors() {
  return AUTHORS;
}

/**
 * Returns all valid author pubkeys
 */
export function getValidAuthorPubkeys() {
  return AUTHORS.map(a => a.pubkey);
}
