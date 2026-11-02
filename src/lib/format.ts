const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Formats a number as Indian rupees, e.g. 42999 -> "₹42,999". */
export function formatPrice(value: number): string {
  return inr.format(value);
}
