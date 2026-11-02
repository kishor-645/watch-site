import { Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoryLabels, genderLabels, movementLabels } from "@/lib/catalog";
import type { Watch, WatchSpecs } from "@/lib/types";

const specLabels: Record<keyof WatchSpecs, string> = {
  caseSize: "Case size",
  caseMaterial: "Case material",
  movement: "Movement",
  waterResistance: "Water resistance",
  crystal: "Crystal",
  dial: "Dial",
  strap: "Strap",
  thickness: "Thickness",
  lugWidth: "Lug width",
  powerReserve: "Power reserve",
  warranty: "Warranty",
};

const triggerClass =
  "h-auto flex-none rounded-none border-0 px-0 pb-4 pt-0 text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground data-active:text-gold after:bg-gold group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-px";

export function ProductTabs({ watch }: { watch: Watch }) {
  const paragraphs = watch.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const rows: { label: string; value: string }[] = [
    { label: "Brand", value: watch.brand },
    { label: "Reference", value: watch.id.toUpperCase() },
    { label: "Collection", value: categoryLabels[watch.category] },
    { label: "Gender", value: genderLabels[watch.gender] },
    { label: "Movement type", value: movementLabels[watch.movementType] },
    ...(Object.keys(specLabels) as (keyof WatchSpecs)[])
      .filter((k) => watch.specs[k])
      .map((k) => ({ label: specLabels[k], value: watch.specs[k] as string })),
  ];

  return (
    <Tabs defaultValue="description" className="gap-10">
      <TabsList
        variant="line"
        className="h-auto! w-full justify-start gap-10 rounded-none border-b border-border p-0"
      >
        <TabsTrigger value="description" className={triggerClass}>
          Description
        </TabsTrigger>
        <TabsTrigger value="details" className={triggerClass}>
          Technical Details
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="text-base">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div className="space-y-5 leading-relaxed text-foreground/80">
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.85] first-letter:text-gold" : undefined}>
                {p}
              </p>
            ))}
          </div>
          {watch.features.length > 0 && (
            <div>
              <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Highlights</h3>
              <ul className="mt-6 space-y-4">
                {watch.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.75} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="details">
        <dl className="grid border-t border-border md:grid-cols-2 md:gap-x-16">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between gap-6 border-b border-border py-4"
            >
              <dt className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{r.label}</dt>
              <dd className="text-right text-sm text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>
      </TabsContent>
    </Tabs>
  );
}
