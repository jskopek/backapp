import { invoke } from "@tauri-apps/api/tauri";
import { isTauri } from "./vault";

export type GooglePhotosMediaItem = {
  id: string;
  path: string;
  filename: string;
  mimeType: string;
  takenAtMs?: number | null;
};

export async function indexGooglePhotos(accountId: string): Promise<number> {
  if (!isTauri()) return 0;
  const res = await invoke<{ indexedCount: number }>("index_google_photos", {
    args: { accountId }
  });
  return res.indexedCount;
}

export async function listGooglePhotosMedia(args: {
  accountId: string;
  limit?: number;
  offset?: number;
}): Promise<GooglePhotosMediaItem[]> {
  if (!isTauri()) return [];
  return invoke<GooglePhotosMediaItem[]>("list_google_photos_media", {
    args: {
      accountId: args.accountId,
      limit: args.limit ?? null,
      offset: args.offset ?? null
    }
  });
}

