import "server-only";

/**
 * Minimal structured logger (JSON lines in production, readable in dev). Vercel captures stdout.
 * Sensitive keys are redacted recursively; never pass raw request bodies.
 */

type Level = "debug" | "info" | "warn" | "error";
const SENSITIVE = /pass(word)?|secret|token|authorization|cookie|uri|hash/i;

/** Removes credentials from MongoDB connection strings embedded in text. */
const scrub = (s: string) => s.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/g, "mongodb$1://[redacted]@");

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: scrub(value.message),
      ...(process.env.NODE_ENV !== "production" && value.stack && { stack: scrub(value.stack) }),
    };
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE.test(k) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  if (typeof value === "string") return scrub(value);
  return value;
}

function write(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;
  const entry = { level, msg, time: new Date().toISOString(), ...(meta ? (redact(meta) as object) : {}) };
  const line = process.env.NODE_ENV === "production" ? JSON.stringify(entry) : `[${level}] ${msg}${meta ? " " + JSON.stringify(entry) : ""}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (msg: string, meta?: Record<string, unknown>) => write("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => write("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write("error", msg, meta),
};
