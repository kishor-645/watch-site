"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { MotionConfig, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { container, ctaPrimary, ctaSecondary } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

interface HeroProps {
  name: string;
  slug: string;
  image: string;
  price: string;
  tagline: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ name, slug, image, price, tagline }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  // Only feeds scroll-linked values (identical at scroll 0 on server and client), never the render
  // tree: framer reads the media query on the first client render, so branching on it would
  // mismatch the server HTML. Entrance animations defer to MotionConfig instead.
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.05, reduce ? 1.05 : 1.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay, ease },
  });

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={ref}
        aria-labelledby="hero-heading"
        // Pull up beneath the sticky header so the hero is truly full-bleed.
        className="relative -mt-16 flex min-h-[100svh] items-end overflow-hidden bg-background lg:-mt-20 lg:items-center"
      >
        <motion.div style={{ y: imageY, scale: imageScale }} className="absolute inset-0 will-change-transform">
          <Image
            src={image}
            alt={`${name}, the MyWatch flagship chronograph`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center lg:object-[70%_center]"
          />
        </motion.div>

        {/* Legibility veils */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30 lg:hidden" />
        <div aria-hidden className="absolute inset-0 hidden bg-gradient-to-r from-background via-background/80 to-transparent lg:block" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent" />

        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className={cn(container, "relative z-10 pb-20 pt-32 lg:pb-0 lg:pt-20")}
        >
          <div className="max-w-2xl">
            <motion.p
              {...enter(0.1)}
              className="flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold"
            >
              <span aria-hidden className="h-px w-10 bg-gold/70" />
              The 2026 Flagship
            </motion.p>

            <motion.h1
              id="hero-heading"
              {...enter(0.25)}
              className="mt-6 text-[2.9rem] font-medium leading-[0.98] text-foreground sm:text-7xl lg:text-[5.5rem]"
            >
              Timeless Luxury.
              <br />
              <span className="text-gold-gradient italic">Crafted for You.</span>
            </motion.h1>

            <motion.p
              {...enter(0.45)}
              className="mt-7 max-w-lg text-base leading-relaxed text-foreground/75 sm:text-lg"
            >
              Authentic timepieces from the world&apos;s finest ateliers, curated for those who measure a
              life in moments. Hand-inspected, fully insured, delivered to your door.
            </motion.p>

            <motion.div {...enter(0.6)} className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link href={`/watches/${slug}`} className={ctaPrimary}>
                Shop the Aurora
                <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" aria-hidden />
              </Link>
              <Link href="/shop" className={ctaSecondary}>
                Explore Collection
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Flagship chip */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.9, ease }}
          className="absolute bottom-8 right-5 z-10 hidden sm:right-8 sm:block lg:bottom-12 lg:right-12"
        >
          <Link
            href={`/watches/${slug}`}
            className="group/chip flex items-center gap-5 border border-gold/25 bg-background/60 px-5 py-4 outline-none backdrop-blur-md transition-colors hover:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <span>
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">{tagline}</span>
              <span className="mt-1 block font-serif text-xl text-foreground">{name}</span>
            </span>
            <span aria-hidden className="h-10 w-px bg-gold/30" />
            <span className="font-serif text-xl font-semibold text-gold">{price}</span>
          </Link>
        </motion.div>

        {/* Scroll cue */}
        <div aria-hidden className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 lg:block motion-reduce:hidden!">
          <motion.span
            className="block h-12 w-px bg-gradient-to-b from-gold to-transparent"
            animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ originY: 0 }}
          />
        </div>
      </section>
    </MotionConfig>
  );
}
