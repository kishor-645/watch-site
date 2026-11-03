# API Documentation

All endpoints are Next.js Route Handlers under `src/app/api/**`, wrapped with `withApi()` from
`src/server/http.ts`. Public pages do **not** call these APIs — server components read MongoDB
directly through `src/server/queries/*`.

## Conventions

| Item | Rule |
|---|---|
| Body | `application/json` only (415 otherwise), max 256 KB (413). |
| Success | `{ "ok": true, "data": <T> }` |
| Failure | `{ "ok": false, "error": { "code": ApiErrorCode, "message": string, "fields"?: { "<path>": "<msg>" } } }` |
| Field paths | Dot-joined zod paths: `name`, `specs.caseSize`, `images.0.url`, `catalog.categories.2.slug` |
| Auth | HttpOnly cookie `mw_admin_session` (HS256 JWT, 8 h). Sent automatically by the browser — use `fetch(url, { credentials: "same-origin" })`. |
| CSRF | Every non-GET request must be same-origin (`Origin` / `Sec-Fetch-Site`). Cross-site → 403 `FORBIDDEN`. |
| Caching | All API responses are `Cache-Control: no-store`. |
| Password gate | While `mustChangePassword` is true, every admin endpoint except those marked † returns 403 `PASSWORD_CHANGE_REQUIRED`. |

### Error codes

| HTTP | code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed JSON / bad id |
| 401 | `UNAUTHORIZED` | No/invalid/revoked session; wrong credentials on login |
| 403 | `FORBIDDEN` | Cross-site request |
| 403 | `PASSWORD_CHANGE_REQUIRED` | Initial password not changed yet |
| 404 | `NOT_FOUND` | Watch id does not exist |
| 409 | `CONFLICT` | Slug already used; catalog not empty when seeding |
| 413 | `PAYLOAD_TOO_LARGE` | Body > 256 KB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Not JSON |
| 422 | `VALIDATION_ERROR` | zod validation failed — see `fields` |
| 429 | `RATE_LIMITED` | Too many attempts — `Retry-After` header (seconds) |
| 503 | `SERVICE_UNAVAILABLE` | Database / blob storage unreachable or not configured |
| 500 | `INTERNAL_ERROR` | Unexpected; details only in server logs |

Types referenced below live in `src/lib/types.ts` and `src/lib/schemas/*`.

---

## Auth

### `POST /api/auth/login` — public, rate-limited
Body `LoginInput`: `{ "username": string, "password": string }`

- First-run bootstrap: if the `admins` collection is **empty** and the credentials equal
  `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_PASSWORD` (constant-time compare), the admin is
  created with a bcrypt hash and `mustChangePassword: true`.
- Failed attempts → identical 401 `"Incorrect username or password"` whether the user exists or not.
- Limits (counted atomically **before** the password check, so parallel bursts cannot exceed them):
  10 attempts / 15 min per client IP (IPv6 bucketed by /64) and 5 attempts / 15 min per
  username + IP. Both counters reset on success. Exceeding either → 429 with `Retry-After` and the
  same message for existing and unknown usernames. There is **no account-wide lockout** (it would
  let anyone lock the owner out). Client IP comes from Vercel's `x-vercel-forwarded-for` / `x-real-ip`.
- Bootstrap is refused (generic 401) if `INITIAL_ADMIN_PASSWORD` is shorter than 12 characters.
- Success → sets cookie, `200 { data: { username, mustChangePassword } }`.

### `POST /api/auth/logout` — admin †
Increments `sessionVersion` (revokes all sessions of this admin) and clears the cookie.
`200 { data: { loggedOut: true } }`. Also succeeds (200) when already logged out.

### `GET /api/auth/me` — admin †
`200 { data: AdminProfile }`

### `POST /api/admin/account/password` — admin †, rate-limited (5 / 15 min per admin)
Body `ChangePasswordInput`: `{ currentPassword, newPassword, confirmPassword }`
- Wrong current password → 422 with `fields.currentPassword`.
- On success: new hash, `mustChangePassword=false`, `passwordChangedAt=now`, `sessionVersion+1`
  (signs out other devices) and a **fresh cookie is issued** for the current browser.
- `200 { data: { changed: true } }`

---

## Watches (admin)

### `GET /api/admin/watches`
Query `AdminWatchQuery`: `q`, `status=all|published|draft`, `availability=all|in_stock|limited|pre_order|sold_out`, `page`, `pageSize (≤100, default 20)`
→ `200 { data: Paginated<Watch> }` (sorted by `updatedAt` desc).

### `POST /api/admin/watches`
Body `WatchInput` (see `watchInputSchema`). Server additionally checks:
- `category` ∈ `settings.catalog.categories[].slug`, `movement` ∈ `settings.catalog.movements[].slug` → else 422 on that field.
- `slug` empty → generated from `slugify(brand + " " + name)`; if taken, suffixed `-2`, `-3`…
  An explicitly provided slug that is taken → 409 `CONFLICT` with `fields.slug`.
→ `201 { data: Watch }`. Audit `watch.create`. Revalidates `watches` tag.

### `GET /api/admin/watches/:id`
→ `200 { data: Watch }` | 404.

### `PUT /api/admin/watches/:id`
Full replace with `WatchInput` (same rules as POST). Slug change allowed (unique check).
Images removed from the list that have a `pathname` are deleted from Vercel Blob (best effort, after the DB write).
→ `200 { data: Watch }`. Audit `watch.update` with `changes` for: price, originalPrice, availability, published, featured, name, slug. Price changes are additionally logged as `watch.price_change`.

### `PATCH /api/admin/watches/:id`
Quick edit, `WatchPatch`: any of `{ price, originalPrice, availability, published, featured }` (≥1).
`originalPrice` rule is checked against the merged document.
→ `200 { data: Watch }`. Audit `watch.price_change` / `watch.publish` / `watch.unpublish` / `watch.update`.

### `DELETE /api/admin/watches/:id`
Hard delete + best-effort Blob deletion of uploaded images.
→ `200 { data: { deleted: true } }`. Audit `watch.delete` (label = watch name).

### `POST /api/admin/catalog/seed`
Inserts the 15 sample watches **only if the catalog is empty**, else 409.
→ `201 { data: { inserted: number } }`. Audit `catalog.seed`.

### `GET /api/admin/stats`
→ `200 { data: DashboardStats }`

---

## Uploads (admin)

### `POST /api/admin/uploads`
Vercel Blob **client-upload token exchange** (`handleUpload` from `@vercel/blob/client`).
The admin UI calls `upload(pathname, file, { access: "public", handleUploadUrl: "/api/admin/uploads" })`.

Server rules in `onBeforeGenerateToken`:
- Admin session required (same cookie check as other admin routes; same-origin enforced).
- `pathname` must start with `watches/` or `site/`.
- `allowedContentTypes`: `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
- `maximumSizeInBytes`: 5 MB. `addRandomSuffix: true`. Token valid 10 minutes.
- Rate limit: 60 tokens / 10 min per admin.
- Without `BLOB_READ_WRITE_TOKEN` → 503 `SERVICE_UNAVAILABLE` "Image storage is not configured".

The UI stores the returned `{ url, pathname }` in the watch's `images[]` and saves via PUT/POST.
`onUploadCompleted` is not relied upon (it cannot reach localhost); validation of the final URL
happens when the watch/settings are saved (`isAllowedImageUrl`).

### `DELETE /api/admin/uploads`
Body `{ "url": string }` — deletes an uploaded blob that was never saved (e.g. user removed it
from the form before saving). Only URLs on the project's Blob host are accepted.
→ `200 { data: { deleted: true } }`.

---

## Settings (admin)

### `GET /api/admin/settings`
→ `200 { data: PublicSettings }` (stored values merged over defaults).

### `PUT /api/admin/settings`
Body `SiteSettingsInput` (full object; see `siteSettingsSchema`). Server also rejects removing a
category/movement that is still used by any watch → 422 `fields["catalog.categories"]` with the
count. Upserts `_id: "global"`.
→ `200 { data: PublicSettings }`. Audit `settings.update` with changed top-level sections
(and `contact.whatsappNumber` from/to when it changes). Revalidates `settings` **and** `watches` tags.

---

## Audit log (admin)

### `GET /api/admin/audit`
Query `AuditQuery`: `action` (optional exact action), `page`, `pageSize (≤100, default 30)`
→ `200 { data: Paginated<AuditLogEntry> }` newest first.

---

## Public (no auth)

No public JSON API is required: public pages are server-rendered. `GET /sitemap.xml` and
`GET /robots.txt` are generated by `src/app/sitemap.ts` / `src/app/robots.ts`.
