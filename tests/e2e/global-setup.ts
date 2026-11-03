import { chromium, type FullConfig } from "@playwright/test";

/**
 * Warms the production server before the suite: the first request to each route and the first
 * /_next/image optimisation of every remote image are slow (several seconds each), which made
 * the first test to touch a page flaky. Also fails fast with a clear message if no server runs.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3300";
  const res = await fetch(`${baseURL}/`).catch(() => null);
  if (!res?.ok) {
    throw new Error(`No server at ${baseURL} — start it first (see tests/e2e/README.md).`);
  }

  const browser = await chromium.launch();
  try {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 412, height: 915 },
    ]) {
      const page = await browser.newPage({ viewport });
      for (const path of ["/", "/shop", "/shop?page=2", "/watches/kaizen-horology-tachymeter-pro", "/about", "/contact"]) {
        await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle", timeout: 120_000 }).catch(() => undefined);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
