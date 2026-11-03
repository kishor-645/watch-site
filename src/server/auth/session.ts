import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCollections } from "../db";
import { parseObjectId } from "../queries/admin";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken, verifySessionToken } from "./token";

export interface AdminSession {
  id: string;
  username: string;
  mustChangePassword: boolean;
  sessionVersion: number;
}

/**
 * Resolves the logged-in admin from the session cookie, verifying the signature AND that the
 * token's session version still matches the database (logout / password change revoke tokens).
 * Memoised per request.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminSession | null> => {
  const store = await cookies();
  const claims = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const _id = parseObjectId(claims.sub);
  if (!_id) return null;
  const { admins } = await getCollections();
  const admin = await admins.findOne(
    { _id },
    { projection: { username: 1, sessionVersion: 1, mustChangePassword: 1, lockedUntil: 1 } },
  );
  if (!admin || admin.sessionVersion !== claims.sv) return null;
  return {
    id: _id.toHexString(),
    username: admin.username,
    mustChangePassword: admin.mustChangePassword,
    sessionVersion: admin.sessionVersion,
  };
});

/**
 * Guard for admin server components / layouts. Redirects to login when not authenticated and
 * to the account page when a password change is pending.
 */
export async function requireAdminPage(options: { allowPendingPasswordChange?: boolean } = {}): Promise<AdminSession> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword && !options.allowPendingPasswordChange) redirect("/admin/account?required=1");
  return admin;
}

export async function setSessionCookie(admin: { id: string; username: string; sessionVersion: number }): Promise<void> {
  const token = await signSessionToken({ sub: admin.id, username: admin.username, sv: admin.sessionVersion });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", sessionCookieOptions(0));
}
