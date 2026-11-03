"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon, Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatDateTime, formatPrice, type CurrencyOptions } from "@/lib/format";
import { AVAILABILITY, availabilityLabels, MAX_PRICE, type Availability, type WatchPatch } from "@/lib/schemas/watch";
import type { Watch } from "@/lib/types";
import { api } from "./api-client";
import { DeleteWatchDialog } from "./delete-watch-dialog";
import { NativeSelect } from "./form-field";
import { StatusBadge, Thumb } from "./page-parts";

type RowState = Pick<Watch, "price" | "originalPrice" | "availability" | "published" | "featured" | "updatedAt">;

const GRID = "xl:grid xl:grid-cols-[minmax(0,1fr)_8.5rem_10.5rem_5.5rem_5.5rem_8rem_7.5rem] xl:items-center xl:gap-3";

export function WatchesList({ watches, currency }: { watches: Watch[]; currency: CurrencyOptions }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div
        aria-hidden
        className={cn(
          "hidden border-b border-border px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase",
          GRID,
        )}
      >
        <span>Watch</span>
        <span>Price</span>
        <span>Availability</span>
        <span>Published</span>
        <span>Featured</span>
        <span>Updated</span>
        <span className="text-right">Actions</span>
      </div>
      <ul className="divide-y divide-border">
        {watches.map((w) => (
          // Remount when the server copy changes so local optimistic state never goes stale.
          <WatchRow key={`${w.id}:${w.updatedAt}`} watch={w} currency={currency} />
        ))}
      </ul>
    </div>
  );
}

function WatchRow({ watch, currency }: { watch: Watch; currency: CurrencyOptions }) {
  const router = useRouter();
  const [state, setState] = React.useState<RowState>({
    price: watch.price,
    originalPrice: watch.originalPrice,
    availability: watch.availability,
    published: watch.published,
    featured: watch.featured,
    updatedAt: watch.updatedAt,
  });
  const [busy, setBusy] = React.useState<keyof WatchPatch | null>(null);

  /**
   * Optimistic single-field PATCH. The whole row is disabled while a request is in flight (one edit
   * at a time per row), and a failure rolls back only the field that was being changed.
   * Returns true on success.
   */
  async function patch(change: WatchPatch, label: string): Promise<boolean> {
    if (busy) return false;
    const field = Object.keys(change)[0] as keyof WatchPatch & keyof RowState;
    const previousValue = state[field];
    setState((s) => ({ ...s, ...change }));
    setBusy(field);
    const res = await api.patch<Watch>(`/api/admin/watches/${encodeURIComponent(watch.id)}`, change);
    setBusy(null);
    if (!res.ok) {
      setState((s) => ({ ...s, [field]: previousValue }));
      const fieldMsg = res.error.fields ? Object.values(res.error.fields)[0] : undefined;
      toast.error(`${watch.name}: ${fieldMsg ?? res.error.message ?? "Update failed"}`);
      return false;
    }
    const w = res.data;
    setState({
      price: w.price,
      originalPrice: w.originalPrice,
      availability: w.availability,
      published: w.published,
      featured: w.featured,
      updatedAt: w.updatedAt,
    });
    toast.success(`${watch.name}: ${label}`);
    router.refresh();
    return true;
  }

  const editHref = `/admin/watches/${watch.id}`;
  const rowBusy = busy !== null;

  return (
    <li aria-busy={rowBusy || undefined} className={cn("flex flex-col gap-3 px-4 py-3", GRID)}>
      {/* Watch */}
      <div className="flex min-w-0 items-center gap-3">
        <Thumb src={watch.images[0]?.url} alt="" />
        <div className="min-w-0">
          <Link href={editHref} className="block truncate text-sm font-medium hover:underline">
            {watch.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {watch.brand}
            {watch.modelNumber && ` · ${watch.modelNumber}`}
          </p>
          <div className="mt-1 xl:hidden">
            <StatusBadge published={state.published} />
          </div>
        </div>
      </div>

      {/* Controls — wrap into a compact grid on small screens */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4 xl:contents">
        <div className="flex flex-col gap-1 xl:block">
          <span className="text-xs text-muted-foreground xl:hidden">Price</span>
          <PriceCell
            watchName={watch.name}
            price={state.price}
            originalPrice={state.originalPrice}
            currency={currency}
            saving={busy === "price"}
            disabled={rowBusy}
            onSave={(price) => patch({ price }, `price set to ${formatPrice(price, currency)}`)}
          />
        </div>
        <div className="flex flex-col gap-1 xl:block">
          <label htmlFor={`avail-${watch.id}`} className="text-xs text-muted-foreground xl:sr-only">
            Availability<span className="sr-only"> of {watch.name}</span>
          </label>
          <NativeSelect
            id={`avail-${watch.id}`}
            value={state.availability}
            disabled={rowBusy}
            onChange={(e) => {
              const availability = e.target.value as Availability;
              void patch({ availability }, `marked ${availabilityLabels[availability].toLowerCase()}`);
            }}
          >
            {AVAILABILITY.map((a) => (
              <option key={a} value={a}>
                {availabilityLabels[a]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <ToggleCell
          id={`pub-${watch.id}`}
          label="Published"
          watchName={watch.name}
          checked={state.published}
          busy={busy === "published"}
          disabled={rowBusy}
          onChange={(published) => patch({ published }, published ? "published" : "unpublished (now a draft)")}
        />
        <ToggleCell
          id={`feat-${watch.id}`}
          label="Featured"
          watchName={watch.name}
          checked={state.featured}
          busy={busy === "featured"}
          disabled={rowBusy}
          onChange={(featured) => patch({ featured }, featured ? "featured" : "no longer featured")}
        />
      </div>

      {/* Updated */}
      <p className="text-xs text-muted-foreground xl:text-sm">
        <span className="xl:hidden">Updated </span>
        <time dateTime={state.updatedAt}>{formatDateTime(state.updatedAt, currency.locale)}</time>
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 xl:justify-end">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={editHref} aria-label={`Edit ${watch.name}`} title="Edit">
            <PencilIcon aria-hidden />
          </Link>
        </Button>
        {state.published ? (
          <Button asChild variant="ghost" size="icon-sm">
            <a
              href={`/watches/${watch.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${watch.name} on the site (opens in a new tab)`}
              title="View on site"
            >
              <ExternalLinkIcon aria-hidden />
            </a>
          </Button>
        ) : (
          <span className="inline-block size-7" aria-hidden />
        )}
        <DeleteWatchDialog
          watch={watch}
          onDeleted={() => router.refresh()}
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Delete ${watch.name}`}
              title="Delete"
            >
              <Trash2Icon aria-hidden />
            </Button>
          }
        />
      </div>
    </li>
  );
}

function ToggleCell({
  id,
  label,
  watchName,
  checked,
  busy,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  watchName: string;
  checked: boolean;
  busy: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1 xl:flex-row xl:items-center">
      <label htmlFor={id} className="text-xs text-muted-foreground xl:sr-only">
        {label}
        <span className="sr-only"> — {watchName}</span>
      </label>
      <div className="flex h-8 items-center gap-2">
        <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
        {busy && <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" aria-hidden />}
      </div>
    </div>
  );
}

function PriceCell({
  watchName,
  price,
  originalPrice,
  currency,
  saving,
  disabled,
  onSave,
}: {
  watchName: string;
  price: number;
  originalPrice: number | null;
  currency: CurrencyOptions;
  saving: boolean;
  /** Another edit of this row is in flight. */
  disabled: boolean;
  onSave: (price: number) => Promise<boolean>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(price));
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const skipBlur = React.useRef(false);
  const errorId = React.useId();

  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function validate(raw: string): number | string {
    const trimmed = raw.replace(/[,\s]/g, "");
    if (!/^\d+$/.test(trimmed)) return "Enter a whole number";
    const n = Number(trimmed);
    if (n > MAX_PRICE) return "Price is too high";
    if (originalPrice != null && n >= originalPrice) {
      return `Must be below the original price (${formatPrice(originalPrice, currency)})`;
    }
    return n;
  }

  function close() {
    setEditing(false);
    setError(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  const committing = React.useRef(false);

  async function commit() {
    if (committing.current) return;
    const result = validate(draft);
    if (typeof result === "string") {
      setError(result);
      return;
    }
    if (result === price) {
      close();
      return;
    }
    committing.current = true;
    const ok = await onSave(result);
    committing.current = false;
    if (ok) close();
    else setDraft(String(price));
  }

  if (!editing) {
    return (
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          setDraft(String(price));
          setEditing(true);
        }}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-1.5 text-sm font-medium tabular-nums outline-none hover:border-input hover:bg-input/30 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-70"
        aria-label={`Price of ${watchName}: ${formatPrice(price, currency)}. Click to edit`}
      >
        {formatPrice(price, currency)}
        {saving && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Input
        ref={inputRef}
        inputMode="numeric"
        aria-label={`New price for ${watchName}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-8 tabular-nums"
        value={draft}
        disabled={saving}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            skipBlur.current = true;
            close();
          }
        }}
        onBlur={() => {
          if (skipBlur.current) {
            skipBlur.current = false;
            return;
          }
          if (!saving) void commit();
        }}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
