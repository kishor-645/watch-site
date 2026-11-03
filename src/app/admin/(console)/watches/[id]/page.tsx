import type { Metadata } from "next";
import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, StatusBadge } from "@/components/admin/page-parts";
import { WatchForm } from "@/components/admin/watch-form";
import { formatDateTime } from "@/lib/format";
import { requireAdminPage } from "@/server/auth/session";
import { getWatchForAdmin } from "@/server/queries/admin";
import { loadWatchFormData } from "../form-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit watch",
  robots: { index: false, follow: false },
};

export default async function EditWatchPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [watch, data] = await Promise.all([getWatchForAdmin(id), loadWatchFormData()]);

  if (!watch) {
    return (
      <>
        <PageHeader title="Watch not found" back={{ href: "/admin/watches", label: "Watches" }} />
        <EmptyState
          icon={<SearchXIcon />}
          title="This watch does not exist"
          description="It may have been deleted, or the link is incorrect."
        >
          <Button asChild>
            <Link href="/admin/watches">Back to watches</Link>
          </Button>
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={watch.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge published={watch.published} />
            <span>Last updated {formatDateTime(watch.updatedAt, data.currency.locale)}</span>
          </span>
        }
        back={{ href: "/admin/watches", label: "Watches" }}
      />
      <WatchForm key={watch.id} watch={watch} {...data} />
    </>
  );
}
