import "server-only";
import { MongoServerError } from "mongodb";
import { getCollections } from "./db";
import { ApiError } from "./http";

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** Shared limits. Keys are "<scope>:<id>". */
export const LIMITS = {
  loginIp: { limit: 5, windowSeconds: 15 * 60 },
  passwordChange: { limit: 5, windowSeconds: 15 * 60 },
  uploadTokens: { limit: 60, windowSeconds: 10 * 60 },
  adminMutations: { limit: 120, windowSeconds: 60 },
} satisfies Record<string, RateLimitOptions>;

const isDuplicateKey = (e: unknown) => e instanceof MongoServerError && e.code === 11000;

function retryAfter(expiresAt: Date, now: number): number {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000));
}

/**
 * Fixed-window counter: atomically increments `key` and reports whether the caller is still
 * within `limit` for the current window. An expired window (TTL deletion is lazy) is restarted.
 */
export async function hitRateLimit(key: string, { limit, windowSeconds }: RateLimitOptions): Promise<RateLimitResult> {
  const { rateLimits } = await getCollections();
  const now = new Date();
  const fresh = new Date(now.getTime() + windowSeconds * 1000);
  const active = { $gt: ["$expiresAt", now] };
  const update = [
    {
      $set: {
        count: { $cond: [active, { $add: ["$count", 1] }, 1] },
        expiresAt: { $cond: [active, "$expiresAt", fresh] },
      },
    },
  ];
  const run = () => rateLimits.findOneAndUpdate({ _id: key }, update, { upsert: true, returnDocument: "after" });
  let doc;
  try {
    doc = await run();
  } catch (error) {
    // Two concurrent upserts of a new key: one wins the insert, the other retries as an update.
    if (!isDuplicateKey(error)) throw error;
    doc = await run();
  }
  if (!doc) throw new Error("rate limit upsert returned no document");
  return {
    allowed: doc.count <= limit,
    remaining: Math.max(0, limit - doc.count),
    retryAfterSeconds: retryAfter(doc.expiresAt, now.getTime()),
  };
}

/** Reads the counter without consuming it: `allowed` is false once `limit` hits are recorded. */
export async function peekRateLimit(key: string, { limit }: RateLimitOptions): Promise<RateLimitResult> {
  const { rateLimits } = await getCollections();
  const now = Date.now();
  const doc = await rateLimits.findOne({ _id: key });
  if (!doc || doc.expiresAt.getTime() <= now) return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  return {
    allowed: doc.count < limit,
    remaining: Math.max(0, limit - doc.count),
    retryAfterSeconds: retryAfter(doc.expiresAt, now),
  };
}

export async function resetRateLimit(key: string): Promise<void> {
  const { rateLimits } = await getCollections();
  await rateLimits.deleteOne({ _id: key });
}

export function rateLimitedError(retryAfterSeconds: number, message = "Too many attempts. Please try again later."): ApiError {
  return new ApiError(429, "RATE_LIMITED", message, undefined, { "Retry-After": String(Math.max(1, retryAfterSeconds)) });
}

/** Consumes one hit and throws 429 (with Retry-After) when over the limit. */
export async function enforceRateLimit(key: string, options: RateLimitOptions, message?: string): Promise<void> {
  const result = await hitRateLimit(key, options);
  if (!result.allowed) throw rateLimitedError(result.retryAfterSeconds, message);
}

/** General throttle for authenticated admin mutations (120 / min per admin). */
export function enforceAdminMutationLimit(adminId: string): Promise<void> {
  return enforceRateLimit(`admin:${adminId}`, LIMITS.adminMutations, "Too many changes in a short time. Please wait a moment.");
}
