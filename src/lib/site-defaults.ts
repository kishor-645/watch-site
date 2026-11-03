import { DEFAULT_WHATSAPP_TEMPLATE, type SiteSettings } from "@/lib/schemas/settings";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;

/**
 * Used until the admin saves settings for the first time, and merged under stored settings
 * so that fields added in later releases always have a value. Edit in Admin → Settings.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    siteName: "MyWatch",
    tagline: "Timeless watches, personally curated.",
    logoUrl: "",
    currencyCode: "INR",
    locale: "en-IN",
  },
  contact: {
    whatsappNumber: "919016456462",
    whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
    generalEnquiryMessage: "Hello, I would like to know more about your watches.",
    phone: "+91 90164 56462",
    email: "",
    address: "",
    mapUrl: "",
    businessHours: "Mon–Sat, 10:00–19:00 IST",
  },
  social: { instagram: "", facebook: "", youtube: "", x: "" },
  seo: {
    title: "MyWatch — Timeless watches, personally curated",
    description:
      "Discover chronographs, divers, skeleton and dress watches. Check availability instantly on WhatsApp.",
    ogImageUrl: "",
  },
  home: {
    heroEyebrow: "The Collection",
    heroTitle: "Watches chosen with care",
    heroSubtitle:
      "A focused collection of chronographs, divers, skeleton and dress watches. Ask us anything on WhatsApp — we reply personally.",
    heroWatchSlug: "",
    heroImageUrl: "",
    featuredTitle: "Featured watches",
    featuredSubtitle: "Pieces our clients ask about most.",
    storyTitle: "Our approach",
    storyBody:
      "We keep our collection small so that every watch can be checked, described honestly and explained properly.\n\nTell us what you are looking for and we will help you find the right piece — no pressure, just straightforward advice.",
    storyImageUrl: unsplash("1524805444758-089113d48a6d"),
    trustItems: [
      { title: "Genuine watches", description: "Every piece is checked before it is listed" },
      { title: "Personal advice", description: "Talk to us directly on WhatsApp" },
      { title: "Secure delivery", description: "Carefully packed and tracked" },
      { title: "After-sales support", description: "Help with sizing, servicing and care" },
    ],
    ctaTitle: "Have a question about a watch?",
    ctaBody: "Message us on WhatsApp for availability, pricing or a closer look.",
  },
  about: {
    title: "About us",
    body:
      "We are a small, independent watch retailer. Our aim is simple: offer well-made watches, describe them accurately and give every customer honest, personal service.\n\nIf you would like more photos, a video or advice on sizing, just message us on WhatsApp.",
    imageUrl: unsplash("1612817159949-195b6eb9e31a"),
  },
  footer: {
    blurb: "Timeless watches, personally curated. Enquire about any piece on WhatsApp.",
    copyright: "",
  },
  catalog: {
    categories: [
      {
        slug: "chronograph",
        label: "Chronograph",
        description: "Precision timing with motorsport character.",
        imageUrl: unsplash("1539874754764-5a96559165b0"),
      },
      {
        slug: "diver",
        label: "Diver",
        description: "Unidirectional bezels, luminous dials and serious water resistance.",
        imageUrl: unsplash("1594534475808-b18fc33b045e"),
      },
      {
        slug: "skeleton",
        label: "Skeleton",
        description: "Open-worked dials that reveal the movement.",
        imageUrl: unsplash("1524805444758-089113d48a6d"),
      },
      {
        slug: "dress",
        label: "Dress",
        description: "Slim, quiet and refined.",
        imageUrl: unsplash("1619134778706-7015533a6150"),
      },
      {
        slug: "everyday",
        label: "Everyday",
        description: "Versatile watches for daily wear.",
        imageUrl: unsplash("1508057198894-247b23fe5ade"),
      },
    ],
    movements: [
      { slug: "automatic", label: "Automatic" },
      { slug: "mechanical-hand-wound", label: "Hand-wound" },
      { slug: "swiss-quartz", label: "Swiss Quartz" },
      { slug: "quartz", label: "Quartz" },
    ],
  },
};
