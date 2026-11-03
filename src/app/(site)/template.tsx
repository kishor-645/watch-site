import { PageTransition } from "@/components/motion/page-transition";

/**
 * Re-mounts on every navigation within the public site, replaying a subtle fade/lift (`.page-transition`
 * in motion.css) on client-side navigations. Opacity/transform only, so no layout shift; disabled for
 * reduced motion. The initial document load is not animated, so the LCP element paints right away.
 */
export default function SiteTemplate({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PageTransition>{children}</PageTransition>;
}
