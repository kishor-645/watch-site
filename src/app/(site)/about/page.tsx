import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/home/cta-band";
import { PageHero } from "@/components/home/page-hero";
import { container } from "@/components/home/section-heading";
import { TrustBar } from "@/components/home/trust-bar";
import { Reveal } from "@/components/motion/reveal";
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
      <PageHero eyebrow={general.siteName} title={about.title || "About us"} description={general.tagline || undefined} />

      {(about.imageUrl || paragraphs.length > 0) && (
        <section aria-label="Our story" className="light bg-background py-section text-foreground">
          <div
            className={cn(container, "grid gap-12 lg:gap-20", about.imageUrl && "lg:grid-cols-12 lg:items-center")}
          >
            {about.imageUrl && (
              <div className="relative lg:col-span-5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-surface-2 lg:aspect-[4/5]">
                  <Image
                    src={about.imageUrl}
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 1320px) 480px, (min-width: 1024px) 38vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            {paragraphs.length > 0 && (
              <Reveal className={cn("max-w-[42.5rem] lg:col-span-7", !about.imageUrl && "mx-auto")}>
                <p className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground">
                  {lede}
                </p>
                {rest.length > 0 && (
                  <div className="type-lede mt-8 space-y-5 text-muted-foreground">
                    {rest.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </Reveal>
            )}
          </div>
        </section>
      )}

      <TrustBar items={home.trustItems} />

      <CtaBand
        title={home.ctaTitle}
        body={home.ctaBody}
        whatsappHref={generalEnquiryUrl(settings)}
        showWhenEmpty
        withShopLink
        className="pt-0"
      />
    </>
  );
}
