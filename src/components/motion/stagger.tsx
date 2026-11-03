import { cn } from "@/lib/utils";

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol" | "section";
  "aria-label"?: string;
  role?: string;
}

/**
 * Grid/list wrapper whose direct children fade + slide in as they enter the viewport, each column
 * slightly after the previous one (cascades across rows of up to 4). Pure CSS scroll-driven
 * animation (`.stagger` in motion.css): content is visible without JS, in browsers without
 * scroll timelines, and for reduced motion. Put your grid classes on it:
 *   <Stagger as="ul" className="grid grid-cols-2 gap-6 lg:grid-cols-4">{cards.map(c => <li …/>)}</Stagger>
 */
export function Stagger({ children, className, as: Tag = "div", ...rest }: StaggerProps) {
  return (
    <Tag className={cn("stagger", className)} {...rest}>
      {children}
    </Tag>
  );
}
