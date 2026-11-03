import Image from "next/image";
import Link from "next/link";
import { SectionHeading, container } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import type { CatalogOption } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ShopByCategory({ categories }: { categories: CatalogOption[] }) {
  if (!categories.length) return null;
  const many = categories.length > 4;

  return (
    <section aria-labelledby="categories-heading" className="border-t border-gold/10 py-20 lg:py-28">
      <div className={container}>
        <Reveal>
          <SectionHeading id="categories-heading" title="Shop by category" />
        </Reveal>

        <ul
          className={cn(
            "mt-12 grid grid-cols-2 gap-3 sm:gap-4",
            many ? "md:grid-cols-3 xl:grid-cols-5" : categories.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4",
          )}
        >
          {categories.map((c) => (
            <Reveal as="li" key={c.slug} className="odd:last:col-span-2 md:odd:last:col-span-1">
              <Link
                href={`/shop?category=${encodeURIComponent(c.slug)}`}
                className="group relative flex aspect-[4/5] h-full flex-col justify-end overflow-hidden rounded-sm border border-border bg-charcoal transition-colors hover:border-gold/40"
              >
                {c.imageUrl && (
                  <Image
                    src={c.imageUrl}
                    alt=""
                    fill
                    sizes={many ? "(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw" : "(min-width: 768px) 25vw, 50vw"}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <span className="relative p-4 sm:p-5">
                  <span className="block font-serif text-2xl leading-tight text-foreground sm:text-3xl">{c.label}</span>
                  {c.description && (
                    <span className="mt-1.5 line-clamp-2 hidden text-sm leading-relaxed text-foreground/75 sm:block">
                      {c.description}
                    </span>
                  )}
                  <span aria-hidden className="mt-3 block h-px w-6 bg-gold transition-all duration-500 group-hover:w-12" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
