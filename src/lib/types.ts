import type { WatchData } from "@/lib/schemas/watch";
import type { SiteSettings } from "@/lib/schemas/settings";

export type { Availability, Gender, WatchData, WatchImage, WatchInput, WatchPatch, WatchSpecs } from "@/lib/schemas/watch";
export type { CatalogOption, SiteSettings } from "@/lib/schemas/settings";
export type { CatalogQuery, SortKey } from "@/lib/schemas/catalog-query";

/** Watch as returned to UI code (server components and admin API). Dates are ISO strings. */
export interface Watch extends Omit<WatchData, "slug"> {
  id: string;
  slug: string;
  /** slugify(brand) — used for brand filters in shop URLs. */
  brandSlug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface CatalogFacets {
  brands: { slug: string; label: string; count: number }[];
  priceBounds: { min: number; max: number };
}

export interface PublicSettings extends SiteSettings {
  updatedAt: string | null;
  /** Stored sections that failed validation and were replaced by defaults (admin should re-save). */
  invalidSections: string[];
}

export interface AdminProfile {
  id: string;
  username: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  available: number; // in_stock + limited + pre_order (published or not)
  unavailable: number; // sold_out
  byAvailability: Record<import("@/lib/schemas/watch").Availability, number>;
  recent: Watch[];
}

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.password_change"
  | "auth.bootstrap"
  | "watch.create"
  | "watch.update"
  | "watch.delete"
  | "watch.price_change"
  | "watch.publish"
  | "watch.unpublish"
  | "catalog.seed"
  | "settings.update"
  | "upload.create";

export interface AuditLogEntry {
  id: string;
  at: string;
  action: AuditAction;
  actor: { id: string | null; username: string | null };
  entity: { type: "watch" | "settings" | "admin" | "upload" | null; id: string | null; label: string | null };
  changes: Record<string, { from: unknown; to: unknown }> | null;
  ip: string | null;
  userAgent: string | null;
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "PASSWORD_CHANGE_REQUIRED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** Field path (dot-joined, e.g. "specs.caseSize" or "images.0.url") -> first error message. */
  fields?: Record<string, string>;
}

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError };
