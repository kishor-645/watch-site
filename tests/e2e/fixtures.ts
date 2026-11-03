import { test as base, expect, type Page } from "@playwright/test";

/**
 * Shared fixtures.
 *
 * Every test automatically fails when the page logs a console error, throws an uncaught exception,
 * a request fails, or a same-origin response is >= 400 — unless it matches `allowedErrors`
 * (use `test.use({ allowedErrors: [/.../] })` for flows that expect e.g. a 404 or 401).
 * External image hosts are ignored so the suite still passes offline.
 */
type Fixtures = {
  allowedErrors: RegExp[];
  /** `errorTracker.allow(/422/)` allow-lists an expected error for the rest of the test. */
  errorTracker: { errors: string[]; allow: (re: RegExp) => void };
};

const EXTERNAL_IMAGE_HOSTS = /images\.unsplash\.com|public\.blob\.vercel-storage\.com/;

export const test = base.extend<Fixtures>({
  allowedErrors: [[], { option: true }],
  errorTracker: [
    async ({ page, allowedErrors, baseURL }, use, testInfo) => {
      const errors: string[] = [];
      const allowed = [...allowedErrors];
      const origin = new URL(baseURL ?? "http://localhost:3300").origin;
      const record = (msg: string) => {
        if (allowed.some((re) => re.test(msg))) return;
        if (EXTERNAL_IMAGE_HOSTS.test(msg)) return;
        errors.push(msg);
      };

      page.on("console", (msg) => {
        if (msg.type() === "error") record(`console.error: ${msg.text()} @ ${msg.location().url}`);
      });
      page.on("pageerror", (err) => record(`pageerror: ${err.message}`));
      page.on("requestfailed", (req) => {
        const failure = req.failure()?.errorText ?? "";
        // Aborted requests are normal (cancelled RSC prefetches, navigations, image swaps).
        if (failure.includes("ERR_ABORTED")) return;
        // wa.me is never actually loaded by tests, but guard anyway.
        if (req.url().startsWith("https://wa.me/")) return;
        record(`requestfailed: ${req.method()} ${req.url()} ${failure}`);
      });
      page.on("response", (res) => {
        if (res.status() < 400 || !res.url().startsWith(origin)) return;
        record(`http ${res.status()}: ${res.request().method()} ${res.url()}`);
      });

      await use({ errors, allow: (re) => void allowed.push(re) });

      if (errors.length) {
        await testInfo.attach("browser-errors", { body: errors.join("\n"), contentType: "text/plain" });
      }
      expect(errors, "console errors / failed requests during the test").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** True when the document is not wider than the viewport (no horizontal scrolling). */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, `document is ${scrollWidth}px wide in a ${innerWidth}px viewport`).toBeLessThanOrEqual(innerWidth);
}

/** Decoded `text` query parameter of a wa.me link. */
export function whatsappText(href: string): string {
  return new URL(href).searchParams.get("text") ?? "";
}

/** Scrolls the full page so lazy images and whileInView reveals render (for screenshots). */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
}

export const SITE = {
  whatsappNumber: "919016456462",
  siteName: "MyWatch",
} as const;
