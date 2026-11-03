import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "section";
}

/**
 * Fades and lifts its children in (8px) as they scroll into view. Implemented with CSS
 * scroll-driven animations (see `.reveal` in globals.css): no JavaScript, never hides
 * server-rendered content, and disabled for users who prefer reduced motion.
 * Use on section heading blocks and grid containers only — never on individual cards.
 */
export function Reveal({ children, className, as: Tag = "div" }: RevealProps) {
  return <Tag className={cn("reveal", className)}>{children}</Tag>;
}
