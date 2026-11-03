import "server-only";
import { ObjectId } from "mongodb";
import type { AuditAction, AuditLogEntry } from "@/lib/types";
import { getCollections } from "./db";
import { log } from "./log";

export type AuditChanges = NonNullable<AuditLogEntry["changes"]>;

export interface AuditInput {
  action: AuditAction;
  actor: { id: string | null; username: string | null } | null;
  entity?: Partial<AuditLogEntry["entity"]>;
  changes?: AuditChanges | null;
  ip?: string | null;
  userAgent?: string | null;
}

/** Request metadata passed from route handlers to services. */
export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

const SECRET_KEY = /pass(word)?|hash|secret|token/i;

function stripSecrets(changes: AuditChanges | null | undefined): AuditChanges | null {
  if (!changes) return null;
  const out: AuditChanges = {};
  for (const [k, v] of Object.entries(changes)) if (!SECRET_KEY.test(k)) out[k] = v;
  return Object.keys(out).length ? out : null;
}

/** Records an audit entry. Never throws: an audit failure must not fail the user's action. */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    const { audit } = await getCollections();
    await audit.insertOne({
      _id: new ObjectId(),
      at: new Date(),
      action: input.action,
      actor: { id: input.actor?.id ?? null, username: input.actor?.username ?? null },
      entity: { type: input.entity?.type ?? null, id: input.entity?.id ?? null, label: input.entity?.label ?? null },
      changes: stripSecrets(input.changes),
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (error) {
    log.error("audit.write_failed", { action: input.action, error });
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** `{ field: { from, to } }` for every listed field whose value differs, or null if none do. */
export function diffFields<T extends object>(
  before: T,
  after: T,
  fields: readonly (keyof T & string)[],
): AuditChanges | null {
  const changes: AuditChanges = {};
  for (const f of fields) {
    if (!same(before[f], after[f])) changes[f] = { from: before[f] ?? null, to: after[f] ?? null };
  }
  return Object.keys(changes).length ? changes : null;
}
