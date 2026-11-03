import "server-only";
import { del } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import { z } from "zod";
import { UPLOAD_ALLOWED_TYPES, UPLOAD_MAX_BYTES, UPLOAD_PATH_PREFIXES } from "@/lib/upload-rules";
import { writeAudit, type RequestMeta } from "../audit";
import type { AdminSession } from "../auth/session";
import { findReferencedUrls, isProjectBlobUrl } from "../blob";
import { getBlobToken } from "../env";
import { ApiError } from "../http";
import { log } from "../log";
import { LIMITS, enforceRateLimit } from "../rate-limit";

const TOKEN_VALIDITY_MS = 10 * 60 * 1000;
const CONTROL_OR_BACKSLASH = /[\\\u0000-\u001f]/;
const isSafePathname = (p: string) =>
  UPLOAD_PATH_PREFIXES.some((prefix) => p.startsWith(prefix) && p.length > prefix.length) &&
  !CONTROL_OR_BACKSLASH.test(p) &&
  !p.split("/").some((seg) => seg === "" || seg === "." || seg === "..");

/**
 * Only the token-exchange event is accepted. We never register `onUploadCompleted` (so no
 * callbackUrl is embedded in tokens and Vercel never calls back); a `blob.upload-completed`
 * body is therefore rejected by validation instead of being processed.
 */
export const uploadTokenRequestSchema = z.object({
  type: z.literal("blob.generate-client-token"),
  payload: z.object({
    pathname: z.string().max(300),
    multipart: z.boolean().default(false),
    clientPayload: z.string().max(1000).nullable().default(null),
  }),
});
export type UploadTokenRequest = z.output<typeof uploadTokenRequestSchema>;

export const deleteUploadSchema = z.object({ url: z.string().trim().max(2048) });

function requireBlobToken(): string {
  const token = getBlobToken();
  if (!token) throw new ApiError(503, "SERVICE_UNAVAILABLE", "Image storage is not configured");
  return token;
}

export function assertBlobConfigured(): void {
  requireBlobToken();
}

/** Issues a short-lived client upload token (Vercel Blob `handleUpload` token exchange). */
export async function issueUploadToken(req: Request, body: UploadTokenRequest, admin: AdminSession, meta: RequestMeta) {
  const token = requireBlobToken();
  return handleUpload({
    token,
    request: req,
    body,
    onBeforeGenerateToken: async (pathname) => {
      if (!isSafePathname(pathname)) {
        throw new ApiError(422, "VALIDATION_ERROR", "Invalid upload path", {
          pathname: `Path must start with ${UPLOAD_PATH_PREFIXES.join(" or ")}`,
        });
      }
      await enforceRateLimit(`upload:${admin.id}`, LIMITS.uploadTokens, "Too many uploads. Please wait a few minutes.");
      await writeAudit({
        action: "upload.create",
        actor: { id: admin.id, username: admin.username },
        entity: { type: "upload", id: null, label: pathname },
        ...meta,
      });
      return {
        allowedContentTypes: [...UPLOAD_ALLOWED_TYPES],
        maximumSizeInBytes: UPLOAD_MAX_BYTES,
        addRandomSuffix: true,
        validUntil: Date.now() + TOKEN_VALIDITY_MS,
      };
    },
  });
}

/**
 * Deletes an uploaded blob that was never saved. Only URLs on this project's Blob store are
 * accepted (422), and URLs still referenced by any watch or the settings are refused (409).
 */
export async function deleteUnsavedUpload(url: string): Promise<void> {
  const token = requireBlobToken();
  if (!isProjectBlobUrl(url)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Only uploaded images can be deleted", { url: "Not an uploaded image URL" });
  }
  if ((await findReferencedUrls([url])).size > 0) {
    throw new ApiError(409, "CONFLICT", "This image is in use and cannot be deleted");
  }
  try {
    await del(url, { token });
  } catch (error) {
    log.warn("blob.delete_failed", { error });
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "Could not delete the image. Please try again.");
  }
}
