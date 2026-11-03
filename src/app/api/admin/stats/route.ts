import { ok, withApi } from "@/server/http";
import { getDashboardStats } from "@/server/queries/admin";

export const runtime = "nodejs";

export const GET = withApi(async () => ok(await getDashboardStats()));
