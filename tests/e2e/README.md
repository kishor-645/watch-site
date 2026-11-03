# Browser end-to-end tests (Playwright)

Real user flows against a **production build** in Chromium (desktop 1440×900 and Pixel 7).

| File | Project(s) | What |
| --- | --- | --- |
| `public.spec.ts` | desktop, mobile | Home, header nav, shop filters/sort/search/pagination/empty state, product page + WhatsApp link, 404s |
| `mobile.spec.ts` | mobile | Menu sheet, shop filters sheet, no horizontal overflow on key pages |
| `visual.spec.ts` | desktop | Full-page screenshots at 390px and 1440px → `test-results/screens/`, overflow / broken-image / duplicate-id checks |
| `admin.spec.ts` | admin (serial) | First login + forced password change, dashboard, inline list edits, create/edit/delete, settings, activity, admin screenshots, logout |
| `fixtures.ts` | — | Fails any test on console errors, page errors, failed requests or same-origin HTTP ≥ 400 (allow-list per test with `errorTracker.allow(/…/)`); external image hosts are ignored |

The `admin` project depends on `desktop` and `mobile`, so it only starts after the read-only public
tests have finished (it changes prices, settings and the admin password).

## Running

```sh
# 1. Fresh database (REQUIRED before every full run — the admin suite changes the initial password)
#    stop `npm run dev:db` (and any leftover mongod.exe), then:
rm -rf .data                     # PowerShell: Remove-Item -Recurse -Force .data
npm run dev:db                   # 127.0.0.1:27018, seeds the 15 sample watches

# 2. Production build + server (NEXT_PUBLIC_SITE_URL in .env.local must equal the URL tested,
#    because WhatsApp messages contain the absolute product URL)
npm run build
npx next start -p 3300           # restart it after resetting the DB (it caches catalogue reads)

# 3. Tests
npx playwright install chromium  # once
npm run test:e2e                 # all projects
npm run test:e2e -- --project=desktop --project=mobile   # public only (re-runnable without a reset)
```

- `E2E_BASE_URL` (default `http://localhost:3300`). Use `localhost`, not `127.0.0.1`: the
  production session cookie is `Secure`, and Chromium only treats `http://localhost` as secure.
- `E2E_ADMIN_USERNAME` / `E2E_ADMIN_INITIAL_PASSWORD` default to `admin` / `InitialPass12345`
  (must match `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_PASSWORD` of the server). The suite changes
  the password to `E2e-Rotated-Passw0rd-2026`.
- The admin suite deletes the watch it creates and restores the settings, price and availability it
  changes, so the public tests still pass after it — but the admin suite itself needs a reset.
- npm swallows `--no-*` flags; to run only the admin project without its dependencies use
  `node node_modules/@playwright/test/cli.js test --project=admin --no-deps`.
- Reports: `playwright-report/` (HTML), failures keep screenshots + traces in `test-results/e2e/`.

## Determinism notes

- `globalSetup` (`global-setup.ts`) fails fast if no server is running and warms the routes and
  `/_next/image` variants (cold AVIF optimisation takes seconds per image).
- `workers: 2` — more parallel browsers overload a single local `next start`.
- Public projects use `retries: 1`: on a freshly started server roughly one client-side shop
  navigation per full run was silently dropped (BUG-3). A retried test shows up as **flaky** in the
  report; it is not hidden. The serial `admin` project never retries.

## Known app bugs

Tests for known bugs are kept and marked `test.fail()` with a `BUG-n` comment — when the bug is
fixed the test starts "unexpectedly passing"; remove the `test.fail()` then.

- BUG-1 (`visual.spec.ts` › element ids are unique): duplicate `#header-search` id (mobile menu sheet).
- BUG-2 (`admin.spec.ts` › dashboard has no horizontal overflow at 390px).
- BUG-3 (not `test.fail` — intermittent): dropped client-side navigations right after server start.
