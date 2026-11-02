import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/** Shared editorial page header: breadcrumb, gold eyebrow, large serif title and lede. */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  description,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_85%_0%,color-mix(in_oklch,var(--gold)_10%,transparent),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14 lg:px-10">
        <Breadcrumbs items={crumbs} />
        <div className="mt-10 max-w-3xl md:mt-14">
          <p className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
            <span aria-hidden className="h-px w-10 bg-gold/60" />
            {eyebrow}
          </p>
          <h1 className="mt-5 text-4xl font-light leading-[1.05] sm:text-5xl md:text-6xl">{title}</h1>
          {description && (
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
