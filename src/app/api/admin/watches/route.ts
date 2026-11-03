import { adminWatchQuerySchema } from "@/lib/schemas/admin-query";
import { watchInputSchema } from "@/lib/schemas/watch";
import { ok, readJson, withApi } from "@/server/http";
import { listAdminWatches } from "@/server/queries/admin";
import { enforceAdminMutationLimit } from "@/server/rate-limit";
import { createWatch } from "@/server/services/watches";

export const runtime = "nodejs";

export const GET = withApi(async ({ req }) => {
  const query = adminWatchQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  return ok(await listAdminWatches(query));
});

export const POST = withApi(async ({ req, admin, ip, userAgent }) => {
  await enforceAdminMutationLimit(admin.id);
  const input = await readJson(req, watchInputSchema);
  return ok(await createWatch(input, admin, { ip, userAgent }), 201);
});
