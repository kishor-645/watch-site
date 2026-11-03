"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DatabaseIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "./api-client";

export function SeedCatalogButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function seed() {
    setPending(true);
    const res = await api.post<{ inserted: number }>("/api/admin/catalog/seed", {});
    setPending(false);
    if (res.ok) {
      toast.success(`Imported ${res.data.inserted} sample watches`);
      router.refresh();
      return;
    }
    if (res.error.code === "CONFLICT") {
      toast.info("The catalogue already has watches, so the samples were not imported.");
      router.refresh();
      return;
    }
    toast.error(res.error.message || "Could not import the sample watches.");
  }

  return (
    <Button type="button" variant="outline" size="lg" onClick={seed} disabled={pending}>
      {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : <DatabaseIcon aria-hidden />}
      {pending ? "Importing…" : "Import 15 sample watches"}
    </Button>
  );
}
