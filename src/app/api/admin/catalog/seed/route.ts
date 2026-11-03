import { ok, withApi } from "@/server/http";
import { enforceAdminMutationLimit } from "@/server/rate-limit";
import { seedCatalog } from "@/server/services/watches";

export const runtime = "nodejs";

export const POST = withApi(async ({ admin, ip, userAgent }) => {
  await enforceAdminMutationLimit(admin.id);
  const inserted = await seedCatalog(admin, { ip, userAgent });
  return ok({ inserted }, 201);
});
