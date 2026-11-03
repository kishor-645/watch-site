import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-parts";
import { WatchForm } from "@/components/admin/watch-form";
import { requireAdminPage } from "@/server/auth/session";
import { loadWatchFormData } from "../form-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add watch",
  robots: { index: false, follow: false },
};

export default async function NewWatchPage() {
  await requireAdminPage();
  const data = await loadWatchFormData();
  return (
    <>
      <PageHeader
        title="Add watch"
        description="New watches are saved as drafts unless you switch on “Published”."
        back={{ href: "/admin/watches", label: "Watches" }}
      />
      <WatchForm {...data} />
    </>
  );
}
