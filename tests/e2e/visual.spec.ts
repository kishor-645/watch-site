import path from "node:path";
import { expect, expectNoHorizontalOverflow, scrollThrough, test } from "./fixtures";

/*
 * Visual sanity pass (desktop project only): full-page screenshots of the public pages at 390px
 * and 1440px into test-results/screens/ for manual review, plus DOM checks that catch common
 * layout regressions — horizontal overflow, broken images, duplicate element ids.
 */

const SHOTS = path.join("test-results", "screens");
const PAGES = [
  ["home", "/"],
  ["shop", "/shop"],
  ["shop-category", "/shop?category=diver"],
  ["pdp", "/watches/kaizen-horology-tachymeter-pro"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["login", "/admin/login"],
] as const;

for (const width of [1440, 390]) {
  test.describe(`${width}px`, () => {
    test.use(
      width < 800
        ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
        : { viewport: { width, height: 900 } },
    );

    for (const [name, url] of PAGES) {
      test(`${name} renders cleanly`, async ({ page }) => {
        await page.goto(url);
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
        await scrollThrough(page);
        await page.waitForLoadState("networkidle");
        await page.screenshot({ path: path.join(SHOTS, `public-${name}-${width}.png`), fullPage: true, animations: "disabled", timeout: 30_000 });

        await expectNoHorizontalOverflow(page);

        // Every <img> that has been loaded must have decoded successfully.
        const broken = await page.locator("img").evaluateAll((imgs) =>
          (imgs as HTMLImageElement[])
            .filter((img) => img.complete && img.currentSrc && img.naturalWidth === 0)
            .map((img) => img.currentSrc),
        );
        expect(broken, "broken images").toEqual([]);
      });
    }
  });
}

test("element ids are unique on public pages", async ({ page }) => {
  // Regression test for BUG-1 (the mobile menu search reused the desktop #header-search id).
  const duplicates: string[] = [];
  for (const [, url] of PAGES.filter(([n]) => n !== "login")) {
    await page.goto(url);
    // Open the mobile menu so the sheet is in the DOM.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const dups = await page.evaluate(() => {
      const seen = new Map<string, number>();
      document.querySelectorAll("[id]").forEach((el) => seen.set(el.id, (seen.get(el.id) ?? 0) + 1));
      return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
    });
    duplicates.push(...dups.map((id) => `${url}: #${id}`));
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  expect(duplicates).toEqual([]);
});
