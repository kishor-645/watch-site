import { cn } from "@/lib/utils";

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

/** Optional micro-label + serif heading + optional lede, used across the public pages. */
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
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow mb-4 text-muted-foreground">{eyebrow}</p>}
      <Heading id={id} className={cn(Heading === "h1" ? "type-h1" : "type-h2", "text-foreground")}>
        {title}
      </Heading>
      {description && <p className="type-lede mt-4 max-w-[60ch] text-muted-foreground">{description}</p>}
    </div>
  );
}

/** Standard horizontal page container (1320px max). */
export const container = "mx-auto w-full max-w-[82.5rem] px-5 sm:px-8 lg:px-12";

/** Prose column width. */
export const prose = "max-w-[42.5rem]";

const ctaBase =
  "group/cta type-nav inline-flex min-h-12 items-center justify-center gap-3 rounded-sm px-7 py-3 text-center transition-colors duration-150 ease-quiet active:translate-y-px disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Solid ink call-to-action (ivory on the dark bands). */
export const ctaPrimary = cn(ctaBase, "bg-primary text-primary-foreground hover:bg-foreground/85");

/** Hairline outlined call-to-action. */
export const ctaSecondary = cn(
  ctaBase,
  "border border-foreground/80 text-foreground hover:bg-foreground hover:text-background",
);

/** Quiet underlined text link (optionally followed by an arrow that nudges on hover). */
export const textLink =
  "group/link inline-flex items-center gap-2 rounded-sm text-sm font-medium text-foreground underline decoration-border underline-offset-[6px] transition-colors duration-150 hover:decoration-foreground";
