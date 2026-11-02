import type { Collection } from "@/lib/types";

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

export const collections: Collection[] = [
  {
    slug: "chronograph",
    title: "Chronograph",
    description:
      "Precision timing with motorsport soul — from integrated-bracelet sports-luxe to classic panda dials.",
    image: img("1539874754764-5a96559165b0"),
  },
  {
    slug: "diver",
    title: "Diver's",
    description:
      "Built for the deep, worn everywhere. Unidirectional bezels, luminous dials and serious water resistance.",
    image: img("1594534475808-b18fc33b045e"),
  },
  {
    slug: "skeleton",
    title: "Skeleton",
    description:
      "Mechanical theatre on the wrist. Openworked dials that reveal the beating heart of fine watchmaking.",
    image: img("1524805444758-089113d48a6d"),
  },
  {
    slug: "everyday",
    title: "Everyday Luxury",
    description:
      "Versatile, refined and endlessly wearable — the watches you reach for without a second thought.",
    image: img("1508057198894-247b23fe5ade"),
  },
  {
    slug: "dress",
    title: "Dress",
    description:
      "Slim, quiet and impeccably finished. Timepieces made to slip beneath a cuff and shine after dark.",
    image: img("1619134778706-7015533a6150"),
  },
];
