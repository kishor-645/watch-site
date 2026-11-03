import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
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
    // Same category first (nearest price first), then other categories.
    const all = await c.watches.find({ published: true }).toArray();
    const sameCat = all.filter((d) => d.category === one!.category && d._id.toHexString() !== one!.id);
    const firstN = related.slice(0, Math.min(sameCat.length, 4));
    expect(firstN.every((w) => w.category === one!.category)).toBe(true);
    const dist = firstN.map((w) => Math.abs(w.price - one!.price));
    expect(dist).toEqual([...dist].sort((a, b) => a - b));
    const expected = sameCat.map((d) => Math.abs(d.price - one!.price)).sort((a, b) => a - b).slice(0, firstN.length);
    expect(dist).toEqual(expected);
    expect(related.slice(firstN.length).every((w) => w.category !== one!.category)).toBe(true);
  });

  it("featured list contains only featured, published watches", async () => {
    const { getCollections } = await import("@/server/db");
    const q = await import("@/server/queries/watches");
    const c = await getCollections();
    const expected = await c.watches.countDocuments({ published: true, featured: true });
    expect(expected).toBeGreaterThan(0);
    const featured = await q.getFeaturedWatches(48);
    expect(featured).toHaveLength(expected);
    expect(featured.every((w) => w.featured && w.published)).toBe(true);
    expect(await q.getFeaturedWatches(1)).toHaveLength(1);
  });

  it("brand facets use a stable label for each brand slug", async () => {
    const { getCollections } = await import("@/server/db");
    const q = await import("@/server/queries/watches");
    const c = await getCollections();
    const sample = await c.watches.findOne({ published: true });
    await c.watches.updateOne({ _id: sample!._id }, { $set: { brand: sample!.brand.toUpperCase() } });
    const label = (await q.getCatalogFacets()).brands.find((b) => b.slug === sample!.brandSlug)!.label;
    for (let i = 0; i < 3; i++) expect((await q.getCatalogFacets()).brands.find((b) => b.slug === sample!.brandSlug)!.label).toBe(label);
    // Uppercase sorts before mixed case → deterministic choice.
    expect(label).toBe(sample!.brand.toUpperCase());
    await c.watches.updateOne({ _id: sample!._id }, { $set: { brand: sample!.brand } });
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
    expect(s.invalidSections).toEqual([]);
  });

  it("an invalid stored section falls back alone and is reported in invalidSections", async () => {
    const { getCollections } = await import("@/server/db");
    const { loadSettings, getSiteSettings } = await import("@/server/queries/settings");
    const c = await getCollections();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      await c.settings.updateOne(
        { _id: "global" },
        {
          $set: {
            "contact.whatsappNumber": "919999988888",
            "seo.title": "x".repeat(500), // too long → whole `seo` section invalid
            "social.instagram": "not a url",
          },
        },
      );
      for (const s of [await loadSettings(), await getSiteSettings()]) {
        expect(s.contact.whatsappNumber).toBe("919999988888");
        expect(s.general.siteName).toBe("Yash Watches");
        expect(s.seo).toEqual(DEFAULT_SETTINGS.seo);
        expect(s.social).toEqual(DEFAULT_SETTINGS.social);
        expect([...s.invalidSections].sort()).toEqual(["seo", "social"]);
      }
      expect(error.mock.calls.flat().join(" ")).toContain("settings.invalid_stored_section");
    } finally {
      error.mockRestore();
      await c.settings.updateOne(
        { _id: "global" },
        { $set: { seo: DEFAULT_SETTINGS.seo, social: DEFAULT_SETTINGS.social, contact: DEFAULT_SETTINGS.contact } },
      );
    }
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
