export type WatchCategory = "chronograph" | "diver" | "skeleton" | "dress" | "everyday";
export type Gender = "men" | "women" | "unisex";
export type Movement = "swiss-quartz" | "automatic" | "quartz" | "mechanical-hand-wound";

export interface WatchSpecs {
  caseSize: string; // e.g. "41mm"
  caseMaterial: string;
  movement: string; // human readable, e.g. "Swiss quartz chronograph"
  waterResistance: string; // e.g. "100m"
  crystal: string;
  dial: string;
  strap: string;
  thickness?: string;
  lugWidth?: string;
  powerReserve?: string;
  warranty: string;
}

export interface Watch {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: WatchCategory;
  gender: Gender;
  movementType: Movement;
  price: number; // INR
  compareAtPrice?: number; // INR, original price if on sale
  rating: number; // 0-5
  reviewCount: number;
  images: string[]; // first = primary, second = hover image
  shortDescription: string;
  description: string; // may contain paragraphs separated by \n\n
  features: string[];
  specs: WatchSpecs;
  inStock: boolean;
  isFlagship?: boolean;
  isMostLoved?: boolean;
  isNew?: boolean;
  tags?: string[];
}

export interface Collection {
  slug: WatchCategory;
  title: string;
  description: string;
  image: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // paragraphs separated by \n\n
  coverImage: string;
  author: string;
  date: string; // ISO date
  readingTime: string;
  category: string;
}

export interface CartItem {
  watchId: string;
  quantity: number;
}
