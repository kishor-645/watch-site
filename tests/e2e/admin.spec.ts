import { mkdirSync } from "node:fs";
import path from "node:path";
import { request as playwrightRequest, type Page } from "@playwright/test";
import { expect, SITE, test, whatsappText } from "./fixtures";

/*
 * Admin console flows — SERIAL and STATE-CHANGING. Requires a freshly reset database
 * (initial admin password, 15 sample watches, default settings). See tests/e2e/README.md.
 *
 * Order: first login + forced password change → dashboard → inline list edits → create/edit/delete
 * → settings → activity → admin screenshots → logout (revokes the session, so it runs last).
 */

const USER = process.env.E2E_ADMIN_USERNAME ?? "admin";
const INITIAL_PASSWORD = process.env.E2E_ADMIN_INITIAL_PASSWORD ?? "InitialPass12345";
const NEW_PASSWORD = "E2e-Rotated-Passw0rd-2026";
// Outside the Playwright outputDir (test-results/e2e), which is wiped at the start of every run.
const STATE_FILE = path.join("test-results", ".auth", "admin.json");
const SHOTS = path.join("test-results", "screens");

const PDP = "/watches/kaizen-horology-tachymeter-pro";
const PDP_NAME = "Kaizen Horology Tachymeter Pro";
const IMAGE_URL = "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=1600&q=80&auto=format&fit=crop";

test.describe.configure({ mode: "serial" });

async function toast(page: Page, text: string | RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible();
}

async function signIn(page: Page, password: string) {
  await page.getByLabel("Username").fill(USER);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("auth gate, wrong password, first login forces a password change", async ({ page, errorTracker }) => {
  errorTracker.allow(/401|422/); // expected: wrong password, wrong current password

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);

  await signIn(page, "definitely-wrong-password");
  await expect(page.getByRole("alert").filter({ hasText: "Incorrect" })).toHaveText("Incorrect username or password.");
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");

  await signIn(page, INITIAL_PASSWORD);
  await expect(page).toHaveURL(/\/admin\/account\?required=1$/);
  await expect(page.getByText("Change the initial password to continue")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Action required" })).toBeVisible();

  // Every other admin page is locked until the password is changed.
  for (const p of ["/admin", "/admin/watches", "/admin/settings", "/admin/activity", "/admin/watches/new"]) {
    await page.goto(p);
    await expect(page, `${p} should redirect to the account page`).toHaveURL(/\/admin\/account\?required=1$/);
  }

  const current = page.getByLabel("Current password", { exact: true });
  const next = page.getByLabel("New password", { exact: true });
  const confirm = page.getByLabel("Confirm new password", { exact: true });
  const submit = page.getByRole("button", { name: "Change password" });

  // Too short.
  await current.fill(INITIAL_PASSWORD);
  await next.fill("short1");
  await confirm.fill("short1");
  await submit.click();
  await expect(page.getByText("Use at least 12 characters")).toBeVisible();
  await expect(next).toHaveAttribute("aria-invalid", "true");

  // No digit.
  await next.fill("onlylettershere");
  await confirm.fill("onlylettershere");
  await submit.click();
  await expect(page.getByText("Include at least one letter and one number")).toBeVisible();

  // Mismatch.
  await next.fill(NEW_PASSWORD);
  await confirm.fill(`${NEW_PASSWORD}x`);
  await submit.click();
  await expect(page.getByText("Passwords do not match")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Both new passwords match" })).toContainText("not met yet");

  // Wrong current password (server-side check).
  await current.fill("not-the-current-password");
  await confirm.fill(NEW_PASSWORD);
  await submit.click();
  await expect(page.getByText("Current password is incorrect")).toBeVisible();

  // Valid → dashboard.
  await current.fill(INITIAL_PASSWORD);
  await submit.click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await toast(page, "Password changed");
  await expect(page.getByText("Action required")).toHaveCount(0);

  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  await page.context().storageState({ path: STATE_FILE });
});

test.describe("signed in", () => {
  test.use({ storageState: STATE_FILE });

  test("dashboard shows the catalogue statistics", async ({ page }) => {
    await page.goto("/admin");
    const stats = page.getByRole("region", { name: "Catalogue statistics" });
    await expect(stats.getByRole("link", { name: /^Total watches\s*15$/ })).toBeVisible();
    await expect(stats.getByRole("link", { name: /^Published\s*15$/ })).toBeVisible();
    await expect(stats.getByRole("link", { name: /^Drafts\s*0$/ })).toBeVisible();
    await expect(stats.getByRole("link", { name: /^Sold out\s*0$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recently added" })).toBeVisible();
    await expect(page.getByText("Signed in as")).toContainText(USER);
  });

  test("watches list: search, inline price, availability and publish toggles reach the public site", async ({
    page,
    errorTracker,
  }) => {
    errorTracker.allow(/404/); // the unpublished product page

    await page.goto("/admin/watches");
    await expect(page.locator("ul > li").filter({ has: page.getByRole("button", { name: /^Price of / }) })).toHaveCount(15);

    // Search (debounced, URL-driven).
    await page.locator("#watch-search").fill("Tachymeter");
    await expect(page).toHaveURL(/\/admin\/watches\?q=Tachymeter$/);
    const priceButton = page.getByRole("button", { name: `Price of ${PDP_NAME}: ₹24,999. Click to edit` });
    await expect(priceButton).toBeVisible();
    await expect(page.getByRole("button", { name: /^Price of / })).toHaveCount(1);

    // Inline price edit — invalid first, then valid.
    await priceButton.click();
    const priceInput = page.getByRole("textbox", { name: `New price for ${PDP_NAME}` });
    await priceInput.fill("35000");
    await priceInput.press("Enter");
    await expect(page.getByRole("alert").filter({ hasText: "Must be below the original price (₹29,999)" })).toBeVisible();
    await priceInput.fill("23999");
    await priceInput.press("Enter");
    await toast(page, "price set to ₹23,999");
    await expect(page.getByRole("button", { name: `Price of ${PDP_NAME}: ₹23,999. Click to edit` })).toBeVisible();

    await page.goto(PDP);
    await expect(page.getByText("Price: ₹23,999")).toBeVisible();
    expect(whatsappText((await page.getByRole("link", { name: /Check availability/ }).getAttribute("href"))!)).toContain(
      "Price: ₹23,999",
    );

    // Sold out.
    await page.goto("/admin/watches?q=Tachymeter");
    await page.getByLabel(`Availability of ${PDP_NAME}`).selectOption("sold_out");
    await toast(page, "marked sold out");
    await page.goto(PDP);
    await expect(page.locator("section[aria-label$=overview]").getByText("Sold out", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ask about availability/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Check availability/ })).toHaveCount(0);
    await expect(page.getByText("Currently sold out")).toBeVisible();
    await page.goto("/shop?q=KH-003");
    await expect(page.locator("main article").getByText("Sold out")).toBeVisible();
    await page.goto("/shop?q=KH-003&stock=1");
    await expect(page.getByRole("heading", { name: "No watches match these filters" })).toBeVisible();

    // Unpublish → 404 and absent from the shop.
    await page.goto("/admin/watches?q=Tachymeter");
    await page.getByRole("switch", { name: `Published — ${PDP_NAME}` }).click();
    await toast(page, "unpublished");
    expect((await page.goto(PDP))?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This page could not be found" })).toBeVisible();
    await page.goto("/shop?q=KH-003");
    await expect(page.getByRole("heading", { name: "No watches match these filters" })).toBeVisible();
    await page.goto("/shop");
    await expect(page.locator("p[role=status]").filter({ hasText: /watch/ })).toHaveText("Showing 1–12 of 14 watches");

    // Republish and restore availability.
    await page.goto("/admin/watches?q=Tachymeter");
    await page.getByRole("switch", { name: `Published — ${PDP_NAME}` }).click();
    await toast(page, /: published$/);
    await page.getByLabel(`Availability of ${PDP_NAME}`).selectOption("in_stock");
    await toast(page, "marked in stock");
    // Restore the original price so the public suite still matches the seed data afterwards.
    await page.getByRole("button", { name: `Price of ${PDP_NAME}: ₹23,999. Click to edit` }).click();
    await page.getByRole("textbox", { name: `New price for ${PDP_NAME}` }).fill("24999");
    await page.getByRole("textbox", { name: `New price for ${PDP_NAME}` }).press("Enter");
    await toast(page, "price set to ₹24,999");
    expect((await page.goto(PDP))?.status()).toBe(200);
    await expect(page.getByRole("link", { name: /Check availability/ })).toBeVisible();
  });

  test("create, validate, edit and delete a watch", async ({ page, errorTracker }) => {
    errorTracker.allow(/503/); // upload token request without a Blob store
    errorTracker.allow(/404/); // deleted product page

    await page.goto("/admin/watches/new");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Required-field validation.
    await page.getByRole("button", { name: "Create watch" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /fields? needs? attention before saving/ })).toBeVisible();
    await expect(page.locator("#f-name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#f-brand")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#f-price")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Enter the selling price")).toBeVisible();
    await expect(page.locator("#f-name")).toBeFocused();

    // Upload without Blob storage → clear message.
    await page.locator("input[type=file]").setInputFiles({
      name: "watch.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await expect(page.getByRole("alert").filter({ hasText: "Image storage is not configured" }).first()).toBeVisible();

    // Image URL validation.
    await page.locator("#image-url").fill("https://example.com/watch.jpg");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "images.unsplash.com" })).toBeVisible();

    // Fill the form.
    await page.locator("#f-name").fill("E2E Test Chronograph");
    await page.locator("#f-brand").fill("E2E Horology");
    await page.locator("#f-modelNumber").fill("E2E-001");
    await page.locator("#f-category").selectOption("chronograph");
    await page.locator("#f-movement").selectOption("automatic");
    await page.locator("#f-gender").selectOption("unisex");
    await page.locator("#f-price").fill("55555");
    await page.locator("#f-originalPrice").fill("66666");
    await expect(page.getByText("Shown struck through as ₹66,666 — 17% off")).toBeVisible();
    await page.getByRole("switch", { name: "Published" }).click();
    await page.locator("#f-shortDescription").fill("A watch created by the end-to-end test suite.");
    await page.locator("#f-description").fill("First paragraph of the E2E watch.\n\nSecond paragraph of the E2E watch.");
    await page.getByRole("button", { name: "Add feature" }).click();
    await page.getByLabel("Feature 1", { exact: true }).fill("Sapphire crystal (E2E)");
    await page.getByRole("button", { name: "Add feature" }).click();
    await page.getByLabel("Feature 2", { exact: true }).fill("Exhibition caseback (E2E)");
    await page.locator("#f-specs-caseSize").fill("41mm");
    await page.locator("#f-specs-caseMaterial").fill("Grade 5 titanium");
    await page.getByRole("button", { name: "Add specification" }).click();
    await page.getByLabel("Specification 1 label").fill("Bezel");
    await page.getByLabel("Specification 1 value").fill("Ceramic, unidirectional");
    await page.locator("#image-url").fill(IMAGE_URL);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Primary", { exact: true })).toBeVisible();
    await expect(page.locator("#f-slug")).toHaveValue("e2e-horology-e2e-test-chronograph");

    await page.getByRole("button", { name: "Create watch" }).click();
    await toast(page, "Created “E2E Test Chronograph”");
    await expect(page).toHaveURL(/\/admin\/watches\/[a-f0-9]{24}$/);
    const editUrl = page.url();

    // Public product page.
    const slugPath = "/watches/e2e-horology-e2e-test-chronograph";
    await page.goto(slugPath);
    await expect(page.getByRole("heading", { level: 1, name: "E2E Test Chronograph" })).toBeVisible();
    const overview = page.locator("section[aria-label$=overview]");
    await expect(overview.getByText("Price: ₹55,555")).toBeVisible();
    await expect(overview.locator("s")).toHaveText("Original price: ₹66,666");
    await expect(overview.getByText("17% off")).toBeVisible();
    await expect(overview.getByText("Sapphire crystal (E2E)")).toBeVisible();
    await expect(overview.getByText("Exhibition caseback (E2E)")).toBeVisible();
    await expect(page.getByText("Second paragraph of the E2E watch.")).toBeVisible();
    const specs = page.locator("section[aria-labelledby=specs-heading] table");
    await expect(specs.locator("tr", { hasText: "Case size" }).locator("td")).toHaveText("41mm");
    await expect(specs.locator("tr", { hasText: "Bezel" }).locator("td")).toHaveText("Ceramic, unidirectional");
    await expect(specs.locator("tr", { hasText: "Reference" }).locator("td")).toHaveText("E2E-001");
    const text = whatsappText((await page.getByRole("link", { name: /Check availability/ }).getAttribute("href"))!);
    expect(text).toContain("E2E Test Chronograph");
    expect(text).toContain("Model: E2E-001");

    // Appears in the shop.
    await page.goto("/shop?q=E2E");
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article h2")).toHaveText("E2E Test Chronograph");
    await page.goto("/shop");
    await expect(page.locator("p[role=status]").filter({ hasText: /watch/ })).toHaveText("Showing 1–12 of 16 watches");

    // Edit.
    await page.goto(editUrl);
    await expect(page.locator("#f-name")).toHaveValue("E2E Test Chronograph");
    await page.locator("#f-price").fill("49999");
    await page.getByRole("button", { name: "Add feature" }).click();
    await page.getByLabel("Feature 3", { exact: true }).fill("Edited feature (E2E)");
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    await page.getByRole("button", { name: "Save changes" }).click();
    await toast(page, "Saved “E2E Test Chronograph”");
    await expect(page.getByText("All changes saved")).toBeVisible();
    await page.goto(slugPath);
    await expect(page.getByText("Price: ₹49,999")).toBeVisible();
    await expect(page.getByText("Edited feature (E2E)")).toBeVisible();

    // Delete (with confirmation; Cancel first).
    await page.goto(editUrl);
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("alertdialog", { name: "Delete “E2E Test Chronograph”?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await dialog.getByRole("button", { name: "Delete watch" }).click();
    await toast(page, "Deleted “E2E Test Chronograph”");
    await expect(page).toHaveURL(/\/admin\/watches$/);
    expect((await page.goto(slugPath))?.status()).toBe(404);
    await page.goto("/shop?q=E2E");
    await expect(page.getByRole("heading", { name: "No watches match these filters" })).toBeVisible();
  });

  test("settings changes are reflected on the public site; categories in use cannot be removed", async ({
    page,
    errorTracker,
    baseURL,
  }) => {
    errorTracker.allow(/422/); // removing a category in use

    const tab = (name: string) => page.getByRole("tab", { name });
    const save = async () => {
      await page.getByRole("button", { name: "Save settings" }).click();
      await toast(page, "Settings saved — the website is updated.");
      await expect(page.getByText("All changes saved")).toBeVisible();
    };

    await page.goto("/admin/settings");
    await page.locator("#f-general-siteName").fill("E2E Watch House");
    await tab("Contact & WhatsApp").click();
    await page.locator("#f-contact-whatsappNumber").fill("+91 99999 88888");
    const template = page.locator("#f-contact-whatsappTemplate");
    const originalTemplate = await template.inputValue();
    await template.fill(`${originalTemplate}\nE2E reference: {model}`);
    await expect(page.getByText("E2E reference:", { exact: false }).first()).toBeVisible(); // live preview
    await tab("Homepage").click();
    await page.locator("#f-home-heroTitle").fill("E2E hero title");
    await tab("Catalogue").click();
    const diverLabel = page.locator("[data-field^='catalog.categories.']").filter({ has: page.locator("input[value=diver]") }).getByLabel("Label");
    await diverLabel.fill("Dive watches");
    // The slug of an existing category must not follow the label (that would count as removal).
    await expect(page.locator("[data-field^='catalog.categories.'] input[value=diver]")).toHaveCount(1);
    await save();

    // Public pages.
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "E2E hero title" })).toBeVisible();
    await expect(page.locator("header").getByText("E2E Watch House")).toBeVisible();
    await expect(page.locator("footer").getByText(/© \d{4} E2E Watch House/)).toBeVisible();
    await expect(page.locator("section[aria-labelledby=categories-heading]").getByRole("link", { name: /^Dive watches/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Chat with us on WhatsApp (opens in a new tab)" }).last()).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/919999988888/,
    );
    await expect(page.locator("footer")).toContainText("+91 99999 88888");
    await page.goto(PDP);
    const href = (await page.getByRole("link", { name: /Check availability/ }).getAttribute("href"))!;
    expect(href.startsWith("https://wa.me/919999988888?text=")).toBe(true);
    expect(whatsappText(href)).toContain("E2E reference: KH-003");
    expect(whatsappText(href)).toContain(`${baseURL}${PDP}`);
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();
    await page.goto("/shop?category=diver");
    await expect(page.getByRole("heading", { level: 1, name: "Dive watches watches" })).toBeVisible();

    // Removing a category that is still used by watches → error.
    await page.goto("/admin/settings");
    await tab("Catalogue").click();
    await page.getByRole("button", { name: "Remove category 1" }).click();
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.locator("[data-field='catalog.categories'] [role=alert]")).toContainText(/Category/);
    await toast(page, /Category/);
    await page.getByRole("button", { name: "Discard changes" }).click();
    await expect(page.getByText("All changes saved")).toBeVisible();

    // Restore defaults.
    await tab("General").click();
    await page.locator("#f-general-siteName").fill(SITE.siteName);
    await tab("Contact & WhatsApp").click();
    await page.locator("#f-contact-whatsappNumber").fill(SITE.whatsappNumber);
    await page.locator("#f-contact-whatsappTemplate").fill(originalTemplate);
    await tab("Homepage").click();
    await page.locator("#f-home-heroTitle").fill("Watches chosen with care");
    await tab("Catalogue").click();
    await diverLabel.fill("Diver");
    await save();

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Watches chosen with care" })).toBeVisible();
    await expect(page.locator("header").getByText(SITE.siteName)).toBeVisible();
    await expect(page.getByRole("link", { name: "Chat with us on WhatsApp (opens in a new tab)" }).last()).toHaveAttribute(
      "href",
      new RegExp(`^https://wa\\.me/${SITE.whatsappNumber}`),
    );
  });

  test("activity log lists the actions performed", async ({ page }) => {
    await page.goto("/admin/activity");
    const log = page.locator("main ul").first();
    for (const label of [
      "Admin account created", // the very first sign-in bootstraps the account (logged instead of "Signed in")
      "Failed sign-in",
      "Changed password",
      "Changed price",
      "Unpublished watch",
      "Published watch",
      "Created watch",
      "Updated watch",
      "Deleted watch",
      "Updated settings",
    ]) {
      await expect(log.getByText(label, { exact: true }).first(), `activity should include "${label}"`).toBeVisible();
    }
    await expect(log.getByText("Price ₹24,999 → ₹23,999")).toBeVisible();
    await expect(log.locator("li").first()).toContainText("Updated settings"); // newest first
  });

  test("admin pages screenshots at 1440px and 390px (visual review)", async ({ page }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width > 800 ? 900 : 844 });
      for (const [name, url] of [
        ["dashboard", "/admin"],
        ["watches", "/admin/watches"],
        ["watch-form", "/admin/watches/new"],
        ["settings", "/admin/settings"],
        ["activity", "/admin/activity"],
        ["account", "/admin/account"],
      ]) {
        await page.goto(url);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.screenshot({ path: path.join(SHOTS, `admin-${name}-${width}.png`), fullPage: true, animations: "disabled", timeout: 30_000 });
        if (name === "dashboard" && width === 390) continue; // known BUG-2, asserted in the next test
        const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
        expect.soft(sw, `${url} overflows horizontally at ${width}px`).toBeLessThanOrEqual(iw);
      }
    }
  });

  test("dashboard has no horizontal overflow at 390px", async ({ page }) => {
    // BUG-2: the "Availability / Recently added" grid has no min-w-0/grid-cols-1, so the truncated
    // watch names in "Recently added" widen the grid track (~441px document in a 390px viewport).
    // src/app/admin/(console)/page.tsx — `<div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">`.
    test.fail();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Recently added" })).toBeVisible();
    const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    expect(sw).toBeLessThanOrEqual(iw);
  });

  test("logout ends the session; the old cookie can no longer use the API", async ({ page, baseURL, errorTracker }) => {
    errorTracker.allow(/401/); // signing in with the old (initial) password
    await page.goto("/admin/account");
    const oldState = await page.context().storageState();
    // Sanity: the session works before logging out.
    const before = await page.request.get("/api/admin/stats");
    expect(before.status()).toBe(200);

    await page.getByRole("main").getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    for (const p of ["/admin", "/admin/watches", "/admin/settings"]) {
      await page.goto(p);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }

    // Replay the pre-logout cookie: server-side session version was bumped.
    const replay = await playwrightRequest.newContext({ baseURL, storageState: oldState });
    expect((await replay.get("/api/admin/stats")).status()).toBe(401);
    expect((await replay.get("/api/auth/me")).status()).toBe(401);
    const patch = await replay.patch("/api/admin/watches/000000000000000000000000", {
      data: { price: 1 },
      headers: { Origin: baseURL! },
    });
    expect(patch.status()).toBe(401);
    await replay.dispose();

    // The initial password no longer works; the new one does.
    await signIn(page, INITIAL_PASSWORD);
    await expect(page.getByRole("alert").filter({ hasText: "Incorrect" })).toBeVisible();
    await signIn(page, NEW_PASSWORD);
    await expect(page).toHaveURL(/\/admin$/);

    // Sign-out and the regular sign-in are logged.
    await page.goto("/admin/activity");
    const entries = page.locator("main ul").first().locator(":scope > li");
    await expect(entries.nth(0)).toContainText("Signed in");
    await expect(entries.nth(1)).toContainText("Failed sign-in");
    await expect(entries.nth(2)).toContainText("Signed out");
  });
});
