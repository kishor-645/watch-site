import { ObjectId } from "mongodb";
import { cookieJar } from "./next-headers";

/**
 * Inserts an admin directly (no bcrypt, fast) and puts a valid session cookie in the jar.
 * Requires startTestDb() to have run. The password hash is unusable, so /login won't work for it.
 */
export async function signInAsNewAdmin(username = "editor", opts: { mustChangePassword?: boolean } = {}) {
  const { getCollections } = await import("@/server/db");
  const { SESSION_COOKIE, signSessionToken } = await import("@/server/auth/token");
  const { admins } = await getCollections();
  const now = new Date();
  const _id = new ObjectId();
  await admins.insertOne({
    _id,
    username,
    passwordHash: "!",
    mustChangePassword: opts.mustChangePassword ?? false,
    sessionVersion: 1,
    lastLoginAt: null,
    lastLoginIp: null,
    passwordChangedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  cookieJar.put(SESSION_COOKIE, await signSessionToken({ sub: _id.toHexString(), username, sv: 1 }));
  return { id: _id.toHexString(), username };
}
