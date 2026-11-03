import "server-only";
import { isIP } from "node:net";
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
  /** Every sign-in attempt from one IP bucket (any username). */
  loginIp: { limit: 10, windowSeconds: 15 * 60 },
  /** Every sign-in attempt for one username from one IP bucket. */
  loginUser: { limit: 5, windowSeconds: 15 * 60 },
  passwordChange: { limit: 5, windowSeconds: 15 * 60 },
  uploadTokens: { limit: 60, windowSeconds: 10 * 60 },
  adminMutations: { limit: 120, windowSeconds: 60 },
} satisfies Record<string, RateLimitOptions>;

const isDuplicateKey = (e: unknown) => e instanceof MongoServerError && e.code === 11000;

function retryAfter(expiresAt: Date, now: number): number {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000));
}

/** Expands an IPv6 address (no zone, no brackets) to its 8 hextets, or null if malformed. */
function ipv6Hextets(ip: string): string[] | null {
  let addr = ip;
  // Embedded IPv4 tail (e.g. 64:ff9b::192.0.2.1) → two hextets.
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(addr);
  if (v4) {
    const o = v4[1]!.split(".").map(Number);
    addr = addr.slice(0, -v4[1]!.length) + `${((o[0]! << 8) | o[1]!).toString(16)}:${((o[2]! << 8) | o[3]!).toString(16)}`;
  }
  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const all = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  return all.map((h) => h.toLowerCase().replace(/^0+(?=.)/, ""));
}

/**
 * Rate-limit bucket for a client address: IPv4 by full address, IPv6 by its /64 prefix (one
 * subscriber typically controls a whole /64). IPv4-mapped IPv6 is treated as IPv4.
 */
export function ipBucket(ip: string | null | undefined): string {
  const raw = (ip ?? "").trim().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  if (!raw) return "unknown";
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(raw);
  if (mapped && isIP(mapped[1]!) === 4) return mapped[1]!;
  const kind = isIP(raw);
  if (kind === 4) return raw;
  if (kind === 6) {
    const hextets = ipv6Hextets(raw);
    if (hextets) return `${hextets.slice(0, 4).join(":")}::/64`;
  }
  return `other:${raw.toLowerCase().slice(0, 64)}`;
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

export async function resetRateLimit(...keys: string[]): Promise<void> {
  if (!keys.length) return;
  const { rateLimits } = await getCollections();
  await rateLimits.deleteMany({ _id: { $in: keys } });
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
