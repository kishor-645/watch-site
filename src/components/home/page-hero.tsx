import { container } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

/** Compact, left-aligned editorial header for inner pages (About, Contact). */
export function PageHero({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-border", className)}>
      <div className={cn(container, "py-14 sm:py-16 lg:py-20")}>
        {eyebrow && <p className="eyebrow mb-5 text-muted-foreground">{eyebrow}</p>}
        <h1 className="type-h1 max-w-4xl text-balance text-foreground">{title}</h1>
        {description && <p className="type-lede mt-5 max-w-[60ch] text-muted-foreground">{description}</p>}
      </div>
    </section>
  );
}
