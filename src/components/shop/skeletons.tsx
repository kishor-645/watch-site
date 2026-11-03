import { cn } from "@/lib/utils";

/** A single pulsing placeholder block. */
export function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-muted/50", className)} />;
}
