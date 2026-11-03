import { toParagraphs } from "@/components/site/text";
import { genderLabels, specLabels, type WatchSpecs } from "@/lib/schemas/watch";
import type { Watch } from "@/lib/types";
import { cn } from "@/lib/utils";

type Row = { label: string; value: string };

const spec = (watch: Watch, keys: (keyof WatchSpecs)[]): Row[] =>
  keys.map((k) => ({ label: specLabels[k], value: watch.specs[k] }));

/** Description paragraphs + the specification panel, grouped by topic (empty groups are omitted). */
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

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: "Overview",
      rows: [
        { label: "Brand", value: watch.brand },
        { label: "Reference", value: watch.modelNumber },
        { label: "Collection", value: categoryLabel },
        { label: "Gender", value: genderLabels[watch.gender] },
      ],
    },
    {
      title: "Case and dial",
      rows: spec(watch, ["caseSize", "caseMaterial", "thickness", "lugWidth", "crystal", "waterResistance", "dialColour"]),
    },
    {
      title: "Movement",
      rows: [{ label: "Movement type", value: movementLabel }, ...spec(watch, ["movementDetail", "powerReserve"])],
    },
    { title: "Strap", rows: spec(watch, ["strapMaterial"]) },
    { title: "Warranty", rows: spec(watch, ["warranty"]) },
    { title: "Additional", rows: watch.extraSpecs },
  ]
    .map((g) => ({ ...g, rows: g.rows.filter((r) => r.value && r.value.trim()) }))
    .filter((g) => g.rows.length > 0);

  return (
    <div className={cn("grid gap-14 lg:gap-16", paragraphs.length > 0 && "lg:grid-cols-[5fr_7fr]")}>
      {paragraphs.length > 0 && (
        <section aria-labelledby="description-heading">
          <h2 id="description-heading" className="type-h2 text-foreground">
            About this watch
          </h2>
          <div className="type-body mt-6 max-w-[62ch] space-y-5 text-foreground/85">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="specs-heading">
        <h2 id="specs-heading" className="type-h2 text-foreground">
          Specifications
        </h2>
        <div
          className={cn(
            "mt-6 gap-x-10 bg-card p-6 sm:p-8 [&>table]:mb-8 [&>table]:break-inside-avoid [&>table:last-child]:mb-0",
            paragraphs.length > 0 ? "xl:columns-2" : "md:columns-2",
          )}
        >
          {groups.map((g) => (
            <table key={g.title} className="w-full text-left">
              <caption className="eyebrow pb-2 text-left text-muted-foreground">
                {g.title}
                <span className="sr-only"> — {watch.name} specifications</span>
              </caption>
              <tbody>
                {g.rows.map((r, i) => (
                  <tr key={`${r.label}-${i}`} className="border-b border-border last:border-b-0">
                    <th scope="row" className="w-2/5 py-3 pr-4 align-top text-[0.8125rem] font-normal text-muted-foreground">
                      {r.label}
                    </th>
                    <td className="py-3 align-top text-[0.9375rem] text-foreground [overflow-wrap:anywhere]">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      </section>
    </div>
  );
}
