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

/** Optional eyebrow label + serif heading + optional lede, used across the public pages. */
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
      {eyebrow && (
        <p
          className={cn(
            "mb-4 flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-gold",
            align === "center" && "justify-center",
          )}
        >
          <span aria-hidden className="h-px w-8 bg-gold/60" />
          {eyebrow}
          {align === "center" && <span aria-hidden className="h-px w-8 bg-gold/60" />}
        </p>
      )}
      <Heading id={id} className="text-3xl font-medium leading-[1.08] text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </Heading>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
      )}
    </div>
  );
}

/** Standard horizontal page container. */
export const container = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12";

const ctaBase =
  "group/cta inline-flex min-h-12 items-center justify-center gap-3 px-7 py-3 text-center text-[0.7rem] font-medium uppercase tracking-[0.25em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Solid gold call-to-action. */
export const ctaPrimary = cn(ctaBase, "bg-gold text-primary-foreground hover:bg-gold-light");

/** Hairline outlined call-to-action. */
export const ctaSecondary = cn(ctaBase, "border border-foreground/25 text-foreground hover:border-gold hover:text-gold-light");
