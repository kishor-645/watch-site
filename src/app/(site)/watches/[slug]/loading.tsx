import { container } from "@/components/home/section-heading";
import { Bone } from "@/components/shop/skeletons";

export default function WatchLoading() {
  return (
    <div role="status" aria-label="Loading watch">
      <div className={`${container} pt-6 md:pt-10`}>
        <Bone className="h-3 w-56" />
      </div>
      <div className={`${container} grid gap-10 pb-16 pt-6 md:grid-cols-2 md:gap-12 md:pt-10 lg:gap-16`}>
        <div className="space-y-4">
          <Bone className="-mx-5 aspect-square rounded-none sm:-mx-8 md:mx-0 md:rounded-sm" />
          <div className="hidden grid-cols-5 gap-3 md:grid">
            {Array.from({ length: 4 }, (_, i) => (
              <Bone key={i} className="aspect-square" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Bone className="h-3 w-40" />
          <Bone className="h-12 w-4/5 md:h-14" />
          <Bone className="h-3 w-28" />
          <Bone className="mt-8 h-10 w-44" />
          <Bone className="h-6 w-32 rounded-full" />
          <Bone className="h-12 w-full" />
          <div className="flex gap-3">
            <Bone className="h-12 flex-1" />
            <Bone className="h-12 flex-1" />
          </div>
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
