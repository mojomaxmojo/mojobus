import { useNostr } from "@nostrify/react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useCurrentUser } from "./useCurrentUser";
import type { NostrEvent } from "@nostrify/nostrify";

interface DeleteEventOptions {
  /** Event(s) to delete - can be single event ID or array of event IDs */
  eventIds: string | string[];
  /** Optional reason for deletion */
  reason?: string;
}

export function useNostrDelete(): UseMutationResult<NostrEvent, Error, DeleteEventOptions> {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ eventIds, reason }: DeleteEventOptions) => {
      if (!user) {
        throw new Error("You must be logged in to delete events");
      }

      // Normalize eventIds to array
      const idsToDelete = Array.isArray(eventIds) ? eventIds : [eventIds];

      if (idsToDelete.length === 0) {
        throw new Error("No event IDs provided for deletion");
      }

      // Create delete event (Kind 5)
      const deleteEvent = {
        kind: 5, // Delete event
        content: reason || "",
        tags: [
          ...idsToDelete.map(id => ['e', id]),
          ['k', '1'] // Optional: specify the kind of events being deleted
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = await user.signer.signEvent(deleteEvent);
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });
      
      return signedEvent;
    },
    onError: (error) => {
      console.error("Failed to delete event:", error);
    },
    onSuccess: (data) => {
      console.log("Delete event published successfully:", data);
    },
  });
}