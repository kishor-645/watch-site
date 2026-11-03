import "server-only";
import { MongoServerError, ObjectId, type Filter } from "mongodb";
import { slugify, type WatchData, type WatchPatch } from "@/lib/schemas/watch";
import type { Watch } from "@/lib/types";
import { diffFields, writeAudit, type AuditChanges, type RequestMeta } from "../audit";
import type { AdminSession } from "../auth/session";
import { deleteBlobsQuietly } from "../blob";
import { revalidateWatches } from "../cache";
import { getCollections } from "../db";
import { ApiError } from "../http";
import { escapeRegex, toWatch } from "../mappers";
import type { WatchDoc } from "../models";
import { parseObjectId } from "../queries/admin";
import { loadSettings } from "../queries/settings";
import { seedSampleCatalog } from "../seed/sample-catalog";

const AUDITED_FIELDS = ["price", "originalPrice", "availability", "published", "featured", "name", "slug"] as const;
const PRICE_FIELDS = ["price", "originalPrice"] as const;

const validation = (fields: Record<string, string>) =>
  new ApiError(422, "VALIDATION_ERROR", "Please correct the highlighted fields", fields);
const notFound = () => new ApiError(404, "NOT_FOUND", "Watch not found");
const slugTaken = () =>
  new ApiError(409, "CONFLICT", "This URL slug is already used by another watch", { slug: "This slug is already in use" });
const isDuplicateKey = (e: unknown) => e instanceof MongoServerError && e.code === 11000;
const actor = (a: AdminSession) => ({ id: a.id, username: a.username });
const watchEntity = (d: Pick<WatchDoc, "_id" | "name">) => ({ type: "watch" as const, id: d._id.toHexString(), label: d.name });

function requireId(id: string): ObjectId {
  const _id = parseObjectId(id);
  if (!_id) throw notFound();
  return _id;
}

async function assertCatalogRefs(data: Pick<WatchData, "category" | "movement">): Promise<void> {
  const { catalog } = await loadSettings();
  const fields: Record<string, string> = {};
  if (!catalog.categories.some((c) => c.slug === data.category)) fields.category = "Choose a category from the list";
  if (!catalog.movements.some((m) => m.slug === data.movement)) fields.movement = "Choose a movement from the list";
  if (Object.keys(fields).length) throw validation(fields);
}

/** Explicit slug → must be free (409). Empty → slugify(brand + name) with -2, -3… suffixes. */
async function resolveSlug(data: WatchData, excludeId?: ObjectId): Promise<string> {
  const { watches } = await getCollections();
  const notSelf: Filter<WatchDoc> = excludeId ? { _id: { $ne: excludeId } } : {};
  if (data.slug) {
    if (await watches.findOne({ slug: data.slug, ...notSelf }, { projection: { _id: 1 } })) throw slugTaken();
    return data.slug;
  }
  const base = slugify(`${data.brand} ${data.name}`).slice(0, 110).replace(/-+$/, "") || "watch";
  const taken = new Set(
    (
      await watches
        .find({ slug: { $regex: `^${escapeRegex(base)}(-\\d+)?$` }, ...notSelf }, { projection: { slug: 1 } })
        .toArray()
    ).map((d) => d.slug),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

function uploadedUrls(images: WatchData["images"]): string[] {
  return images.filter((i) => i.pathname).map((i) => i.url);
}

function priceChanges(changes: AuditChanges | null): AuditChanges | null {
  if (!changes) return null;
  const out = Object.fromEntries(PRICE_FIELDS.filter((f) => f in changes).map((f) => [f, changes[f]!]));
  return Object.keys(out).length ? out : null;
}

export async function createWatch(data: WatchData, admin: AdminSession, meta: RequestMeta): Promise<Watch> {
  await assertCatalogRefs(data);
  const { watches } = await getCollections();
  const now = new Date();
  const doc: WatchDoc = {
    ...data,
    _id: new ObjectId(),
    slug: await resolveSlug(data),
    brandSlug: slugify(data.brand),
    createdAt: now,
    updatedAt: now,
    createdBy: admin.username,
    updatedBy: admin.username,
  };
  try {
    await watches.insertOne(doc);
  } catch (error) {
    if (isDuplicateKey(error)) throw slugTaken();
    throw error;
  }
  revalidateWatches();
  await writeAudit({ action: "watch.create", actor: actor(admin), entity: watchEntity(doc), ...meta });
  return toWatch(doc);
}

export async function replaceWatch(id: string, data: WatchData, admin: AdminSession, meta: RequestMeta): Promise<Watch> {
  const _id = requireId(id);
  const { watches } = await getCollections();
  const before = await watches.findOne({ _id });
  if (!before) throw notFound();
  await assertCatalogRefs(data);

  const next: WatchDoc = {
    ...data,
    _id,
    slug: await resolveSlug(data, _id),
    brandSlug: slugify(data.brand),
    createdAt: before.createdAt,
    createdBy: before.createdBy,
    updatedAt: new Date(),
    updatedBy: admin.username,
  };
  let after: WatchDoc | null;
  try {
    after = await watches.findOneAndReplace({ _id }, next, { returnDocument: "after" });
  } catch (error) {
    if (isDuplicateKey(error)) throw slugTaken();
    throw error;
  }
  if (!after) throw notFound();
  revalidateWatches();

  const changes = diffFields(before, after, AUDITED_FIELDS);
  await writeAudit({ action: "watch.update", actor: actor(admin), entity: watchEntity(after), changes, ...meta });
  const prices = priceChanges(changes);
  if (prices) await writeAudit({ action: "watch.price_change", actor: actor(admin), entity: watchEntity(after), changes: prices, ...meta });

  const kept = new Set(after.images.map((i) => i.url));
  await deleteBlobsQuietly(uploadedUrls(before.images).filter((u) => !kept.has(u)));
  return toWatch(after);
}

export async function patchWatch(id: string, patch: WatchPatch, admin: AdminSession, meta: RequestMeta): Promise<Watch> {
  const _id = requireId(id);
  const { watches } = await getCollections();
  const before = await watches.findOne({ _id });
  if (!before) throw notFound();

  const price = patch.price ?? before.price;
  const originalPrice = patch.originalPrice !== undefined ? patch.originalPrice : before.originalPrice;
  if (originalPrice != null && originalPrice <= price) {
    throw validation({ originalPrice: "Original price must be higher than the selling price" });
  }

  const after = await watches.findOneAndUpdate(
    { _id },
    { $set: { ...patch, updatedAt: new Date(), updatedBy: admin.username } },
    { returnDocument: "after" },
  );
  if (!after) throw notFound();
  revalidateWatches();

  const entity = watchEntity(after);
  const base = { actor: actor(admin), entity, ...meta };
  const prices = diffFields(before, after, PRICE_FIELDS);
  if (prices) await writeAudit({ action: "watch.price_change", changes: prices, ...base });
  const publish = diffFields(before, after, ["published"]);
  if (publish) await writeAudit({ action: after.published ? "watch.publish" : "watch.unpublish", changes: publish, ...base });
  const other = diffFields(before, after, ["availability", "featured"]);
  if (other) await writeAudit({ action: "watch.update", changes: other, ...base });
  return toWatch(after);
}

export async function deleteWatch(id: string, admin: AdminSession, meta: RequestMeta): Promise<void> {
  const _id = requireId(id);
  const { watches } = await getCollections();
  const deleted = await watches.findOneAndDelete({ _id });
  if (!deleted) throw notFound();
  revalidateWatches();
  await writeAudit({ action: "watch.delete", actor: actor(admin), entity: watchEntity(deleted), ...meta });
  await deleteBlobsQuietly(uploadedUrls(deleted.images));
}

/** Inserts the sample catalogue; 409 when the catalogue already has watches. */
export async function seedCatalog(admin: AdminSession, meta: RequestMeta): Promise<number> {
  const c = await getCollections();
  const inserted = await seedSampleCatalog(c, admin.username);
  if (inserted === 0) throw new ApiError(409, "CONFLICT", "The catalogue already has watches. Sample data can only be added to an empty catalogue.");
  revalidateWatches();
  await writeAudit({
    action: "catalog.seed",
    actor: actor(admin),
    entity: { type: "watch", id: null, label: `${inserted} sample watches` },
    changes: { inserted: { from: 0, to: inserted } },
    ...meta,
  });
  return inserted;
}
