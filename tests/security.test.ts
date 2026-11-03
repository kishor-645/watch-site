import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { formatDate, formatDateTime } from "@/lib/format";
import { isAllowedImageUrl } from "@/lib/schemas/watch";
import { buildRequest } from "./helpers/api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("ipBucket", () => {
  it("keeps IPv4 addresses whole and maps IPv4-mapped IPv6 to IPv4", async () => {
    const { ipBucket } = await import("@/server/rate-limit");
    expect(ipBucket("203.0.113.7")).toBe("203.0.113.7");
    expect(ipBucket("::ffff:203.0.113.7")).toBe("203.0.113.7");
    expect(ipBucket(null)).toBe("unknown");
    expect(ipBucket("")).toBe("unknown");
  });

  it("groups IPv6 addresses by /64 regardless of notation", async () => {
    const { ipBucket } = await import("@/server/rate-limit");
    const a = ipBucket("2001:db8:1:2::1");
    expect(a).toBe("2001:db8:1:2::/64");
    expect(ipBucket("2001:0DB8:0001:0002:ffff:ffff:ffff:ffff")).toBe(a);
    expect(ipBucket("[2001:db8:1:2::99]")).toBe(a);
    expect(ipBucket("2001:db8:1:2::5%eth0")).toBe(a);
    expect(ipBucket("2001:db8:1:3::1")).not.toBe(a);
    expect(ipBucket("::1")).toBe("0:0:0:0::/64");
  });
});

describe("clientIp", () => {
  it("prefers x-vercel-forwarded-for, then x-real-ip, then the first x-forwarded-for entry", async () => {
    const { clientIp } = await import("@/server/http");
    const req = (headers: Record<string, string>) => buildRequest("GET", "/", { headers: { "x-forwarded-for": "", ...headers } });
    expect(clientIp(req({ "x-vercel-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }))).toBe("1.1.1.1");
    expect(clientIp(req({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientIp(req({ "x-forwarded-for": "3.3.3.3, 10.0.0.1" }))).toBe("3.3.3.3");
    expect(clientIp(req({}))).toBeNull();
  });
});

describe("readJson", () => {
  it("measures the body in bytes, not characters", async () => {
    const { readJson, ApiError } = await import("@/server/http");
    // 100k "€" = 100k UTF-16 units (under 256 KB) but 300 KB of UTF-8.
    const big = new Request("http://localhost/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ s: "€".repeat(100_000) }),
    });
    await expect(readJson(big, z.object({ s: z.string() }))).rejects.toMatchObject({ status: 413 });
    const small = new Request("http://localhost/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ s: "€".repeat(1000) }),
    });
    await expect(readJson(small, z.object({ s: z.string() }))).resolves.toEqual({ s: "€".repeat(1000) });
    expect(ApiError).toBeTypeOf("function");
  });
});

describe("session cookie", () => {
  it("uses the __Host- prefix in production and the plain name elsewhere", async () => {
    vi.resetModules();
    const dev = await import("@/server/auth/token");
    expect(dev.SESSION_COOKIE).toBe("mw_admin_session");

    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const prod = await import("@/server/auth/token");
    expect(prod.SESSION_COOKIE).toBe("__Host-mw_admin_session");
    const options = prod.sessionCookieOptions();
    expect(options).toMatchObject({ secure: true, path: "/" });
    expect(options).not.toHaveProperty("domain");
  });
});

describe("logger", () => {
  it("scrubs MongoDB credentials from error messages", async () => {
    const { log } = await import("@/server/log");
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    log.error("db.failed", { error: new Error("connect failed: mongodb+srv://app:S3cret!@cluster0.example.net/db") });
    const out = spy.mock.calls.flat().join(" ");
    expect(out).not.toContain("S3cret");
    expect(out).toContain("mongodb+srv://[redacted]@cluster0.example.net");
  });
});

describe("Blob host pinning", () => {
  it("derives the store host from BLOB_READ_WRITE_TOKEN and matches only that host", async () => {
    const blob = await import("@/server/blob");
    expect(blob.blobStoreHost("vercel_blob_rw_AbC123xyz_secretPart")).toBe("abc123xyz.public.blob.vercel-storage.com");
    expect(blob.blobStoreHost(undefined)).toBeNull();
    expect(blob.blobStoreHost("garbage")).toBeNull();

    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_AbC123xyz_secretPart");
    expect(blob.isProjectBlobUrl("https://abc123xyz.public.blob.vercel-storage.com/watches/a.jpg")).toBe(true);
    expect(blob.isProjectBlobUrl("https://other.public.blob.vercel-storage.com/watches/a.jpg")).toBe(false);
    expect(blob.isProjectBlobUrl("http://abc123xyz.public.blob.vercel-storage.com/watches/a.jpg")).toBe(false);
    expect(blob.foreignBlobFields([
      { path: "images.0.url", url: "https://other.public.blob.vercel-storage.com/a.jpg" },
      { path: "images.1.url", url: "https://abc123xyz.public.blob.vercel-storage.com/a.jpg" },
      { path: "images.2.url", url: "https://images.unsplash.com/photo-1" },
    ])).toEqual({ "images.0.url": expect.any(String) });
    expect(blob.normalizeBlobUrl("https://ABC123XYZ.public.blob.vercel-storage.com/a.jpg?download=1#x")).toBe(
      "https://abc123xyz.public.blob.vercel-storage.com/a.jpg",
    );

    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    expect(blob.isProjectBlobUrl("https://abc123xyz.public.blob.vercel-storage.com/watches/a.jpg")).toBe(false);
    expect(blob.foreignBlobFields([{ path: "x", url: "https://other.public.blob.vercel-storage.com/a.jpg" }])).toEqual({});
  });

  it("client-safe host check accepts exactly one DNS label before the Blob suffix", () => {
    expect(isAllowedImageUrl("https://abc123.public.blob.vercel-storage.com/a.jpg")).toBe(true);
    expect(isAllowedImageUrl("https://a.b.public.blob.vercel-storage.com/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://public.blob.vercel-storage.com/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://evilpublic.blob.vercel-storage.com/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("http://abc123.public.blob.vercel-storage.com/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://images.unsplash.com/photo-1")).toBe(true);
  });
});

describe("date formatting", () => {
  it("renders in the shop time zone (Asia/Kolkata) by default, overridable", () => {
    const iso = "2026-01-15T20:00:00.000Z"; // 16 Jan 01:30 in India
    expect(formatDate(iso)).toBe("16 Jan 2026");
    expect(formatDate(iso, "en-IN", { timeZone: "UTC" })).toBe("15 Jan 2026");
    const local = formatDateTime(iso);
    expect(local).toContain("16 Jan 2026");
    expect(local).toMatch(/01:30/);
    expect(formatDateTime(iso, "en-IN", { timeZone: "UTC" })).toMatch(/08:00/);
    // Same output no matter which zone the process runs in.
    expect(formatDateTime(iso, "en-IN")).toBe(formatDateTime(iso, "en-IN", { timeZone: "Asia/Kolkata" }));
    expect(formatDate(iso, "not a locale!!")).toBe("16 Jan 2026");
    expect(formatDate("not-a-date")).toBe("");
  });
});
