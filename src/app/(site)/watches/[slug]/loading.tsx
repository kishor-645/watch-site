import { Bone } from "@/components/shop/skeletons";

export default function WatchLoading() {
  return (
    <div role="status" aria-label="Loading timepiece">
      <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-6 md:pt-10 lg:px-10">
        <Bone className="h-3 w-56" />
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pb-20 pt-6 sm:px-6 md:grid-cols-2 md:gap-12 md:pt-10 lg:gap-20 lg:px-10">
        {/* Gallery */}
        <div className="space-y-4">
          <Bone className="-mx-4 aspect-square rounded-none sm:-mx-6 md:mx-0 md:rounded-lg" />
          <div className="hidden grid-cols-5 gap-3 md:grid">
            {Array.from({ length: 4 }, (_, i) => (
              <Bone key={i} className="aspect-square" />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <Bone className="h-3 w-40" />
          <Bone className="h-12 w-4/5 md:h-14" />
          <Bone className="h-4 w-48" />
          <Bone className="mt-8 h-10 w-44" />
          <div className="space-y-2.5 pt-4">
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-11/12" />
            <Bone className="h-4 w-2/3" />
          </div>
          <div className="grid grid-cols-2 gap-px pt-4 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Bone key={i} className="h-24 rounded-none" />
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <Bone className="h-12 w-36" />
            <Bone className="h-12 flex-1" />
          </div>
          <Bone className="h-12 w-full" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
