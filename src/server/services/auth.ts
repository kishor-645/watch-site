import "server-only";
import { MongoServerError, ObjectId } from "mongodb";
import type { z } from "zod";
import { MIN_PASSWORD_LENGTH, type changePasswordSchema, type loginSchema } from "@/lib/schemas/auth";
import { writeAudit, type RequestMeta } from "../audit";
import { getCurrentAdmin, clearSessionCookie, setSessionCookie, type AdminSession } from "../auth/session";
import { hashPassword, safeEqual, verifyPassword } from "../auth/password";
import { getCollections } from "../db";
import { getAuthEnv } from "../env";
import { ApiError } from "../http";
import { log } from "../log";
import type { AdminDoc } from "../models";
import { LIMITS, hitRateLimit, ipBucket, rateLimitedError, resetRateLimit } from "../rate-limit";

type LoginData = z.output<typeof loginSchema>;
type ChangePasswordData = z.output<typeof changePasswordSchema>;

export const LOGIN_FAILED_MESSAGE = "Incorrect username or password";
export const LOGIN_RATE_LIMITED_MESSAGE = "Too many sign-in attempts. Please try again later.";

const loginFailed = () => new ApiError(401, "UNAUTHORIZED", LOGIN_FAILED_MESSAGE);
const actorOf = (a: Pick<AdminDoc, "_id" | "username">) => ({ id: a._id.toHexString(), username: a.username });

/** Rate-limit keys for a sign-in attempt. Both are consumed by every attempt, before any lookup. */
export function loginRateLimitKeys(username: string, ip: string | null): { ip: string; user: string } {
  const bucket = ipBucket(ip);
  return { ip: `login:ip:${bucket}`, user: `login:user:${username}:${bucket}` };
}

/**
 * First-run bootstrap: creates the initial admin when the collection is empty and the
 * credentials equal INITIAL_ADMIN_USERNAME / INITIAL_ADMIN_PASSWORD. Returns the admin to log in
 * (also when a concurrent request created it first), or null when bootstrap does not apply.
 */
async function tryBootstrap(username: string, password: string, meta: RequestMeta): Promise<AdminDoc | null> {
  const env = getAuthEnv();
  if (!env.INITIAL_ADMIN_PASSWORD) {
    log.warn("auth.bootstrap_unavailable", { reason: "INITIAL_ADMIN_PASSWORD is not set" });
    return null;
  }
  if (env.INITIAL_ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) {
    log.warn("auth.bootstrap_unavailable", {
      reason: `INITIAL_ADMIN_PASSWORD is shorter than ${MIN_PASSWORD_LENGTH} characters`,
    });
    return null;
  }
  // Evaluate both comparisons so timing does not reveal which one failed.
  const userOk = safeEqual(username, env.INITIAL_ADMIN_USERNAME);
  const passOk = safeEqual(password, env.INITIAL_ADMIN_PASSWORD);
  if (!userOk || !passOk) return null;

  const { admins } = await getCollections();
  const now = new Date();
  const doc: AdminDoc = {
    _id: new ObjectId(),
    username,
    passwordHash: await hashPassword(password),
    mustChangePassword: true,
    sessionVersion: 1,
    lastLoginAt: null,
    lastLoginIp: null,
    passwordChangedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await admins.insertOne(doc);
  } catch (error) {
    // Lost a bootstrap race (unique username index): log in against the stored account instead.
    if (error instanceof MongoServerError && error.code === 11000) return admins.findOne({ username });
    throw error;
  }
  log.info("auth.bootstrap", { username });
  await writeAudit({ action: "auth.bootstrap", actor: actorOf(doc), entity: { type: "admin", id: doc._id.toHexString(), label: username }, ...meta });
  return doc;
}

/**
 * Sign-in. Order matters for brute-force resistance:
 *  1. Both counters (per IP bucket, and per username + IP bucket) are atomically consumed BEFORE
 *     any lookup or bcrypt work, so a burst of parallel requests cannot all test passwords.
 *  2. The 429 is identical whether or not the username exists.
 *  3. There is no account-wide lock (that would let anyone keep the owner locked out); throttling
 *     is per source, so the owner on another network can always sign in.
 */
export async function login(input: LoginData, meta: RequestMeta): Promise<{ username: string; mustChangePassword: boolean }> {
  const keys = loginRateLimitKeys(input.username, meta.ip);
  const [ipLimit, userLimit] = await Promise.all([
    hitRateLimit(keys.ip, LIMITS.loginIp),
    hitRateLimit(keys.user, LIMITS.loginUser),
  ]);
  if (!ipLimit.allowed || !userLimit.allowed) {
    const waits = [ipLimit, userLimit].filter((l) => !l.allowed).map((l) => l.retryAfterSeconds);
    throw rateLimitedError(Math.max(...waits), LOGIN_RATE_LIMITED_MESSAGE);
  }

  const { admins } = await getCollections();
  // Both queries always run so known and unknown usernames do the same database work.
  const [found, adminCount] = await Promise.all([
    admins.findOne({ username: input.username }),
    admins.countDocuments({}, { limit: 1 }),
  ]);
  let admin = found;
  let bootstrapped = false;
  if (!admin && adminCount === 0) {
    admin = await tryBootstrap(input.username, input.password, meta);
    bootstrapped = admin != null;
  }

  // Always run a bcrypt comparison (dummy hash for unknown users) to equalise timing.
  const valid = await verifyPassword(input.password, admin?.passwordHash);
  if (!admin || !valid) {
    // Unknown usernames are not recorded: the field may contain a mistyped password.
    await writeAudit({
      action: "auth.login_failed",
      actor: admin ? actorOf(admin) : null,
      entity: admin ? { type: "admin", id: admin._id.toHexString(), label: admin.username } : undefined,
      ...meta,
    });
    throw loginFailed();
  }

  const now = new Date();
  await admins.updateOne(
    { _id: admin._id },
    {
      $set: { lastLoginAt: now, lastLoginIp: meta.ip, updatedAt: now },
      // Leftovers of the removed account lock (documents created before it was dropped).
      $unset: { failedLoginCount: "", lockedUntil: "" },
    },
  );
  await resetRateLimit(keys.ip, keys.user);
  await setSessionCookie({ id: admin._id.toHexString(), username: admin.username, sessionVersion: admin.sessionVersion });
  if (!bootstrapped) await writeAudit({ action: "auth.login", actor: actorOf(admin), entity: { type: "admin", id: admin._id.toHexString(), label: admin.username }, ...meta });
  return { username: admin.username, mustChangePassword: admin.mustChangePassword };
}

/** Revokes every session of the current admin (if any) and clears the cookie. Idempotent. */
export async function logout(meta: RequestMeta): Promise<void> {
  const admin = await getCurrentAdmin();
  if (admin) {
    const { admins } = await getCollections();
    await admins.updateOne({ _id: new ObjectId(admin.id) }, { $inc: { sessionVersion: 1 }, $set: { updatedAt: new Date() } });
    await writeAudit({ action: "auth.logout", actor: admin, entity: { type: "admin", id: admin.id, label: admin.username }, ...meta });
  }
  await clearSessionCookie();
}

export async function changePassword(input: ChangePasswordData, session: AdminSession, meta: RequestMeta): Promise<void> {
  const limitKey = `password:${session.id}`;
  const limit = await hitRateLimit(limitKey, LIMITS.passwordChange);
  if (!limit.allowed) throw rateLimitedError(limit.retryAfterSeconds);

  const { admins } = await getCollections();
  const _id = new ObjectId(session.id);
  const current = await admins.findOne({ _id }, { projection: { passwordHash: 1 } });
  if (!current) throw new ApiError(401, "UNAUTHORIZED", "Please sign in again");
  if (!(await verifyPassword(input.currentPassword, current.passwordHash))) {
    throw new ApiError(422, "VALIDATION_ERROR", "Please correct the highlighted fields", {
      currentPassword: "Current password is incorrect",
    });
  }

  const now = new Date();
  const updated = await admins.findOneAndUpdate(
    { _id },
    {
      $set: { passwordHash: await hashPassword(input.newPassword), mustChangePassword: false, passwordChangedAt: now, updatedAt: now },
      $inc: { sessionVersion: 1 },
    },
    { returnDocument: "after", projection: { username: 1, sessionVersion: 1 } },
  );
  if (!updated) throw new ApiError(401, "UNAUTHORIZED", "Please sign in again");

  await setSessionCookie({ id: session.id, username: updated.username, sessionVersion: updated.sessionVersion });
  await resetRateLimit(limitKey);
  await writeAudit({ action: "auth.password_change", actor: session, entity: { type: "admin", id: session.id, label: session.username }, ...meta });
}
