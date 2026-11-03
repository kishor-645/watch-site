import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AccentTitle, container, ctaPrimary } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { toParagraphs } from "@/components/site/text";
import { cn } from "@/lib/utils";

/** Warm cream editorial band (`.light` scope) for contrast against the midnight page. */
export function Story({ title, body, imageUrl }: { title: string; body: string; imageUrl: string }) {
  const paragraphs = toParagraphs(body);
  if (!title && !paragraphs.length) return null;
  const [lede, ...rest] = paragraphs;

  return (
    <section
      aria-labelledby={title ? "story-heading" : undefined}
      aria-label={title ? undefined : "Our story"}
      className="light relative overflow-hidden bg-background py-section text-foreground"
    >
      <div className={cn(container, "grid items-center gap-12 lg:gap-20", imageUrl && "lg:grid-cols-12")}>
        {imageUrl && (
          <div className="relative lg:col-span-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-surface-2 lg:aspect-[5/6]">
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes="(min-width: 1320px) 600px, (min-width: 1024px) 48vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}
        <Reveal className={cn("max-w-[60ch] lg:col-span-6", !imageUrl && "mx-auto text-center")}>
          {title && (
            <h2 id="story-heading" className="type-h2 text-balance text-foreground">
              <AccentTitle text={title} tone="plain" />
            </h2>
          )}
          {lede && <p className="type-lede mt-7 text-foreground">{lede}</p>}
          {rest.length > 0 && (
            <div className="type-body mt-5 space-y-5 text-muted-foreground">
              {rest.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          <Link href="/about" className={cn(ctaPrimary, "mt-10 shadow-none hover:shadow-none")}>
            More about us
            <ArrowUpRight
              aria-hidden
              className="size-4 transition-transform duration-300 ease-quiet group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
