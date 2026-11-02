import { watches } from "@/data/watches";
import { posts } from "@/data/blog";
import type { BlogPost, Gender, Movement, Watch, WatchCategory } from "@/lib/types";

export const categoryLabels: Record<WatchCategory, string> = {
  chronograph: "Chronograph",
  diver: "Diver's",
  skeleton: "Skeleton",
  dress: "Dress",
  everyday: "Everyday Luxury",
};

export const genderLabels: Record<Gender, string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
};

export const movementLabels: Record<Movement, string> = {
  "swiss-quartz": "Swiss Quartz",
  automatic: "Automatic",
  quartz: "Quartz",
  "mechanical-hand-wound": "Mechanical Hand-Wound",
};

export function getWatchBySlug(slug: string): Watch | undefined {
  return watches.find((w) => w.slug === slug);
}

export function getWatchById(id: string): Watch | undefined {
  return watches.find((w) => w.id === id);
}

export function getFlagship(): Watch {
  return watches.find((w) => w.isFlagship) ?? watches[0];
}

export function getMostLoved(): Watch[] {
  const flagship = getFlagship();
  return [flagship, ...watches.filter((w) => w.isMostLoved && w.id !== flagship.id)];
}

export function getRelatedWatches(watch: Watch, limit = 4): Watch[] {
  const byPriceDistance = (a: Watch, b: Watch) =>
    Math.abs(a.price - watch.price) - Math.abs(b.price - watch.price);
  const others = watches.filter((w) => w.id !== watch.id);
  const sameCategory = others.filter((w) => w.category === watch.category).sort(byPriceDistance);
  const rest = others.filter((w) => w.category !== watch.category).sort(byPriceDistance);
  return [...sameCategory, ...rest].slice(0, limit);
}

export function getBrands(): string[] {
  return Array.from(new Set(watches.map((w) => w.brand))).sort((a, b) => a.localeCompare(b));
}

export function getPriceBounds(): { min: number; max: number } {
  const prices = watches.map((w) => w.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
