# MyWatch — Luxury Watch Boutique

A premium, dark-themed luxury watch e-commerce storefront built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui** and **Framer Motion**. Product data is static, so no backend is required.

Flagship product: **MyWatch Aurora Chronograph**, a 41mm Swiss quartz chronograph with an integrated steel bracelet, priced at ₹42,999.

## Features

- **Home** — hero with the flagship, trust bar, featured collections, "Most Loved" scroller, flagship spotlight, shop by style, brand story, newsletter
- **Shop** — filter by category, brand, gender, movement and price; sorting; URL-driven filters (`/shop?category=diver`)
- **Product page** — image gallery, specs, add to cart / buy now, description and technical-detail tabs, related watches, JSON-LD
- **Cart** — client-side and saved in `localStorage`
- **About, Contact, Journal** (4 articles)
- Loading skeletons, custom 404, SEO metadata, optimized images (AVIF/WebP)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Project structure

```
src/
  app/                 # routes: /, /shop, /watches/[slug], /cart, /about, /contact, /journal
  components/
    ui/                # shadcn/ui primitives
    layout/            # header, footer
    home/              # homepage sections
    shop/              # filters, sorting, grid
    product/           # product card, gallery, product info
    motion/            # animation helpers
  data/                # watches.ts, collections.ts, blog.ts (static catalog)
  lib/                 # types, catalog helpers, cart context, formatting
```

To add or edit products, change `src/data/watches.ts`. Each entry follows the `Watch` type in `src/lib/types.ts`.

## Deploy to Vercel

**Option A — dashboard**

1. Push this project to a GitHub, GitLab or Bitbucket repository.
2. Go to https://vercel.com/new and import the repository.
3. Vercel detects Next.js automatically. Keep the default settings (build command `next build`, output `.next`).
4. Optional: add the environment variable `NEXT_PUBLIC_SITE_URL` = your production URL (used for absolute Open Graph URLs).
5. Click **Deploy**.

**Option B — CLI**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

Images load from `images.unsplash.com`, which is allowed in `next.config.ts`. If you switch to your own image host, add it to `images.remotePatterns`.

## How this was built (multi-agent workflow)

This project was built by a team of Claude Code agents:

| Agent | Responsibility |
|---|---|
| Project Manager | Scaffold, design tokens, shared types and cart state, architecture (`PLAN.md`), coordination, README |
| Product & Data | Catalog of 15 watches, collections, journal posts, catalog helpers |
| Frontend UI-A | Header/footer, homepage, product card, About/Contact/Journal |
| Frontend UI-B | Shop with filters, product detail page, cart, loading and 404 states |
| Tester / QA | Type-check, lint, build, route checks, accessibility and responsive fixes |

The role definitions live in `.claude/agents/` and can be reused in future Claude Code sessions.
