"use client";

import { MotionConfig, motion } from "framer-motion";

interface RevealProps {
  children: React.ReactNode;
  /** Delay in seconds before the reveal starts. */
  delay?: number;
  className?: string;
}

/**
 * Fades and lifts its children into view once, the first time they scroll into the viewport.
 * Reduced motion is handled by MotionConfig (transform skipped, fade kept) rather than by
 * branching the render tree, which would mismatch the server HTML during hydration.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
