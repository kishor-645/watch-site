import { cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function formatPostDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

/** "Category · 12 March 2026 · 6 min read" line for journal posts. */
export function PostMeta({
  category,
  date,
  readingTime,
  className,
}: {
  category: string;
  date: string;
  readingTime: string;
  className?: string;
}) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.25em]", className)}>
      <span className="text-gold">{category}</span>
      <span aria-hidden className="text-muted-foreground/50">·</span>
      <time dateTime={date} className="text-muted-foreground">
        {formatPostDate(date)}
      </time>
      <span aria-hidden className="text-muted-foreground/50">·</span>
      <span className="text-muted-foreground">{readingTime}</span>
    </p>
  );
}
