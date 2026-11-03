import "server-only";
import { siteSettingsSchema, type SiteSettings } from "@/lib/schemas/settings";
import type { PublicSettings } from "@/lib/types";
import { writeAudit, type AuditChanges, type RequestMeta } from "../audit";
import type { AdminSession } from "../auth/session";
import { collectStrings, deleteUnreferencedBlobs, foreignBlobFields, normalizeBlobUrl } from "../blob";
import { revalidateSettings, revalidateWatches } from "../cache";
import { getCollections } from "../db";
import { ApiError, zodFields } from "../http";
import { loadSettings } from "../queries/settings";

const SECTIONS = Object.keys(siteSettingsSchema.shape) as (keyof SiteSettings)[];

/** Message per removed option slug that is still referenced by watches, or null. */
async function removedInUse(field: "category" | "movement", before: { slug: string }[], after: { slug: string }[]) {
  const kept = new Set(after.map((o) => o.slug));
  const removed = before.map((o) => o.slug).filter((s) => !kept.has(s));
  if (!removed.length) return null;
  const { watches } = await getCollections();
  const used = await watches
    .aggregate<{ _id: string; n: number }>([
      { $match: { [field]: { $in: removed } } },
      { $group: { _id: `$${field}`, n: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
  if (!used.length) return null;
  return used
    .map(({ _id, n }) => `"${_id}" is still used by ${n} watch${n === 1 ? "" : "es"} — reassign ${n === 1 ? "it" : "them"} first`)
    .join("; ");
}

export async function updateSettings(input: unknown, admin: AdminSession, meta: RequestMeta): Promise<PublicSettings> {
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(422, "VALIDATION_ERROR", "Please correct the highlighted fields", zodFields(parsed.error));
  }
  const data = parsed.data;
  const foreign = foreignBlobFields(collectStrings(data));
  if (Object.keys(foreign).length) throw new ApiError(422, "VALIDATION_ERROR", "Please correct the highlighted fields", foreign);
  const before = await loadSettings();

  const fields: Record<string, string> = {};
  const categories = await removedInUse("category", before.catalog.categories, data.catalog.categories);
  const movements = await removedInUse("movement", before.catalog.movements, data.catalog.movements);
  if (categories) fields["catalog.categories"] = `Category ${categories}`;
  if (movements) fields["catalog.movements"] = `Movement ${movements}`;
  if (Object.keys(fields).length) throw new ApiError(422, "VALIDATION_ERROR", "Some options are still in use", fields);

  const { settings } = await getCollections();
  await settings.replaceOne(
    { _id: "global" },
    { ...data, updatedAt: new Date(), updatedBy: admin.username },
    { upsert: true },
  );
  revalidateSettings();
  revalidateWatches();

  // The changed section names go into entity.label; `changes` only carries real field values.
  const changed = SECTIONS.filter((s) => JSON.stringify(before[s]) !== JSON.stringify(data[s]));
  if (changed.length) {
    const changes: AuditChanges = {};
    if (before.contact.whatsappNumber !== data.contact.whatsappNumber) {
      changes["contact.whatsappNumber"] = { from: before.contact.whatsappNumber, to: data.contact.whatsappNumber };
    }
    await writeAudit({
      action: "settings.update",
      actor: { id: admin.id, username: admin.username },
      entity: { type: "settings", id: "global", label: changed.join(", ") },
      changes,
      ...meta,
    });
  }

  // Uploaded images that were replaced/removed in the settings (and are not used elsewhere).
  const now = new Set(collectStrings(data).map((s) => normalizeBlobUrl(s.url)));
  const dropped = collectStrings(before).map((s) => s.url).filter((u) => !now.has(normalizeBlobUrl(u)));
  await deleteUnreferencedBlobs(dropped);
  return loadSettings();
}
