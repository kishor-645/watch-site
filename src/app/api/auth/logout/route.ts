import { ok, withApi } from "@/server/http";
import { logout } from "@/server/services/auth";

export const runtime = "nodejs";

/** auth: false — succeeds (and clears the cookie) even when the session is already invalid. */
export const POST = withApi(
  async ({ ip, userAgent }) => {
    await logout({ ip, userAgent });
    return ok({ loggedOut: true });
  },
  { auth: false },
);
