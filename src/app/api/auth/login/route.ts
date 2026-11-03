import { loginSchema } from "@/lib/schemas/auth";
import { ok, readJson, withApi } from "@/server/http";
import { login } from "@/server/services/auth";

export const runtime = "nodejs";

export const POST = withApi(
  async ({ req, ip, userAgent }) => {
    const input = await readJson(req, loginSchema);
    return ok(await login(input, { ip, userAgent }));
  },
  { auth: false },
);
