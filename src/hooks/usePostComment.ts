import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { NostrEvent } from '@nostrify/nostrify';
import { NKinds } from '@nostrify/nostrify';

interface PostCommentVariables {
  content: string;
  root: NostrEvent | URL;
  reply?: NostrEvent | URL;
}

export function usePostComment() {
  const publish = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, root, reply }: PostCommentVariables) => {
      // Build tags for the comment event (kind 1111)
      const tags: string[][] = [['content', content]];

      // Add root reference tag
      if (root instanceof URL) {
        tags.push(['i', root.toString()]);
      } else if (NKinds.addressable(root.kind)) {
        const d = root.tags.find(([name]) => name === 'd')?.[1] ?? '';
        tags.push(['a', `${root.kind}:${root.pubkey}:${d}`]);
        tags.push(['e', root.id]);
      } else if (NKinds.replaceable(root.kind)) {
        tags.push(['a', `${root.kind}:${root.pubkey}:`]);
        tags.push(['e', root.id]);
      } else {
        tags.push(['e', root.id]);
      }

      // Add reply reference tag if applicable
      if (reply instanceof URL) {
        tags.push(['i', reply.toString()]);
      } else if (reply) {
        tags.push(['e', reply.id, 'reply']);
      }

      // Publish the comment event
      await publish({
        kind: 1111,
        content,
        tags,
      });
    },
    onSuccess: async (_, variables) => {
      // Invalidate and refetch comments
      const queryKey = ['comments', variables.root instanceof URL ? variables.root.toString() : variables.root.id];
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
