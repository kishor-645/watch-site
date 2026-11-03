const formatters = new Map<string, Intl.NumberFormat>();

export interface CurrencyOptions {
  currencyCode?: string;
  locale?: string;
}

/** Formats a whole-unit price, e.g. 42999 -> "₹42,999". Pass `settings.general` for configured currency. */
export function formatPrice(value: number, { currencyCode = "INR", locale = "en-IN" }: CurrencyOptions = {}): string {
  const key = `${locale}|${currencyCode}`;
  let f = formatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode, maximumFractionDigits: 0 });
    } catch {
      f = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
    }
    formatters.set(key, f);
  }
  return f.format(value);
}

/** The shop's time zone. Dates are always rendered in it so server and browser output match. */
export const SHOP_TIME_ZONE = "Asia/Kolkata";

export interface DateFormatOptions {
  /** IANA time zone; defaults to SHOP_TIME_ZONE. */
  timeZone?: string;
}

function formatInZone(iso: string, locale: string, timeZone: string, parts: Intl.DateTimeFormatOptions): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale, { ...parts, timeZone }).format(date);
  } catch {
    // Invalid locale/time zone from settings: fall back to the shop defaults instead of crashing a page.
    return new Intl.DateTimeFormat("en-IN", { ...parts, timeZone: SHOP_TIME_ZONE }).format(date);
  }
}

export function formatDate(iso: string, locale = "en-IN", { timeZone = SHOP_TIME_ZONE }: DateFormatOptions = {}): string {
  return formatInZone(iso, locale, timeZone, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string, locale = "en-IN", { timeZone = SHOP_TIME_ZONE }: DateFormatOptions = {}): string {
  return formatInZone(iso, locale, timeZone, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Percentage off, e.g. (80, 100) -> 20. Returns null when there is no discount. */
export function discountPercent(price: number, originalPrice: number | null | undefined): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
