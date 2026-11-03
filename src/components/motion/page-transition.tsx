"use client";

import { useEffect, useState } from "react";

// Set once the first page has hydrated: every later mount of the site template is a client-side
// navigation and gets the transition; the initial document load never does.
let hydrated = false;

/**
 * Wrapper for (site)/template.tsx. Plays the `.page-transition` fade/lift (motion.css) on client-side
 * navigations only. On the initial load the content paints immediately: starting it at opacity 0
 * would hold back the first paint of the LCP element (hero / gallery image) until the fade ends.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  // Decided once per mount, so a re-render of the first page never starts the animation late.
  const [animate] = useState(() => hydrated);
  useEffect(() => {
    hydrated = true;
  }, []);
  return <div className={animate ? "page-transition" : undefined}>{children}</div>;
}
