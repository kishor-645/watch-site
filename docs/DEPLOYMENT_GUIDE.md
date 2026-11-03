# Deployment Guide — Vercel (Hobby / free) + MongoDB Atlas (M0 / free) + Vercel Blob

Time needed: ~20 minutes. Everything below uses free tiers.

---

## 0. Before you start

- [ ] Code is on GitHub (`github.com/kishor-645/watch-site`), branch `main` contains the production code.
- [ ] You have a MongoDB Atlas account with your free cluster.
- [ ] **Security:** if a database password was ever pasted into a chat, email or file, change it first
      (Atlas → *Database Access* → user → *Edit* → *Edit Password*). Use the new one below.

---

## 1. MongoDB Atlas

### 1.1 Database user (least privilege)
Atlas → **Security → Database Access → Add New Database User**
- Authentication: Password → *Autogenerate Secure Password* → copy it somewhere safe.
- Database User Privileges → **Specific Privileges** → `readWrite` on database `mywatch`.
  (Avoid "Atlas admin" — the app only needs its own database.)

### 1.2 Network access
Vercel's free plan has no fixed outbound IP addresses, so Atlas must accept connections from anywhere:
Atlas → **Security → Network Access → Add IP Address → Allow Access from Anywhere** (`0.0.0.0/0`).
This is the standard setup for Vercel + Atlas; access is still protected by TLS and the database
user's strong password. Keep that password secret and rotate it if it leaks.

### 1.3 Connection string
Atlas → **Database → Connect → Drivers** → copy the `mongodb+srv://…` string and insert the user's password:
```
mongodb+srv://<user>:<password>@watch-cluster.s0ssgvo.mongodb.net/?retryWrites=true&w=majority&appName=mywatch
```
If the password contains special characters (`@ : / ? # [ ]`), URL-encode them.

You do **not** need to create collections or indexes — the app creates indexes on first connection.

---

## 2. Generate secrets (on your PC)

Open **PowerShell** and run this twice — once for `SESSION_SECRET`, once for `INITIAL_ADMIN_PASSWORD`:
```powershell
$b = New-Object byte[] 36; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```
(For the admin password you can also choose your own: at least 12 characters with letters and numbers.
You will be forced to change it at first login anyway.)

---

## 3. Vercel project

1. Go to **https://vercel.com/new** → *Import Git Repository* → select `watch-site`.
2. Framework preset: **Next.js** (auto-detected). Leave Build Command (`next build`), Output and
   Install Command at their defaults. Root directory: `/`.
3. **Environment Variables** — add these *before* the first deploy (mark secrets as **Sensitive**):

| Name | Value | Environments |
|---|---|---|
| `MONGODB_URI` | the Atlas connection string from 1.3 | Production only (Preview gets its own — §7) |
| `MONGODB_DB` | `mywatch` | Production |
| `SESSION_SECRET` | random string from step 2 (≥ 32 chars) | Production only (Preview gets a different one) |
| `INITIAL_ADMIN_USERNAME` | `admin` | Production |
| `INITIAL_ADMIN_PASSWORD` | initial password from step 2 — **at least 12 characters** (shorter values are refused) | Production |
| `NEXT_PUBLIC_SITE_URL` | your final URL, e.g. `https://watch-site.vercel.app` (no trailing slash) | Production |

4. Click **Deploy**. The build does not need the database, so it succeeds even before Atlas is ready.
5. Project → **Settings → General → Node.js Version** → **22.x**.

### 3.1 Image storage (Vercel Blob)
Project → **Storage → Create Database → Blob** → name it `watch-images` → **Connect to project**
(all environments). This adds `BLOB_READ_WRITE_TOKEN` automatically.
Then **Deployments → ⋯ → Redeploy** so the new variable is picked up.

> Without Blob, everything works except uploading images (you can still use image URLs from allowed hosts).

---

## 4. First login & setup

1. Open `https://<your-domain>/admin/login`.
2. Sign in with `admin` and the `INITIAL_ADMIN_PASSWORD`. The account is created at this moment
   (password stored only as a bcrypt hash).
3. You are taken to **Account** and must set a new password (≥ 12 characters, letters + numbers).
4. **Dashboard → Import 15 sample watches** (only shown while the catalogue is empty) — or add your own.
5. **Settings** → set site name, logo, WhatsApp number (default `+91 9016456462`), phone, email,
   address, social links, homepage texts → **Save**. Changes appear on the public site immediately.
6. **Do steps 1–3 right after the first deployment.** Until the admin account exists, anyone who knows
   the initial password could create it.
7. **Remove `INITIAL_ADMIN_PASSWORD`** from Vercel → Settings → Environment Variables, then **Redeploy**
   (a running deployment keeps the values it was deployed with). It is ignored once an admin exists anyway.

The username comes from `INITIAL_ADMIN_USERNAME` (default `admin`); a less obvious name is slightly safer.
Sign-in attempts are rate-limited per IP using Vercel's client-IP headers — the app is designed to run on Vercel.

**Forgot your password?** With database access, delete the document in the `admins` collection
(Atlas → Browse Collections → `mywatch.admins`), set a fresh `INITIAL_ADMIN_PASSWORD` in Vercel,
redeploy, and log in again (bootstrap runs because the collection is empty).

---

## 5. Custom domain (optional)

Project → **Settings → Domains → Add** → `www.yourdomain.com` → follow the DNS instructions
(CNAME `cname.vercel-dns.com` for `www`, A record `76.76.21.21` for the apex; Vercel shows the exact
values). HTTPS certificates are automatic. Then update `NEXT_PUBLIC_SITE_URL` to the new domain and redeploy
(used in WhatsApp product links, canonical URLs and the sitemap).

---

## 6. Post-deployment verification

| Check | Expected |
|---|---|
| `/` | Home page renders with settings content and featured watches |
| `/shop`, `/shop?category=diver`, `/shop?q=aurora` | Filtering, search and pagination work |
| A product page → **Check Availability** | Opens WhatsApp (`wa.me/<your number>`) with watch name, brand, model, price and the product URL |
| `/admin` while logged out | Redirects to `/admin/login` |
| Wrong password 6× for one username | "Too many sign-in attempts" message |
| Admin: change a price | New price on the public product page on refresh |
| Admin: unpublish a watch | Disappears from shop; its URL returns 404 |
| Admin: upload an image | Appears in the form and on the site after saving |
| Admin: change WhatsApp number | All Check Availability links use the new number |
| Admin → Activity | Shows logins, price changes and settings updates |
| `/sitemap.xml`, `/robots.txt` | Present; robots disallows `/admin` and `/api` |
| Response headers | `content-security-policy`, `strict-transport-security`, `x-frame-options: DENY` |

Logs: Vercel → Project → **Logs** (JSON lines; secrets are redacted).

---

## 7. Environments (recommended)

- **Production** uses database `mywatch`.
- **Preview** deployments run unreviewed branch code, so they must never hold production secrets:
  - create a second Atlas user with `readWrite` on **`mywatch_preview` only**; set its connection string as
    `MONGODB_URI` and `MONGODB_DB=mywatch_preview` for the *Preview* environment (same cluster is fine);
  - set a **different** `SESSION_SECRET` and `INITIAL_ADMIN_PASSWORD` for Preview;
  - keep Vercel **Deployment Protection** enabled for previews (Settings → Deployment Protection).
- **Local**: `npm run dev:db` + `npm run dev` with `.env.local` (see `.env.example`) — no Atlas needed.

---

## 8. Free-tier limits to keep in mind

- **Atlas M0**: 512 MB storage, shared CPU, limited connections. The app keeps one small pool per
  instance and stores images outside MongoDB; audit logs expire after 180 days.
- **Vercel Hobby**: limits on function invocations, bandwidth, image optimisation and Blob storage/transfer,
  and Hobby is intended for non-commercial use. Check current limits at https://vercel.com/docs/limits and
  https://vercel.com/pricing — move to Pro if the shop becomes a commercial business with real traffic.

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| Pages show "temporarily unavailable" / logs `mongodb.connect_failed` | Check `MONGODB_URI`, the user's password, and Atlas Network Access `0.0.0.0/0` |
| Login always says incorrect (first run) | `INITIAL_ADMIN_USERNAME`/`INITIAL_ADMIN_PASSWORD` not set for **Production**, or set after the deployment — redeploy |
| `SESSION_SECRET must be set` in logs | Add it (≥ 32 chars) and redeploy |
| Image upload: "Image storage is not configured" | Connect a Blob store (§3.1) and redeploy |
| WhatsApp link points to localhost | Set `NEXT_PUBLIC_SITE_URL` and redeploy |
| Everyone got logged out | `SESSION_SECRET` was changed (expected) |

## 10. Deploying updates

Push to `main` → Vercel builds and deploys automatically. Pull requests get Preview URLs.
CLI alternative: `npm i -g vercel && vercel --prod`.
