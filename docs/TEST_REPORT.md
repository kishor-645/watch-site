# Test Report

_Branch `feat/production` · 2026-11-03 · local Windows machine, portable Node 22.23.4, MongoDB 7.0 (local)_

All results below were produced by actually running the suites; nothing is estimated.

## 1. Static checks

| Check | Command | Result |
|---|---|---|
| TypeScript (strict) | `npm run typecheck` | 0 errors |
| ESLint | `npm run lint` | 0 errors, 0 warnings |
| Dependency audit (production) | `npm audit --omit=dev` | 0 vulnerabilities |
| Production build | `npm run build` (no DB env vars) | succeeds; all pages dynamic, build does not need MongoDB |

## 2. Unit & integration tests — Vitest + in-memory MongoDB

`npm test` → **74 passed / 74** (7 files)

| Suite | Covers |
|---|---|
| `tests/foundation.test.ts` | WhatsApp link building/encoding & template rendering, schema validation, catalogue queries (filters, search incl. regex-injection safety, pagination, featured-only), unpublished watches hidden, per-section settings fallback, dashboard stats, time-zone date formatting |
| `tests/api/auth.test.ts` | bootstrap rules, password-change gate, password change (wrong current / weak / mismatch), session revocation on logout & password change, uniform 401s, atomic per-IP and per-username limits under concurrent bursts, no account-lock DoS, IPv6 /64 bucketing, CSRF 403 |
| `tests/api/auth-bootstrap-*.test.ts` | bootstrap impossible without, or with a < 12 char, `INITIAL_ADMIN_PASSWORD` |
| `tests/api/admin.test.ts` | watch create/replace/patch/delete, slug generation & conflicts, old-slug redirects, category/movement validation, image-host and Blob-store pinning, audit entries (price changes, no empty updates), cache revalidation, settings update & in-use category protection, sample-catalogue seeding, upload token rules, reference-checked Blob deletion |
| `tests/security.test.ts` | IP bucketing (IPv4, IPv6 /64), client-IP header order, byte-accurate body limit, `__Host-` cookie name, Mongo-URI scrubbing in logs, Blob store host pinning, shop time-zone date formatting |
| `src/components/admin/admin-forms.test.ts` | admin form state ↔ schema round-trips for all 15 sample watches, server error-path mapping |

## 3. Browser end-to-end — Playwright (Chromium)

Production build (`next start`) against a freshly reset local MongoDB. `npm run test:e2e`.

**Result: 48 passed, 0 failed, 0 flaky, 3 skipped (desktop-only checks in the mobile project).**

| Project | Flows |
|---|---|
| desktop (1440×900) | home, header navigation, shop filters/sort/search/pagination/empty state, product page gallery/price/specs/related, **Check Availability → `wa.me/919016456462?text=…`** with name/brand/model/price/URL, 404s, visual screenshots + overflow/broken-image/duplicate-id checks |
| mobile (Pixel 7) | menu sheet, filter sheet, swipe gallery, no horizontal overflow on key pages |
| admin (serial) | `/admin` redirect, wrong password, first login → forced password change (validation errors), dashboard counts, inline price/availability/publish edits reflected publicly (unpublished → 404), create/validate/edit/delete a watch, upload shows "storage not configured" without a Blob token, settings (name, WhatsApp number & template, homepage text, category label) reflected publicly, in-use category removal blocked, activity log, logout revokes the session |

Every e2e test fails on any browser console error, uncaught page error, failed request or same-origin HTTP ≥ 400.

## 4. Manual HTTP integration check (production build)

Login wrong → 401 · initial login → `mustChangePassword` · admin APIs 403 until password changed · old token
revoked after change · price PATCH visible on the public page on the next request · cross-site PATCH → 403 ·
WhatsApp number/site name change reflected everywhere · unpublish → 404 · logout → 401 · CSP, HSTS,
`X-Frame-Options: DENY` present · `/admin` `noindex` · robots disallows `/admin` and `/api`.

## 5. Bugs found during testing and fixed

| Bug | Found by | Fix |
|---|---|---|
| Login limits bypassable with parallel requests | Security review | counters incremented atomically before bcrypt |
| Anyone could lock the single admin out | Security review | removed account-wide lockout; per username+IP limits |
| Preview deployments would share production secrets | Security review | deployment guide: separate secret, DB user, URI |
| Blob images from any Vercel store accepted; shared images could be deleted | Security + code review | store host pinned from token; reference-checked deletion |
| "Featured" toggle did not control the home page | Code review | featured-only query with newest fallback |
| One invalid settings field reset the whole site (incl. WhatsApp number) | Code review | per-section fallback + admin warning banner |
| Admin times shown in UTC; hydration mismatch on dates | Code review + e2e | fixed `Asia/Kolkata` zone, dates built from numeric parts |
| Shop navigations occasionally dropped on a cold server | QA e2e | removed `/shop` loading boundary that triggered a Next 15 prefetch bug |
| Admin dashboard overflowed on 390 px phones | QA e2e | `min-w-0` grid columns |
| Duplicate `id="header-search"` (accessibility) | QA e2e | unique ids |
| Changed slugs broke shared links | Code review | `previousSlugs` + permanent redirect |
| CSP blocked Vercel Blob uploads | Admin agent | `connect-src https://vercel.com/api/blob/` |
| Middleware redirect loop with revoked-but-signed cookies | CTO review | middleware never redirects away from login |

## 6. Not tested (needs your accounts)

- **MongoDB Atlas** connectivity — tested against a local MongoDB 7.0; Atlas is the same protocol but needs your
  connection string (set only in Vercel).
- **Real image uploads to Vercel Blob** — needs `BLOB_READ_WRITE_TOKEN` from a connected Blob store; the
  "not configured" path and all server-side rules are tested.
- **Actual WhatsApp app opening** — the generated `wa.me` link and message are verified; opening WhatsApp
  itself is outside the browser test.
- **Vercel deployment** — not performed; see `docs/DEPLOYMENT_GUIDE.md`.
