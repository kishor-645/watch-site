import { watchInputSchema, watchPatchSchema } from "@/lib/schemas/watch";
import { ApiError, ok, readJson, withApi } from "@/server/http";
import { getWatchForAdmin } from "@/server/queries/admin";
import { enforceAdminMutationLimit } from "@/server/rate-limit";
import { deleteWatch, patchWatch, replaceWatch } from "@/server/services/watches";

export const runtime = "nodejs";

type Params = { id: string };

export const GET = withApi<Params>(async ({ params }) => {
  const watch = await getWatchForAdmin(params.id);
  if (!watch) throw new ApiError(404, "NOT_FOUND", "Watch not found");
  return ok(watch);
});

export const PUT = withApi<Params>(async ({ req, params, admin, ip, userAgent }) => {
  await enforceAdminMutationLimit(admin.id);
  const input = await readJson(req, watchInputSchema);
  return ok(await replaceWatch(params.id, input, admin, { ip, userAgent }));
});

export const PATCH = withApi<Params>(async ({ req, params, admin, ip, userAgent }) => {
  await enforceAdminMutationLimit(admin.id);
  const patch = await readJson(req, watchPatchSchema);
  return ok(await patchWatch(params.id, patch, admin, { ip, userAgent }));
});

export const DELETE = withApi<Params>(async ({ params, admin, ip, userAgent }) => {
  await enforceAdminMutationLimit(admin.id);
  await deleteWatch(params.id, admin, { ip, userAgent });
  return ok({ deleted: true });
});
