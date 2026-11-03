import { z } from "zod";

/* Admin list queries (server / admin pages only — keeps zod out of public client bundles). */

/** Admin watch list query: GET /api/admin/watches */
export const adminWatchQuerySchema = z.object({
  q: z.string().trim().max(80).default(""),
  status: z.enum(["all", "published", "draft"]).default("all"),
  availability: z.enum(["all", "in_stock", "limited", "pre_order", "sold_out"]).default("all"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminWatchQuery = z.output<typeof adminWatchQuerySchema>;

export const auditQuerySchema = z.object({
  action: z.string().trim().max(60).default(""),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});
export type AuditQuery = z.output<typeof auditQuerySchema>;
