import { cn } from "@/lib/utils";

/** A single slowly pulsing placeholder block on the stone surface. */
export function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse bg-surface-2 [animation-duration:2s]", className)} />;
}
