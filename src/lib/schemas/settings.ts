import { z } from "zod";
import { imageUrlSchema, slugSchema } from "./watch";

const text = (max: number) => z.string().trim().max(max);
const optionalImage = z.union([z.literal(""), imageUrlSchema]).default("");
const optionalUrl = z
  .union([z.literal(""), z.url({ protocol: /^https?$/, message: "Enter a full URL starting with https://" })])
  .default("");

/** Accepts "+91 90164 56462", "919016456462" etc. and stores digits only (wa.me format). */
export const whatsappNumberSchema = z
  .string()
  .transform((s) => s.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{8,15}$/, "Enter the number with country code, e.g. +91 9016456462"));

export const catalogOptionSchema = z.object({
  slug: slugSchema,
  label: z.string().trim().min(1).max(40),
  description: text(300).default(""),
  imageUrl: optionalImage,
});

export const trustItemSchema = z.object({
  title: z.string().trim().min(1).max(60),
  description: text(160).default(""),
});

/** Placeholders: {name} {brand} {model} {price} {url}. Lines whose placeholder is empty are dropped. */
export const DEFAULT_WHATSAPP_TEMPLATE = [
  "Hello, I am interested in this watch.",
  "",
  "Watch: {name}",
  "Brand: {brand}",
  "Model: {model}",
  "Price: {price}",
  "",
  "Please confirm its availability.",
  "",
  "Product URL: {url}",
].join("\n");

export const siteSettingsSchema = z.object({
  general: z
    .object({
      siteName: z.string().trim().min(1).max(60).default("MyWatch"),
      tagline: text(120).default(""),
      logoUrl: optionalImage,
      currencyCode: z.string().trim().length(3).toUpperCase().default("INR"),
      locale: z.string().trim().min(2).max(20).default("en-IN"),
    })
    .prefault({}),
  contact: z
    .object({
      whatsappNumber: whatsappNumberSchema.default("919016456462"),
      whatsappTemplate: text(1000).default(DEFAULT_WHATSAPP_TEMPLATE),
      generalEnquiryMessage: text(300).default("Hello, I would like to know more about your watches."),
      phone: text(30).default(""),
      email: z.union([z.literal(""), z.email("Enter a valid email")]).default(""),
      address: text(300).default(""),
      mapUrl: optionalUrl,
      businessHours: text(120).default(""),
    })
    .prefault({}),
  social: z
    .object({
      instagram: optionalUrl,
      facebook: optionalUrl,
      youtube: optionalUrl,
      x: optionalUrl,
    })
    .prefault({}),
  seo: z
    .object({
      title: text(70).default(""),
      description: text(170).default(""),
      ogImageUrl: optionalImage,
    })
    .prefault({}),
  home: z
    .object({
      heroEyebrow: text(60).default(""),
      heroTitle: text(120).default(""),
      heroSubtitle: text(300).default(""),
      /** Slug of the watch shown in the hero; empty = first featured watch. */
      heroWatchSlug: z.union([z.literal(""), slugSchema]).default(""),
      heroImageUrl: optionalImage,
      featuredTitle: text(80).default(""),
      featuredSubtitle: text(200).default(""),
      storyTitle: text(100).default(""),
      storyBody: text(2000).default(""),
      storyImageUrl: optionalImage,
      trustItems: z.array(trustItemSchema).max(6).default([]),
      ctaTitle: text(100).default(""),
      ctaBody: text(300).default(""),
    })
    .prefault({}),
  about: z
    .object({
      title: text(100).default(""),
      body: text(6000).default(""),
      imageUrl: optionalImage,
    })
    .prefault({}),
  footer: z
    .object({
      blurb: text(300).default(""),
      copyright: text(120).default(""),
    })
    .prefault({}),
  catalog: z
    .object({
      categories: z.array(catalogOptionSchema).min(1).max(30),
      movements: z.array(catalogOptionSchema.pick({ slug: true, label: true })).min(1).max(20),
    })
    .superRefine((c, ctx) => {
      for (const key of ["categories", "movements"] as const) {
        const seen = new Set<string>();
        c[key].forEach((o, i) => {
          if (seen.has(o.slug)) ctx.addIssue({ code: "custom", path: [key, i, "slug"], message: "Duplicate slug" });
          seen.add(o.slug);
        });
      }
    }),
});

export type SiteSettingsInput = z.input<typeof siteSettingsSchema>;
export type SiteSettings = z.output<typeof siteSettingsSchema>;
export type CatalogOption = z.output<typeof catalogOptionSchema>;

export function optionLabel(options: readonly { slug: string; label: string }[], slug: string): string {
  return options.find((o) => o.slug === slug)?.label ?? slug;
}
