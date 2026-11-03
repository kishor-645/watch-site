import "server-only";
import type { AdminProfile, AuditLogEntry, Watch } from "@/lib/types";
import type { AdminDoc, AuditLogDoc, WatchDoc } from "./models";

export function toWatch(doc: WatchDoc): Watch {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    brandSlug: doc.brandSlug,
    name: doc.name,
    brand: doc.brand,
    modelNumber: doc.modelNumber ?? "",
    category: doc.category,
    gender: doc.gender,
    movement: doc.movement,
    price: doc.price,
    originalPrice: doc.originalPrice ?? null,
    availability: doc.availability,
    published: doc.published,
    featured: doc.featured,
    shortDescription: doc.shortDescription ?? "",
    description: doc.description ?? "",
    features: doc.features ?? [],
    specs: doc.specs,
    extraSpecs: doc.extraSpecs ?? [],
    images: (doc.images ?? []).map((i) => ({ url: i.url, alt: i.alt ?? "", ...(i.pathname && { pathname: i.pathname }) })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toAdminProfile(doc: AdminDoc): AdminProfile {
  return {
    id: doc._id.toHexString(),
    username: doc.username,
    mustChangePassword: doc.mustChangePassword,
    lastLoginAt: doc.lastLoginAt?.toISOString() ?? null,
    passwordChangedAt: doc.passwordChangedAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toAuditEntry(doc: AuditLogDoc): AuditLogEntry {
  return {
    id: doc._id.toHexString(),
    at: doc.at.toISOString(),
    action: doc.action,
    actor: doc.actor,
    entity: doc.entity,
    changes: doc.changes ?? null,
    ip: doc.ip,
    userAgent: doc.userAgent,
  };
}

export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
