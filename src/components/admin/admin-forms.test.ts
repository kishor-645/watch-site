import { describe, expect, it } from "vitest";
import { siteSettingsSchema } from "@/lib/schemas/settings";
import { watchInputSchema } from "@/lib/schemas/watch";
import { DEFAULT_SETTINGS } from "@/lib/site-defaults";
import { toWatch } from "@/server/mappers";
import { sampleWatchDocs } from "@/server/seed/sample-catalog";
import { describeChanges } from "./audit-labels";
import { sanitizeFilename, validateImageFile } from "./uploads";
import * as settingsForm from "./settings-form-model";
import { clientValidate, remapErrors, stateFromWatch, toPayload } from "./watch-form-model";

const categories = DEFAULT_SETTINGS.catalog.categories.map(({ slug, label }) => ({ slug, label }));
const movements = DEFAULT_SETTINGS.catalog.movements.map(({ slug, label }) => ({ slug, label }));

describe("watch form model", () => {
  const watches = sampleWatchDocs(null).map(toWatch);

  it("round-trips every sample watch into a valid, identical WatchInput", () => {
    expect(watches.length).toBe(15);
    for (const w of watches) {
      const state = stateFromWatch(w, categories, movements);
      expect(clientValidate(state)).toEqual({});
      const { payload } = toPayload(state);
      const parsed = watchInputSchema.parse(payload);
      expect(parsed.price).toBe(w.price);
      expect(parsed.originalPrice).toBe(w.originalPrice);
      expect(parsed.slug).toBe(w.slug);
      expect(parsed.images).toEqual(w.images.map((i) => ({ url: i.url, alt: i.alt, ...(i.pathname ? { pathname: i.pathname } : {}) })));
      expect(parsed.features).toEqual(w.features);
      expect(parsed.specs).toEqual(w.specs);
      expect(parsed.extraSpecs).toEqual(w.extraSpecs);
      expect(typeof payload.price).toBe("number");
    }
  });

  it("validates an empty new watch and sends an empty slug while it is automatic", () => {
    const state = stateFromWatch(undefined, categories, movements);
    const errors = clientValidate(state);
    expect(errors).toMatchObject({ name: expect.any(String), brand: expect.any(String), price: expect.any(String), images: expect.any(String) });
    const filled = { ...state, name: "Test Watch", brand: "Acme", slug: "acme-test-watch", price: "42,999", originalPrice: "" };
    filled.images = [{ key: "a", url: "https://images.unsplash.com/photo-1?w=1", alt: "" }];
    expect(clientValidate(filled)).toEqual({});
    const { payload } = toPayload(filled);
    expect(payload.slug).toBe("");
    expect(payload.price).toBe(42999);
    expect(payload.originalPrice).toBeNull();
  });

  it("flags original price not above price, bad image hosts and half-filled spec rows", () => {
    const state = stateFromWatch(watches[0], categories, movements);
    const bad = {
      ...state,
      originalPrice: String(watches[0].price),
      images: [{ key: "z", url: "https://evil.example.com/x.jpg", alt: "" }],
      extraSpecs: [{ key: "e1", label: "Bezel", value: "" }],
    };
    const errors = clientValidate(bad);
    expect(errors.originalPrice).toBeTruthy();
    expect(errors["images.z.url"]).toBeTruthy();
    expect(errors["extraSpecs.e1.value"]).toBeTruthy();
  });

  it("maps index-based server error paths onto row keys", () => {
    expect(
      remapErrors(
        { "features.1": "Too long", "images.0.url": "Bad", "specs.caseSize": "x", slug: "Taken" },
        { featureKeys: ["a", "b"], extraKeys: [], imageKeys: ["img"] },
      ),
    ).toEqual({ "features.b": "Too long", "images.img.url": "Bad", "specs.caseSize": "x", slug: "Taken" });
  });
});

describe("settings form model", () => {
  it("round-trips the default settings into a valid SiteSettingsInput", () => {
    const state = settingsForm.toState(DEFAULT_SETTINGS);
    const payload = settingsForm.toPayload(state);
    expect(siteSettingsSchema.parse(payload)).toEqual(DEFAULT_SETTINGS);
    expect(JSON.stringify(payload)).not.toContain('"key"');
  });

  it("maps list error paths onto row keys", () => {
    const state = settingsForm.toState(DEFAULT_SETTINGS);
    const mapped = settingsForm.remapErrors({ "catalog.categories.2.slug": "Duplicate", "catalog.categories": "In use" }, state);
    expect(mapped).toEqual({ [`catalog.categories.${state.catalog.categories[2].key}.slug`]: "Duplicate", "catalog.categories": "In use" });
  });
});

describe("helpers", () => {
  it("describes audit changes", () => {
    expect(describeChanges({ price: { from: 42999, to: 39999 } }, {})).toEqual(["Price ₹42,999 → ₹39,999"]);
    expect(describeChanges({ published: { from: false, to: true } }, {})).toEqual(["Published No → Yes"]);
    expect(describeChanges({ availability: { from: "in_stock", to: "sold_out" } }, {})).toEqual(["Availability In stock → Sold out"]);
  });

  it("sanitises filenames and validates files", () => {
    expect(sanitizeFilename("My Photo (1).JPG")).toBe("my-photo-1.jpg");
    expect(sanitizeFilename("..png")).toBe("image.png");
    const big = new File([new Uint8Array(6 * 1024 * 1024)], "a.png", { type: "image/png" });
    expect(validateImageFile(big)).toMatch(/5 MB/);
    expect(validateImageFile(new File(["x"], "a.gif", { type: "image/gif" }))).toMatch(/JPEG/);
    expect(validateImageFile(new File(["x"], "a.webp", { type: "image/webp" }))).toBeNull();
  });
});
