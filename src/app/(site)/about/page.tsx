import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/home/cta-band";
import { PageHero } from "@/components/home/page-hero";
import { container } from "@/components/home/section-heading";
import { toParagraphs } from "@/components/site/text";
import { cn } from "@/lib/utils";
import { generalEnquiryUrl } from "@/lib/whatsapp";
import { getSiteSettings } from "@/server/queries/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { about, general } = await getSiteSettings();
  return {
    title: about.title || "About us",
    description: toParagraphs(about.body)[0]?.slice(0, 170) || `About ${general.siteName}.`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const { about, general, home } = settings;
  const paragraphs = toParagraphs(about.body);
  const [lede, ...rest] = paragraphs;

  return (
    <>
      <PageHero title={about.title || "About us"} description={general.tagline || undefined} />

      {(about.imageUrl || paragraphs.length > 0) && (
        <section
          aria-label="Our story"
          className={cn(container, "grid gap-10 py-section lg:gap-16 xl:gap-24", about.imageUrl && "lg:grid-cols-12 lg:items-start")}
        >
          {about.imageUrl && (
            <div className="relative aspect-[4/3] overflow-hidden bg-surface-2 lg:sticky lg:top-24 lg:col-span-5 lg:aspect-[4/5]">
              <Image
                src={about.imageUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 1320px) 480px, (min-width: 1024px) 38vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
          {paragraphs.length > 0 && (
            <div className={cn("max-w-[42.5rem] lg:col-span-7 lg:pt-2", !about.imageUrl && "mx-auto")}>
              <p className="type-lede text-foreground">{lede}</p>
              {rest.length > 0 && (
                <div className="type-body mt-6 space-y-5 text-muted-foreground">
                  {rest.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <CtaBand
        title={home.ctaTitle}
        body={home.ctaBody}
        whatsappHref={generalEnquiryUrl(settings)}
        showWhenEmpty
        withShopLink
      />
    </>
  );
}
