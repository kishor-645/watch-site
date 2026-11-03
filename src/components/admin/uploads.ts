import { put } from "@vercel/blob/client";
import { api, failureFromResponse, handleAuthError, NETWORK_ERROR_MESSAGE } from "./api-client";

/*
 * Vercel Blob client uploads (docs/API_DOCUMENTATION.md → Uploads).
 *
 * This performs exactly what `upload(pathname, file, { access: "public", handleUploadUrl:
 * "/api/admin/uploads" })` does — POST the `blob.generate-client-token` event to our handler, then
 * PUT the file straight to Blob with that token — but fetches the token itself so the UI can tell
 * a 503 "storage not configured" / 429 / 401 apart (`upload()` hides the status code).
 */

export const UPLOAD_ENDPOINT = "/api/admin/uploads";
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");
export const STORAGE_NOT_CONFIGURED = "Image storage is not configured — connect a Vercel Blob store.";
export const ALLOWED_URL_HINT = "Use an https:// link from images.unsplash.com or your Vercel Blob store.";

export class UploadError extends Error {
  constructor(
    message: string,
    readonly notConfigured = false,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

/** Returns an error message when the file cannot be uploaded, else null. */
export function validateImageFile(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name}: use a JPEG, PNG, WebP or AVIF image.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: the file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 5 MB.`;
  }
  return null;
}

/** "My Photo (1).JPG" -> "my-photo-1.jpg" */
export function sanitizeFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  return `${base || "image"}${ext ? `.${ext}` : ""}`;
}

async function getClientToken(pathname: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: { pathname, clientPayload: null, multipart: false },
      }),
    });
  } catch {
    throw new UploadError(NETWORK_ERROR_MESSAGE);
  }
  if (!res.ok) {
    const failure = await failureFromResponse<never>(res);
    if (failure.ok) throw new UploadError("Upload failed");
    handleAuthError(failure.error.code);
    if (failure.status === 503 || failure.error.code === "SERVICE_UNAVAILABLE") {
      throw new UploadError(STORAGE_NOT_CONFIGURED, true);
    }
    if (failure.status === 429) {
      const mins = failure.retryAfter ? Math.max(1, Math.ceil(failure.retryAfter / 60)) : null;
      throw new UploadError(`Too many uploads. Try again${mins ? ` in ${mins} minute${mins === 1 ? "" : "s"}` : " later"}.`);
    }
    throw new UploadError(failure.error.message || "Upload was not allowed.");
  }
  try {
    const json = (await res.json()) as { clientToken?: string; data?: { clientToken?: string } };
    const token = json.clientToken ?? json.data?.clientToken;
    if (!token) throw new Error("missing token");
    return token;
  } catch {
    throw new UploadError("Unexpected response from the upload service.");
  }
}

export interface UploadedImage {
  url: string;
  pathname: string;
}

/**
 * Uploads an image to `<folder>/<sanitised-filename>` (the server adds a random suffix).
 * `folder` must start with "watches/" or "site/".
 */
export async function uploadImage(
  file: File,
  folder: string,
  onProgress?: (percentage: number) => void,
): Promise<UploadedImage> {
  const invalid = validateImageFile(file);
  if (invalid) throw new UploadError(invalid);
  const pathname = `${folder.replace(/\/+$/, "")}/${sanitizeFilename(file.name)}`;
  const token = await getClientToken(pathname);
  try {
    const blob = await put(pathname, file, {
      access: "public",
      token,
      contentType: file.type,
      onUploadProgress: ({ percentage }) => onProgress?.(percentage),
    });
    return { url: blob.url, pathname: blob.pathname };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Upload failed.";
    throw new UploadError(message.replace(/^Vercel Blob:\s*/, ""));
  }
}

/** Best-effort removal of a blob that was uploaded in this session but never saved. */
export async function deleteUnsavedUpload(url: string): Promise<void> {
  await api.delete<{ deleted: true }>(UPLOAD_ENDPOINT, { url });
}
