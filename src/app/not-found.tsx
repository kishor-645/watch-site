import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/layout/wordmark";
import { NotFoundContent } from "@/components/site/not-found-content";
import { getSiteSettings } from "@/server/queries/settings";

// Reads settings: render per request (never prerendered at build with default settings).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/**
 * Root 404 for unmatched URLs. Rendered inside the root layout only (no site header/footer),
 * so it carries its own minimal branding. getSiteSettings() never throws (defaults on failure).
 */
export default async function NotFound() {
  const { general } = await getSiteSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-[82.5rem] items-center px-5 sm:px-8 lg:h-[76px] lg:px-12">
          <Link href="/" aria-label={`${general.siteName} — home`} className="rounded-sm">
            <Brand siteName={general.siteName} logoUrl={general.logoUrl} className="text-xl sm:text-2xl" />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center">
        <NotFoundContent />
      </main>
    </div>
  );
}
