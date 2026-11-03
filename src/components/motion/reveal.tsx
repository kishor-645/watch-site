import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol" | "section" | "header" | "article";
  /** "up" (default): fade + 8px lift. "scale": fade + subtle scale-in (hero visuals, media). */
  id?: string;
}

/**
 * Fades and lifts its children in as they scroll into view. Implemented with CSS scroll-driven
 * animations (`.reveal` in globals.css): no JavaScript,
 * never hides server-rendered content, and disabled for users who prefer reduced motion.
 * Use on section heading blocks and media; for grids of cards use <Stagger>.
 */
export function Reveal({ children, className, as: Tag = "div", id }: RevealProps) {
  return (
    <Tag id={id} className={cn("reveal", className)}>
      {children}
    </Tag>
  );
}
