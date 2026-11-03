import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/home/page-hero";
import { container, ctaSecondary } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { toParagraphs } from "@/components/site/text";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
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
  const { about, general } = settings;
  const paragraphs = toParagraphs(about.body);

  return (
    <>
      <PageHero eyebrow={general.siteName} title={about.title || "About us"} description={general.tagline || undefined} />

      <section
        aria-label="Our story"
        className={cn(container, "grid gap-12 py-16 lg:gap-16 lg:py-24", about.imageUrl && "lg:grid-cols-2 lg:items-start")}
      >
        {about.imageUrl && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-gold/15 lg:sticky lg:top-28 lg:aspect-[4/5]">
            <Image
              src={about.imageUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 600px, (min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className={cn("space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg", !about.imageUrl && "mx-auto max-w-3xl")}>
          {paragraphs.length ? (
            paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "text-foreground/90" : undefined}>
                {p}
              </p>
            ))
          ) : (
            <p>Have a question about us or a particular watch? We would be glad to help.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="about-cta" className={cn(container, "text-center")}>
        <Reveal className="rounded-sm border border-gold/20 bg-charcoal px-6 py-14 sm:px-12">
          <h2 id="about-cta" className="mx-auto max-w-2xl text-3xl font-medium leading-tight sm:text-4xl">
            Get in touch
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Ask about a watch, request more photos or get advice on sizing — we reply personally.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <WhatsAppLink href={generalEnquiryUrl(settings)}>Chat on WhatsApp</WhatsAppLink>
            <Link href="/shop" className={ctaSecondary}>
              Explore the collection
              <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
