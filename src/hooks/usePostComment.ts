import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { NKinds, type NostrEvent } from '@nostrify/nostrify';

interface PostCommentParams {
  root: NostrEvent | URL; // The root event to comment on
  reply?: NostrEvent | URL; // Optional reply to another comment
  content: string;
}

/** Post a NIP-22 (kind 1111) comment on an event. */
export function usePostComment() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ root, reply, content }: PostCommentParams) => {
      const tags: string[][] = [];

      // d-tag identifiers
      const dRoot = root instanceof URL ? '' : root.tags.find(([name]) => name === 'd')?.[1] ?? '';
      const dReply = reply instanceof URL ? '' : reply?.tags.find(([name]) => name === 'd')?.[1] ?? '';

      // Root event tags
      if (root instanceof URL) {
        tags.push(['I', root.toString()]);
      } else if (NKinds.addressable(root.kind)) {
        tags.push(['A', `${root.kind}:${root.pubkey}:${dRoot}`]);
        // Add E tag as well for addressable events per NIP-22
        tags.push(['E', root.id, '', root.pubkey]);
      } else if (NKinds.replaceable(root.kind)) {
        tags.push(['A', `${root.kind}:${root.pubkey}:`]);
        // Add E tag as well for replaceable events per NIP-22
        tags.push(['E', root.id, '', root.pubkey]);
      } else {
        tags.push(['E', root.id, '', root.pubkey]);
      }
      if (root instanceof URL) {
        tags.push(['K', 'web']);
      } else {
        tags.push(['K', root.kind.toString()]);
        tags.push(['P', root.pubkey]);
      }

      // Reply event tags
      if (reply) {
        if (reply instanceof URL) {
          tags.push(['i', reply.toString()]);
        } else if (NKinds.addressable(reply.kind)) {
          tags.push(['a', `${reply.kind}:${reply.pubkey}:${dReply}`]);
          // Add e tag as well for addressable events per NIP-22
          tags.push(['e', reply.id, '', reply.pubkey]);
        } else if (NKinds.replaceable(reply.kind)) {
          tags.push(['a', `${reply.kind}:${reply.pubkey}:`]);
          // Add e tag as well for replaceable events per NIP-22
          tags.push(['e', reply.id, '', reply.pubkey]);
        } else {
          tags.push(['e', reply.id, '', reply.pubkey]);
        }
        if (reply instanceof URL) {
          tags.push(['k', 'web']);
        } else {
          tags.push(['k', reply.kind.toString()]);
          tags.push(['p', reply.pubkey]);
        }
      } else {
        // If this is a top-level comment, use the root event's tags
        if (root instanceof URL) {
          tags.push(['i', root.toString()]);
        } else if (NKinds.addressable(root.kind)) {
          tags.push(['a', `${root.kind}:${root.pubkey}:${dRoot}`]);
          // Add e tag as well for addressable events per NIP-22
          tags.push(['e', root.id, '', root.pubkey]);
        } else if (NKinds.replaceable(root.kind)) {
          tags.push(['a', `${root.kind}:${root.pubkey}:`]);
          // Add e tag as well for replaceable events per NIP-22
          tags.push(['e', root.id, '', root.pubkey]);
        } else {
          tags.push(['e', root.id, '', root.pubkey]);
        }
        if (root instanceof URL) {
          tags.push(['k', 'web']);
        } else {
          tags.push(['k', root.kind.toString()]);
          tags.push(['p', root.pubkey]);
        }
      }

      const event = await publishEvent({
        kind: 1111,
        content,
        tags,
      });

      return event;
    },
    onSuccess: (_, { root }) => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({
        queryKey: ['comments', root instanceof URL ? root.toString() : root.id]
      });
    },
  });
}