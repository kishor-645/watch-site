import { container } from "@/components/home/section-heading";
import { Bone } from "@/components/shop/skeletons";

/** Mirrors the product page: breadcrumb, rounded 1:1 stage + thumbnails (7 cols), info column (5 cols). */
export default function WatchLoading() {
  return (
    <div role="status" aria-label="Loading watch">
      <div className={`${container} pt-5 md:pt-8`}>
        <Bone className="h-3 w-56" />
      </div>
      <div className={`${container} grid gap-8 pb-section pt-5 md:grid-cols-12 md:gap-10 md:pt-8 lg:gap-16 xl:gap-24`}>
        <div className="space-y-4 md:col-span-7">
          <Bone className="aspect-square rounded-[1.5rem] md:rounded-[2rem]" />
          <div className="hidden gap-2 md:flex">
            {Array.from({ length: 4 }, (_, i) => (
              <Bone key={i} className="size-[76px] rounded-[0.875rem]" />
            ))}
          </div>
        </div>
        <div className="space-y-5 md:col-span-5 md:pt-2">
          <Bone className="h-7 w-48 rounded-full" />
          <Bone className="h-11 w-4/5 md:h-13" />
          <Bone className="h-3 w-28" />
          <Bone className="mt-6 h-32 w-full rounded-[1.25rem]" />
          <Bone className="mt-5 h-13 w-full rounded-full" />
          <Bone className="h-3 w-3/4" />
          <div className="space-y-2.5 pt-6">
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-11/12" />
            <Bone className="h-4 w-2/3" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
