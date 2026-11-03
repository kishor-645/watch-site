import { expect, expectNoHorizontalOverflow, scrollThrough, test } from "./fixtures";

/* Mobile-only flows (Pixel 7 project). Read-only. */

test.describe("mobile", () => {
  test("menu sheet opens, navigates, searches and closes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();

    const openMenu = page.getByRole("button", { name: "Open menu" });
    await openMenu.click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    const mobileNav = sheet.getByRole("navigation", { name: "Mobile" });
    await expect(mobileNav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await expect(sheet.getByRole("link", { name: "Chat on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/919016456462/);

    // Close button.
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toBeHidden();

    // Escape closes too.
    await openMenu.click();
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();

    // Navigating closes the sheet.
    await openMenu.click();
    await mobileNav.getByRole("link", { name: "Shop" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Shop watches" })).toBeVisible();

    // Search from the sheet.
    await openMenu.click();
    await sheet.getByRole("searchbox").fill("aurelius");
    await sheet.getByRole("searchbox").press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=aurelius$/);
    await expect(sheet).toBeHidden();
    await expect(page.locator("main article")).toHaveCount(3);
  });

  test("filters sheet on the shop", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("complementary", { name: "Filters" })).toBeHidden();

    const trigger = page.getByRole("button", { name: /^Filters/ });
    await trigger.click();
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Clear all" })).toBeDisabled();

    await sheet.getByRole("checkbox", { name: /^Diver/ }).click();
    await expect(page).toHaveURL(/\/shop\?category=diver$/);
    // The sheet stays open while results update.
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Show 3 watches" })).toBeVisible();
    await sheet.getByRole("button", { name: "Show 3 watches" }).click();
    await expect(sheet).toBeHidden();
    await expect(page.locator("main article")).toHaveCount(3);
    await expect(trigger).toContainText("1 active");

    // Clear all from inside the sheet.
    await trigger.click();
    await sheet.getByRole("button", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(sheet.getByRole("button", { name: "Show 15 watches" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });

  for (const path of ["/", "/shop", "/shop?category=chronograph", "/watches/lindqvist-fils-atelier-squelette-manuel", "/about", "/contact", "/admin/login"]) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      await scrollThrough(page);
      await expectNoHorizontalOverflow(page);
    });
  }
});
