import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { availabilityLabels, type Availability } from "@/lib/schemas/watch";

/* Server-safe presentational pieces shared by admin pages (no hooks, no client state). */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeftIcon className="size-3.5" aria-hidden />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl leading-tight font-semibold break-words sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const availabilityTone: Record<Availability, string> = {
  in_stock: "text-success bg-success/10",
  limited: "text-warning bg-warning/10",
  pre_order: "text-info bg-info/10",
  sold_out: "text-muted-foreground bg-muted",
};

/** Availability as a soft tinted chip with a status dot. */
export function AvailabilityBadge({ value }: { value: Availability }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        availabilityTone[value],
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {availabilityLabels[value]}
    </span>
  );
}

/** Published = green chip with a dot; Draft = muted dashed chip. */
export function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap",
        published
          ? "border-success/25 bg-success/10 text-success"
          : "border-dashed border-foreground/25 text-muted-foreground",
      )}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", published ? "bg-success" : "bg-muted-foreground/60")} />
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-foreground/15 bg-card px-6 py-12 text-center">
      {icon && (
        <div className="grid size-14 place-items-center rounded-2xl bg-muted text-brand-ink [&_svg]:size-6" aria-hidden>
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function Pagination({
  basePath,
  params,
  page,
  pageCount,
  total,
  pageSize,
  noun = "items",
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  noun?: string;
}) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const linkClass =
    "inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-sm font-medium shadow-xs outline-none transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";
  const disabledClass = "inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-sm text-muted-foreground/50";

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        {total === 0 ? `No ${noun}` : `${from}–${to} of ${total} ${noun}`}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={href(page - 1)} className={linkClass} rel="prev">
              <ChevronLeftIcon className="size-4" aria-hidden /> Previous
            </Link>
          ) : (
            <span className={disabledClass} aria-disabled="true">
              <ChevronLeftIcon className="size-4" aria-hidden /> Previous
            </span>
          )}
          <span className="tabular-nums text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={href(page + 1)} className={linkClass} rel="next">
              Next <ChevronRightIcon className="size-4" aria-hidden />
            </Link>
          ) : (
            <span className={disabledClass} aria-disabled="true">
              Next <ChevronRightIcon className="size-4" aria-hidden />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}

/** Small square product thumbnail (next/image keeps large source images cheap). */
export function Thumb({ src, alt, className, size = 48 }: { src?: string; alt: string; className?: string; size?: number }) {
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted", className)}
      style={{ width: size, height: size }}
    >
      {src ? <Image src={src} alt={alt} fill sizes={`${size * 2}px`} className="object-cover" /> : null}
    </div>
  );
}
