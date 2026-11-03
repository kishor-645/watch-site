import { cn } from "@/lib/utils";

/**
 * Renders admin-entered heading text with its last word styled as the luxury accent
 * (Cormorant italic, optionally in the aurora gradient). The accessible name is unchanged.
 */
export function AccentTitle({ text, tone = "aurora" }: { text: string; tone?: "aurora" | "plain" }) {
  const trimmed = text.trim();
  const cut = trimmed.lastIndexOf(" ");
  if (cut < 0) return <>{trimmed}</>;
  return (
    <>
      {trimmed.slice(0, cut)}{" "}
      <em className={cn("accent-serif inline-block pr-[0.08em] text-[1.08em] leading-[0.9]", tone === "aurora" && "text-aurora")}>
        {trimmed.slice(cut + 1)}
      </em>
    </>
  );
}

/** Small rounded label above headings ("● Featured"). */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-aurora" />
      {children}
    </p>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  /** Heading level, defaults to h2. */
  as?: "h1" | "h2";
  id?: string;
}

/** Optional eyebrow chip + bold display heading + optional lede, used across the public pages. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as: Heading = "h2",
  id,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow className="mb-5">{eyebrow}</Eyebrow>}
      <Heading id={id} className={cn(Heading === "h1" ? "type-h1" : "type-h2", "text-balance text-foreground")}>
        {typeof title === "string" ? <AccentTitle text={title} /> : title}
      </Heading>
      {description && <p className="type-lede mt-4 max-w-[56ch] text-muted-foreground">{description}</p>}
    </div>
  );
}

/** Standard horizontal page container (1320px max). */
export const container = "mx-auto w-full max-w-[82.5rem] px-5 sm:px-8 lg:px-12";

/** Prose column width. */
export const prose = "max-w-[42.5rem]";

const ctaBase =
  "group/cta type-nav inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-7 py-3 text-center font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-quiet disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Solid hot-orange call-to-action (midnight text). Inside `.light` sections it turns midnight. */
export const ctaPrimary = cn(
  ctaBase,
  "btn-magnetic bg-primary text-primary-foreground shadow-[0_10px_30px_-12px_rgb(255_107_44/0.7)] hover:bg-[color-mix(in_oklab,var(--primary),white_14%)] hover:shadow-[0_16px_40px_-12px_rgb(255_107_44/0.85)]",
);

/** Outlined glass call-to-action. */
export const ctaSecondary = cn(
  ctaBase,
  // Press feedback here only: ctaPrimary gets its press scale from .btn-magnetic (motion.css).
  "active:scale-[0.98] border border-foreground/25 bg-foreground/[0.04] text-foreground backdrop-blur-sm hover:border-foreground hover:bg-foreground hover:text-background",
);

/** Text link with an animated underline (optionally followed by an arrow that nudges on hover). */
export const textLink =
  "group/link inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-foreground underline decoration-foreground/25 decoration-1 underline-offset-[6px] transition-colors duration-150 hover:text-brand-ink hover:decoration-brand-ink";
