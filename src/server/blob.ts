import "server-only";
import { del } from "@vercel/blob";
import { getBlobToken } from "./env";
import { log } from "./log";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** True for https URLs served from a Vercel Blob public store. */
export function isProjectBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/** Best-effort deletion of uploaded images. No-op without a Blob token; never throws. */
export async function deleteBlobsQuietly(urls: readonly string[]): Promise<void> {
  const token = getBlobToken();
  const targets = Array.from(new Set(urls.filter(isProjectBlobUrl)));
  if (!token || targets.length === 0) return;
  try {
    await del(targets, { token });
  } catch (error) {
    log.warn("blob.delete_failed", { count: targets.length, error });
  }
}
