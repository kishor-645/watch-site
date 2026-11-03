import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { HistoryIcon } from "lucide-react";
import { ActivityFilter } from "@/components/admin/activity-filter";
import { auditActionLabels, AUDIT_ACTIONS, describeChanges } from "@/components/admin/audit-labels";
import { EmptyState, PageHeader, Pagination } from "@/components/admin/page-parts";
import { formatDateTime } from "@/lib/format";
import { auditQuerySchema } from "@/lib/schemas/catalog-query";
import type { AuditAction, AuditLogEntry } from "@/lib/types";
import { requireAdminPage } from "@/server/auth/session";
import { listAuditLogs } from "@/server/queries/admin";
import { loadSettings } from "@/server/queries/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activity",
  robots: { index: false, follow: false },
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function EntityLabel({ entry }: { entry: AuditLogEntry }) {
  const { entity } = entry;
  if (!entity.label && !entity.type) return <span className="text-muted-foreground">—</span>;
  const label = entity.label ?? entity.type;
  if (entity.type === "watch" && entity.id && entry.action !== "watch.delete") {
    return (
      <Link href={`/admin/watches/${entity.id}`} className="font-medium hover:underline">
        {label}
      </Link>
    );
  }
  return <span className="font-medium">{label}</span>;
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const sp = await searchParams;
  const rawAction = first(sp.action) ?? "";
  const action = (AUDIT_ACTIONS as string[]).includes(rawAction) ? rawAction : "";
  const parsed = auditQuerySchema.safeParse({ action, page: first(sp.page) });
  const query = parsed.success ? parsed.data : auditQuerySchema.parse({ action });
  const [result, settings] = await Promise.all([listAuditLogs(query), loadSettings()]);
  const currency = { currencyCode: settings.general.currencyCode, locale: settings.general.locale };

  return (
    <>
      <PageHeader title="Activity" description="Sign-ins and every change made in the admin console, newest first." />
      <ActivityFilter action={action} />

      {result.items.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon />}
          title={action ? "No matching activity" : "No activity yet"}
          description={action ? "Nothing has been recorded for this action." : "Actions in the admin console will be listed here."}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div
            aria-hidden
            className="hidden border-b border-border px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase lg:grid lg:grid-cols-[10rem_8rem_11rem_minmax(0,1fr)_8rem] lg:gap-3"
          >
            <span>Time</span>
            <span>User</span>
            <span>Action</span>
            <span>Details</span>
            <span>IP</span>
          </div>
          <ul className="divide-y divide-border">
            {result.items.map((entry) => {
              const changes = describeChanges(entry.changes, currency);
              const label = auditActionLabels[entry.action as AuditAction] ?? entry.action;
              return (
                <li
                  key={entry.id}
                  className="flex flex-col gap-1 px-4 py-3 text-sm lg:grid lg:grid-cols-[10rem_8rem_11rem_minmax(0,1fr)_8rem] lg:items-start lg:gap-3"
                >
                  <time dateTime={entry.at} className="text-xs text-muted-foreground lg:text-sm">
                    {formatDateTime(entry.at, currency.locale)}
                  </time>
                  <span className="truncate">
                    <span className="text-muted-foreground lg:hidden">By </span>
                    {entry.actor.username ?? <span className="text-muted-foreground">unknown</span>}
                  </span>
                  <span className={cn("font-medium", entry.action === "auth.login_failed" && "text-destructive")}>{label}</span>
                  <div className="min-w-0">
                    <EntityLabel entry={entry} />
                    {changes.length > 0 && (
                      <ul className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {changes.map((c) => (
                          <li key={c} className="break-words">
                            {c}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span className="truncate font-mono text-xs text-muted-foreground" title={entry.userAgent ?? undefined}>
                    {entry.ip ?? "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Pagination
        basePath="/admin/activity"
        params={{ action: action || undefined }}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={result.pageSize}
        noun="entries"
      />
    </>
  );
}
