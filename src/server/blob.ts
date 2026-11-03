import "server-only";
import { del } from "@vercel/blob";
import { getCollections } from "./db";
import { getBlobToken } from "./env";
import { log } from "./log";
import { escapeRegex } from "./mappers";

const ANY_BLOB_HOST = /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;

/**
 * Public host of THIS project's Blob store, derived from BLOB_READ_WRITE_TOKEN
 * (`vercel_blob_rw_<storeId>_<secret>` — the same parsing @vercel/blob uses), e.g.
 * `abc123.public.blob.vercel-storage.com`. Null when no (well-formed) token is configured.
 */
export function blobStoreHost(token: string | undefined = getBlobToken()): string | null {
  const storeId = token?.split("_")[3];
  return storeId && /^[a-z0-9]+$/i.test(storeId) ? `${storeId.toLowerCase()}.public.blob.vercel-storage.com` : null;
}

function parseHttps(url: string): URL | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

/** True only for https URLs on this project's own Blob store (see blobStoreHost). */
export function isProjectBlobUrl(url: string): boolean {
  const host = blobStoreHost();
  return host != null && parseHttps(url)?.hostname === host;
}

/** True for https URLs on any Vercel Blob public store. */
export function isAnyBlobUrl(url: string): boolean {
  const u = parseHttps(url);
  return u != null && ANY_BLOB_HOST.test(u.hostname);
}

/** Canonical form for reference comparisons: origin + pathname (query/hash ignored). */
export function normalizeBlobUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return null;
  }
}

/**
 * Field-path → message for every Blob URL that belongs to a different store than this project's.
 * Without a configured token the project store is unknown, so nothing is rejected (local dev).
 */
export function foreignBlobFields(urls: { path: string; url: string }[]): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!blobStoreHost()) return fields;
  for (const { path, url } of urls) {
    if (url && isAnyBlobUrl(url) && !isProjectBlobUrl(url)) {
      fields[path] ??= "This image is stored outside this site's image storage. Upload it again here.";
    }
  }
  return fields;
}

/** Every string inside `value` with its dot-joined path (used to scan the settings document). */
export function collectStrings(value: unknown, path = "", out: { path: string; url: string }[] = []) {
  if (typeof value === "string") out.push({ path, url: value });
  else if (Array.isArray(value)) value.forEach((v, i) => collectStrings(v, path ? `${path}.${i}` : String(i), out));
  else if (value && typeof value === "object" && !(value instanceof Date)) {
    for (const [k, v] of Object.entries(value)) if (k !== "_id") collectStrings(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

/**
 * Normalised URLs among `candidates` that are still referenced by any watch image or anywhere in
 * the settings document. Call AFTER the write that dropped the old reference.
 */
export async function findReferencedUrls(candidates: readonly string[]): Promise<Set<string>> {
  const wanted = new Set(candidates.map(normalizeBlobUrl).filter((u): u is string => u != null));
  const used = new Set<string>();
  if (!wanted.size) return used;
  const { watches, settings } = await getCollections();
  // Case-insensitive prefix pre-filter in MongoDB; the exact normalised comparison happens below.
  const patterns = [...wanted].map((u) => new RegExp(`^${escapeRegex(u)}(?:[?#]|$)`, "i"));
  const [docs, settingsDoc] = await Promise.all([
    watches.find({ "images.url": { $in: patterns } }, { projection: { images: 1 } }).toArray(),
    settings.findOne({ _id: "global" }),
  ]);
  const check = (url: string) => {
    const n = normalizeBlobUrl(url);
    if (n && wanted.has(n)) used.add(n);
  };
  for (const doc of docs) for (const image of doc.images ?? []) check(image.url);
  for (const { url } of collectStrings(settingsDoc)) check(url);
  return used;
}

/**
 * Best-effort deletion of this project's uploaded images that nothing references any more.
 * URLs on other hosts/stores and URLs still used by another watch or the settings are skipped.
 * No-op without a Blob token; never throws.
 */
export async function deleteUnreferencedBlobs(urls: readonly string[]): Promise<void> {
  const token = getBlobToken();
  const own = Array.from(new Set(urls.filter(isProjectBlobUrl)));
  if (!token || own.length === 0) return;
  try {
    const used = await findReferencedUrls(own);
    const targets = own.filter((u) => !used.has(normalizeBlobUrl(u)!));
    if (used.size) log.info("blob.delete_skipped_referenced", { count: own.length - targets.length });
    if (targets.length) await del(targets, { token });
  } catch (error) {
    log.warn("blob.delete_failed", { count: own.length, error });
  }
}
