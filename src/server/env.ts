import "server-only";
import { z } from "zod";

/**
 * Server-only environment. Parsed lazily so `next build` does not require secrets.
 * Error messages list variable NAMES only — never values.
 */

const dbSchema = z.object({
  MONGODB_URI: z
    .string({ error: "MONGODB_URI is not set" })
    .min(1, "MONGODB_URI is not set")
    .refine((v) => v.startsWith("mongodb://") || v.startsWith("mongodb+srv://"), "MONGODB_URI must be a MongoDB connection string"),
  MONGODB_DB: z.string().trim().min(1).default("mywatch"),
});

const authSchema = z.object({
  SESSION_SECRET: z
    .string({ error: "SESSION_SECRET is not set" })
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  INITIAL_ADMIN_USERNAME: z.string().trim().toLowerCase().default("admin"),
  INITIAL_ADMIN_PASSWORD: z.string().optional(),
});

function parse<T extends z.ZodTypeAny>(schema: T, label: string): z.output<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues.map((i) => i.message).join("; ");
    throw new Error(`[config] Invalid ${label} environment: ${problems}`);
  }
  return result.data;
}

let dbEnv: z.output<typeof dbSchema> | undefined;
let authEnv: z.output<typeof authSchema> | undefined;

export function getDbEnv() {
  return (dbEnv ??= parse(dbSchema, "database"));
}

export function getAuthEnv() {
  return (authEnv ??= parse(authSchema, "auth"));
}

/** Vercel Blob token is optional locally; uploads are disabled without it. */
export function getBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || undefined;
}
