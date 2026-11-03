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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
}

/**
 * Numeric date parts in the given zone. Only numbers come from Intl — they are identical in Node
 * and every browser — while words/punctuation are added here. Locale-formatted output (e.g. "pm"
 * vs "PM", narrow no-break spaces) differs between ICU builds and caused hydration mismatches.
 */
function zonedParts(date: Date, timeZone: string): ZonedParts {
  let fmt: Intl.DateTimeFormat;
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  };
  try {
    fmt = new Intl.DateTimeFormat("en-US", { ...opts, timeZone });
  } catch {
    fmt = new Intl.DateTimeFormat("en-US", { ...opts, timeZone: SHOP_TIME_ZONE });
  }
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(fmt.formatToParts(date).find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute") };
}

function toDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "3 Nov 2026" in the shop's time zone. `_locale` is accepted for call-compatibility. */
export function formatDate(iso: string, _locale = "en-IN", { timeZone = SHOP_TIME_ZONE }: DateFormatOptions = {}): string {
  const date = toDate(iso);
  if (!date) return "";
  const p = zonedParts(date, timeZone);
  return `${p.day} ${MONTHS[p.month - 1]} ${p.year}`;
}

/** "3 Nov 2026, 02:46 pm" in the shop's time zone — identical on server and client. */
export function formatDateTime(iso: string, _locale = "en-IN", { timeZone = SHOP_TIME_ZONE }: DateFormatOptions = {}): string {
  const date = toDate(iso);
  if (!date) return "";
  const p = zonedParts(date, timeZone);
  const h12 = p.hour % 12 || 12;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.day} ${MONTHS[p.month - 1]} ${p.year}, ${pad(h12)}:${pad(p.minute)} ${p.hour < 12 ? "am" : "pm"}`;
}

/** Percentage off, e.g. (80, 100) -> 20. Returns null when there is no discount. */
export function discountPercent(price: number, originalPrice: number | null | undefined): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
