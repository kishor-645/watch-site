import { AccentTitle, container } from "@/components/home/section-heading";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/** Shop header: breadcrumb, bold display title (accent last word), optional lede and extra content (chips). */
export function PageHeader({
  crumbs,
  title,
  description,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div aria-hidden className="orb orb-blue -left-40 -top-56 -z-10 size-[30rem]" />
      <div aria-hidden className="orb orb-violet -right-32 -top-40 -z-10 size-[24rem]" />
      <div className={`${container} pb-8 pt-6 md:pb-10 md:pt-8`}>
        <Breadcrumbs items={crumbs} />
        <div className="mt-8 max-w-4xl md:mt-12">
          <h1 className="type-h1 text-balance text-foreground">
            <AccentTitle text={title} />
          </h1>
          {description && <p className="type-lede mt-4 max-w-[60ch] text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
