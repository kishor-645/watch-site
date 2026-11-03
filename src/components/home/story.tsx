import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { container, textLink } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { toParagraphs } from "@/components/site/text";
import { cn } from "@/lib/utils";

export function Story({ title, body, imageUrl }: { title: string; body: string; imageUrl: string }) {
  const paragraphs = toParagraphs(body);
  if (!title && !paragraphs.length) return null;

  return (
    <section
      aria-labelledby={title ? "story-heading" : undefined}
      aria-label={title ? undefined : "Our story"}
      className="bg-surface-2 py-section"
    >
      <div className={cn(container, "grid items-center gap-10 lg:gap-24", imageUrl && "lg:grid-cols-2")}>
        {imageUrl && (
          <div className="relative aspect-[4/3] overflow-hidden bg-background lg:aspect-[4/5]">
            <Image src={imageUrl} alt="" fill sizes="(min-width: 1320px) 570px, (min-width: 1024px) 44vw, 100vw" className="object-cover" />
          </div>
        )}
        <Reveal className={cn("max-w-[60ch]", !imageUrl && "mx-auto text-center")}>
          {title && (
            <h2 id="story-heading" className="type-h2 text-foreground">
              {title}
            </h2>
          )}
          <div className="type-body mt-6 space-y-5 text-muted-foreground">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Link href="/about" className={cn(textLink, "mt-8")}>
            More about us
            <ArrowRight className="size-4 transition-transform duration-150 group-hover/link:translate-x-0.5" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
