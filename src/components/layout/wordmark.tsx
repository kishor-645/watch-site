import { cn } from "@/lib/utils";

/** "MYWATCH" serif wordmark with a gold-gradient accent. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-2xl font-semibold tracking-[0.18em] text-foreground", className)}>
      MY<span className="text-gold-gradient">WATCH</span>
    </span>
  );
}
