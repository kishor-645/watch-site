import "server-only";
import { MongoClient, type Collection, type Db } from "mongodb";
import { getDbEnv } from "./env";
import { log } from "./log";
import {
  AUDIT_RETENTION_DAYS,
  COLLECTIONS,
  type AdminDoc,
  type AuditLogDoc,
  type RateLimitDoc,
  type SettingsDoc,
  type WatchDoc,
} from "./models";

export class DatabaseUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Database is unavailable", { cause });
    this.name = "DatabaseUnavailableError";
  }
}

interface MongoCache {
  client?: Promise<MongoClient>;
  indexes?: Promise<void>;
}

// Reused across hot reloads in dev and across invocations of a warm serverless instance.
const globalForMongo = globalThis as typeof globalThis & { __mongoCache?: MongoCache };
const cache: MongoCache = (globalForMongo.__mongoCache ??= {});

function getClient(): Promise<MongoClient> {
  if (!cache.client) {
    const { MONGODB_URI } = getDbEnv();
    const client = new MongoClient(MONGODB_URI, {
      appName: "mywatch-web",
      maxPoolSize: 10, // Atlas free tier allows ~500 connections across all instances
      minPoolSize: 0,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 10_000,
    });
    cache.client = client.connect().catch((err: unknown) => {
      cache.client = undefined; // allow retry on next request
      log.error("mongodb.connect_failed", { error: err });
      throw new DatabaseUnavailableError(err);
    });
  }
  return cache.client;
}

export async function getDb(): Promise<Db> {
  const db = (await getClient()).db(getDbEnv().MONGODB_DB);
  cache.indexes ??= ensureIndexes(db).catch((err: unknown) => {
    cache.indexes = undefined;
    log.error("mongodb.index_failed", { error: err });
    throw err;
  });
  await cache.indexes;
  return db;
}

export interface Collections {
  watches: Collection<WatchDoc>;
  admins: Collection<AdminDoc>;
  settings: Collection<SettingsDoc>;
  audit: Collection<AuditLogDoc>;
  rateLimits: Collection<RateLimitDoc>;
}

export async function getCollections(): Promise<Collections> {
  const db = await getDb();
  return collectionsFor(db);
}

export function collectionsFor(db: Db): Collections {
  return {
    watches: db.collection<WatchDoc>(COLLECTIONS.watches),
    admins: db.collection<AdminDoc>(COLLECTIONS.admins),
    settings: db.collection<SettingsDoc>(COLLECTIONS.settings),
    audit: db.collection<AuditLogDoc>(COLLECTIONS.audit),
    rateLimits: db.collection<RateLimitDoc>(COLLECTIONS.rateLimits),
  };
}

/** Idempotent. Runs once per process (first getDb call) and from the seed script. */
export async function ensureIndexes(db: Db): Promise<void> {
  const c = collectionsFor(db);
  await Promise.all([
    c.watches.createIndexes([
      { key: { slug: 1 }, name: "slug_unique", unique: true },
      // Old-slug redirects + "slug reserved" check (multikey).
      { key: { previousSlugs: 1 }, name: "previous_slugs" },
      // Shop "featured" sort; home page featured list.
      { key: { published: 1, featured: -1, createdAt: -1 }, name: "published_featured_recent" },
      // Shop "newest" sort.
      { key: { published: 1, createdAt: -1 }, name: "published_recent" },
      // Shop price sorts (both directions); related-watch padding by price.
      { key: { published: 1, price: 1 }, name: "published_price" },
      // Category filter + price sort; related watches (same category, nearest price).
      { key: { published: 1, category: 1, price: 1 }, name: "published_category_price" },
      // Brand filter; brand facets.
      { key: { published: 1, brandSlug: 1 }, name: "published_brand" },
      // Admin list (sorted by updatedAt) and sitemap.
      { key: { updatedAt: -1 }, name: "updated_recent" },
      // Dashboard "recently added".
      { key: { createdAt: -1 }, name: "recent" },
    ]),
    c.admins.createIndexes([{ key: { username: 1 }, name: "username_unique", unique: true }]),
    c.audit.createIndexes([
      { key: { at: 1 }, name: "at_ttl", expireAfterSeconds: AUDIT_RETENTION_DAYS * 24 * 60 * 60 },
      { key: { action: 1, at: -1 }, name: "action_recent" },
    ]),
    c.rateLimits.createIndexes([{ key: { expiresAt: 1 }, name: "expires_ttl", expireAfterSeconds: 0 }]),
  ]);
}

/** For scripts and tests only. */
export async function closeDb(): Promise<void> {
  if (cache.client) {
    const client = await cache.client.catch(() => undefined);
    cache.client = undefined;
    cache.indexes = undefined;
    await client?.close();
  }
}
