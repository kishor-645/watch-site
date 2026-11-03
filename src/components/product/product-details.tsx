import { toParagraphs } from "@/components/site/text";
import { genderLabels, specLabels, type WatchSpecs } from "@/lib/schemas/watch";
import type { Watch } from "@/lib/types";

/** Description paragraphs + full specification table. */
export function ProductDetails({
  watch,
  categoryLabel,
  movementLabel,
}: {
  watch: Watch;
  categoryLabel: string;
  movementLabel: string;
}) {
  const paragraphs = toParagraphs(watch.description);

  const rows: { label: string; value: string }[] = [
    { label: "Brand", value: watch.brand },
    { label: "Reference", value: watch.modelNumber },
    { label: "Collection", value: categoryLabel },
    { label: "Movement type", value: movementLabel },
    { label: "Gender", value: genderLabels[watch.gender] },
    ...(Object.keys(specLabels) as (keyof WatchSpecs)[]).map((k) => ({ label: specLabels[k], value: watch.specs[k] })),
    ...watch.extraSpecs,
  ].filter((r) => r.value && r.value.trim());

  return (
    <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
      {paragraphs.length > 0 && (
        <section aria-labelledby="description-heading">
          <h2 id="description-heading" className="text-3xl font-light sm:text-4xl">
            About this watch
          </h2>
          <div className="mt-6 max-w-prose space-y-5 leading-relaxed text-foreground/80">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="specs-heading" className={paragraphs.length ? undefined : "lg:col-span-2"}>
        <h2 id="specs-heading" className="text-3xl font-light sm:text-4xl">
          Specifications
        </h2>
        <table className="mt-6 w-full border-t border-border text-sm">
          <caption className="sr-only">{watch.name} specifications</caption>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.label}-${i}`} className="border-b border-border">
                <th
                  scope="row"
                  className="w-2/5 py-3.5 pr-6 text-left align-top text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground"
                >
                  {r.label}
                </th>
                <td className="py-3.5 text-foreground">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
