import type { Watch } from "@/lib/types";

/** schema.org Product structured data for rich results. */
export function ProductJsonLd({ watch, url }: { watch: Watch; url: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: watch.name,
    description: watch.shortDescription,
    image: watch.images,
    sku: watch.id,
    category: "Watches",
    brand: { "@type": "Brand", name: watch.brand },
    aggregateRating: watch.reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: watch.rating,
          reviewCount: watch.reviewCount,
          bestRating: 5,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: watch.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: watch.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "MyWatch" },
    },
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so description text can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
