import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { call } from "../helpers/api";
import { startTestDb } from "../helpers/db";

vi.mock("next/headers", () => import("../helpers/next-headers").then((m) => m.nextHeadersModule));

describe("GET /api/catalog/snapshots (wishlist refresh)", () => {
  let db: { stop: () => Promise<void> };
  let route: typeof import("@/app/api/catalog/snapshots/route");

  beforeAll(async () => {
    db = await startTestDb();
    const { getCollections } = await import("@/server/db");
    const { seedSampleCatalog } = await import("@/server/seed/sample-catalog");
    await seedSampleCatalog(await getCollections(), "test");
    route = await import("@/app/api/catalog/snapshots/route");
  });
  afterAll(async () => {
    await db?.stop();
  });

  it("returns current public data only for published watches", async () => {
    const { getCollections } = await import("@/server/db");
    const c = await getCollections();
    await c.watches.updateOne({ slug: "mywatch-aurora-chronograph" }, { $set: { price: 12345 } });
    await c.watches.updateOne({ slug: "valmont-geneve-rallye-panda-chronograph" }, { $set: { published: false } });

    const r = await call<{ items: { slug: string; price: number; image: string | null }[] }>(
      route.GET,
      "GET",
      "/api/catalog/snapshots?slugs=mywatch-aurora-chronograph,valmont-geneve-rallye-panda-chronograph,does-not-exist,BAD%20slug",
    );
    expect(r.status).toBe(200);
    expect(r.data.items).toHaveLength(1);
    expect(r.data.items[0]).toMatchObject({ slug: "mywatch-aurora-chronograph", price: 12345 });
    expect(r.data.items[0]!.image).toMatch(/^https:\/\//);
    expect(JSON.stringify(r.data)).not.toMatch(/createdBy|updatedBy|_id/);
  });

  it("rejects oversized requests", async () => {
    const slugs = Array.from({ length: 61 }, (_, i) => `w-${i}`).join(",");
    const r = await call(route.GET, "GET", `/api/catalog/snapshots?slugs=${slugs}`);
    expect(r.status).toBe(400);
  });
});
