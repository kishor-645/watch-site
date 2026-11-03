import Image from "next/image";
import Link from "next/link";
import { container } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { toParagraphs } from "@/components/site/text";
import { cn } from "@/lib/utils";

export function Story({ title, body, imageUrl }: { title: string; body: string; imageUrl: string }) {
  const paragraphs = toParagraphs(body);
  if (!title && !paragraphs.length) return null;

  return (
    <section aria-labelledby={title ? "story-heading" : undefined} aria-label={title ? undefined : "Our story"} className="border-y border-gold/10 bg-charcoal/40 py-20 lg:py-28">
      <div className={cn(container, "grid items-center gap-12 lg:gap-16", imageUrl && "lg:grid-cols-2")}>
        {imageUrl && (
          <Reveal className="relative aspect-[4/3] overflow-hidden rounded-sm border border-gold/15 lg:aspect-[5/6]">
            <Image src={imageUrl} alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </Reveal>
        )}
        <Reveal className={cn(!imageUrl && "mx-auto max-w-3xl text-center")}>
          {title && (
            <h2 id="story-heading" className="text-3xl font-medium leading-[1.08] sm:text-4xl lg:text-5xl">
              {title}
            </h2>
          )}
          <div className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Link
            href="/about"
            className="mt-8 inline-block text-[0.7rem] font-medium uppercase tracking-[0.26em] text-foreground underline decoration-gold/50 underline-offset-8 transition-colors hover:text-gold"
          >
            More about us
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
