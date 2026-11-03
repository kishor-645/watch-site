import { changePasswordSchema } from "@/lib/schemas/auth";
import { ok, readJson, withApi } from "@/server/http";
import { changePassword } from "@/server/services/auth";

export const runtime = "nodejs";

export const POST = withApi(
  async ({ req, admin, ip, userAgent }) => {
    const input = await readJson(req, changePasswordSchema);
    await changePassword(input, admin, { ip, userAgent });
    return ok({ changed: true });
  },
  { allowPendingPasswordChange: true },
);
