# MyWatch — Design Specification (v2, "quiet luxury")

Status: ready for implementation. Scope is the public site, with brief notes for the admin console.
Constraints: Tailwind v4 CSS-first tokens in `src/app/globals.css`, shadcn/radix, **no new dependencies**,
fixed data model (`src/lib/schemas/{watch,settings}.ts`), public pages stay server components, and
**every marketing sentence comes from admin settings**. This spec adds no new marketing copy.

---

## 1. Direction

Classic, quiet luxury. The site should feel like a well-lit independent boutique: warm ivory paper,
near-black ink, one restrained bronze accent, generous but disciplined whitespace, and photography
placed on a calm stone backdrop. The serif carries the voice (headings and product names) and the sans
carries information (prices, specs, labels). Nothing shimmers, glows or bounces. Hierarchy comes from
size, space and weight, not colour. WhatsApp is the "sales associate", so the enquiry CTA is presented
like a boutique appointment button, not a chat widget.

## 2. Research summary (patterns only)

| Pattern | Observed at | Take-away for MyWatch |
|---|---|---|
| Light canvas with dark **bands** for hero or editorial moments; no gradients between bands | Omega, Patek Philippe, Rolex (white/grey canvas, black panels) | Light catalogue with dark bookends (CTA band and footer) |
| One chromatic accent used sparingly (about 20 accent uses against about 440 ink uses on Rolex; Omega's red is used as heading text, not as button fill; Patek's taupe only on labels and secondary buttons) | Rolex, Omega, Patek | Bronze is a seasoning. Primary buttons are **ink** |
| Flat surfaces, hairline separators, no shadows; 0 px radius on cards and imagery | Rolex, Omega, Patek | Borderless cards, 1 px hairlines, radius of 0 to 2 px |
| Tracked uppercase used only for small labels and nav; headings in sentence case. Rolex moved away from all-caps bold headings to lowercase headings with more air | Omega, Patek, Rolex (Browser London) | Micro-labels only; headings in sentence case |
| Product card: square or 4:5 image on a neutral, light backdrop → status label → name → spec line → price; the whole card is clickable | Tissot (light backdrop with soft shadow), Watches of Switzerland (brand label above name, spec line, price) | Same order, with one consistent stone backdrop |
| Listing page: result count above the grid, sort with 3 options, numbered pagination, faceted filters | Tissot listing, WoS | Already present; restyle quietly |
| Home: hero → products → category/audience tiles → editorial/story → trust and services → newsletter/footer | WoS, Tissot, Omega, Longines | Hero → featured → categories → story → trust → CTA → footer |
| Trust/commitments as a calm row of label and description, often near the footer | WoS (stats/trust band), Tissot (footer "commitments" row) | Trust items as a text row; compact version on the product page |
| CTA wording: short verbs ("Discover", "Explore", "Shop the collection"); appointment/boutique actions are separate from shopping | Omega, Longines, WoS | "Check availability" is primary; "Explore the collection" is secondary |
| Footer: link columns, social links, legal row; often a dark or contrasting band | all | Dark footer band, 4 columns |
| Motion: slow fades and scroll entrances, carousels driven by swiping; little else | Omega, Patek (scroll fades), KIJO review | Opacity and small translate only |

Sources actually consulted: watchesofswitzerland.com (home), tissotwatches.com/en-in (home and men's
listing), omegawatches.com (home), longines.com/en-in (home), shadcn.io design extractions for
[Rolex](https://www.shadcn.io/design/rolex/raw), [Omega](https://www.shadcn.io/design/omega/raw) and
[Patek Philippe](https://www.shadcn.io/design/patek-philippe/raw) (third-party token scans, used as
indicative only), [KIJO luxury watch site review](https://kijo.london/blog/luxury-watch-websites), and
the Browser London and Trio Media notes on Rolex typography and whitespace (via search summaries).
Rolex, TAG Heuer, Ethos, Chrono24 and Hodinkee Shop blocked automated fetching (403 errors or a fetch
refusal), so this spec makes **no claims** about their specific details. Nothing here copies any brand's
wording, logos or trade dress.

## 3. Audit of the current site

**What reads as generic or "AI template"**
1. **Gold everywhere.** There are about 95 `gold` class uses: eyebrows, legends, prices, icons, check
   marks, chips, pagination, the wordmark half, the outlines on the floating button and the
   availability-note pill. Because everything is accented, nothing is.
2. **The eyebrow-with-rule motif** (`h-px w-8 bg-gold` + tracked caps at 0.3–0.35em) appears on every
   section, in the hero, page heroes, filter legends and the PDP brand line.
3. **Dark photos on a dark canvas.** Mixed Unsplash shots (white studio, black studio, red and teal
   scenes) sit in `bg-charcoal` frames. Dark shots disappear and light shots glare. The hero uses a dark
   lifestyle photo under a `from-background` veil, which turns it to mud (QA note). In the 390 px
   capture the first featured card looks blank.
4. **Uniform boxed cards.** Every image has the same bordered box, and hover just brightens the gold
   border. Category tiles put serif text over busy photos, which is illegible (the "Diver" and
   "Skeleton" tiles in `public-home-1440.png`).
5. **Weak hierarchy on the PDP.** The price is serif with old-style figures (`₹24,999` reads oddly), the
   spec labels are 11 px tracked caps (hard to scan), and the gallery uses `object-cover`, so the watch
   is cropped (Tachymeter Pro).
6. **Unloaded weights.** `font-light` (300) is used on headings, but Cormorant is loaded at 400–700
   only (`src/app/layout.tsx`), so the browser falls back unpredictably.
7. **Gradient-text utility** `text-gold-gradient` is defined but unused. Delete it.
8. **Spacing.** Sections use `py-20 lg:py-28` plus a `pt-20` CTA plus a `mt-24` footer, which creates
   stacked dead zones on the home page. Meanwhile trust items and filter groups are cramped.
9. **Hardcoded copy** that makes claims: the About CTA ("we reply personally"), the Contact hero
   ("We are here to help…") and the shop lede. See P3.

**Keep**
- Cormorant Garamond + Inter pairing; the serif wordmark fallback; tabular numbers.
- Information architecture, URL-driven filters, chips, result count and pagination logic.
- Gallery behaviour (swipe track on mobile, keyboard, thumbnails), the CSS-only hover image swap and the
  CSS scroll-driven `Reveal` (never hides content without JS).
- Accessibility work: skip link, `sr-only` context, visible focus, reduced-motion block, availability
  shown as text as well as colour.
- WhatsApp URL builders (`src/lib/whatsapp.ts`); `WhatsAppLink` as the single CTA component.

## 4. Theme

**Decision: hybrid.** A warm-ivory editorial catalogue, with dark ink **bands** only for the closing CTA
band and the footer (and optionally the Story section later).

Why:
- All the reference brands put products on light or neutral grounds and reserve black for
  photographic hero panels.
- Our photography is mixed. A light stone backdrop with `mix-blend-multiply` absorbs white-background
  studio shots seamlessly. Dark lifestyle shots read as framed photographs instead of dissolving into
  the page.
- Admin uploads will vary, so the backdrop must be forgiving. Ivory forgives more than charcoal.
- The dark bookends keep some continuity with the current brand mood.

### 4.1 Tokens (replace the `:root` block; add a `.dark` block used for bands)

```css
:root {                         /* light catalogue */
  --background: #F7F4EE;        /* warm ivory canvas */
  --foreground: #1C1A17;        /* ink */
  --card: #FFFFFF;              /* raised panels: sheets, popovers, spec panel */
  --card-foreground: #1C1A17;
  --popover: #FFFFFF; --popover-foreground: #1C1A17;
  --surface-2: #ECE7DE;         /* stone: image backdrop, skeletons, Story band */
  --primary: #1C1A17;           /* primary buttons are INK */
  --primary-foreground: #F7F4EE;
  --secondary: #ECE7DE; --secondary-foreground: #1C1A17;
  --muted: #ECE7DE;
  --muted-foreground: #6B645A;  /* secondary text */
  --accent: #ECE7DE;            /* shadcn "accent" = hover surface, NOT the brand accent */
  --accent-foreground: #1C1A17;
  --brand: #B08D57;             /* bronze — decorative only (rules, active underline) */
  --brand-ink: #7A5C24;         /* bronze for TEXT and focus rings */
  --border: #DDD6CA;            /* hairlines (decorative) */
  --input: #8F8678;             /* form control borders (≥3:1) */
  --ring: #7A5C24;
  --success: #2F6B4A; --warning: #8A5A12; --info: #3D5A73;
  --destructive: #A23B2C;
  --radius: 0.125rem;           /* 2px: buttons, inputs. Imagery/cards: 0 */
}
.dark {                         /* footer, CTA band (class on the band element) */
  --background: #15130F; --foreground: #F2EEE6;
  --card: #1F1C17; --card-foreground: #F2EEE6;
  --popover: #1F1C17; --popover-foreground: #F2EEE6;
  --surface-2: #1F1C17;
  --primary: #F2EEE6; --primary-foreground: #15130F;   /* ivory button on ink */
  --secondary: #1F1C17; --secondary-foreground: #F2EEE6;
  --muted: #1F1C17; --muted-foreground: #A39B8E;
  --accent: #2A261F; --accent-foreground: #F2EEE6;
  --brand: #C9A96A; --brand-ink: #C9A96A;
  --border: #3A352D; --input: #6E665A; --ring: #C9A96A;
}
```
- Add `--color-surface-2`, `--color-brand`, `--color-brand-ink`, `--color-success`, `--color-warning`
  and `--color-info` to `@theme inline`.
- `--gold*` and `--charcoal` become temporary aliases (`--gold: var(--brand-ink)`,
  `--charcoal: var(--surface-2)`) so nothing breaks mid-migration. Delete them once the class sweep is
  done.
- Set `html { color-scheme: light; }` and `.dark { color-scheme: dark; }`.
- Selection: `background: var(--surface-2); color: var(--foreground)`.
- Focus outline: `2px solid var(--ring)`.

### 4.2 Contrast (WCAG 2.x, computed)

| Pair | Ratio | Use |
|---|---|---|
| ink `#1C1A17` on ivory `#F7F4EE` | **15.8:1** | body, headings |
| ink on white `#FFFFFF` / on stone `#ECE7DE` | 17.4 / 14.1 | panels, image backdrop captions |
| muted `#6B645A` on ivory / white / stone | **5.3 / 5.8 / 4.7** | secondary text (AA at all sizes) |
| brand-ink `#7A5C24` on ivory / white | **5.7 / 6.2** | discount text, text links, focus ring |
| brand `#B08D57` on ivory | 2.8 | **decorative only. Never text, never the only state cue** |
| ivory on ink (primary button) | 15.8 | buttons |
| success / warning / info / destructive on ivory | 5.8 / 5.4 / 6.6 / 6.0 | status text |
| input `#8F8678` on ivory | 3.3 | control borders (meets 1.4.11 non-text) |
| border `#DDD6CA` on ivory | 1.3 | decorative hairlines only |
| dark: fg `#F2EEE6` / muted `#A39B8E` / brand `#C9A96A` on `#15130F` | 16.0 / 6.8 / 8.3 | bands |
| dark: muted on card `#1F1C17` | 6.2 | |

### 4.3 Accent rules (bronze)
Bronze is allowed in exactly these places:
1. the 1 px active-nav underline;
2. focus rings;
3. discount text ("17% off") and text-link hover colour;
4. the price-range slider track;
5. on dark bands, footer column headings.

Prices, eyebrows, icons, check marks, legends, pagination and badges are ink or muted.
Aim for **at most one bronze element per viewport**. No gradients, no glows, no gold fills.

## 5. Typography

Keep **Cormorant Garamond** for display, headings and product names, and **Inter** for everything
else. In `src/app/layout.tsx`, change the Cormorant weights to `["400","500","600"]` (no new
dependency), and never use `font-light`. Prices and numbers always use Inter with `tabular-nums`,
because Cormorant's old-style figures read poorly for ₹ amounts.

Define these in `@theme` (Tailwind v4 `--text-*` with `--line-height` / `--letter-spacing` /
`--font-weight` sub-properties). `clamp()` gives mobile to desktop sizing with one class.

| Token / class | Family, weight | Size mobile → desktop | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `text-display` | Cormorant 400 | 40 → 64 px `clamp(2.5rem,1.7rem+3.4vw,4rem)` | 1.04 | -0.01em | Home hero h1 |
| `text-h1` | Cormorant 400 | 36 → 52 px | 1.08 | -0.005em | Page titles, PDP name |
| `text-h2` | Cormorant 400 | 30 → 40 px | 1.12 | 0 | Section headings |
| `text-h3` | Cormorant 500 | 22 → 26 px | 1.25 | 0 | Sub-sections, empty states |
| `text-card` | Cormorant 500 | 18 → 19 px | 1.3 | 0 | Product name in cards |
| `text-lede` | Inter 400 | 16 → 18 px | 1.6 | 0 | Hero subtitle, section ledes (max 60ch) |
| body | Inter 400 | 15 → 16 px | 1.7 | 0 | Paragraphs (max 68ch) |
| `text-small` | Inter 400 | 13 px | 1.5 | 0 | Helper text, captions, breadcrumbs |
| `text-micro` (`@utility eyebrow`) | Inter 500, UPPERCASE | 11 px | 1.4 | 0.16em | Micro-labels only |
| `text-nav` | Inter 500, UPPERCASE | 12 px | 1 | 0.14em | Desktop nav, button labels |
| price-lg | Inter 500 tabular | 24 → 28 px | 1.2 | -0.01em | PDP price |
| price-md | Inter 500 tabular | 14 → 15 px | 1.4 | 0 | Card price |

Uppercase micro-labels are used **only** for: brand name above product names, nav and button labels,
the hero eyebrow (`home.heroEyebrow`), footer column headings and filter legends. They do not use a
leading rule line. Breadcrumbs, spec labels and the trust titles are sentence case. Headings are
sentence case, as entered by the admin.

## 6. Spacing and layout

- **Container:** keep `container` in `section-heading.tsx`, but raise the max width to 1320 px
  (`max-w-[82.5rem]`). Padding is 20 / 32 / 48 px (`px-5 sm:px-8 lg:px-12`). Prose columns are 680 px
  maximum.
- **Section rhythm:** add `--spacing-section: clamp(4rem, 2.5rem + 5vw, 7.5rem)` and use `py-section`.
  Each section owns its own padding. Remove the ad-hoc `pt-20` on CtaBand and `mt-24` on the footer.
  Between a heading block and its content: 40 px mobile, 56 px desktop.
- **4 px base scale.** Common steps are 8, 12, 16, 24, 32, 40, 56, 80 and 120 px.
- **Grids**

| Grid | <640 | ≥640 | ≥768 | ≥1024 | ≥1280 | gap x / y |
|---|---|---|---|---|---|---|
| Home featured, related | 2 | 2 | 3 | 4 | 4 | 16/40 → 32/56 |
| Shop (beside a 240 px sidebar from lg) | 2 | 2 | 3 | 3 | 3 (4 at ≥1536) | 16/40 → 24/56 |
| Categories | 2 | 2 | 3 | count ≤4 ? count : 4 | — | 16/32 → 24/40 |
| PDP | 1 | 1 | 2 (7/5 split) | 7/5, gap 64 | 7/5, gap 96 | — |
| Footer | 1 | 2 | 2 | 12-col (4/3/2/3) | — | 48 |

## 7. Components

**Header** (`layout/header.tsx`, `header-client.tsx`)
- Height 64 px mobile, 76 px desktop. Ivory at 92% opacity with backdrop blur and a 1 px bottom hairline.
- Desktop: wordmark on the left, nav centred (`text-nav`, `text-foreground/70`, active is ink with the
  1 px bronze underline), right side has search then the WhatsApp link.
- The WhatsApp item is a text link "WhatsApp" with a 16 px monochrome glyph. No border pill.
- Wordmark: single colour ink, Cormorant 600, tracking 0.12em. **Remove the gold second half** from
  `wordmark.tsx`.
- Mobile: wordmark on the left; search icon and menu icon on the right (44 px targets).
- Mobile menu (Sheet, right, ivory, width 88%):
  - search at the top;
  - nav items in Cormorant 28 px, each row 56 px with hairlines;
  - a "Categories" micro-label followed by `catalog.categories` links in Inter 15;
  - a bottom primary button "Chat on WhatsApp".

**Search**
- Input 40 px high with 2 px radius, `border-input`, `bg-card`, an 16 px leading icon and placeholder in
  muted. Focus state is a 2 px ring in `--ring`.
- In the header it shows inline from `xl`. Below `xl`, an icon button opens the mobile Sheet with the
  search focused.

**Buttons** (`ctaBase` / `ctaPrimary` / `ctaSecondary` in `home/section-heading.tsx`)
- **Primary:** `bg-primary text-primary-foreground`, 48 px high (52 px on the PDP), padding x 28 px,
  `text-nav`, 2 px radius. Hover: `bg-foreground/85`, 150 ms. Active: translate-y 1 px.
  Disabled: 40% opacity.
- **Secondary:** transparent, 1 px `border-foreground/80`, ink text. Hover: `bg-foreground`
  with ivory text.
- **Text link:** Inter 13 or 14, 500, ink, underline offset 6 px with `decoration-border`. Hover:
  `decoration-foreground`. An optional arrow moves 2 px on hover.
- Focus for all: 2 px ring with 2 px offset.
- On dark bands the tokens invert automatically through `.dark`.

**WhatsApp CTA ("Check availability")** (`site/whatsapp-link.tsx`, `product/product-info.tsx`)
- Full-width primary ink button labelled **"Check availability"** (or "Ask about availability" when
  sold out), with a 16 px monochrome WhatsApp glyph leading. Never use WhatsApp green or chat-bubble
  styling.
- Under the button: one `text-small` muted line that keeps today's helper text, plus "Call" and
  "Email" as **text links** separated by a middle dot (they are not boxed buttons).
- **Mobile sticky bar (P2):** after the main CTA scrolls out of view, show a 64 px bottom bar on ivory
  with a top hairline, the price on the left (price-md) and a compact primary button on the right.
  Build it as a small client component using IntersectionObserver, without dependencies. While the bar
  is visible, hide the floating WhatsApp button.

**Product card** (`product/product-card.tsx`)
- Anatomy:
  1. image frame: 4:5, `bg-surface-2`, no border, radius 0;
  2. 16 px gap;
  3. brand (`eyebrow`, muted);
  4. 4 px gap;
  5. name (`text-card`, ink, 2-line clamp);
  6. 8 px gap;
  7. price row (price-md ink; the original price is struck through in muted 13 px; discount in
     brand-ink 12 px 500);
  8. availability text line, only when not in stock (`text-small`, in the status colour with a 6 px dot).
- Remove the pill badge that overlays the photo.
- Image: `object-cover mix-blend-multiply`, so white studio backgrounds take on the stone tone.
- Hover (hover-capable pointers only): the image scales to 1.03 over 600 ms and the second image
  crossfades in (keep this). The name gets an underline. No border colour change.
- Focus: the title link shows the ring. The whole card remains clickable through the image link.
- P3: an optional spec line under the name, `specs.caseSize` only (for example "42 mm"), in
  `text-small` muted. This uses existing data.

**Price** (`product/price.tsx`)
- Inter with tabular figures, ink (not gold).
- `lg`: 24 → 28 px, with the original price in muted 16 px struck through and the discount as plain
  brand-ink text "17% off" (no pill).
- Keep the screen-reader labels.

**Availability** (`product/availability.tsx`)
- Text with a dot, no pill, no blur.
- Colours: in stock → success; limited → warning; pre-order → info; sold out → muted.
- Label in Inter 13 500, sentence case (from `availabilityLabels`). Dot is 6 px.

**Filters panel** (`shop/filter-panel.tsx`, `shop-controls.tsx`)
- Sidebar 240 px, sticky at `top-24`.
- Legends use `eyebrow` in **muted** with no rule. Groups are separated by a 1 px hairline with 24 px
  padding.
- Checkboxes 16 px with 2 px radius and `border-input`; checked is an ink fill with an ivory tick.
- Labels in Inter 14 ink; counts in muted 12 px tabular.
- Price slider: track `border`, range `brand`, thumbs 16 px ivory with an ink 1 px border.
- Chips: 32 px pill, `border-input`, `bg-card`, ink 13 px, muted × icon. "Clear all" is a text link.
- Mobile Sheet from the left (keep), footer buttons Secondary "Clear all" and Primary "Show N watches".
- Sort select matches the search input styling.

**Pagination** (`shop/pagination.tsx`)
- 40 px square targets with no borders.
- The current page is ink 500 with a 1 px ink underline. Others are muted, and turn ink on hover.
- Prev/next show chevrons plus visible "Previous" / "Next" from `sm`.
- The disabled state is muted at 40% opacity.

**Breadcrumbs** (`shop/breadcrumbs.tsx`)
- `text-small`, sentence case (not uppercase), muted. The separator is "/" in the `border` colour.
  The current item is ink and truncated at 28ch on mobile.

**Specification table** (`product/product-details.tsx`)
- Use a white `bg-card` panel with 32 px padding (24 px on mobile), and group the rows using existing
  keys:
  - **Overview:** Brand, Reference, Collection, Gender.
  - **Case and dial:** caseSize, caseMaterial, thickness, lugWidth, crystal, waterResistance, dialColour.
  - **Movement:** movement type, movementDetail, powerReserve.
  - **Strap:** strapMaterial.
  - **Warranty:** warranty.
  - **Additional:** `extraSpecs`.
- Group titles use `eyebrow` (muted). Each row is a `dl` grid with a 40/60 split: label in Inter 13
  muted sentence case, value in Inter 15 ink, and a hairline between rows.
- Empty groups are omitted. On desktop, lay the groups out in two columns.

**Gallery** (`product/product-gallery.tsx`)
- Stage: 1:1 with `bg-surface-2` and `object-contain mix-blend-multiply`, so the whole watch is visible
  and never cropped. Radius 0, no border.
- Thumbnails: 72 px squares in a row with 8 px gaps. Active has a 1 px ink outline; inactive is at 70%
  opacity.
- Counter: "01 / 05" in `text-small` muted, placed under the stage on the right (no blurred pill).
- Arrows: 40 px circles in ivory with a hairline. Show them on hover or focus.
- Zoom: scale 1.6 on mouse hover. Disable it for reduced motion.
- Mobile: keep the swipe track with stone backgrounds, and use 2 px ink and border bars for the dots.

**Trust items** (`home/trust-bar.tsx`)
- Text only: no icons, no diamonds.
- 2 columns on mobile and 4 on desktop. Each item has a 1 px top hairline and 24 px top padding; the
  title is Inter 14 500 ink and the description is `text-small` muted.
- On the PDP, show up to 3 trust **titles** as a compact list under the CTA, using the same data.

**Footer** (`layout/footer.tsx`)
- A `.dark` band.
- Column headings use `eyebrow` in brand. Links are Inter 14 muted and turn foreground on hover.
- Icons are 16 px muted (not gold).
- Bottom row: copyright on the left, social links on the right, with a hairline above.
- Top padding 80 px. Bottom padding 40 px, plus 64 px extra on mobile for the floating button.

**Floating WhatsApp** (`FloatingWhatsApp`)
- 48 px circle in `bg-card` with a 1 px `border` hairline, a 20 px ink glyph and `shadow-sm`.
- Position: bottom-right, 16 px from the edges (24 px from `sm`).
- Hover: border `foreground`.
- Hide it on PDP mobile while the sticky bar is visible, and omit it inside `print`.

**Empty states** (`shop/shop-empty.tsx`)
- No icon circle. Use a `text-h3` heading, a muted paragraph (max 44ch) and buttons in the order
  Secondary, then Primary.
- `bg-card` panel with a hairline and 64 px vertical padding.

**Skeletons** (`shop/skeletons.tsx`, `watches/[slug]/loading.tsx`)
- `Bone` uses `bg-surface-2` with `animate-pulse` (about 2 s). Shapes mirror the real layout: a 4:5
  image, two text lines and a price line. The PDP skeleton has a 1:1 stage and a 5-column info block.

## 8. Page blueprints

**Home** (`src/app/(site)/page.tsx`)
1. **Hero, split layout and never a veil.**
   - Desktop: a 6/6 grid. The left column has `heroEyebrow` (eyebrow), `heroTitle` (fallback
     `general.tagline` or `siteName`) in `text-display`, `heroSubtitle` in `text-lede`, then two CTAs
     (Primary "Check availability" / "Chat on WhatsApp", Secondary "Explore the collection"), then a
     featured-watch line: the name in Cormorant 20 px · the price in price-md as a text link (no glass
     chip).
   - The right column shows the image (`heroImageUrl`, or the image of the watch chosen by
     `heroWatchSlug` or the first featured watch) in a 4:5 frame on `surface-2`. Use `object-cover` for
     a lifestyle `heroImageUrl`, and `object-contain mix-blend-multiply` for a watch product photo.
   - Mobile: the image comes first at 4:5 and full bleed, followed by the text on ivory.
   - Minimum height: `min(88svh, 860px)` on desktop. No gradients.
2. **Featured watches:** `featuredTitle`, `featuredSubtitle`, watches flagged featured (falls back to
   newest). The "View all" text link sits to the right of the heading.
3. **Shop by category:** `catalog.categories[].label/description/imageUrl`. Each tile is a 4:5 image on
   `surface-2` with the label **below** it (`text-h3`), the description in muted (2 lines), and an
   underline on hover. Text never goes over the image. Replace the `odd:last:col-span-2` rule with a
   normal grid.
4. **Story:** `storyTitle`, `storyBody`, `storyImageUrl`, on a `bg-surface-2` band. Image 4:5 on the
   left with text on the right (prose 60ch), and a "More about us" text link.
5. **Trust items:** `home.trustItems`, as a text row.
6. **CTA band:** `ctaTitle`, `ctaBody`, using the `generalEnquiryMessage` link. A `.dark` full-width
   band (not a boxed card), centred, with `text-h2` and an ivory primary button.
7. **Footer** (dark): `footer.blurb` or `general.tagline`, categories, pages, `contact.*`, `social.*`,
   and `footer.copyright`.

**Shop** (`src/app/(site)/shop/page.tsx`)
- Compact header: breadcrumbs, `text-h1` title, the category description as a lede when present, and
  48 px bottom padding with no eyebrow.
- Toolbar row: search on the left; filters button (mobile) and sort on the right; a hairline below.
- Then chips, the result count (`text-small`), the grid and pagination.
- Sidebar from lg.

**Product detail** (`src/app/(site)/watches/[slug]/page.tsx`)
- Breadcrumbs, then a 7/5 grid: the gallery on the left (sticky at `top-24`, keep), info on the right.
- Info column order:
  1. brand eyebrow · category link (muted);
  2. name `text-h1`;
  3. "Ref. …" in `text-small`;
  4. 24 px gap, then the price;
  5. availability line with its note;
  6. 32 px gap, then the "Check availability" button;
  7. helper line, then Call · Email links;
  8. compact trust titles;
  9. hairline, then `shortDescription` (lede);
  10. Highlights (`features`) as a list with a 4 px ink dot (no gold check marks).
- Below the grid: About this watch (prose) beside the grouped spec panel, then "You may also like"
  (4 cards, heading left-aligned).

**About** (`src/app/(site)/about/page.tsx`)
- Left-aligned page hero with `about.title` and the tagline lede.
- Then a 5/7 grid: `about.imageUrl` (4:5, sticky) beside the `about.body` prose, with the first
  paragraph as the lede.
- Close with the shared CTA band using `home.ctaTitle/ctaBody` instead of hardcoded copy. If they are
  empty, show only the buttons.

**Contact** (`src/app/(site)/contact/page.tsx`)
- Page hero with the title "Contact" and `general.tagline` as the lede (replacing the hardcoded
  claims).
- 5/7 grid:
  - a white WhatsApp panel: `text-h3` heading, the number in Inter 20 tabular, a primary button, and
    `businessHours` in muted;
  - a `dl` of phone, email, address (+ an "Open in maps" text link), hours and social links. Icons are
    muted, 18 px.

## 9. Imagery rules

| Context | Ratio | Fit | Backdrop |
|---|---|---|---|
| Product card | 4:5 | `cover` + `mix-blend-multiply` | `surface-2` |
| PDP stage and thumbnails | 1:1 | `contain` + `mix-blend-multiply` (whole watch visible) | `surface-2` |
| Category tile | 4:5 | `cover` | `surface-2` |
| Hero | 4:5 desktop column / 4:5 mobile | `cover` for `heroImageUrl`; `contain` for a product photo | `surface-2` |
| Story / About | 4:5 (story 4:3 on mobile) | `cover` | `surface-2` |

- Never place text over photographs, which removes the need for veils and gradients.
- The multiply blend makes white studio shots blend into the stone; it changes dark shots only
  slightly (about 7% tint).
- Inside `.dark` bands, drop the blend.
- Admin guidance (help text in `admin/image-manager.tsx`, functional copy only): "Best results: square,
  at least 1600 px, watch centred on a plain light background. The first image is the cover."

## 10. Motion

- **Tokens:** `--ease-quiet: cubic-bezier(0.2, 0, 0, 1)`; durations `--dur-fast: 150ms` (colour,
  underline), `--dur-base: 300ms` (sheets, opacity, arrows) and `--dur-slow: 600ms` (image scale and
  crossfade).
- **What animates:**
  - header and nav underline;
  - button and link colour;
  - card image scale (1.03) and second-image crossfade;
  - gallery image fade (300 ms) and hover zoom;
  - Sheet open and close;
  - `Reveal` on section heading blocks and grid containers only, never on individual cards. Reduce the
    translate to 8 px over the `entry 0%–35%` range;
  - the hero text fades in once over 500 ms;
  - the filter results dim to 50% while pending.
- **No** parallax, auto-rotating carousels, scroll-jacking, shimmer or bouncing.
- **Reduced motion:** keep the existing global block. Also disable the gallery zoom and the card scale
  (`motion-safe:` prefix), and fall back to instant scrolling (already in place).

## 11. Admin console (brief)

- Shares the tokens, so it becomes light automatically. Add `data-admin` on the console root
  (`app/admin/(console)/layout.tsx` / `admin-shell.tsx`) and scope two overrides there:
  `--radius: 0.375rem`, and headings in Inter 600 (override the global serif `h1–h4`).
- Density: controls at `h-9`, table rows about 56 px, page title Inter 24/600.
- Primary actions use ink buttons. Do not use bronze fills.
- Status badges: Published is an ink outline; Draft is muted; availability uses the success, warning,
  info and muted text colours (no gold pills).
- Keep the sidebar layout. The active item uses `bg-accent` (stone).
- No reveals, no serif display type and no imagery treatment beyond thumbnails with `object-cover`.

## 12. Change list

**P1 — foundation and biggest visual wins**
1. `src/app/globals.css`:
   - replace `:root` with the §4.1 light tokens and add the `.dark` band block;
   - add `surface-2`, `brand`, `brand-ink`, `success`, `warning` and `info` to `@theme`;
   - set `color-scheme: light`, the new selection colour and focus `var(--ring)`;
   - alias `--gold*` and `--charcoal` temporarily;
   - delete `text-gold-gradient`.
2. `src/app/globals.css`: add the §5 `--text-*` tokens, `@utility eyebrow`, `--spacing-section` and the
   motion tokens. `src/app/layout.tsx`: set the Cormorant weights to 400/500/600.
3. `src/components/home/section-heading.tsx`:
   - make `ctaPrimary` ink and `ctaSecondary` an ink outline;
   - remove the eyebrow rule spans;
   - switch the heading to `text-h2`;
   - set the container to 1320 px.
4. `src/components/layout/wordmark.tsx`: use a single-colour wordmark (drop the accent split).
5. `src/components/product/product-card.tsx`:
   - borderless 4:5 frame on `bg-surface-2` with `mix-blend-multiply`;
   - availability as a text line under the price, replacing the overlay badge;
   - title in `text-card`.
6. `src/components/product/price.tsx`: Inter, tabular, ink; discount as plain brand-ink text.
   `src/components/product/availability.tsx`: dot and text using the semantic tokens.
7. `src/components/product/product-gallery.tsx`: `object-contain mix-blend-multiply` on a `surface-2`
   stage; restyled thumbnails and counter.
8. `src/components/home/hero.tsx`: split layout per §8; remove both gradient veils and the glass chip.
9. `src/components/layout/footer.tsx` and `src/components/home/cta-band.tsx`: `.dark` full-width bands;
   muted icons; remove `mt-24` and `pt-20`.
10. Sweep the remaining `gold` and `charcoal` classes across `src/components/**` and
    `src/app/(site)/**` (`grep -rn "gold\|charcoal"`) and map each per §4.3 (most become `foreground`
    or `muted-foreground`). Then delete the aliases.

**P2 — structure and components**
11. `src/components/home/shop-by-category.tsx`: label below the image; normal grid; no overlay.
12. `src/components/product/product-details.tsx`: grouped spec panel (§7); sentence-case labels.
13. `src/components/product/product-info.tsx`:
    - order per §8;
    - Call and Email as text links;
    - compact trust titles (pass `home.trustItems` from the page);
    - features with dots instead of gold checks.
14. New `src/components/product/sticky-enquiry-bar.tsx` (client, IntersectionObserver) used on the PDP.
    `FloatingWhatsApp` hides while the bar is shown, for example via a `data-sticky-cta` attribute on
    `body` and a CSS rule.
15. `src/components/shop/filter-panel.tsx`, `shop-controls.tsx`, `pagination.tsx`, `breadcrumbs.tsx`
    and `page-header.tsx`: restyle per §7 (muted legends, ink checkboxes, quiet pagination,
    sentence-case crumbs, no eyebrow).
16. `src/components/home/trust-bar.tsx`: text row with hairlines, moved after Story in
    `src/app/(site)/page.tsx`. `src/components/home/story.tsx`: `bg-surface-2` band.
17. `src/components/layout/header.tsx`, `header-client.tsx`: restyle the nav and search; search icon
    below `xl`; categories in the mobile menu.
18. `src/components/site/whatsapp-link.tsx`: quiet `FloatingWhatsApp` (card, hairline, ink glyph).
19. `src/components/shop/skeletons.tsx`, `src/app/(site)/watches/[slug]/loading.tsx`,
    `shop-empty.tsx`: `surface-2` bones and the restyled empty state.

**P3 — polish and copy hygiene**
20. `src/app/(site)/about/page.tsx`: replace the hardcoded CTA copy with `CtaBand` fed by
    `home.ctaTitle/ctaBody`. `contact/page.tsx`: title "Contact" with the `general.tagline` lede.
    `shop/page.tsx`: drop the hardcoded lede unless a category description exists.
21. `product-card.tsx`: optional `specs.caseSize` line (extend the `Pick` type with `specs`).
22. `src/components/motion/reveal.tsx` and `globals.css`: 8 px translate; apply only to section blocks
    (remove per-card `Reveal` in `featured-watches.tsx` and `shop-by-category.tsx`).
23. Admin: `data-admin` scope (radius and Inter headings) in `admin-shell.tsx`; badge colours in
    `watches-list.tsx` and the dashboard; image guidance text in `image-manager.tsx`.
24. Re-run the Playwright screen captures at 390 and 1440 px and check the contrast pairs in §4.2.
