import { defineConfig, devices } from "@playwright/test";

/**
 * Browser end-to-end tests (see tests/e2e/README.md).
 *
 * The suite runs against an already running PRODUCTION build — it does not start a server:
 *   npm run dev:db                  # local MongoDB on 127.0.0.1:27018 (fresh .data = 15 sample watches)
 *   npm run build && npx next start -p 3300
 *   npm run test:e2e
 *
 * Set E2E_BASE_URL to point elsewhere (keep NEXT_PUBLIC_SITE_URL at build time equal to it, because
 * the WhatsApp enquiry text contains the absolute product URL). Use `localhost`, not 127.0.0.1:
 * the production session cookie is `Secure`, and Chromium only treats http://localhost as secure.
 *
 * Projects:
 *   desktop / mobile  — read-only public flows, run in parallel.
 *   admin             — serial admin flows that MUTATE the database (password change, prices,
 *                       settings…). Runs after the public projects so it can't disturb them and
 *                       needs a freshly reset database (initial admin password).
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3300";

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  outputDir: "test-results/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Public projects retry once: on a freshly started server ~1 client-side navigation per full run
  // was observed to be silently dropped (BUG-3 in the QA report). Retried tests are reported as
  // "flaky" — they are not hidden. The serial admin project never retries.
  retries: 1,
  // More workers overload a single local `next start` (AVIF image optimisation is CPU-heavy),
  // which made client-side navigations flaky (see BUG-3 in the QA report).
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "desktop",
      testMatch: /(public|visual)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      testMatch: /(public|mobile)\.spec\.ts/,
      // Pixel 7 = Chromium, 412×915, touch, isMobile.
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "admin",
      testMatch: /admin\.spec\.ts/,
      dependencies: ["desktop", "mobile"],
      retries: 0,
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
