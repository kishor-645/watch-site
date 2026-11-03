import { container } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

/** Compact editorial header for inner pages (About, Contact). */
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
    <section className={cn("border-b border-gold/10", className)}>
      <div className={cn(container, "py-16 text-center sm:py-20 lg:py-24")}>
        {eyebrow && (
          <p className="flex items-center justify-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-gold">
            <span aria-hidden className="h-px w-8 bg-gold/60" />
            {eyebrow}
            <span aria-hidden className="h-px w-8 bg-gold/60" />
          </p>
        )}
        <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-medium leading-[1.05] sm:text-5xl lg:text-6xl">{title}</h1>
        {description && (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
