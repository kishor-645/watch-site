import { AccentTitle, Eyebrow, container } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

/** Editorial header for inner pages (About, Contact): big display title over soft aurora orbs. */
export function PageHero({
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("relative isolate overflow-hidden", className)}>
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div aria-hidden className="orb orb-blue -left-32 -top-48 -z-10 size-[28rem]" />
      <div aria-hidden className="orb orb-violet -z-10 -right-24 top-0 size-[24rem]" />
      <div className={cn(container, "pb-14 pt-14 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-28")}>
        {eyebrow && <Eyebrow className="mb-6">{eyebrow}</Eyebrow>}
        <h1 className="type-display max-w-5xl text-balance text-foreground">
          <AccentTitle text={title} />
        </h1>
        {description && <p className="type-lede mt-6 max-w-[56ch] text-muted-foreground">{description}</p>}
        {children}
      </div>
    </section>
  );
}
