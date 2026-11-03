import type { Watch } from "@/lib/types";
import { schemaAvailability } from "./availability";

/** schema.org Product + Offer structured data. Intentionally no ratings/reviews. */
export function ProductJsonLd({
  watch,
  url,
  currencyCode,
  sellerName,
  categoryLabel,
}: {
  watch: Watch;
  url: string;
  currencyCode: string;
  sellerName: string;
  categoryLabel: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: watch.name,
    description: watch.shortDescription || watch.description.slice(0, 300),
    image: watch.images.map((i) => i.url),
    sku: watch.modelNumber || watch.id,
    ...(watch.modelNumber && { mpn: watch.modelNumber }),
    category: categoryLabel,
    brand: { "@type": "Brand", name: watch.brand },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currencyCode,
      price: watch.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: schemaAvailability[watch.availability],
      seller: { "@type": "Organization", name: sellerName },
    },
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so admin-entered text can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
