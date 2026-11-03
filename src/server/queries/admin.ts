import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { AVAILABILITY, AVAILABLE_STATES, type Availability } from "@/lib/schemas/watch";
import type { AdminWatchQuery, AuditQuery } from "@/lib/schemas/catalog-query";
import type { AdminProfile, AuditLogEntry, DashboardStats, Paginated, Watch } from "@/lib/types";
import { getCollections } from "../db";
import { escapeRegex, toAdminProfile, toAuditEntry, toWatch } from "../mappers";
import type { AuditLogDoc, WatchDoc } from "../models";

/*
 * ADMIN reads — uncached, include unpublished watches.
 * Callers MUST have authenticated the admin first (requireAdminPage / withApi({ auth: true })).
 */

export function parseObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id) ? new ObjectId(id) : null;
}

export async function listAdminWatches(q: AdminWatchQuery): Promise<Paginated<Watch>> {
  const { watches } = await getCollections();
  const filter: Filter<WatchDoc> = {};
  if (q.q) {
    const re = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ name: re }, { brand: re }, { modelNumber: re }, { slug: re }];
  }
  if (q.status === "published") filter.published = true;
  if (q.status === "draft") filter.published = false;
  if (q.availability !== "all") filter.availability = q.availability;

  const total = await watches.countDocuments(filter);
  const pageCount = Math.max(1, Math.ceil(total / q.pageSize));
  const page = Math.min(q.page, pageCount);
  const docs = await watches
    .find(filter)
    .sort({ updatedAt: -1, _id: -1 })
    .skip((page - 1) * q.pageSize)
    .limit(q.pageSize)
    .toArray();
  return { items: docs.map(toWatch), total, page, pageSize: q.pageSize, pageCount };
}

export async function getWatchForAdmin(id: string): Promise<Watch | null> {
  const _id = parseObjectId(id);
  if (!_id) return null;
  const { watches } = await getCollections();
  const doc = await watches.findOne({ _id });
  return doc ? toWatch(doc) : null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { watches } = await getCollections();
  const [agg] = await watches
    .aggregate<{
      total: { n: number }[];
      published: { n: number }[];
      featured: { n: number }[];
      availability: { _id: Availability; n: number }[];
    }>([
      {
        $facet: {
          total: [{ $count: "n" }],
          published: [{ $match: { published: true } }, { $count: "n" }],
          featured: [{ $match: { featured: true } }, { $count: "n" }],
          availability: [{ $group: { _id: "$availability", n: { $sum: 1 } } }],
        },
      },
    ])
    .toArray();
  const recentDocs = await watches.find({}).sort({ createdAt: -1 }).limit(5).toArray();

  const byAvailability = Object.fromEntries(AVAILABILITY.map((a) => [a, 0])) as Record<Availability, number>;
  for (const row of agg?.availability ?? []) byAvailability[row._id] = row.n;
  const total = agg?.total[0]?.n ?? 0;
  const published = agg?.published[0]?.n ?? 0;

  return {
    total,
    published,
    drafts: total - published,
    featured: agg?.featured[0]?.n ?? 0,
    available: AVAILABLE_STATES.reduce((sum, a) => sum + byAvailability[a], 0),
    unavailable: byAvailability.sold_out,
    byAvailability,
    recent: recentDocs.map(toWatch),
  };
}

export async function listAuditLogs(q: AuditQuery): Promise<Paginated<AuditLogEntry>> {
  const { audit } = await getCollections();
  const filter: Filter<AuditLogDoc> = q.action ? { action: q.action as AuditLogDoc["action"] } : {};
  const total = await audit.countDocuments(filter);
  const pageCount = Math.max(1, Math.ceil(total / q.pageSize));
  const page = Math.min(q.page, pageCount);
  const docs = await audit
    .find(filter)
    .sort({ at: -1 })
    .skip((page - 1) * q.pageSize)
    .limit(q.pageSize)
    .toArray();
  return { items: docs.map(toAuditEntry), total, page, pageSize: q.pageSize, pageCount };
}

export async function getAdminProfile(id: string): Promise<AdminProfile | null> {
  const _id = parseObjectId(id);
  if (!_id) return null;
  const { admins } = await getCollections();
  const doc = await admins.findOne({ _id });
  return doc ? toAdminProfile(doc) : null;
}

/** Every brand used by any watch (drafts included), for admin form suggestions. */
export async function listAllBrands(): Promise<string[]> {
  const { watches } = await getCollections();
  const brands = await watches.distinct("brand");
  return brands.filter(Boolean).sort((a, b) => a.localeCompare(b));
}
