import { expect, expectNoHorizontalOverflow, SITE, test, whatsappText } from "./fixtures";

/*
 * Public storefront flows (read-only — safe to run in parallel on the desktop and mobile projects).
 * Assumes the 15 sample watches and default settings of a freshly reset database; see README.md.
 */

const isMobile = (name: string) => name === "mobile";

test.describe("home", () => {
  test("renders hero, featured watches, categories, footer contact and the WhatsApp button", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/MyWatch/);
    await expect(page.getByRole("heading", { level: 1, name: "Watches chosen with care" })).toBeVisible();
    const hero = page.locator("section[aria-labelledby=hero-heading]");
    await expect(hero.getByRole("link", { name: "Explore the collection" })).toHaveAttribute("href", "/shop");
    await expect(hero.getByRole("link", { name: /Check availability/ })).toHaveAttribute(
      "href",
      new RegExp(`^https://wa\\.me/${SITE.whatsappNumber}\\?text=`),
    );

    const featured = page.locator("section[aria-labelledby=featured-heading]");
    await expect(featured.getByRole("heading", { name: "Featured watches" })).toBeVisible();
    expect(await featured.locator("article").count()).toBeGreaterThanOrEqual(4);
    await expect(featured.getByRole("link", { name: "MyWatch Aurora Chronograph" })).toHaveAttribute(
      "href",
      "/watches/mywatch-aurora-chronograph",
    );

    const categories = page.locator("section[aria-labelledby=categories-heading]");
    for (const [slug, label] of [
      ["chronograph", "Chronograph"],
      ["diver", "Diver"],
      ["skeleton", "Skeleton"],
      ["dress", "Dress"],
      ["everyday", "Everyday"],
    ]) {
      await expect(categories.getByRole("link", { name: new RegExp(`^${label}`) })).toHaveAttribute(
        "href",
        `/shop?category=${slug}`,
      );
    }

    // Footer contact details come from settings.
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /WhatsApp: \+91 90164 56462/ })).toHaveAttribute(
      "href",
      new RegExp(`^https://wa\\.me/${SITE.whatsappNumber}`),
    );
    await expect(footer.getByRole("link", { name: "+91 90164 56462", exact: true })).toHaveAttribute("href", /^tel:/);
    await expect(footer.getByText("Mon–Sat, 10:00–19:00 IST")).toBeVisible();
    await expect(footer.getByText(/© \d{4} MyWatch/)).toBeVisible();

    // Floating WhatsApp button: fixed, visible, opens wa.me in a new tab.
    const floating = page.getByRole("link", { name: "Chat with us on WhatsApp (opens in a new tab)" }).last();
    await expect(floating).toBeVisible();
    expect(await floating.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
    await expect(floating).toHaveAttribute("href", new RegExp(`^https://wa\\.me/${SITE.whatsappNumber}`));
    await expect(floating).toHaveAttribute("target", "_blank");
    await expect(floating).toHaveAttribute("rel", /noopener/);
    expect(whatsappText((await floating.getAttribute("href"))!)).toBe(
      "Hello, I would like to know more about your watches.",
    );

    await expectNoHorizontalOverflow(page);
  });

  test("header navigation works", async ({ page }, info) => {
    test.skip(isMobile(info.project.name), "desktop navigation is hidden on mobile (covered in mobile.spec.ts)");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Shop" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("heading", { level: 1, name: "Shop watches" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Shop" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await nav.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("link", { name: "MyWatch — home" }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Watches chosen with care" })).toBeVisible();
  });
});

test.describe("shop", () => {
  const status = (page: import("@playwright/test").Page) => page.locator("p[role=status]").filter({ hasText: /watch/i });
  const cardNames = (page: import("@playwright/test").Page) =>
    page.locator("main ul li article h2").allInnerTexts();

  test("filters, sort, pagination, search, clear and empty state", async ({ page }, info) => {
    test.skip(isMobile(info.project.name), "sidebar filters are desktop-only; mobile filter sheet is in mobile.spec.ts");
    const filters = page.getByRole("complementary", { name: "Filters" });

    await page.goto("/shop");
    await expect(status(page)).toHaveText("Showing 1–12 of 15 watches");
    expect(await page.locator("main article").count()).toBe(12);

    // Pagination preserves state in the URL.
    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await expect(pagination.getByRole("link", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    await pagination.getByRole("link", { name: "Page 2" }).click();
    await expect(page).toHaveURL(/\/shop\?page=2$/);
    await expect(status(page)).toHaveText("Showing 13–15 of 15 watches");
    expect(await page.locator("main article").count()).toBe(3);
    await pagination.getByRole("link", { name: "Previous page" }).click();
    await expect(page).toHaveURL(/\/shop$/);

    // Category filter → category view.
    await filters.getByRole("checkbox", { name: /^Chronograph/ }).click();
    await expect(page).toHaveURL(/\/shop\?category=chronograph$/);
    await expect(page.getByRole("heading", { level: 1, name: "Chronograph watches" })).toBeVisible();
    await expect(status(page)).toHaveText("Showing 4 watches");
    await expect(filters.getByRole("checkbox", { name: /^Chronograph/ })).toBeChecked();

    // + Brand filter.
    await filters.getByRole("checkbox", { name: /^Aurelius/ }).click();
    await expect(page).toHaveURL(/\/shop\?category=chronograph&brand=aurelius$/);
    await expect(status(page)).toHaveText("Showing 1 watch");
    expect(await cardNames(page)).toEqual(["Aurelius Rosé Chronograph"]);
    await expect(page.getByRole("list", { name: "Active filters" }).getByRole("button")).toHaveCount(3); // 2 chips + clear all

    // Removing a chip.
    await page.getByRole("button", { name: "Remove filter: Aurelius" }).click();
    await expect(page).toHaveURL(/\/shop\?category=chronograph$/);
    await expect(status(page)).toHaveText("Showing 4 watches");

    // Clear all.
    await filters.getByRole("button", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(status(page)).toHaveText("Showing 1–12 of 15 watches");

    // In stock only (every sample watch is in stock).
    await filters.getByRole("checkbox", { name: /Available only/ }).click();
    await expect(page).toHaveURL(/\/shop\?stock=1$/);
    await expect(page.getByRole("button", { name: "Remove filter: Available only" })).toBeVisible();
    await expect(status(page)).toHaveText("Showing 1–12 of 15 watches");
    await page.getByRole("button", { name: "Remove filter: Available only" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("list", { name: "Active filters" })).toHaveCount(0);
    await expect(page.locator("[aria-busy=true]")).toHaveCount(0);

    // Price slider (keyboard): PageDown moves the max thumb 10 steps (10 × ₹1,000).
    const maxThumb = filters.getByRole("slider", { name: "Maximum price" });
    await maxThumb.focus();
    await maxThumb.press("PageDown");
    await expect(page).toHaveURL(/\/shop\?max=108000$/);
    await expect(status(page)).toHaveText("Showing 1–12 of 13 watches");
    await expect(page.getByRole("button", { name: /Remove filter: Up to ₹1,08,000/ })).toBeVisible();
    await page.getByRole("button", { name: /Remove filter: Up to/ }).click();
    await expect(page).toHaveURL(/\/shop$/);

    // Sort.
    await page.getByRole("combobox", { name: "Sort watches" }).click();
    await page.getByRole("option", { name: "Price: Low to High" }).click();
    await expect(page).toHaveURL(/\/shop\?sort=price-asc$/);
    await expect(page.locator("main article h2").first()).toHaveText("MyWatch Voyager Field 40");
    await page.getByRole("combobox", { name: "Sort watches" }).click();
    await page.getByRole("option", { name: "Price: High to Low" }).click();
    await expect(page).toHaveURL(/\/shop\?sort=price-desc$/);
    await expect(page.locator("main article h2").first()).toHaveText("Lindqvist & Fils Atelier Squelette Manuel");
    // Sort is kept when paginating.
    await page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "Page 2" }).click();
    await expect(page).toHaveURL(/\/shop\?sort=price-desc&page=2$/);
    await expect(page.locator("main article h2").last()).toHaveText("MyWatch Voyager Field 40");

    // Search from the shop's own search box (header search: see the next test).
    await page.locator("#shop-search").fill("diver");
    await page.locator("#shop-search").press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=diver&sort=price-desc$/);
    await expect(page.getByRole("button", { name: "Remove filter: “diver”" })).toBeVisible();
    const names = await cardNames(page);
    expect(names).toEqual(
      expect.arrayContaining(["MyWatch Abyss 300 Diver", "Lindqvist & Fils Nautique 200", "Kaizen Horology Kai Diver"]),
    );
    await expect(page.locator("#shop-search")).toHaveValue("diver");

    // Empty state for a no-match search.
    await page.locator("#shop-search").fill("zzznomatchzzz");
    await page.locator("#shop-search").press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=zzznomatchzzz&sort=price-desc$/);
    await expect(page.getByRole("heading", { name: "No watches match these filters" })).toBeVisible();
    await expect(status(page)).toHaveText("No watches found");
    await page.getByRole("link", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(status(page)).toHaveText("Showing 1–12 of 15 watches");
  });

  test("header search works after browsing the shop client-side", async ({ page }, info) => {
    test.skip(isMobile(info.project.name), "the header search box is desktop-only (mobile: menu sheet)");
    // BUG-3: on the first run after `next start` this navigation was observed to never happen
    // (URL stays on /shop?sort=price-desc&page=2; the /shop?q=… RSC request is issued, then
    // dropped). Not reproducible once the server is warm. Kept strict on purpose.
    await page.goto("/shop");
    await page.getByRole("complementary", { name: "Filters" }).getByRole("checkbox", { name: /^Chronograph/ }).click();
    await expect(page).toHaveURL(/\/shop\?category=chronograph$/);
    await page.getByRole("button", { name: "Remove filter: Chronograph" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await page.getByRole("combobox", { name: "Sort watches" }).click();
    await page.getByRole("option", { name: "Price: High to Low" }).click();
    await expect(page).toHaveURL(/\/shop\?sort=price-desc$/);
    await page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "Page 2" }).click();
    await expect(page).toHaveURL(/\/shop\?sort=price-desc&page=2$/);
    await expect(page.locator("main article h2").last()).toHaveText("MyWatch Voyager Field 40");

    await page.locator("#header-search").fill("diver");
    await page.locator("#header-search").press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=diver$/, { timeout: 20_000 });
    await expect(status(page)).toHaveText(/Showing \d+ watches/);
    await expect(page.locator("#shop-search")).toHaveValue("diver");
  });

  test("shop state is restored from the URL", async ({ page }) => {
    await page.goto("/shop?category=diver,dress&sort=price-asc&max=60000");
    await expect(status(page)).toHaveText("Showing 3 watches");
    const prices = await page.locator("main article").evaluateAll((cards) =>
      cards.map((c) => Number((c.querySelector("p span")?.textContent ?? "").replace(/\D/g, ""))),
    );
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(Math.max(...prices)).toBeLessThanOrEqual(60000);
    await expect(page.getByRole("button", { name: "Remove filter: Diver" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove filter: Dress" })).toBeVisible();
  });
});

test.describe("product page", () => {
  const slug = "kaizen-horology-tachymeter-pro";

  test("gallery, price, specs, related watches and the Check Availability link", async ({ page, context, baseURL }, info) => {
    await page.goto(`/watches/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: "Kaizen Horology Tachymeter Pro" })).toBeVisible();
    await expect(page.getByText("Ref.")).toContainText("KH-003");

    // Price, original price and discount.
    const info1 = page.locator("section[aria-label$=overview]");
    await expect(info1.getByText("Price: ₹24,999")).toBeVisible();
    await expect(info1.locator("s")).toHaveText("Original price: ₹29,999");
    await expect(info1.getByText("17% off")).toBeVisible();
    await expect(info1.getByText("In stock", { exact: true })).toBeVisible();

    // Gallery: choosing image 2 shows it in the main stage.
    const thumbs = page.getByRole("button", { name: "Show image 2 of 3" });
    if (isMobile(info.project.name)) {
      const track = page.getByRole("region", { name: /image gallery, swipe to browse/ });
      await expect(track.getByRole("group", { name: "1 of 3" })).toBeInViewport();
      await thumbs.filter({ visible: true }).click();
      await expect(thumbs.filter({ visible: true })).toHaveAttribute("aria-current", "true");
      await expect(track.getByRole("group", { name: "2 of 3" })).toBeInViewport({ ratio: 0.9 });
    } else {
      const stage = page.getByRole("region", { name: /image 1 of 3/ });
      const before = await stage.locator("img").getAttribute("src");
      await page.getByRole("list", { name: "Choose image" }).getByRole("button", { name: "Show image 2 of 3" }).click();
      const stage2 = page.getByRole("region", { name: /image 2 of 3/ });
      await expect(stage2).toBeVisible();
      await expect(stage2.locator("img")).not.toHaveAttribute("src", before!);
      await expect(page.getByRole("list", { name: "Choose image" }).getByRole("button", { name: "Show image 2 of 3" })).toHaveAttribute(
        "aria-current",
        "true",
      );
      // Arrow keys browse too.
      await stage2.focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("region", { name: /image 3 of 3/ })).toBeVisible();
    }

    // Specifications table.
    const specs = page.locator("section[aria-labelledby=specs-heading] table");
    const row = (label: string) => specs.locator("tr", { has: page.locator("th", { hasText: new RegExp(`^${label}$`) }) }).locator("td");
    await expect(row("Brand")).toHaveText("Kaizen Horology");
    await expect(row("Reference")).toHaveText("KH-003");
    await expect(row("Collection")).toHaveText("Chronograph");
    await expect(row("Movement type")).toHaveText("Quartz");
    await expect(row("Case size")).toHaveText("43mm");
    expect(await specs.locator("tr").count()).toBeGreaterThanOrEqual(10);

    // Related watches.
    const related = page.locator("section[aria-labelledby=related-heading]");
    await expect(related.getByRole("heading", { name: "You may also like" })).toBeVisible();
    await expect(related.locator("article")).toHaveCount(4);
    await expect(related.getByRole("link", { name: "Kaizen Horology Tachymeter Pro" })).toHaveCount(0);

    // Check Availability → wa.me with the pre-filled enquiry.
    const cta = page.getByRole("link", { name: /Check availability/ });
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveAttribute("target", "_blank");
    await expect(cta).toHaveAttribute("rel", /noopener/);
    const href = (await cta.getAttribute("href"))!;
    expect(href.startsWith(`https://wa.me/${SITE.whatsappNumber}?text=`)).toBe(true);
    const text = whatsappText(href);
    expect(text).toContain("Kaizen Horology Tachymeter Pro");
    expect(text).toContain("Brand: Kaizen Horology");
    expect(text).toContain("Model: KH-003");
    expect(text).toContain("Price: ₹24,999");
    expect(text).toContain("Please confirm its availability");
    expect(text).toContain(`${baseURL}/watches/${slug}`);

    // Clicking opens a new tab at wa.me (stubbed — never hits WhatsApp).
    await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<p>stub</p>" }));
    const [popup] = await Promise.all([page.waitForEvent("popup"), cta.click()]);
    expect(popup.url()).toBe(href);
    await popup.close();

    await expectNoHorizontalOverflow(page);
  });

  test("breadcrumb and category link go back to the shop", async ({ page }) => {
    await page.goto(`/watches/${slug}`);
    const crumbs = page.getByRole("navigation", { name: /breadcrumb/i });
    await expect(crumbs.getByRole("link", { name: "Chronograph" })).toHaveAttribute("href", "/shop?category=chronograph");
    await crumbs.getByRole("link", { name: "Shop" }).click();
    await expect(page).toHaveURL(/\/shop$/);
  });
});

test.describe("not found", () => {
  test.use({ allowedErrors: [/404/] });

  test("unknown product slug renders the 404 page", async ({ page }) => {
    const res = await page.goto("/watches/this-watch-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This page could not be found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore the collection" })).toHaveAttribute("href", "/shop");
    await expect(page.locator("footer")).toBeVisible(); // rendered inside the site layout
  });

  test("unknown URL renders the 404 page", async ({ page }) => {
    const res = await page.goto("/definitely/not/a/page");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This page could not be found" })).toBeVisible();
    await page.getByRole("link", { name: "Return home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
