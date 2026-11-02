import { container } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

/** Compact editorial header for inner pages (About, Contact, Journal). */
export function PageHero({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b border-gold/10", className)}>
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-3xl" />
      <div className={cn(container, "relative py-20 text-center sm:py-24 lg:py-32")}>
        <p className="flex items-center justify-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-gold">
          <span aria-hidden className="h-px w-8 bg-gold/60" />
          {eyebrow}
          <span aria-hidden className="h-px w-8 bg-gold/60" />
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-medium leading-[1.02] sm:text-6xl lg:text-7xl">{title}</h1>
        {description && (
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
        )}
      </div>
    </section>
  );
}
