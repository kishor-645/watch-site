import { ApiError, ok, withApi } from "@/server/http";
import { getAdminProfile } from "@/server/queries/admin";

export const runtime = "nodejs";

export const GET = withApi(
  async ({ admin }) => {
    const profile = await getAdminProfile(admin.id);
    if (!profile) throw new ApiError(401, "UNAUTHORIZED", "Please sign in again");
    return ok(profile);
  },
  { allowPendingPasswordChange: true },
);
