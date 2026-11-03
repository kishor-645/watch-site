"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUDIT_ACTIONS, auditActionLabels } from "./audit-labels";
import { NativeSelect } from "./form-field";

export function ActivityFilter({ action }: { action: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  return (
    <div className="mb-4 flex flex-col gap-1.5 sm:w-72" aria-busy={isPending}>
      <label htmlFor="activity-action" className="text-xs font-medium text-muted-foreground">
        Action
      </label>
      <NativeSelect
        id="activity-action"
        className="h-9"
        value={action}
        onChange={(e) => {
          const v = e.target.value;
          startTransition(() => router.push(v ? `${pathname}?action=${encodeURIComponent(v)}` : pathname));
        }}
      >
        <option value="">All actions</option>
        {AUDIT_ACTIONS.map((a) => (
          <option key={a} value={a}>
            {auditActionLabels[a]}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
