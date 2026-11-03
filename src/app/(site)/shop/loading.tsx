import { container } from "@/components/home/section-heading";
import { Bone, ShopBodySkeleton } from "@/components/shop/skeletons";

export default function ShopLoading() {
  return (
    <>
      <section className="border-b border-border">
        <div className={`${container} pb-10 pt-6 md:pb-14 md:pt-10`}>
          <Bone className="h-3 w-32" />
          <div className="mt-8 max-w-3xl space-y-5 md:mt-12">
            <Bone className="h-3 w-40" />
            <Bone className="h-12 w-3/5" />
            <Bone className="h-4 w-full max-w-xl" />
          </div>
        </div>
      </section>
      <div className={`${container} pt-8 md:pt-12`}>
        <ShopBodySkeleton />
      </div>
    </>
  );
}
