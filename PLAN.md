# MyWatch — Architecture & Task Board (owned by Project Manager)

## Stack
Next.js 15 App Router · TypeScript · Tailwind v4 (CSS-first config in `src/app/globals.css`) · shadcn/ui (radix-nova) · Framer Motion · lucide-react · static data.

## Already built by PM (do NOT rewrite; extend only if essential)
- `src/lib/types.ts` — `Watch`, `WatchSpecs`, `Collection`, `BlogPost`, `CartItem`, unions for category/gender/movement.
- `src/lib/format.ts` — `formatPrice(n)` → "₹42,999".
- `src/lib/cart-context.tsx` — `CartProvider` + `useCart()` → `{ items, count, hydrated, addItem(id, qty?), removeItem(id), setQuantity(id, qty), clear() }` (localStorage persisted).
- `src/app/layout.tsx` — fonts, metadata, wraps app in `CartProvider`, renders `<Header/>`, `<Footer/>`, `<Toaster/>` (sonner: `import { toast } from "sonner"`).
- `src/app/globals.css` — dark luxury tokens. Use Tailwind classes:
  - `bg-background` (near-black), `bg-card` / `bg-charcoal` (deep charcoal), `text-foreground`, `text-muted-foreground`, `border-border`
  - Gold: `text-gold`, `bg-gold`, `text-gold-light`, `text-gold-dark`, `border-gold/40`, utility `text-gold-gradient`
  - `bg-primary` is gold, `text-primary-foreground` is dark.
  - Fonts: `font-serif` (Cormorant Garamond — headings, h1–h4 default to it), `font-sans` (Inter — body).
  - Utility `no-scrollbar` for horizontal scrollers.
- shadcn components in `src/components/ui/`: button, badge, tabs, sheet, select, checkbox, slider, input, separator, accordion, sonner.
- `next.config.ts` allows `images.unsplash.com` for `next/image`.

## Data API contract (Product & Data Agent implements; UI agents import)
```ts
// src/data/watches.ts
export const watches: Watch[];               // 14–16 items, flagship first
// src/data/collections.ts
export const collections: Collection[];      // chronograph, diver, skeleton, everyday (+ dress optional)
// src/data/blog.ts
export const posts: BlogPost[];              // 4 posts
// src/lib/catalog.ts
export function getWatchBySlug(slug: string): Watch | undefined;
export function getWatchById(id: string): Watch | undefined;
export function getFlagship(): Watch;        // MyWatch Aurora Chronograph, slug "mywatch-aurora-chronograph"
export function getMostLoved(): Watch[];     // flagship first
export function getRelatedWatches(watch: Watch, limit?: number): Watch[];
export function getBrands(): string[];
export function getPriceBounds(): { min: number; max: number };
export function getPostBySlug(slug: string): BlogPost | undefined;
export const categoryLabels: Record<WatchCategory, string>;
export const genderLabels: Record<Gender, string>;
export const movementLabels: Record<Movement, string>;
```
All images: `https://images.unsplash.com/photo-<id>?w=1200&q=80&auto=format&fit=crop` — every URL must be verified to return HTTP 200.

## Routes
| Route | Owner |
|---|---|
| `/` Home (hero = flagship, trust bar, featured collections, most loved scroller, shop by style, brand story, newsletter) | UI-A |
| `/about`, `/contact`, `/journal`, `/journal/[slug]` | UI-A |
| `/shop` (filters: category, brand, price, gender, movement; sort; `?category=` query param support) | UI-B |
| `/watches/[slug]` PDP (gallery, specs, add to cart / buy now, tabs, related) + `generateStaticParams` + `generateMetadata` | UI-B |
| `/cart` | UI-B |
| `not-found.tsx`, `loading.tsx` for shop & PDP | UI-B |

## Shared components & ownership (avoid editing files you don't own)
- UI-A: `src/components/layout/header.tsx` (export `Header`; sticky, blurred, logo, nav: Home/Shop/Collections→/shop/About/Journal/Contact, cart icon with `useCart().count` badge, mobile `Sheet` menu), `src/components/layout/footer.tsx` (export `Footer`), `src/components/home/*`, `src/components/motion/reveal.tsx` (export `Reveal` — fade-up on scroll wrapper).
- UI-A: `src/components/product/product-card.tsx` — `export function ProductCard({ watch, priority }: { watch: Watch; priority?: boolean })`. Hover swaps to `images[1]`, links to `/watches/[slug]`, shows brand, name, price, compareAtPrice strike, rating, "New"/"Flagship" badge.
- UI-B: `src/components/shop/*`, `src/components/product/*` (except product-card), cart page components.

## Task board
- [x] PM: scaffold, theme, types, cart, layout, plan
- [ ] Data: watches, collections, blog, catalog helpers, image verification
- [ ] UI-A: layout chrome, home, about, contact, journal, ProductCard, Reveal
- [ ] UI-B: shop, PDP, cart, not-found, loading states
- [ ] QA: build, lint, type-check, responsive/a11y review, fixes
- [ ] PM: README + Vercel instructions, final summary
