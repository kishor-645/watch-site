import { formatPrice } from "@/lib/format";
import type { SiteSettings, Watch } from "@/lib/types";

/**
 * The ONLY place WhatsApp links are built. Components must call these helpers with
 * `settings.contact` — never hardcode a number.
 */

export function normalizeWhatsAppNumber(input: string): string {
  return input.replace(/\D/g, "");
}

export function buildWhatsAppUrl(number: string, message?: string): string {
  const digits = normalizeWhatsAppNumber(number);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export interface EnquiryValues {
  name: string;
  brand: string;
  model: string;
  price: string;
  url: string;
}

/** Fills {name} {brand} {model} {price} {url}; drops any line whose placeholder resolves to empty. */
export function renderTemplate(template: string, values: EnquiryValues): string {
  const lines = template.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    let empty = false;
    const rendered = line.replace(/\{(name|brand|model|price|url)\}/g, (_, key: keyof EnquiryValues) => {
      const v = values[key]?.trim() ?? "";
      if (!v) empty = true;
      return v;
    });
    if (!empty) out.push(rendered);
  }
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type EnquirySettings = Pick<SiteSettings, "contact" | "general">;
type EnquiryWatch = Pick<Watch, "name" | "brand" | "modelNumber" | "price">;

/** "Check Availability" link for a watch. `productUrl` must be absolute. */
export function watchEnquiryUrl(settings: EnquirySettings, watch: EnquiryWatch, productUrl: string): string {
  const message = renderTemplate(settings.contact.whatsappTemplate, {
    name: watch.name,
    brand: watch.brand,
    model: watch.modelNumber,
    price: formatPrice(watch.price, settings.general),
    url: productUrl,
  });
  return buildWhatsAppUrl(settings.contact.whatsappNumber, message);
}

/** Generic "Chat on WhatsApp" link (header, footer, contact page, floating button). */
export function generalEnquiryUrl(settings: Pick<SiteSettings, "contact">): string {
  return buildWhatsAppUrl(settings.contact.whatsappNumber, settings.contact.generalEnquiryMessage || undefined);
}

/** "+91 90164 56462" style display for Indian numbers; otherwise "+<digits>". */
export function displayPhone(input: string): string {
  const d = normalizeWhatsAppNumber(input);
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return d ? `+${d}` : "";
}
