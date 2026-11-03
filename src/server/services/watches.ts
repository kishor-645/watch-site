import "server-only";
import { MongoServerError, ObjectId, type Filter } from "mongodb";
import { slugify, watchBaseSchema, type WatchData, type WatchPatch } from "@/lib/schemas/watch";
import type { Watch } from "@/lib/types";
import { diffFields, writeAudit, type RequestMeta } from "../audit";
import type { AdminSession } from "../auth/session";
import { deleteUnreferencedBlobs, foreignBlobFields, normalizeBlobUrl } from "../blob";
import { revalidateWatches } from "../cache";
import { getCollections } from "../db";
import { ApiError } from "../http";
import { escapeRegex, toWatch } from "../mappers";
import type { WatchDoc } from "../models";
import { parseObjectId } from "../queries/admin";
import { loadSettings } from "../queries/settings";
import { seedSampleCatalog } from "../seed/sample-catalog";

/** Every editable field — used to detect "nothing changed" on a full replace. */
const CONTENT_FIELDS = Object.keys(watchBaseSchema.shape) as (keyof WatchData & keyof WatchDoc)[];
const PRICE_FIELDS = ["price", "originalPrice"] as const;
/** Fields with from/to in `watch.update` entries (prices go to `watch.price_change` instead). */
const UPDATE_AUDITED_FIELDS = ["availability", "published", "featured", "name", "slug"] as const;
/** Old slugs kept per watch for redirects. */
const MAX_PREVIOUS_SLUGS = 20;

const validation = (fields: Record<string, string>) =>
  new ApiError(422, "VALIDATION_ERROR", "Please correct the highlighted fields", fields);
const notFound = () => new ApiError(404, "NOT_FOUND", "Watch not found");
const slugTaken = () =>
  new ApiError(409, "CONFLICT", "This URL slug is already used by another watch", { slug: "This slug is already in use" });
const slugReserved = () =>
  new ApiError(409, "CONFLICT", "This URL slug used to belong to another watch and still redirects to it", {
    slug: "This slug was used by another watch before (its old links redirect there). Choose a different one.",
  });
const isDuplicateKey = (e: unknown) => e instanceof MongoServerError && e.code === 11000;
const actor = (a: AdminSession) => ({ id: a.id, username: a.username });
const watchEntity = (d: Pick<WatchDoc, "_id" | "name">) => ({ type: "watch" as const, id: d._id.toHexString(), label: d.name });

function requireId(id: string): ObjectId {
  const _id = parseObjectId(id);
  if (!_id) throw notFound();
  return _id;
}

/** Category/movement must exist in settings; Blob images must come from this project's store. */
async function assertRefs(data: Pick<WatchData, "category" | "movement" | "images">): Promise<void> {
  const { catalog } = await loadSettings();
  const fields: Record<string, string> = foreignBlobFields(data.images.map((img, i) => ({ path: `images.${i}.url`, url: img.url })));
  if (!catalog.categories.some((c) => c.slug === data.category)) fields.category = "Choose a category from the list";
  if (!catalog.movements.some((m) => m.slug === data.movement)) fields.movement = "Choose a movement from the list";
  if (Object.keys(fields).length) throw validation(fields);
}

/**
 * Explicit slug → must be free (409). Empty → slugify(brand + name) with -2, -3… suffixes.
 * A slug listed in ANOTHER watch's `previousSlugs` counts as taken (old links keep redirecting
 * to that watch); a watch may take back one of its own previous slugs.
 */
async function resolveSlug(data: WatchData, excludeId?: ObjectId): Promise<string> {
  const { watches } = await getCollections();
  const notSelf: Filter<WatchDoc> = excludeId ? { _id: { $ne: excludeId } } : {};
  if (data.slug) {
    const slug = data.slug;
    const other = await watches.findOne({ $or: [{ slug }, { previousSlugs: slug }], ...notSelf }, { projection: { slug: 1 } });
    if (other) throw other.slug === slug ? slugTaken() : slugReserved();
    return slug;
  }
  const base = slugify(`${data.brand} ${data.name}`).slice(0, 110).replace(/-+$/, "") || "watch";
  const re = new RegExp(`^${escapeRegex(base)}(-\\d+)?$`);
  const docs = await watches
    .find({ $or: [{ slug: re }, { previousSlugs: re }], ...notSelf }, { projection: { slug: 1, previousSlugs: 1 } })
    .toArray();
  const taken = new Set(docs.flatMap((d) => [d.slug, ...(d.previousSlugs ?? [])]));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** Old slug appended (deduped, newest last), new slug removed, capped. */
function nextPreviousSlugs(before: WatchDoc, slug: string): string[] {
  const list = [...(before.previousSlugs ?? []), ...(before.slug !== slug ? [before.slug] : [])].filter((s) => s !== slug);
  return Array.from(new Set(list.reverse())).reverse().slice(-MAX_PREVIOUS_SLUGS);
}

export async function createWatch(data: WatchData, admin: AdminSession, meta: RequestMeta): Promise<Watch> {
  await assertRefs(data);
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
  await assertRefs(data);

  const slug = await resolveSlug(data, _id);
  const previousSlugs = nextPreviousSlugs(before, slug);
  const next: WatchDoc = {
    ...data,
    _id,
    slug,
    brandSlug: slugify(data.brand),
    ...(previousSlugs.length && { previousSlugs }),
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

  // One entry per kind of change; nothing at all when the save changed nothing.
  const changed = diffFields(before, after, CONTENT_FIELDS);
  if (changed) {
    const base = { actor: actor(admin), entity: watchEntity(after), ...meta };
    const nonPriceChanged = Object.keys(changed).some((f) => !(PRICE_FIELDS as readonly string[]).includes(f));
    if (nonPriceChanged) {
      await writeAudit({ action: "watch.update", changes: diffFields(before, after, UPDATE_AUDITED_FIELDS), ...base });
    }
    const prices = diffFields(before, after, PRICE_FIELDS);
    if (prices) await writeAudit({ action: "watch.price_change", changes: prices, ...base });
  }

  const kept = new Set(after.images.map((i) => normalizeBlobUrl(i.url)));
  await deleteUnreferencedBlobs(before.images.map((i) => i.url).filter((u) => !kept.has(normalizeBlobUrl(u))));
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
  await deleteUnreferencedBlobs(deleted.images.map((i) => i.url));
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
