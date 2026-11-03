import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

export const BCRYPT_COST = 12;

/**
 * bcrypt hash (cost 12) of a random, discarded string. Used to run a full bcrypt comparison
 * when the username does not exist, so response timing does not reveal valid usernames.
 */
const DUMMY_HASH = "$2b$12$456/JrzTFdaanZnucfrcs.oUglOwkxkrOcIXeNd2ZzcP4WTjJiWzq";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/** Compares against `hash`, or against a dummy hash when `hash` is missing (always false then). */
export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  const matches = await bcrypt.compare(password, hash || DUMMY_HASH);
  return matches && Boolean(hash);
}

/** Constant-time string equality (compares SHA-256 digests so lengths never leak). */
export function safeEqual(a: string, b: string): boolean {
  const da = createHash("sha256").update(a, "utf8").digest();
  const db = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(da, db);
}
