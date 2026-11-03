import { cn } from "@/lib/utils";

interface MarqueeProps {
  /** Items in one run (rendered twice for a seamless loop; the copy is aria-hidden). */
  children: React.ReactNode;
  className?: string;
  /** Gap between items and the copies, as a CSS length. */
  gap?: string;
  /** Seconds per loop (default 40). */
  duration?: number;
  "aria-label"?: string;
}

/** Infinite horizontal ticker (brand names, press logos). Pauses on hover; static when reduced motion. */
export function Marquee({ children, className, gap = "3rem", duration = 40, ...rest }: MarqueeProps) {
  const style = { "--marquee-duration": `${duration}s`, gap } as React.CSSProperties;
  return (
    <div className={cn("marquee", className)} {...rest}>
      <div className="marquee-track" style={style}>
        <div className="flex shrink-0 items-center" style={{ gap }}>
          {children}
        </div>
        <div className="flex shrink-0 items-center" style={{ gap }} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
