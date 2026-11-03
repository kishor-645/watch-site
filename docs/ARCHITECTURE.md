# Architecture

## Overview

```
Browser ──► Vercel (Next.js 15 App Router, Node runtime)
              ├─ middleware.ts         /admin/* → redirect to /admin/login if no signed cookie (UX only)
              ├─ Public pages (RSC)    read via src/server/queries/* ──► Next data cache (tags) ──► MongoDB Atlas
              ├─ Admin pages (RSC)     requireAdminPage() → uncached admin queries ──► MongoDB Atlas
              ├─ /api/auth/*, /api/admin/*  withApi(): origin check → session check → zod → service → audit → revalidateTag
              └─ /api/admin/uploads    issues short-lived Vercel Blob client-upload tokens
Browser ──(direct PUT, ≤5 MB image)──► Vercel Blob (public URLs on *.public.blob.vercel-storage.com)
Browser ──► wa.me/<number>?text=…   (Check Availability; number from site_settings)
```

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15.5 App Router, React 19, TypeScript strict |
| Styling | Tailwind v4 (tokens in `src/app/globals.css`), shadcn/ui (radix), lucide icons, framer-motion (minimal) |
| Database | MongoDB Atlas M0 via official `mongodb` driver |
| Validation | zod v4 — shared by client forms and server |
| Auth | bcryptjs (cost 12) + HS256 JWT (`jose`) in HttpOnly cookie, server-side session version check |
| Images | Vercel Blob (client uploads) + `next/image` |
| Tests | Vitest + mongodb-memory-server (unit/integration), Playwright (e2e smoke) |

## Source layout

```
src/
  app/
    (public pages) page.tsx, shop/, watches/[slug]/, about/, contact/, not-found, error, sitemap.ts, robots.ts
    admin/                login/, (console)/ dashboard, watches, settings, account, activity
    api/                  auth/*, admin/*
  components/
    ui/                   shadcn primitives
    layout/ home/ shop/ product/ motion/   public UI
    admin/                admin UI
  lib/                    CLIENT-SAFE: schemas/, types.ts, format.ts, whatsapp.ts, site-defaults.ts, site-url.ts, utils.ts
  server/                 SERVER-ONLY (import "server-only"): env, db, log, models, mappers, cache, http,
                          auth/ (token, session, password), queries/ (public + admin reads),
                          services/ (mutations), rate-limit, audit, seed/
  middleware.ts
scripts/                  seed.ts, dev-db.ts
tests/                    vitest suites, helpers, e2e/
docs/                     this folder
```

**Rule:** nothing under `src/lib` may import from `src/server`. Client components must never import
`src/server/*` (enforced by `server-only`). Secrets are only read in `src/server/env.ts` /
`src/server/auth/token.ts`. The only `NEXT_PUBLIC_*` variable is the non-secret site URL.

## Rendering & caching

- The root layout reads settings (header/footer), so all pages render on the server per request.
  No page requires the database at **build** time.
- Data reads are wrapped in `unstable_cache` with tags `watches` / `settings` (fallback
  revalidate 10 min). Vercel persists this cache across instances, so most requests do not hit MongoDB.
- Every successful admin mutation calls `revalidateWatches()` / `revalidateSettings()` →
  changes are visible on the next request. No redeploy needed.
- `getSiteSettings()` never throws: on DB failure it returns defaults (uncached) so the shell and
  WhatsApp links still work; catalogue pages show the error boundary.

## Authentication

1. **Bootstrap:** empty `admins` + login with `INITIAL_ADMIN_USERNAME`/`INITIAL_ADMIN_PASSWORD` →
   account created (bcrypt) with `mustChangePassword`. No other way to create admins; no public registration;
   no hardcoded or bypass credentials.
2. **Login:** rate limited per IP and per account (Mongo-backed counters), uniform error message,
   constant-time comparison via bcrypt, audit logged.
3. **Session:** JWT `{sub, username, sv}` 8 h, cookie `HttpOnly; SameSite=Lax; Secure (prod); Path=/`.
   Every protected request loads the admin and requires `sv === admins.sessionVersion`.
4. **Logout / password change** increment `sessionVersion` → all existing tokens die immediately.
5. **CSRF:** same-origin check on every mutating API request (+ SameSite cookie, JSON-only bodies).
6. **Middleware is not a security boundary** (cf. CVE-2025-29927); checks are repeated in every
   page (`requireAdminPage`) and API (`withApi`).

## WhatsApp enquiries

`src/lib/whatsapp.ts` is the single implementation: `watchEnquiryUrl(settings, watch, absoluteProductUrl)`
renders `settings.contact.whatsappTemplate` and returns `https://wa.me/<digits>?text=<encoded>`.
Links open in a new tab (`target="_blank" rel="noopener noreferrer"`). Changing the number in
Admin → Settings updates every link on the next request.

## Security headers

Set in `next.config.ts`: CSP (self + Unsplash/Blob images, Blob upload connect-src, `frame-ancestors 'none'`),
HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
`/admin` and `/api` are `noindex`.

## Local development

```
npm run dev:db     # local MongoDB on 127.0.0.1:27018, auto-seeded (needs no Atlas account)
npm run dev        # with .env.local (see .env.example)
npm test           # vitest (in-memory MongoDB)
```
