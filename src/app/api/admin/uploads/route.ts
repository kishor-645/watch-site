import { NextResponse } from "next/server";
import { ok, readJson, withApi } from "@/server/http";
import { enforceAdminMutationLimit } from "@/server/rate-limit";
import {
  assertBlobConfigured,
  deleteUnsavedUpload,
  deleteUploadSchema,
  issueUploadToken,
  uploadTokenRequestSchema,
} from "@/server/services/uploads";

export const runtime = "nodejs";

/**
 * Client-upload token exchange for `upload()` from `@vercel/blob/client`. The success body is
 * the raw `handleUpload` result (`{ type, clientToken }`) because the Blob client reads
 * `clientToken` from it directly; errors use the standard API envelope.
 */
export const POST = withApi(async ({ req, admin, ip, userAgent }) => {
  assertBlobConfigured();
  const body = await readJson(req, uploadTokenRequestSchema);
  const result = await issueUploadToken(req, body, admin, { ip, userAgent });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
});

export const DELETE = withApi(async ({ req, admin }) => {
  await enforceAdminMutationLimit(admin.id);
  assertBlobConfigured();
  const { url } = await readJson(req, deleteUploadSchema);
  await deleteUnsavedUpload(url);
  return ok({ deleted: true });
});
