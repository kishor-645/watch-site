import { revalidateTag } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { parseCatalogQuery } from "@/lib/schemas/catalog-query";
import type { WatchInput } from "@/lib/schemas/watch";
import type { AuditLogEntry, DashboardStats, Paginated, PublicSettings, Watch } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/site-defaults";
import { signInAsNewAdmin } from "../helpers/admin";
import { call, errorOf } from "../helpers/api";
import { startTestDb } from "../helpers/db";

vi.mock("next/headers", () => import("../helpers/next-headers").then((m) => m.nextHeadersModule));
vi.mock("@vercel/blob", () => ({ del: vi.fn(async () => undefined) }));

const IMG = "https://images.unsplash.com/photo-1?w=800";
const BLOB_IMG = "https://abc123.public.blob.vercel-storage.com/watches/front-x1.jpg";

const watchInput = (over: Partial<WatchInput> = {}): WatchInput => ({
  name: "Tide Diver",
  brand: "Oceanic",
  category: "diver",
  movement: "automatic",
  gender: "men",
  price: 25000,
  images: [{ url: IMG, alt: "Front" }],
  ...over,
});

type Routes = {
  watches: typeof import("@/app/api/admin/watches/route");
  watch: typeof import("@/app/api/admin/watches/[id]/route");
  seed: typeof import("@/app/api/admin/catalog/seed/route");
  stats: typeof import("@/app/api/admin/stats/route");
  settings: typeof import("@/app/api/admin/settings/route");
  audit: typeof import("@/app/api/admin/audit/route");
  uploads: typeof import("@/app/api/admin/uploads/route");
};

describe("admin API", () => {
  let db: { stop: () => Promise<void> };
  let r: Routes;
  const collections = async () => (await import("@/server/db")).getCollections();
  const create = (body: unknown) => call<Watch>(r.watches.POST, "POST", "/api/admin/watches", { body });
  const auditOf = async (action: string) =>
    (await call<Paginated<AuditLogEntry>>(r.audit.GET, "GET", `/api/admin/audit?action=${action}`)).data.items;

  beforeAll(async () => {
    db = await startTestDb();
    r = {
      watches: await import("@/app/api/admin/watches/route"),
      watch: await import("@/app/api/admin/watches/[id]/route"),
      seed: await import("@/app/api/admin/catalog/seed/route"),
      stats: await import("@/app/api/admin/stats/route"),
      settings: await import("@/app/api/admin/settings/route"),
      audit: await import("@/app/api/admin/audit/route"),
      uploads: await import("@/app/api/admin/uploads/route"),
    };
    await signInAsNewAdmin("editor");
  });
  afterAll(async () => {
    await db?.stop();
  });
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
  });

  describe("watches", () => {
    it("creates with an auto slug and suffixes duplicates", async () => {
      const a = await create(watchInput());
      expect(a.status).toBe(201);
      expect(a.data).toMatchObject({ slug: "oceanic-tide-diver", brandSlug: "oceanic", published: false, originalPrice: null });
      expect(revalidateTag).toHaveBeenCalledWith("watches");
      expect((await create(watchInput())).data.slug).toBe("oceanic-tide-diver-2");
      expect((await create(watchInput({ slug: "" }))).data.slug).toBe("oceanic-tide-diver-3");

      const doc = await (await collections()).watches.findOne({ slug: "oceanic-tide-diver" });
      expect(doc).toMatchObject({ createdBy: "editor", updatedBy: "editor" });
      expect((await auditOf("watch.create")).length).toBe(3);
    });

    it("rejects a taken explicit slug with 409", async () => {
      const res = await create(watchInput({ slug: "oceanic-tide-diver" }));
      expect(res.status).toBe(409);
      expect(errorOf(res)).toMatchObject({ code: "CONFLICT", fields: { slug: expect.any(String) } });
      expect((await create(watchInput({ slug: "custom-tide" }))).data.slug).toBe("custom-tide");
    });

    it("validates catalogue refs, image hosts and the original price rule", async () => {
      const cat = await create(watchInput({ category: "pocket-watch" }));
      expect(cat.status).toBe(422);
      expect(errorOf(cat).fields).toHaveProperty("category");
      const mov = await create(watchInput({ movement: "steam" }));
      expect(errorOf(mov).fields).toHaveProperty("movement");

      const host = await create(watchInput({ images: [{ url: "https://evil.example.com/a.jpg" }] }));
      expect(host.status).toBe(422);
      expect(errorOf(host).fields).toHaveProperty("images.0.url");

      const price = await create(watchInput({ price: 1000, originalPrice: 1000 }));
      expect(price.status).toBe(422);
      expect(errorOf(price).fields).toHaveProperty("originalPrice");
      expect((await create(watchInput({ price: 1000, originalPrice: 1500, slug: "sale-watch" }))).status).toBe(201);
    });

    it("rejects non-JSON and cross-site writes", async () => {
      const notJson = await r.watches.POST(
        new (await import("next/server")).NextRequest("http://localhost:3000/api/admin/watches", {
          method: "POST",
          headers: { host: "localhost:3000", origin: "http://localhost:3000", "content-type": "text/plain" },
          body: "x",
        }),
        { params: Promise.resolve({}) },
      );
      expect(notJson.status).toBe(415);
      expect((await call(r.watches.POST, "POST", "/api/admin/watches", { body: watchInput(), crossSite: true })).status).toBe(403);
    });

    it("lists with filters and pagination", async () => {
      const all = await call<Paginated<Watch>>(r.watches.GET, "GET", "/api/admin/watches");
      expect(all.data.total).toBe(5);
      expect(all.data.pageSize).toBe(20);
      const paged = await call<Paginated<Watch>>(r.watches.GET, "GET", "/api/admin/watches?pageSize=2&page=2");
      expect(paged.data).toMatchObject({ page: 2, pageSize: 2, pageCount: 3 });
      expect(paged.data.items).toHaveLength(2);
      const q = await call<Paginated<Watch>>(r.watches.GET, "GET", "/api/admin/watches?q=custom");
      expect(q.data.items.map((w) => w.slug)).toEqual(["custom-tide"]);
      const drafts = await call<Paginated<Watch>>(r.watches.GET, "GET", "/api/admin/watches?status=published");
      expect(drafts.data.total).toBe(0);
      expect((await call(r.watches.GET, "GET", "/api/admin/watches?pageSize=500")).status).toBe(422);
    });

    it("GET by id returns 404 for bad or unknown ids", async () => {
      const bad = await call(r.watch.GET, "GET", "/api/admin/watches/xyz", { params: { id: "xyz" } });
      expect(bad.status).toBe(404);
      const id = "0123456789abcdef01234567";
      expect((await call(r.watch.GET, "GET", `/api/admin/watches/${id}`, { params: { id } })).status).toBe(404);
      expect((await call(r.watch.DELETE, "DELETE", `/api/admin/watches/${id}`, { params: { id } })).status).toBe(404);
    });

    it("PUT replaces, audits changes and price changes", async () => {
      const { data: w } = await create(watchInput({ name: "Reef", slug: "reef" }));
      const res = await call<Watch>(r.watch.PUT, "PUT", `/api/admin/watches/${w.id}`, {
        params: { id: w.id },
        body: watchInput({ name: "Reef II", slug: "reef-ii", price: 27000, published: true, images: [{ url: IMG }] }),
      });
      expect(res.status).toBe(200);
      expect(res.data).toMatchObject({ id: w.id, name: "Reef II", slug: "reef-ii", price: 27000, published: true, createdAt: w.createdAt });
      expect(revalidateTag).toHaveBeenCalledWith("watches");

      const [update] = await auditOf("watch.update");
      expect(update!.changes).toMatchObject({ price: { from: 25000, to: 27000 }, slug: { from: "reef", to: "reef-ii" }, published: { from: false, to: true } });
      const [price] = await auditOf("watch.price_change");
      expect(price!.changes).toEqual({ price: { from: 25000, to: 27000 } });

      const taken = await call(r.watch.PUT, "PUT", `/api/admin/watches/${w.id}`, {
        params: { id: w.id },
        body: watchInput({ slug: "custom-tide" }),
      });
      expect(taken.status).toBe(409);
      // Keeping its own slug is not a conflict.
      expect((await call(r.watch.PUT, "PUT", `/api/admin/watches/${w.id}`, { params: { id: w.id }, body: watchInput({ name: "Reef II", slug: "reef-ii", price: 27000, published: true }) })).status).toBe(200);
    });

    it("PATCH updates price, publish state and enforces originalPrice on the merged doc", async () => {
      const { data: w } = await create(watchInput({ name: "Quick", slug: "quick", price: 10000, originalPrice: 12000 }));
      const patch = (body: unknown) => call<Watch>(r.watch.PATCH, "PATCH", `/api/admin/watches/${w.id}`, { params: { id: w.id }, body });

      const bad = await patch({ price: 12000 });
      expect(bad.status).toBe(422);
      expect(errorOf(bad).fields).toHaveProperty("originalPrice");
      expect((await patch({})).status).toBe(422);

      const priced = await patch({ price: 9000 });
      expect(priced.data.price).toBe(9000);
      const [entry] = await auditOf("watch.price_change");
      expect(entry!.changes).toEqual({ price: { from: 10000, to: 9000 } });
      expect(entry!.entity).toMatchObject({ type: "watch", id: w.id, label: "Quick" });

      expect((await patch({ published: true })).data.published).toBe(true);
      expect((await auditOf("watch.publish"))[0]!.entity.id).toBe(w.id);
      const { getPublishedWatchBySlug, listPublishedWatches } = await import("@/server/queries/watches");
      expect((await getPublishedWatchBySlug("quick"))?.price).toBe(9000);

      expect((await patch({ published: false, availability: "sold_out" })).data).toMatchObject({ published: false, availability: "sold_out" });
      expect((await auditOf("watch.unpublish")).length).toBe(1);
      expect((await auditOf("watch.update"))[0]!.changes).toEqual({ availability: { from: "in_stock", to: "sold_out" } });
      expect(await getPublishedWatchBySlug("quick")).toBeNull();
      expect((await listPublishedWatches(parseCatalogQuery({}))).items.map((x) => x.slug)).toEqual(["reef-ii"]);
    });

    it("DELETE removes the watch and audits with its name", async () => {
      const { data: w } = await create(watchInput({ name: "Doomed", slug: "doomed", images: [{ url: BLOB_IMG, pathname: "watches/front-x1.jpg" }] }));
      const res = await call(r.watch.DELETE, "DELETE", `/api/admin/watches/${w.id}`, { params: { id: w.id } });
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ deleted: true });
      expect((await call(r.watch.GET, "GET", `/api/admin/watches/${w.id}`, { params: { id: w.id } })).status).toBe(404);
      expect((await auditOf("watch.delete"))[0]!.entity.label).toBe("Doomed");
      expect(revalidateTag).toHaveBeenCalledWith("watches");
    });
  });

  describe("settings", () => {
    it("GET returns defaults", async () => {
      const res = await call<PublicSettings>(r.settings.GET, "GET", "/api/admin/settings");
      expect(res.data.contact.whatsappNumber).toBe(DEFAULT_SETTINGS.contact.whatsappNumber);
      expect(res.data.updatedAt).toBeNull();
    });

    it("PUT saves, normalises the WhatsApp number and audits", async () => {
      const body = {
        ...DEFAULT_SETTINGS,
        general: { ...DEFAULT_SETTINGS.general, siteName: "Yash Watches" },
        contact: { ...DEFAULT_SETTINGS.contact, whatsappNumber: "+91 98765-43210" },
      };
      const res = await call<PublicSettings>(r.settings.PUT, "PUT", "/api/admin/settings", { body });
      expect(res.status).toBe(200);
      expect(res.data.contact.whatsappNumber).toBe("919876543210");
      expect(res.data.general.siteName).toBe("Yash Watches");
      expect(res.data.updatedAt).not.toBeNull();
      expect(revalidateTag).toHaveBeenCalledWith("settings");
      expect(revalidateTag).toHaveBeenCalledWith("watches");

      const { getSiteSettings } = await import("@/server/queries/settings");
      expect((await getSiteSettings()).contact.whatsappNumber).toBe("919876543210");

      const [entry] = await auditOf("settings.update");
      expect(entry!.changes).toEqual({
        sections: { from: null, to: ["general", "contact"] },
        "contact.whatsappNumber": { from: "919016456462", to: "919876543210" },
      });
    });

    it("PUT rejects invalid input and removing an in-use category", async () => {
      const invalid = await call(r.settings.PUT, "PUT", "/api/admin/settings", {
        body: { ...DEFAULT_SETTINGS, contact: { ...DEFAULT_SETTINGS.contact, whatsappNumber: "12" } },
      });
      expect(invalid.status).toBe(422);
      expect(errorOf(invalid).fields).toHaveProperty("contact.whatsappNumber");

      const withoutDiver = DEFAULT_SETTINGS.catalog.categories.filter((c) => c.slug !== "diver");
      const res = await call(r.settings.PUT, "PUT", "/api/admin/settings", {
        body: { ...DEFAULT_SETTINGS, catalog: { ...DEFAULT_SETTINGS.catalog, categories: withoutDiver } },
      });
      expect(res.status).toBe(422);
      const msg = errorOf(res).fields!["catalog.categories"]!;
      expect(msg).toContain('"diver"');
      expect(msg).toMatch(/\d+ watches/);

      // Unused categories can be removed.
      const withoutSkeleton = DEFAULT_SETTINGS.catalog.categories.filter((c) => c.slug !== "skeleton");
      const okRes = await call<PublicSettings>(r.settings.PUT, "PUT", "/api/admin/settings", {
        body: { ...DEFAULT_SETTINGS, catalog: { ...DEFAULT_SETTINGS.catalog, categories: withoutSkeleton } },
      });
      expect(okRes.status).toBe(200);
      expect(okRes.data.catalog.categories.some((c) => c.slug === "skeleton")).toBe(false);
      expect(okRes.data.general.siteName).toBe("MyWatch");
    });
  });

  describe("seed, stats, uploads", () => {
    it("seed returns 409 when the catalogue is not empty, 201 with 15 when empty", async () => {
      expect((await call(r.seed.POST, "POST", "/api/admin/catalog/seed")).status).toBe(409);
      await (await collections()).watches.deleteMany({});
      // Restore default categories so the seed data matches the catalogue.
      await call(r.settings.PUT, "PUT", "/api/admin/settings", { body: DEFAULT_SETTINGS });
      const res = await call<{ inserted: number }>(r.seed.POST, "POST", "/api/admin/catalog/seed");
      expect(res.status).toBe(201);
      expect(res.data).toEqual({ inserted: 15 });
      expect(revalidateTag).toHaveBeenCalledWith("watches");
      expect((await call(r.seed.POST, "POST", "/api/admin/catalog/seed")).status).toBe(409);
      expect((await auditOf("catalog.seed")).length).toBe(1);
    });

    it("stats reflect the catalogue", async () => {
      const res = await call<DashboardStats>(r.stats.GET, "GET", "/api/admin/stats");
      expect(res.data.total).toBe(15);
      expect(res.data.recent).toHaveLength(5);
    });

    it("uploads return 503 without a Blob token", async () => {
      delete process.env.BLOB_READ_WRITE_TOKEN;
      const token = await call(r.uploads.POST, "POST", "/api/admin/uploads", {
        body: { type: "blob.generate-client-token", payload: { pathname: "watches/a.jpg", multipart: false, clientPayload: null } },
      });
      expect(token.status).toBe(503);
      expect(errorOf(token)).toMatchObject({ code: "SERVICE_UNAVAILABLE", message: "Image storage is not configured" });
      const del = await call(r.uploads.DELETE, "DELETE", "/api/admin/uploads", { body: { url: BLOB_IMG } });
      expect(del.status).toBe(503);
    });

    it("uploads validate input before contacting Vercel", async () => {
      process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_teststore_secret";
      try {
        const badPath = await call(r.uploads.POST, "POST", "/api/admin/uploads", {
          body: { type: "blob.generate-client-token", payload: { pathname: "../etc/passwd", multipart: false, clientPayload: null } },
        });
        expect(badPath.status).toBe(422);
        const callback = await call(r.uploads.POST, "POST", "/api/admin/uploads", {
          body: { type: "blob.upload-completed", payload: { blob: { url: BLOB_IMG } } },
        });
        expect(callback.status).toBe(422);
        const foreign = await call(r.uploads.DELETE, "DELETE", "/api/admin/uploads", { body: { url: IMG } });
        expect(foreign.status).toBe(422);
        expect(errorOf(foreign).fields).toHaveProperty("url");
      } finally {
        delete process.env.BLOB_READ_WRITE_TOKEN;
      }
    });
  });

  describe("blob cleanup", () => {
    it("deletes removed/deleted uploads after the DB write and guards unsaved-upload deletion", async () => {
      const { del } = await import("@vercel/blob");
      const delMock = vi.mocked(del);
      const second = BLOB_IMG.replace("front", "back");
      process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_teststore_secret";
      try {
        const images = [
          { url: BLOB_IMG, pathname: "watches/front-x1.jpg" },
          { url: second, pathname: "watches/back-x1.jpg" },
        ];
        const { data: w } = await create(watchInput({ name: "Blobby", slug: "blobby", images }));
        delMock.mockClear();
        await call(r.watch.PUT, "PUT", `/api/admin/watches/${w.id}`, {
          params: { id: w.id },
          body: watchInput({ name: "Blobby", slug: "blobby", images: [images[1]!] }),
        });
        expect(delMock).toHaveBeenCalledTimes(1);
        expect(delMock.mock.calls[0]![0]).toEqual([BLOB_IMG]);

        // The removed image is no longer referenced → may be deleted; the saved one may not.
        expect((await call(r.uploads.DELETE, "DELETE", "/api/admin/uploads", { body: { url: BLOB_IMG } })).status).toBe(200);
        const inUse = await call(r.uploads.DELETE, "DELETE", "/api/admin/uploads", { body: { url: second } });
        expect(inUse.status).toBe(409);

        delMock.mockClear();
        await call(r.watch.DELETE, "DELETE", `/api/admin/watches/${w.id}`, { params: { id: w.id } });
        expect(delMock.mock.calls[0]![0]).toEqual([second]);
      } finally {
        delete process.env.BLOB_READ_WRITE_TOKEN;
      }
    });
  });

  describe("access control", () => {
    it("blocks admins with a pending password change and anonymous users", async () => {
      await signInAsNewAdmin("fresh", { mustChangePassword: true });
      const res = await call(r.watches.GET, "GET", "/api/admin/watches");
      expect(res.status).toBe(403);
      expect(errorOf(res).code).toBe("PASSWORD_CHANGE_REQUIRED");
      (await import("../helpers/next-headers")).cookieJar.clear();
      expect((await call(r.settings.GET, "GET", "/api/admin/settings")).status).toBe(401);
      expect((await call(r.seed.POST, "POST", "/api/admin/catalog/seed")).status).toBe(401);
    });
  });
});
