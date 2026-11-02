import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { posts } from "@/data/blog";
import { getPostBySlug } from "@/lib/catalog";
import { PostMeta, formatPostDate } from "@/components/home/post-meta";
import { container, ctaPrimary } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Story not found" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: post.coverImage, alt: post.title }],
    },
  };
}

export default async function JournalPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const paragraphs = post.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <article>
      <header className={cn(container, "pt-12 text-center sm:pt-16 lg:pt-20")}>
        <nav aria-label="Breadcrumb" className="flex justify-center">
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 rounded-sm text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted-foreground outline-none transition-colors hover:text-gold focus-visible:text-gold focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            The Journal
          </Link>
        </nav>
        <PostMeta className="mt-10 justify-center" category={post.category} date={post.date} readingTime={post.readingTime} />
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-medium leading-[1.05] sm:text-6xl lg:text-7xl">{post.title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <p className="mt-8 text-sm text-muted-foreground">
          By <span className="text-foreground">{post.author}</span>
        </p>
      </header>

      <div className={cn(container, "mt-12 lg:mt-16")}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-gold/15 sm:aspect-[21/9]">
          <Image src={post.coverImage} alt={post.title} fill priority sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
        </div>
      </div>

      <div className={cn(container, "py-16 lg:py-24")}>
        <div className="mx-auto max-w-2xl">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={cn(
                "mb-7 text-[1.05rem] leading-[1.85] text-foreground/85 sm:text-lg",
                i === 0 &&
                  "first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-gold",
              )}
            >
              {p}
            </p>
          ))}

          <div className="mt-14 flex flex-col items-center gap-6 border-t border-gold/20 pt-10 text-center">
            <p className="text-sm text-muted-foreground">
              Published {formatPostDate(post.date)} by {post.author}
            </p>
            <Link href="/shop" className={ctaPrimary}>
              Explore the collection
              <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <aside aria-labelledby="more-heading" className="border-t border-gold/10 bg-charcoal/40 py-20 lg:py-24">
          <div className={container}>
            <h2 id="more-heading" className="text-3xl font-medium sm:text-4xl">
              More from the Journal
            </h2>
            <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <li key={p.slug}>
                  <article className="group relative">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border transition-colors group-hover:border-gold/30">
                      <Image
                        src={p.coverImage}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                      />
                    </div>
                    <PostMeta className="mt-5" category={p.category} date={p.date} readingTime={p.readingTime} />
                    <h3 className="mt-3 text-2xl font-medium leading-snug">
                      <Link
                        href={`/journal/${p.slug}`}
                        className="outline-none after:absolute after:inset-0 group-hover:text-gold-light focus-visible:underline focus-visible:decoration-gold"
                      >
                        {p.title}
                      </Link>
                    </h3>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </article>
  );
}
