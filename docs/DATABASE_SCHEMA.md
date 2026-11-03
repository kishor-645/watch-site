# Database Schema — MongoDB Atlas (database `mywatch`)

Driver: official `mongodb` v7 (no ODM). Validation is enforced in the application layer with zod
(`src/lib/schemas/*`) before every write; documents are typed in `src/server/models.ts`.
Connection: one cached `MongoClient` per serverless instance (`src/server/db.ts`), `maxPoolSize: 10`.
Indexes are created idempotently on first connection (`ensureIndexes`).

## `watches`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `slug` | string | unique, URL `/watches/<slug>` |
| `name`, `brand` | string | |
| `brandSlug` | string | `slugify(brand)` — shop brand filter |
| `modelNumber` | string | may be `""` |
| `category` | string | slug from `site_settings.catalog.categories` |
| `movement` | string | slug from `site_settings.catalog.movements` |
| `gender` | `"men" \| "women" \| "unisex"` | |
| `price` | int | whole currency units (INR) |
| `originalPrice` | int \| null | must be > price when set |
| `availability` | `"in_stock" \| "limited" \| "pre_order" \| "sold_out"` | |
| `published` | bool | public site shows only `true` |
| `featured` | bool | home page + "Featured" sort |
| `shortDescription`, `description` | string | description: paragraphs split by blank line |
| `features` | string[] (≤12) | |
| `specs` | object | `caseMaterial, caseSize, strapMaterial, dialColour, movementDetail, waterResistance, crystal, thickness, lugWidth, powerReserve, warranty` (strings, may be `""`) |
| `extraSpecs` | `{label, value}[]` (≤20) | admin-defined extra fields |
| `images` | `{url, alt, pathname?}[]` (1–10) | first = primary; `pathname` set for Vercel Blob uploads |
| `createdAt`, `updatedAt` | Date | |
| `createdBy`, `updatedBy` | string \| null | admin username |

Indexes: `slug_unique {slug:1} unique` · `published_featured_recent {published:1, featured:-1, createdAt:-1}` ·
`published_category_price {published:1, category:1, price:1}` · `published_brand {published:1, brandSlug:1}` · `recent {createdAt:-1}`

Search uses an escaped, case-insensitive regex over name/brand/modelNumber/category/shortDescription.
This supports partial words ("aur" → "Aurora") and is fast for catalogues of a few thousand items.
If the catalogue grows much larger, switch to an Atlas Search index.

## `admins`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `username` | string | unique, lowercase |
| `passwordHash` | string | bcrypt, cost 12 |
| `mustChangePassword` | bool | true after bootstrap |
| `sessionVersion` | int | bumped on logout/password change → revokes all tokens |
| `failedLoginCount` | int | reset on success |
| `lockedUntil` | Date \| null | set after 10 consecutive failures (15 min) |
| `lastLoginAt`, `lastLoginIp` | Date \| null, string \| null | |
| `passwordChangedAt` | Date \| null | |
| `createdAt`, `updatedAt` | Date | |

Indexes: `username_unique {username:1} unique` (also prevents duplicate bootstrap under races).

## `site_settings`

Single document `_id: "global"` matching `siteSettingsSchema` (+ `updatedAt`, `updatedBy`).
Sections: `general` (siteName, tagline, logoUrl, currencyCode, locale), `contact` (whatsappNumber
— digits only, whatsappTemplate, generalEnquiryMessage, phone, email, address, mapUrl,
businessHours), `social`, `seo`, `home`, `about`, `footer`, `catalog` (categories, movements).
Read path deep-merges the stored doc over `DEFAULT_SETTINGS`, so new fields get defaults.
If the document does not exist, defaults are used.

## `audit_logs`

| Field | Type |
|---|---|
| `_id` | ObjectId |
| `at` | Date |
| `action` | `AuditAction` (see `src/lib/types.ts`) |
| `actor` | `{ id, username }` (nulls for failed logins of unknown users) |
| `entity` | `{ type: "watch"\|"settings"\|"admin"\|"upload"\|null, id, label }` |
| `changes` | `{ [field]: { from, to } }` \| null — never contains passwords/hashes |
| `ip`, `userAgent` | string \| null |

Indexes: `at_ttl {at:1}` TTL 180 days (keeps the 512 MB free tier in check) · `action_recent {action:1, at:-1}`

## `rate_limits`

`{ _id: "<scope>:<key>", count: int, expiresAt: Date }` — fixed-window counters updated with an
atomic `findOneAndUpdate` upsert. Index `expires_ttl {expiresAt:1}` with `expireAfterSeconds: 0`.
Needed because serverless instances do not share memory.

## Storage budget (Atlas M0 = 512 MB)

A watch document is ~3–6 KB → 10,000 watches ≈ 60 MB. Images are **not** stored in MongoDB
(Vercel Blob). Audit logs are capped by TTL.
