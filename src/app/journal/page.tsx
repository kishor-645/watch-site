import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { posts } from "@/data/blog";
import { PageHero } from "@/components/home/page-hero";
import { PostMeta } from "@/components/home/post-meta";
import { container } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "The Journal",
  description:
    "Stories from the MyWatch atelier: buying guides, watchmaking craft, care advice and the culture of fine timekeeping.",
  alternates: { canonical: "/journal" },
};

export default function JournalPage() {
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  const [featured, ...rest] = sorted;

  return (
    <>
      <PageHero
        eyebrow="The Journal"
        title={
          <>
            Notes on <span className="italic text-gold-gradient">fine time</span>
          </>
        }
        description="Guides, craft and culture from the people who inspect every watch we sell."
      />

      <div className={cn(container, "pt-20 lg:pt-28")}>
        {featured && (
          <Reveal>
            <article className="group relative grid overflow-hidden rounded-sm border border-border bg-charcoal/50 transition-colors hover:border-gold/30 lg:grid-cols-2">
              <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[28rem]">
                <Image
                  src={featured.coverImage}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-gold">Featured story</p>
                <PostMeta className="mt-4" category={featured.category} date={featured.date} readingTime={featured.readingTime} />
                <h2 className="mt-5 text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">
                  <Link
                    href={`/journal/${featured.slug}`}
                    className="outline-none after:absolute after:inset-0 group-hover:text-gold-light focus-visible:underline focus-visible:decoration-gold"
                  >
                    {featured.title}
                  </Link>
                </h2>
                <p className="mt-5 leading-relaxed text-muted-foreground">{featured.excerpt}</p>
                <p className="mt-8 inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-foreground" aria-hidden>
                  Read the story
                  <ArrowRight className="size-4 text-gold transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </article>
          </Reveal>
        )}

        {rest.length > 0 && (
          <ul className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <li key={post.slug}>
                <Reveal delay={i * 0.08} className="h-full">
                  <article className="group relative flex h-full flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border transition-colors group-hover:border-gold/30">
                      <Image
                        src={post.coverImage}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                      />
                    </div>
                    <PostMeta className="mt-6" category={post.category} date={post.date} readingTime={post.readingTime} />
                    <h2 className="mt-3 text-2xl font-medium leading-snug">
                      <Link
                        href={`/journal/${post.slug}`}
                        className="outline-none after:absolute after:inset-0 group-hover:text-gold-light focus-visible:underline focus-visible:decoration-gold"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
