/**
 * Enumerations and display labels with NO zod import, so client components on public pages can use
 * them without shipping the validation library. `src/lib/schemas/watch.ts` re-exports these.
 */

export const AVAILABILITY = ["in_stock", "limited", "pre_order", "sold_out"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const availabilityLabels: Record<Availability, string> = {
  in_stock: "In stock",
  limited: "Limited stock",
  pre_order: "Available to order",
  sold_out: "Sold out",
};

/** Availabilities that count as "available" on the dashboard and the "in stock" shop filter. */
export const AVAILABLE_STATES: readonly Availability[] = ["in_stock", "limited", "pre_order"];

export const GENDERS = ["men", "women", "unisex"] as const;
export type Gender = (typeof GENDERS)[number];

export const genderLabels: Record<Gender, string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
};
