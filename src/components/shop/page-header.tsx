import { container } from "@/components/home/section-heading";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/** Compact shop header: breadcrumb, serif title and optional lede. */
export function PageHeader({
  crumbs,
  title,
  description,
}: {
  crumbs: Crumb[];
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <section>
      <div className={`${container} pb-10 pt-5 md:pb-12 md:pt-8`}>
        <Breadcrumbs items={crumbs} />
        <div className="mt-6 max-w-3xl md:mt-10">
          <h1 className="type-h1 text-foreground">{title}</h1>
          {description && <p className="type-lede mt-4 max-w-[60ch] text-muted-foreground">{description}</p>}
        </div>
      </div>
    </section>
  );
}
