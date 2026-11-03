import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** 404 for notFound() inside public pages (e.g. unknown watch) — rendered with header/footer. */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
