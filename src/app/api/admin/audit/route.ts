import { auditQuerySchema } from "@/lib/schemas/catalog-query";
import { ok, withApi } from "@/server/http";
import { listAuditLogs } from "@/server/queries/admin";

export const runtime = "nodejs";

export const GET = withApi(async ({ req }) => {
  const query = auditQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  return ok(await listAuditLogs(query));
});
