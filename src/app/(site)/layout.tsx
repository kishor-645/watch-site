import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getSiteSettings } from "@/server/queries/settings";

// Content comes from MongoDB (cached by tag) — render per request, never at build time.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Header settings={settings} />
      <main id="main-content" className="min-h-[60vh]">
        {children}
      </main>
      <Footer settings={settings} />
    </>
  );
}
