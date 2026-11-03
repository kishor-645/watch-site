import { cn } from "@/lib/utils";

/** A rounded placeholder block with a slow shimmer sweep (static for reduced motion). */
export function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-xl", className)} />;
}
