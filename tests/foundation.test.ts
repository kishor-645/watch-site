import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseCatalogQuery } from "@/lib/schemas/catalog-query";
import { siteSettingsSchema } from "@/lib/schemas/settings";
import { watchInputSchema, watchPatchSchema } from "@/lib/schemas/watch";
import { DEFAULT_SETTINGS } from "@/lib/site-defaults";
import { buildWhatsAppUrl, renderTemplate, watchEnquiryUrl } from "@/lib/whatsapp";
import { startTestDb } from "./helpers/db";

describe("whatsapp", () => {
  it("builds a wa.me link with an encoded message and digits-only number", () => {
    const url = buildWhatsAppUrl("+91 90164 56462", "Hi & hello?\nLine 2");
    expect(url).toBe("https://wa.me/919016456462?text=Hi%20%26%20hello%3F%0ALine%202");
  });

  it("drops template lines whose placeholder is empty", () => {
    const msg = renderTemplate("Watch: {name}\nModel: {model}\nPrice: {price}", {
      name: "Aurora",
      brand: "MyWatch",
      model: "",
      price: "₹1",
      url: "",
    });
    expect(msg).toBe("Watch: Aurora\nPrice: ₹1");
  });

  it("uses the configured number and includes all watch details", () => {
    const url = watchEnquiryUrl(
      DEFAULT_SETTINGS,
      { name: "Aurora Chronograph", brand: "MyWatch", modelNumber: "MW-001", price: 42999 },
      "https://example.com/watches/aurora",
    );
    expect(url.startsWith("https://wa.me/919016456462?text=")).toBe(true);
    const text = decodeURIComponent(url.split("?text=")[1]!);
    expect(text).toContain("Watch: Aurora Chronograph");
    expect(text).toContain("Brand: MyWatch");
    expect(text).toContain("Model: MW-001");
    expect(text).toContain("Price: ₹42,999");
    expect(text).toContain("Product URL: https://example.com/watches/aurora");
    expect(text).toContain("Please confirm its availability.");
  });
});

describe("schemas", () => {
  it("default settings are valid", () => {
    expect(siteSettingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
  });

  it("normalises the WhatsApp number to digits", () => {
    const s = siteSettingsSchema.parse({ ...DEFAULT_SETTINGS, contact: { ...DEFAULT_SETTINGS.contact, whatsappNumber: "+91 90164-56462" } });
    expect(s.contact.whatsappNumber).toBe("919016456462");
  });

  it("rejects images from disallowed hosts and original price below price", () => {
    const r = watchInputSchema.safeParse({
      name: "Test",
      brand: "B",
      category: "diver",
      gender: "men",
      movement: "automatic",
      price: 1000,
      originalPrice: 900,
      images: [{ url: "https://evil.example.com/x.jpg" }],
    });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toContain("images.0.url");
    expect(paths).toContain("originalPrice");
  });

  it("patch requires at least one field", () => {
    expect(watchPatchSchema.safeParse({}).success).toBe(false);
    expect(watchPatchSchema.safeParse({ price: 5 }).success).toBe(true);
  });

  it("parses shop params leniently", () => {
    const q = parseCatalogQuery({ category: "diver,dress", gender: ["men", "alien"], min: "-5", sort: "bogus", page: "2" });
    expect(q).toMatchObject({ category: ["diver", "dress"], gender: ["men"], minPrice: null, sort: "featured", page: 2 });
  });
});

describe("database foundation", () => {
  let db: { stop: () => Promise<void> };
  beforeAll(async () => {
    db = await startTestDb();
  });
  afterAll(async () => {
    await db?.stop();
  });

  it("seeds the 15 sample watches once and serves public queries", async () => {
    const { getCollections } = await import("@/server/db");
    const { seedSampleCatalog } = await import("@/server/seed/sample-catalog");
    const q = await import("@/server/queries/watches");

    const c = await getCollections();
    expect(await seedSampleCatalog(c, "test")).toBe(15);
    expect(await seedSampleCatalog(c, "test")).toBe(0);

    const page1 = await q.listPublishedWatches(parseCatalogQuery({}));
    expect(page1.total).toBe(15);
    expect(page1.items).toHaveLength(12);
    expect(page1.pageCount).toBe(2);
    expect(page1.items[0]!.featured).toBe(true);

    const divers = await q.listPublishedWatches(parseCatalogQuery({ category: "diver", sort: "price-asc" }));
    expect(divers.items.every((w) => w.category === "diver")).toBe(true);
    const prices = divers.items.map((w) => w.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    const search = await q.listPublishedWatches(parseCatalogQuery({ q: "aurora" }));
    expect(search.items.some((w) => w.slug === "mywatch-aurora-chronograph")).toBe(true);

    const regexSafe = await q.listPublishedWatches(parseCatalogQuery({ q: ".*(" }));
    expect(regexSafe.total).toBe(0);

    const one = await q.getPublishedWatchBySlug("mywatch-aurora-chronograph");
    expect(one?.modelNumber).toBe("MW-001");

    const facets = await q.getCatalogFacets();
    expect(facets.brands.length).toBeGreaterThan(1);
    expect(facets.priceBounds.max).toBeGreaterThan(facets.priceBounds.min);

    const related = await q.getRelatedWatches(one!.id, one!.category, one!.price, 4);
    expect(related).toHaveLength(4);
    expect(related.some((w) => w.id === one!.id)).toBe(false);
  });

  it("unpublished watches are hidden from public queries", async () => {
    const { getCollections } = await import("@/server/db");
    const q = await import("@/server/queries/watches");
    const c = await getCollections();
    await c.watches.updateOne({ slug: "mywatch-aurora-chronograph" }, { $set: { published: false } });
    expect(await q.getPublishedWatchBySlug("mywatch-aurora-chronograph")).toBeNull();
    const all = await q.listPublishedWatches(parseCatalogQuery({}));
    expect(all.total).toBe(14);
  });

  it("settings fall back to defaults and merge stored values", async () => {
    const { getCollections } = await import("@/server/db");
    const { loadSettings } = await import("@/server/queries/settings");
    expect((await loadSettings()).contact.whatsappNumber).toBe("919016456462");
    const c = await getCollections();
    await c.settings.insertOne({
      _id: "global",
      ...DEFAULT_SETTINGS,
      general: { ...DEFAULT_SETTINGS.general, siteName: "Yash Watches" },
      updatedAt: new Date(),
      updatedBy: "test",
    });
    const s = await loadSettings();
    expect(s.general.siteName).toBe("Yash Watches");
    expect(s.updatedAt).not.toBeNull();
  });

  it("admin stats count by availability", async () => {
    const { getDashboardStats } = await import("@/server/queries/admin");
    const s = await getDashboardStats();
    expect(s.total).toBe(15);
    expect(s.published).toBe(14);
    expect(s.drafts).toBe(1);
    expect(s.available + s.unavailable).toBe(15);
    expect(s.recent).toHaveLength(5);
  });
});
