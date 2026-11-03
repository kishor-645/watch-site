# Project Plan — MyWatch production upgrade

Branch: `feat/production`. Owner/orchestrator: CTO (main session).

## Goals
1. Production-grade public watch storefront (catalogue, search/filters, PDP, WhatsApp enquiries).
2. Admin console on the same site: watches CRUD, pricing, availability, images, all site settings, password change, audit log.
3. MongoDB Atlas persistence; Vercel Blob images; Vercel free-tier deployment.

## Approved decisions (2026-11-03)
- Remove cart, "Buy now", journal, fake newsletter, fake contact form, fabricated ratings/reviews and unverifiable marketing claims.
- Purchase flow = **Check Availability → WhatsApp** (number from settings, default +91 9016456462).
- Images: Vercel Blob (client uploads, ≤5 MB, jpeg/png/webp/avif).
- Single admin, username `admin`, bootstrapped from env, forced password change on first login.
- Seed the 15 existing watches as editable sample products (admin "Import sample catalogue" button when empty, or `npm run db:seed`).
- Password hashing: bcryptjs cost 12 (pure JS — avoids native-binary risk on Vercel).

## Phases & checklist

### Phase 1 — Discovery ✅
- [x] Repository analysis, stack review, risk list, user approval

### Phase 2 — Architecture & foundation (CTO) ✅
- [x] Branch, dependency install, audit (0 prod vulnerabilities via overrides)
- [x] Shared zod schemas & types (`src/lib/schemas`, `src/lib/types.ts`)
- [x] DB connection, models, indexes, public + admin read queries
- [x] Session token/cookie, `requireAdminPage`, `withApi` wrapper, middleware
- [x] WhatsApp helper, price formatting, default settings, site URL helper
- [x] Seed module + `db:seed` / `dev:db` scripts, vitest + in-memory MongoDB
- [x] Route groups: `(site)` for public pages, `admin/` separate
- [x] Docs: ARCHITECTURE, API_DOCUMENTATION, DATABASE_SCHEMA

### Phase 3 — Parallel build
| Agent | Scope (owns) | Depends on |
|---|---|---|
| Backend & Database | `src/server/{auth/password,services,rate-limit,audit,blob}.ts`, `src/app/api/**`, `tests/api/**` | foundation |
| Public Frontend (UI/UX) | `src/app/(site)/**`, `src/app/{not-found,error,global-error,sitemap,robots}*`, `src/components/{layout,home,shop,product,motion,site}/**`, `globals.css` | foundation |
| Admin Frontend (UI/UX) | `src/app/admin/**`, `src/components/admin/**` | foundation + API contract |

### Phase 4 — Integration (CTO)
- [ ] Merge worktrees, resolve conflicts, full typecheck/lint/build
- [ ] End-to-end run against local MongoDB (dev:db)

### Phase 5 — Verification
- [ ] Security review (independent agent)
- [ ] QA: automated tests + e2e smoke (independent agent)
- [ ] Code review (independent agent)
- [ ] Fix findings, re-verify

### Phase 6 — Deployment
- [ ] `DEPLOYMENT_GUIDE.md` (GitHub → Vercel, env vars, Atlas network access, Blob, domain, verification)
- [ ] User deploys / post-deploy checks

## Reporting format (every agent)
Assigned task · Files modified · Implementation completed · Tests performed · Outstanding issues · Dependencies/blockers
