import { container } from "@/components/home/section-heading";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/** Shop header: breadcrumb, eyebrow, serif title and optional lede. */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  description,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <section className="border-b border-border">
      <div className={`${container} pb-10 pt-6 md:pb-14 md:pt-10`}>
        <Breadcrumbs items={crumbs} />
        <div className="mt-8 max-w-3xl md:mt-12">
          {eyebrow && (
            <p className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
              <span aria-hidden className="h-px w-10 bg-gold/60" />
              {eyebrow}
            </p>
          )}
          <h1 className="mt-4 text-4xl font-light leading-[1.05] sm:text-5xl">{title}</h1>
          {description && (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">{description}</p>
          )}
        </div>
      </div>
    </section>
  );
}
