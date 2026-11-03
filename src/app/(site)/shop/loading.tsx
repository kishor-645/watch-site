import { Bone, ShopBodySkeleton } from "@/components/shop/skeletons";

export default function ShopLoading() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14 lg:px-10">
          <Bone className="h-3 w-32" />
          <div className="mt-10 max-w-3xl space-y-5 md:mt-14">
            <Bone className="h-3 w-40" />
            <Bone className="h-12 w-4/5 md:h-16" />
            <Bone className="h-4 w-full max-w-xl" />
            <Bone className="h-4 w-2/3 max-w-md" />
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 md:pt-14 lg:px-10">
        <ShopBodySkeleton />
      </div>
    </>
  );
}
