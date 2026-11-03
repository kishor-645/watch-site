import "server-only";
import type { ObjectId } from "mongodb";
import type { AuditAction, AuditLogEntry, SiteSettings, WatchData } from "@/lib/types";

/** MongoDB document shapes. See DATABASE_SCHEMA.md. */

export const COLLECTIONS = {
  watches: "watches",
  admins: "admins",
  settings: "site_settings",
  audit: "audit_logs",
  rateLimits: "rate_limits",
} as const;

export interface WatchDoc extends Omit<WatchData, "slug"> {
  _id: ObjectId;
  slug: string;
  brandSlug: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null; // admin username
  updatedBy: string | null;
}

export interface AdminDoc {
  _id: ObjectId;
  username: string; // unique, lowercase
  passwordHash: string; // bcrypt
  mustChangePassword: boolean;
  /** Incremented on logout / password change — invalidates every issued session token. */
  sessionVersion: number;
  failedLoginCount: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  passwordChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsDoc extends SiteSettings {
  _id: "global";
  updatedAt: Date;
  updatedBy: string | null;
}

export interface AuditLogDoc {
  _id: ObjectId;
  at: Date;
  action: AuditAction;
  actor: AuditLogEntry["actor"];
  entity: AuditLogEntry["entity"];
  changes: AuditLogEntry["changes"];
  ip: string | null;
  userAgent: string | null;
}

export interface RateLimitDoc {
  _id: string; // e.g. "login:ip:1.2.3.4"
  count: number;
  expiresAt: Date; // TTL
}

export const AUDIT_RETENTION_DAYS = 180;
