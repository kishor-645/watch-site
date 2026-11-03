import { cn } from "@/lib/utils";

/** A single pulsing placeholder block. */
export function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-muted/50", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-4">
      <Bone className="aspect-[4/5] w-full" />
      <Bone className="h-2.5 w-1/3" />
      <Bone className="h-5 w-3/4" />
      <Bone className="h-4 w-1/4" />
    </div>
  );
}

export function ShopGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Sidebar + toolbar + grid placeholder used while the shop results load. */
export function ShopBodySkeleton() {
  return (
    <div role="status" aria-label="Loading watches" className="flex gap-12">
      <div className="hidden w-64 shrink-0 space-y-10 lg:block">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-4">
            <Bone className="h-2.5 w-24" />
            <Bone className="h-4 w-40" />
            <Bone className="h-4 w-32" />
            <Bone className="h-4 w-36" />
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <Bone className="h-10 w-full max-w-sm" />
          <Bone className="h-10 w-44" />
        </div>
        <ShopGridSkeleton />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
