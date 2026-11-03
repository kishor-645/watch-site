"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, ExternalLinkIcon, Loader2Icon, PlusIcon, RotateCcwIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { discountPercent, formatPrice, type CurrencyOptions } from "@/lib/format";
import {
  AVAILABILITY,
  availabilityLabels,
  GENDERS,
  genderLabels,
  slugify,
  specLabels,
  type Availability,
  type Gender,
} from "@/lib/schemas/watch";
import type { Watch } from "@/lib/types";
import { api } from "./api-client";
import { DeleteWatchDialog } from "./delete-watch-dialog";
import {
  a11yProps,
  CharCount,
  Field,
  FieldError,
  type FieldErrors,
  fieldId,
  focusFirstInvalid,
  NativeSelect,
  Section,
  useUnsavedChangesGuard,
} from "./form-field";
import { newKey, type ImageItem } from "./form-model";
import { ImageManager } from "./image-manager";
import {
  clientValidate,
  MAX_EXTRA_SPECS,
  MAX_FEATURES,
  parseMoney,
  remapErrors,
  SPEC_KEYS,
  SPEC_MAX_LENGTH,
  stateFromWatch,
  toPayload,
  type FormState,
  type Option,
} from "./watch-form-model";
export interface WatchFormProps {
  watch?: Watch;
  categories: Option[];
  movements: Option[];
  brands: string[];
  currency: CurrencyOptions;
}

export function WatchForm({ watch, categories, movements, brands, currency }: WatchFormProps) {
  const router = useRouter();
  const isEdit = Boolean(watch);
  const [state, setState] = React.useState<FormState>(() => stateFromWatch(watch, categories, movements));
  const [snapshot, setSnapshot] = React.useState(() => JSON.stringify(toPayload(stateFromWatch(watch, categories, movements)).payload));
  const [submitted, setSubmitted] = React.useState(false);
  const [serverErrors, setServerErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [focusTick, setFocusTick] = React.useState(0);
  const formRef = React.useRef<HTMLFormElement>(null);

  const payloadJson = React.useMemo(() => JSON.stringify(toPayload(state).payload), [state]);
  const hasUnsavedUploads = state.images.some((i) => i.unsaved);
  const dirty = payloadJson !== snapshot || uploading || hasUnsavedUploads;
  useUnsavedChangesGuard(dirty && !saving);

  const clientErrors = React.useMemo(() => (submitted ? clientValidate(state) : {}), [submitted, state]);
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };

  // Focus the first invalid control (in document order) after a failed submit.
  React.useEffect(() => {
    if (focusTick) focusFirstInvalid(formRef.current);
  }, [focusTick]);

  function update<K extends keyof FormState>(key: K, value: FormState[K], errorPath: string = key) {
    setState((s) => {
      const next = { ...s, [key]: value };
      if ((key === "name" || key === "brand") && s.slugAuto) {
        next.slug = slugify(`${next.brand} ${next.name}`);
      }
      return next;
    });
    clearServerError(errorPath);
    if (key === "name" || key === "brand") clearServerError("slug");
  }

  function clearServerError(prefix: string) {
    setServerErrors((e) => {
      const keys = Object.keys(e).filter((k) => k === prefix || k.startsWith(`${prefix}.`));
      if (!keys.length) return e;
      const next = { ...e };
      for (const k of keys) delete next[k];
      return next;
    });
  }

  const setImages = React.useCallback((updater: (prev: ImageItem[]) => ImageItem[]) => {
    setState((s) => ({ ...s, images: updater(s.images) }));
    setServerErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(next)) if (k === "images" || k.startsWith("images.")) delete next[k];
      return next;
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || uploading) return;
    setSubmitted(true);
    setFormError(null);
    const local = clientValidate(state);
    if (Object.keys(local).length) {
      setFocusTick((t) => t + 1);
      toast.error("Please correct the highlighted fields.");
      return;
    }
    const result = toPayload(state);
    setSaving(true);
    const res = isEdit
      ? await api.put<Watch>(`/api/admin/watches/${encodeURIComponent(watch!.id)}`, result.payload)
      : await api.post<Watch>("/api/admin/watches", result.payload);

    if (res.ok) {
      const saved = res.data;
      const fresh = stateFromWatch(saved, categories, movements);
      setSnapshot(JSON.stringify(toPayload(fresh).payload));
      setServerErrors({});
      setSubmitted(false);
      setState(fresh);
      if (isEdit) {
        setSaving(false);
        toast.success(`Saved “${saved.name}”`);
        router.refresh();
      } else {
        toast.success(`Created “${saved.name}”${saved.published ? "" : " as a draft"}`);
        router.replace(`/admin/watches/${saved.id}`);
        router.refresh();
      }
      return;
    }

    setSaving(false);
    const { error } = res;
    if (error.fields && Object.keys(error.fields).length) {
      const mapped = remapErrors(error.fields, result);
      setServerErrors(mapped);
      setFocusTick((t) => t + 1);
      const known = Object.keys(mapped).some((k) => !k.startsWith("_"));
      setFormError(known ? null : Object.values(mapped)[0]);
      toast.error(error.code === "CONFLICT" ? error.message || "This slug is already used." : "Please correct the highlighted fields.");
    } else if (error.code === "NOT_FOUND") {
      setFormError("This watch no longer exists — it may have been deleted.");
      toast.error("This watch no longer exists.");
    } else if (error.code !== "UNAUTHORIZED" && error.code !== "PASSWORD_CHANGE_REQUIRED") {
      setFormError(error.message || "Could not save the watch.");
      toast.error(error.message || "Could not save the watch.");
    }
  }

  /* ------------------------------ derived ------------------------------ */
  const priceNum = parseMoney(state.price);
  const originalNum = parseMoney(state.originalPrice);
  const validPrice = priceNum != null && !Number.isNaN(priceNum);
  const discount = validPrice && originalNum != null && !Number.isNaN(originalNum) ? discountPercent(priceNum, originalNum) : null;
  const folder = `watches/${slugify(state.slug) || "draft"}`;
  const defaultAlt = [state.brand.trim(), state.name.trim()].filter(Boolean).join(" ");

  const categoryOptions = withCurrent(categories, state.category);
  const movementOptions = withCurrent(movements, state.movement);
  const errorCount = Object.keys(errors).length;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6 pb-24">
      {(formError || (submitted && errorCount > 0)) && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError ?? `${errorCount} field${errorCount === 1 ? " needs" : "s need"} attention before saving.`}
        </div>
      )}

      {/* ------------------------------ Basics ------------------------------ */}
      <Section id="basics" title="Basics" description="How the watch is named and categorised in the shop.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field path="name" label="Name" required error={errors.name}>
            <Input {...a11yProps("name", errors.name)} value={state.name} maxLength={120} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field path="brand" label="Brand" required error={errors.brand} hint={brands.length ? "Pick an existing brand or type a new one." : undefined}>
            <Input
              {...a11yProps("brand", errors.brand, brands.length > 0)}
              list="brand-suggestions"
              value={state.brand}
              maxLength={60}
              autoComplete="off"
              onChange={(e) => update("brand", e.target.value)}
            />
            <datalist id="brand-suggestions">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field path="modelNumber" label="Model number" error={errors.modelNumber}>
            <Input {...a11yProps("modelNumber", errors.modelNumber)} value={state.modelNumber} maxLength={60} onChange={(e) => update("modelNumber", e.target.value)} />
          </Field>
          <Field
            path="slug"
            label="URL slug"
            error={errors.slug}
            hint={
              <>
                Page address: <span className="font-mono text-foreground">/watches/{state.slug || (isEdit ? "…" : "(generated automatically)")}</span>
                {state.slugAuto
                  ? state.isNew
                    ? " · generated from brand + name (a number is added if it is already taken)."
                    : " · follows brand + name until you edit it."
                  : ""}
              </>
            }
            aside={
              !state.slugAuto ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  onClick={() => {
                    setState((s) => ({ ...s, slugAuto: true, slug: slugify(`${s.brand} ${s.name}`) }));
                    clearServerError("slug");
                  }}
                >
                  <RotateCcwIcon className="size-3" aria-hidden /> Generate from name
                </button>
              ) : undefined
            }
          >
            <Input
              {...a11yProps("slug", errors.slug, true)}
              value={state.slug}
              maxLength={120}
              spellCheck={false}
              autoCapitalize="none"
              className="font-mono"
              onChange={(e) => {
                const slug = e.target.value.toLowerCase().replace(/\s+/g, "-");
                setState((s) => ({ ...s, slug, slugAuto: false }));
                clearServerError("slug");
              }}
              onBlur={() => setState((s) => (s.slugAuto ? s : { ...s, slug: slugify(s.slug) }))}
            />
          </Field>
          <Field path="category" label="Category" required error={errors.category}>
            <NativeSelect {...a11yProps("category", errors.category)} value={state.category} onChange={(e) => update("category", e.target.value)}>
              {!state.category && <option value="">Choose…</option>}
              {categoryOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field path="movement" label="Movement" required error={errors.movement}>
            <NativeSelect {...a11yProps("movement", errors.movement)} value={state.movement} onChange={(e) => update("movement", e.target.value)}>
              {!state.movement && <option value="">Choose…</option>}
              {movementOptions.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field path="gender" label="Gender" required error={errors.gender}>
            <NativeSelect {...a11yProps("gender", errors.gender)} value={state.gender} onChange={(e) => update("gender", e.target.value as Gender)}>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {genderLabels[g]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </Section>

      {/* ------------------------------ Pricing ------------------------------ */}
      <Section id="pricing" title="Pricing" description={`Whole amounts in ${currency.currencyCode ?? "INR"}.`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            path="price"
            label="Selling price"
            required
            error={errors.price}
            hint={validPrice ? `Shown as ${formatPrice(priceNum, currency)}` : undefined}
          >
            <Input {...a11yProps("price", errors.price, validPrice)} inputMode="numeric" value={state.price} onChange={(e) => update("price", e.target.value)} />
          </Field>
          <Field
            path="originalPrice"
            label="Original price"
            error={errors.originalPrice}
            hint={
              discount != null
                ? `Shown struck through as ${formatPrice(originalNum!, currency)} — ${discount}% off`
                : "Optional. Must be higher than the selling price to show a discount."
            }
          >
            <Input {...a11yProps("originalPrice", errors.originalPrice, true)} inputMode="numeric" value={state.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* ------------------------------ Status ------------------------------ */}
      <Section id="status" title="Status">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field path="availability" label="Availability" error={errors.availability}>
            <NativeSelect {...a11yProps("availability", errors.availability)} value={state.availability} onChange={(e) => update("availability", e.target.value as Availability)}>
              {AVAILABILITY.map((a) => (
                <option key={a} value={a}>
                  {availabilityLabels[a]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <SwitchField
            id={fieldId("published")}
            label="Published"
            description="Visible on the website."
            checked={state.published}
            onChange={(v) => update("published", v)}
          />
          <SwitchField
            id={fieldId("featured")}
            label="Featured"
            description="Highlighted on the home page."
            checked={state.featured}
            onChange={(v) => update("featured", v)}
          />
        </div>
      </Section>

      {/* ------------------------------ Descriptions ------------------------------ */}
      <Section id="descriptions" title="Descriptions">
        <Field
          path="shortDescription"
          label="Short description"
          error={errors.shortDescription}
          hint="One or two sentences shown on product cards and in search results."
          aside={<CharCount value={state.shortDescription} max={240} />}
        >
          <Textarea
            {...a11yProps("shortDescription", errors.shortDescription, true)}
            rows={2}
            value={state.shortDescription}
            onChange={(e) => update("shortDescription", e.target.value)}
          />
        </Field>
        <Field
          path="description"
          label="Full description"
          error={errors.description}
          hint="Leave a blank line between paragraphs."
          aside={<CharCount value={state.description} max={6000} />}
        >
          <Textarea
            {...a11yProps("description", errors.description, true)}
            rows={8}
            value={state.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>
      </Section>

      {/* ------------------------------ Features ------------------------------ */}
      <Section
        id="features"
        title="Key features"
        description={`Short bullet points (up to ${MAX_FEATURES}). Empty rows are ignored.`}
      >
        <div data-field="features" data-invalid={errors.features ? "true" : undefined} className="flex flex-col gap-2">
          {state.features.length === 0 && <p className="text-sm text-muted-foreground">No features yet.</p>}
          <ol className="flex flex-col gap-2">
            {state.features.map((f, i) => {
              const path = `features.${f.key}`;
              return (
                <li key={f.key} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor={fieldId(path)} className="sr-only">
                      Feature {i + 1}
                    </label>
                    <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums" aria-hidden>
                      {i + 1}.
                    </span>
                    <Input
                      {...a11yProps(path, errors[path])}
                      value={f.value}
                      maxLength={160}
                      onChange={(e) => {
                        const value = e.target.value;
                        setState((s) => ({ ...s, features: s.features.map((x) => (x.key === f.key ? { ...x, value } : x)) }));
                        clearServerError(path);
                      }}
                    />
                    <RowControls
                      index={i}
                      count={state.features.length}
                      noun="feature"
                      onMove={(d) => setState((s) => ({ ...s, features: moveItem(s.features, i, d) }))}
                      onRemove={() => setState((s) => ({ ...s, features: s.features.filter((x) => x.key !== f.key) }))}
                    />
                  </div>
                  <div className="pl-6">
                    <FieldError id={`${fieldId(path)}-error`} message={errors[path]} />
                  </div>
                </li>
              );
            })}
          </ol>
          <FieldError message={errors.features} />
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={state.features.length >= MAX_FEATURES}
              onClick={() => setState((s) => ({ ...s, features: [...s.features, { key: newKey("f"), value: "" }] }))}
            >
              <PlusIcon aria-hidden /> Add feature
            </Button>
          </div>
        </div>
      </Section>

      {/* ------------------------------ Specifications ------------------------------ */}
      <Section id="specs" title="Specifications" description="Leave a field empty to hide it on the product page.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SPEC_KEYS.map((k) => {
            const path = `specs.${k}`;
            return (
              <Field key={k} path={path} label={specLabels[k]} error={errors[path]}>
                <Input
                  {...a11yProps(path, errors[path])}
                  value={state.specs[k]}
                  maxLength={SPEC_MAX_LENGTH[k]}
                  onChange={(e) => {
                    const value = e.target.value;
                    setState((s) => ({ ...s, specs: { ...s.specs, [k]: value } }));
                    clearServerError(path);
                  }}
                />
              </Field>
            );
          })}
        </div>

        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4" data-field="extraSpecs" data-invalid={errors.extraSpecs ? "true" : undefined}>
          <h3 className="font-sans text-sm font-semibold tracking-normal">Additional specifications</h3>
          <p className="text-xs text-muted-foreground">Anything else worth listing, e.g. “Bezel — Unidirectional ceramic” (up to {MAX_EXTRA_SPECS}).</p>
          {state.extraSpecs.map((x, i) => {
            const lp = `extraSpecs.${x.key}.label`;
            const vp = `extraSpecs.${x.key}.value`;
            return (
              <div key={x.key} className="flex flex-col gap-1">
                <div className="flex items-start gap-1.5">
                  <div className="grid flex-1 gap-1.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    <div>
                      <label htmlFor={fieldId(lp)} className="sr-only">
                        Specification {i + 1} label
                      </label>
                      <Input
                        {...a11yProps(lp, errors[lp])}
                        placeholder="Label"
                        value={x.label}
                        maxLength={40}
                        onChange={(e) => {
                          const label = e.target.value;
                          setState((s) => ({ ...s, extraSpecs: s.extraSpecs.map((r) => (r.key === x.key ? { ...r, label } : r)) }));
                          clearServerError(lp);
                        }}
                      />
                      <FieldError id={`${fieldId(lp)}-error`} message={errors[lp]} />
                    </div>
                    <div>
                      <label htmlFor={fieldId(vp)} className="sr-only">
                        Specification {i + 1} value
                      </label>
                      <Input
                        {...a11yProps(vp, errors[vp])}
                        placeholder="Value"
                        value={x.value}
                        maxLength={160}
                        onChange={(e) => {
                          const value = e.target.value;
                          setState((s) => ({ ...s, extraSpecs: s.extraSpecs.map((r) => (r.key === x.key ? { ...r, value } : r)) }));
                          clearServerError(vp);
                        }}
                      />
                      <FieldError id={`${fieldId(vp)}-error`} message={errors[vp]} />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove specification ${i + 1}`}
                    onClick={() => setState((s) => ({ ...s, extraSpecs: s.extraSpecs.filter((r) => r.key !== x.key) }))}
                  >
                    <XIcon aria-hidden />
                  </Button>
                </div>
              </div>
            );
          })}
          <FieldError message={errors.extraSpecs} />
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={state.extraSpecs.length >= MAX_EXTRA_SPECS}
              onClick={() => setState((s) => ({ ...s, extraSpecs: [...s.extraSpecs, { key: newKey("x"), label: "", value: "" }] }))}
            >
              <PlusIcon aria-hidden /> Add specification
            </Button>
          </div>
        </div>
      </Section>

      {/* ------------------------------ Images ------------------------------ */}
      <Section
        id="images"
        title="Images"
        description="1–10 images. The first image is the primary image used on product cards. Use the arrows to reorder."
      >
        <ImageManager
          images={state.images}
          onChange={setImages}
          folder={folder}
          defaultAlt={defaultAlt}
          errors={errors}
          onUploadingChange={setUploading}
        />
      </Section>

      {/* ------------------------------ Actions ------------------------------ */}
      <div className="dark sticky bottom-3 z-30 mt-6 rounded-2xl border border-border bg-background/95 px-3 py-2.5 text-foreground shadow-[0_18px_40px_-16px_rgb(10_14_28/0.55)] backdrop-blur sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <span
              aria-hidden
              className={cn(
                "size-2 shrink-0 rounded-full",
                uploading || dirty ? "bg-hot" : isEdit ? "bg-success" : "bg-muted-foreground/40",
              )}
            />
            {uploading ? "Waiting for uploads to finish…" : dirty ? "Unsaved changes" : isEdit ? "All changes saved" : ""}
          </p>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {isEdit && watch && (
              <>
                <DeleteWatchDialog
                  watch={watch}
                  onDeleted={() => {
                    setSnapshot(payloadJson);
                    setState((s) => ({ ...s, images: s.images.map((i) => ({ ...i, unsaved: false })) }));
                    router.replace("/admin/watches");
                    router.refresh();
                  }}
                  trigger={
                    <Button type="button" variant="destructive" size="lg">
                      <Trash2Icon aria-hidden /> <span className="max-sm:sr-only">Delete</span>
                    </Button>
                  }
                />
                {watch.published && (
                  <Button asChild variant="outline" size="lg">
                    <a href={`/watches/${watch.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLinkIcon aria-hidden /> <span className="max-sm:sr-only">View on site</span>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </Button>
                )}
              </>
            )}
            <Button asChild variant="ghost" size="lg" className="ml-auto">
              <Link href="/admin/watches">Cancel</Link>
            </Button>
            <Button type="submit" size="lg" className="px-4 font-semibold" disabled={saving || uploading}>
              {saving && <Loader2Icon className="animate-spin" aria-hidden />}
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create watch"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function withCurrent(options: Option[], current: string): Option[] {
  if (!current || options.some((o) => o.slug === current)) return options;
  return [...options, { slug: current, label: `${current} (not in settings)` }];
}

function moveItem<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function RowControls({
  index,
  count,
  noun,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  noun: string;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move ${noun} ${index + 1} up`}>
        <ArrowUpIcon aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        aria-label={`Move ${noun} ${index + 1} down`}
      >
        <ArrowDownIcon aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label={`Remove ${noun} ${index + 1}`}
      >
        <XIcon aria-hidden />
      </Button>
    </div>
  );
}

export function SwitchField({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} aria-describedby={description ? `${id}-desc` : undefined} />
    </div>
  );
}
