import { z } from "zod";
import { ok, readJson, withApi } from "@/server/http";
import { loadSettings } from "@/server/queries/settings";
import { enforceAdminMutationLimit } from "@/server/rate-limit";
import { updateSettings } from "@/server/services/settings";

export const runtime = "nodejs";

export const GET = withApi(async () => ok(await loadSettings()));

export const PUT = withApi(async ({ req, admin, ip, userAgent }) => {
  await enforceAdminMutationLimit(admin.id);
  // Content-type / size / JSON checks here; updateSettings validates with siteSettingsSchema.
  const body = await readJson(req, z.unknown());
  return ok(await updateSettings(body, admin, { ip, userAgent }));
});
