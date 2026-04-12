import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';

import { useCurrentUser } from "./useCurrentUser";
import { getBlossomConfigByPubkey, BACKUP_BLOSSOM_SERVER } from '@/config/blossom';

/**
 * KEINE client-seitige EXIF-Rotation!
 * Der Server verwendet ImageMagick -auto-orient für alle Bilder.
 * Das behandelt GrapheneOS, Google Camera, Pixel und alle anderen korrekt.
 */
export function useUploadFile() {
  const { user, users } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user || users.length === 0) {
        throw new Error('Du musst angemeldet sein, um Dateien hochzuladen.');
      }

      const blossomConfig = getBlossomConfigByPubkey(user.pubkey);
      if (!blossomConfig) {
        throw new Error('Upload nicht erlaubt.');
      }

      // Original-Datei unverändert hochladen (EXIF bleibt erhalten)
      const fileToUpload = file;

      const primaryUploader = new BlossomUploader({
        servers: blossomConfig.servers,
        signer: user.signer,
      });

      try {
        const tags = await primaryUploader.upload(fileToUpload);
        const url = tags.find((t: string[]) => t[0] === 'url')?.[1];
        if (!url) throw new Error('No URL from upload');

        try {
          const backupUploader = new BlossomUploader({
            servers: [blossomConfig.backupServer || BACKUP_BLOSSOM_SERVER],
            signer: user.signer,
          });
          await backupUploader.upload(fileToUpload);
        } catch { /* backup failure is non-fatal */ }

        return tags;
      } catch (err) {
        console.error('Blossom upload failed:', err);
        throw err;
      }
    },
  });
}
