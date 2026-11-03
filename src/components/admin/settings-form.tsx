"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon, InfoIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { siteSettingsSchema, type CatalogOption, type SiteSettings } from "@/lib/schemas/settings";
import { slugify } from "@/lib/schemas/watch";
import type { PublicSettings } from "@/lib/types";
import { buildWhatsAppUrl, displayPhone, renderTemplate } from "@/lib/whatsapp";
import { api } from "./api-client";
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
  zodFieldErrors,
} from "./form-field";
import { newKey } from "./form-model";
import { ImageUrlField } from "./image-url-field";
import {
  remapErrors,
  TABS,
  tabForPath,
  toPayload,
  toState,
  type Keyed,
  type Movement,
  type SettingsState,
  type StringKeys,
  type TabValue,
  type TextSection,
  type TrustItem,
} from "./settings-form-model";
import { RowControls } from "./watch-form";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export interface HeroWatchOption {
  slug: string;
  name: string;
  brand: string;
  modelNumber: string;
  price: number;
}

export function SettingsForm({
  settings,
  watches,
  siteUrl,
}: {
  settings: PublicSettings;
  /** Published watches (hero select + WhatsApp preview sample). */
  watches: HeroWatchOption[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [state, setState] = React.useState<SettingsState>(() => toState(settings));
  const [saved, setSaved] = React.useState<SiteSettings>(settings);
  const [snapshot, setSnapshot] = React.useState(() => JSON.stringify(toPayload(toState(settings))));
  const [tab, setTab] = React.useState<TabValue>("general");
  const [submitted, setSubmitted] = React.useState(false);
  const [serverErrors, setServerErrors] = React.useState<FieldErrors>({});
  const [saving, setSaving] = React.useState(false);
  const [uploads, setUploads] = React.useState(0);
  const [focusTick, setFocusTick] = React.useState(0);
  const formRef = React.useRef<HTMLFormElement>(null);

  const payload = React.useMemo(() => toPayload(state), [state]);
  const dirty = JSON.stringify(payload) !== snapshot;
  useUnsavedChangesGuard((dirty || uploads > 0) && !saving);

  const clientErrors = React.useMemo<FieldErrors>(() => {
    if (!submitted) return {};
    const r = siteSettingsSchema.safeParse(payload);
    return r.success ? {} : remapErrors(zodFieldErrors(r.error), state);
  }, [submitted, payload, state]);
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };
  const tabErrorCounts = Object.keys(errors).reduce<Record<string, number>>((acc, k) => {
    const t = tabForPath(k);
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  React.useEffect(() => {
    // Runs after the tab containing the first error has been activated (see showErrors).
    if (focusTick) focusFirstInvalid(formRef.current?.querySelector('[role="tabpanel"][data-state="active"]'));
  }, [focusTick]);

  function clearServerError(prefix: string) {
    setServerErrors((e) => {
      const keys = Object.keys(e).filter((k) => k === prefix || k.startsWith(`${prefix}.`));
      if (!keys.length) return e;
      const next = { ...e };
      for (const k of keys) delete next[k];
      return next;
    });
  }

  function setField<S extends TextSection>(section: S, key: StringKeys<SettingsState[S]>, value: string) {
    setState((s) => ({ ...s, [section]: { ...s[section], [key]: value } }));
    clearServerError(`${section}.${key}`);
  }

  function showErrors(fields: FieldErrors) {
    const first = TABS.find((t) => Object.keys(fields).some((k) => tabForPath(k) === t.value));
    if (first) setTab(first.value);
    setFocusTick((n) => n + 1);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || uploads > 0) return;
    setSubmitted(true);
    const local = siteSettingsSchema.safeParse(payload);
    if (!local.success) {
      showErrors(remapErrors(zodFieldErrors(local.error), state));
      toast.error("Please correct the highlighted fields.");
      return;
    }
    setSaving(true);
    const res = await api.put<PublicSettings>("/api/admin/settings", payload);
    setSaving(false);
    if (res.ok) {
      const fresh = toState(res.data);
      setState(fresh);
      setSaved(res.data);
      setSnapshot(JSON.stringify(toPayload(fresh)));
      setServerErrors({});
      setSubmitted(false);
      toast.success("Settings saved — the website is updated.");
      router.refresh();
      return;
    }
    if (res.error.fields && Object.keys(res.error.fields).length) {
      const mapped = remapErrors(res.error.fields, state);
      setServerErrors(mapped);
      showErrors(mapped);
      toast.error(res.error.fields["catalog.categories"] ?? res.error.fields["catalog.movements"] ?? "Please correct the highlighted fields.");
    } else if (res.error.code !== "UNAUTHORIZED" && res.error.code !== "PASSWORD_CHANGE_REQUIRED") {
      toast.error(res.error.message || "Could not save the settings.");
    }
  }

  const onUploadingChange = React.useCallback((u: boolean) => setUploads((n) => Math.max(0, n + (u ? 1 : -1))), []);

  /* ------------------------------ field helpers ------------------------------ */

  function text<S extends TextSection>(
    section: S,
    key: StringKeys<SettingsState[S]>,
    label: string,
    opts: { max?: number; hint?: React.ReactNode; textarea?: boolean; rows?: number; type?: string; placeholder?: string; required?: boolean; className?: string } = {},
  ) {
    const path = `${section}.${key}`;
    const value = String((state[section] as Record<string, unknown>)[key] ?? "");
    const err = errors[path];
    const common = {
      ...a11yProps(path, err, Boolean(opts.hint)),
      value,
      placeholder: opts.placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(section, key, e.target.value),
    };
    return (
      <Field
        path={path}
        label={label}
        error={err}
        hint={opts.hint}
        required={opts.required}
        className={opts.className}
        aside={opts.max && (opts.textarea || opts.max <= 200) ? <CharCount value={value} max={opts.max} /> : undefined}
      >
        {opts.textarea ? <Textarea {...common} rows={opts.rows ?? 3} /> : <Input {...common} type={opts.type ?? "text"} />}
      </Field>
    );
  }

  function image<S extends TextSection>(section: S, key: StringKeys<SettingsState[S]>, label: string, hint?: string) {
    const path = `${section}.${key}`;
    return (
      <ImageUrlField
        path={path}
        label={label}
        hint={hint}
        value={String((state[section] as Record<string, unknown>)[key] ?? "")}
        savedValue={String((saved[section] as Record<string, unknown>)[key] ?? "")}
        onChange={(v) => setField(section, key, v)}
        error={errors[path]}
        folder={`site/${section}`}
        onUploadingChange={onUploadingChange}
      />
    );
  }

  /* ------------------------------ WhatsApp preview ------------------------------ */

  const sample = watches.find((w) => w.slug === state.home.heroWatchSlug) ?? watches[0];
  const sampleValues = {
    name: sample?.name ?? "Classic Chronograph",
    brand: sample?.brand ?? "Sample Brand",
    model: sample?.modelNumber ?? "CH-1001",
    price: formatPrice(sample?.price ?? 42999, state.general),
    url: `${siteUrl}/watches/${sample?.slug ?? "classic-chronograph"}`,
  };
  const previewMessage = renderTemplate(state.contact.whatsappTemplate, sampleValues);
  const digits = state.contact.whatsappNumber.replace(/\D/g, "");
  const numberValid = /^\d{8,15}$/.test(digits);
  const testUrl = numberValid ? buildWhatsAppUrl(digits, previewMessage) : null;

  /* ------------------------------ list editors ------------------------------ */

  function updateTrust(key: string, patch: Partial<TrustItem>) {
    setState((s) => ({ ...s, home: { ...s.home, trustItems: s.home.trustItems.map((t) => (t.key === key ? { ...t, ...patch } : t)) } }));
  }
  function updateCategory(key: string, patch: Partial<Keyed<CatalogOption>>) {
    setState((s) => ({
      ...s,
      catalog: { ...s.catalog, categories: s.catalog.categories.map((c) => (c.key === key ? { ...c, ...patch } : c)) },
    }));
  }
  function updateMovement(key: string, patch: Partial<Keyed<Movement>>) {
    setState((s) => ({
      ...s,
      catalog: { ...s.catalog, movements: s.catalog.movements.map((m) => (m.key === key ? { ...m, ...patch } : m)) },
    }));
  }
  function moveIn<T>(list: T[], i: number, d: -1 | 1): T[] {
    const j = i + d;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="pb-24">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="gap-4">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-auto! flex-nowrap">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="px-3 py-1.5">
                {t.label}
                {tabErrorCounts[t.value] ? (
                  <span className="ml-1 rounded-full bg-destructive px-1.5 text-[10px] leading-4 font-semibold text-white" aria-label={`${tabErrorCounts[t.value]} errors`}>
                    {tabErrorCounts[t.value]}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ------------------------------ General ------------------------------ */}
        <TabsContent value="general" className="flex flex-col gap-6">
          <Section title="Brand">
            <div className="grid gap-4 sm:grid-cols-2">
              {text("general", "siteName", "Site name", { max: 60, required: true })}
              {text("general", "tagline", "Tagline", { max: 120 })}
            </div>
            {image("general", "logoUrl", "Logo", "Optional. Shown in the header instead of the site name text. Transparent PNG/WebP works best.")}
          </Section>
          <Section title="Currency & locale" description="Controls how prices and dates are formatted everywhere.">
            <div className="grid gap-4 sm:grid-cols-2">
              {text("general", "currencyCode", "Currency code", { hint: "ISO 4217 code, e.g. INR, USD, EUR.", placeholder: "INR" })}
              {text("general", "locale", "Locale", { hint: "e.g. en-IN, en-US, en-GB.", placeholder: "en-IN" })}
            </div>
            <p className="text-sm text-muted-foreground">
              Example: <span className="font-medium text-foreground">{formatPrice(42999, state.general)}</span>
            </p>
          </Section>
        </TabsContent>

        {/* ------------------------------ Contact ------------------------------ */}
        <TabsContent value="contact" className="flex flex-col gap-6">
          <Section title="WhatsApp" description="Every “Check availability” and “Chat on WhatsApp” link uses these settings.">
            {text("contact", "whatsappNumber", "WhatsApp number", {
              required: true,
              type: "tel",
              hint: `Include the country code, e.g. +91 90164 56462.${numberValid ? ` Saved as ${displayPhone(digits)}.` : ""}`,
            })}
            <div className="grid gap-4 lg:grid-cols-2">
              {text("contact", "whatsappTemplate", "Watch enquiry message", {
                textarea: true,
                rows: 10,
                max: 1000,
                hint: (
                  <>
                    Placeholders: <code>{"{name}"}</code> <code>{"{brand}"}</code> <code>{"{model}"}</code> <code>{"{price}"}</code>{" "}
                    <code>{"{url}"}</code>. A line whose placeholder is empty (e.g. no model number) is left out.
                  </>
                ),
              })}
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium" id="wa-preview-label">
                  Preview
                </p>
                <div
                  aria-labelledby="wa-preview-label"
                  className="min-h-40 rounded-lg border border-border bg-[#0b141a] p-3"
                >
                  <div className="ml-auto max-w-[95%] rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 text-sm whitespace-pre-wrap text-white shadow">
                    {previewMessage || <span className="italic opacity-70">(empty message)</span>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sample: {sampleValues.brand} {sampleValues.name}
                  {sample ? "" : " (example values)"}.
                </p>
                {testUrl ? (
                  <Button asChild variant="outline" className="self-start">
                    <a href={testUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLinkIcon aria-hidden /> Test link
                      <span className="sr-only">(opens WhatsApp in a new tab)</span>
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-destructive">Enter a valid WhatsApp number to test the link.</p>
                )}
              </div>
            </div>
            {text("contact", "generalEnquiryMessage", "General enquiry message", {
              textarea: true,
              rows: 2,
              max: 300,
              hint: "Pre-filled text for the general “Chat on WhatsApp” buttons.",
            })}
          </Section>
          <Section title="Contact details" description="Shown on the contact page and in the footer. Leave empty to hide.">
            <div className="grid gap-4 sm:grid-cols-2">
              {text("contact", "phone", "Phone", { type: "tel" })}
              {text("contact", "email", "Email", { type: "email" })}
              {text("contact", "businessHours", "Business hours", { placeholder: "Mon–Sat, 10:00–19:00 IST" })}
              {text("contact", "mapUrl", "Map link", { type: "url", placeholder: "https://maps.google.com/…" })}
            </div>
            {text("contact", "address", "Address", { textarea: true, rows: 3, max: 300 })}
          </Section>
        </TabsContent>

        {/* ------------------------------ Home ------------------------------ */}
        <TabsContent value="home" className="flex flex-col gap-6">
          <Section title="Hero">
            <div className="grid gap-4 sm:grid-cols-2">
              {text("home", "heroEyebrow", "Eyebrow", { max: 60 })}
              <Field path="home.heroWatchSlug" label="Hero watch" error={errors["home.heroWatchSlug"]} hint="Only published watches can be chosen.">
                <NativeSelect
                  {...a11yProps("home.heroWatchSlug", errors["home.heroWatchSlug"], true)}
                  value={state.home.heroWatchSlug}
                  onChange={(e) => setField("home", "heroWatchSlug", e.target.value)}
                >
                  <option value="">Automatic (first watch shown on the home page)</option>
                  {state.home.heroWatchSlug && !watches.some((w) => w.slug === state.home.heroWatchSlug) && (
                    <option value={state.home.heroWatchSlug}>{state.home.heroWatchSlug} (not published)</option>
                  )}
                  {watches.map((w) => (
                    <option key={w.slug} value={w.slug}>
                      {w.brand} — {w.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            {text("home", "heroTitle", "Title", { max: 120 })}
            {text("home", "heroSubtitle", "Subtitle", { textarea: true, rows: 3, max: 300 })}
            {image("home", "heroImageUrl", "Hero image", "Optional background image. If empty, the hero watch's primary image is used.")}
          </Section>
          <Section
            title="Featured watches"
            description="Shows the watches marked “Featured”. If none are, the newest watches are shown as “New arrivals”."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {text("home", "featuredTitle", "Title", { max: 80 })}
              {text("home", "featuredSubtitle", "Subtitle", { max: 200 })}
            </div>
          </Section>
          <Section title="Story">
            {text("home", "storyTitle", "Title", { max: 100 })}
            {text("home", "storyBody", "Text", { textarea: true, rows: 6, max: 2000, hint: "Leave a blank line between paragraphs." })}
            {image("home", "storyImageUrl", "Image")}
          </Section>
          <Section title="Trust points" description="Short reassurance points shown on the homepage (up to 6).">
            <div data-field="home.trustItems" data-invalid={errors["home.trustItems"] ? "true" : undefined} className="flex flex-col gap-3">
              {state.home.trustItems.length === 0 && <p className="text-sm text-muted-foreground">No trust points.</p>}
              {state.home.trustItems.map((t, i) => {
                const tp = `home.trustItems.${t.key}.title`;
                const dp = `home.trustItems.${t.key}.description`;
                return (
                  <div key={t.key} className="flex items-start gap-2 rounded-md border border-border bg-background/40 p-3">
                    <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                      <div className="flex flex-col gap-1">
                        <label htmlFor={fieldId(tp)} className="text-xs font-medium text-muted-foreground">
                          Title {i + 1}
                        </label>
                        <Input
                          {...a11yProps(tp, errors[tp])}
                          value={t.title}
                          maxLength={60}
                          onChange={(e) => {
                            updateTrust(t.key, { title: e.target.value });
                            clearServerError(tp);
                          }}
                        />
                        <FieldError id={`${fieldId(tp)}-error`} message={errors[tp]} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor={fieldId(dp)} className="text-xs font-medium text-muted-foreground">
                          Description {i + 1}
                        </label>
                        <Input
                          {...a11yProps(dp, errors[dp])}
                          value={t.description}
                          maxLength={160}
                          onChange={(e) => {
                            updateTrust(t.key, { description: e.target.value });
                            clearServerError(dp);
                          }}
                        />
                        <FieldError id={`${fieldId(dp)}-error`} message={errors[dp]} />
                      </div>
                    </div>
                    <div className="pt-5">
                      <RowControls
                        index={i}
                        count={state.home.trustItems.length}
                        noun="trust point"
                        onMove={(d) => setState((s) => ({ ...s, home: { ...s.home, trustItems: moveIn(s.home.trustItems, i, d) } }))}
                        onRemove={() =>
                          setState((s) => ({ ...s, home: { ...s.home, trustItems: s.home.trustItems.filter((x) => x.key !== t.key) } }))
                        }
                      />
                    </div>
                  </div>
                );
              })}
              <FieldError message={errors["home.trustItems"]} />
              <div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={state.home.trustItems.length >= 6}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      home: { ...s.home, trustItems: [...s.home.trustItems, { key: newKey("t"), title: "", description: "" }] },
                    }))
                  }
                >
                  <PlusIcon aria-hidden /> Add trust point
                </Button>
              </div>
            </div>
          </Section>
          <Section title="Call to action" description="The closing WhatsApp prompt at the bottom of the homepage.">
            {text("home", "ctaTitle", "Title", { max: 100 })}
            {text("home", "ctaBody", "Text", { textarea: true, rows: 2, max: 300 })}
          </Section>
        </TabsContent>

        {/* ------------------------------ About & footer ------------------------------ */}
        <TabsContent value="about" className="flex flex-col gap-6">
          <Section title="About page">
            {text("about", "title", "Title", { max: 100 })}
            {text("about", "body", "Text", { textarea: true, rows: 10, max: 6000, hint: "Leave a blank line between paragraphs." })}
            {image("about", "imageUrl", "Image")}
          </Section>
          <Section title="Footer">
            {text("footer", "blurb", "Short description", { textarea: true, rows: 2, max: 300 })}
            {text("footer", "copyright", "Copyright line", {
              max: 120,
              hint: `Leave empty for “© ${new Date().getFullYear()} ${state.general.siteName}”.`,
            })}
          </Section>
        </TabsContent>

        {/* ------------------------------ Social & SEO ------------------------------ */}
        <TabsContent value="social" className="flex flex-col gap-6">
          <Section title="Social profiles" description="Full links starting with https://. Leave empty to hide the icon.">
            <div className="grid gap-4 sm:grid-cols-2">
              {text("social", "instagram", "Instagram", { type: "url", placeholder: "https://instagram.com/…" })}
              {text("social", "facebook", "Facebook", { type: "url", placeholder: "https://facebook.com/…" })}
              {text("social", "youtube", "YouTube", { type: "url", placeholder: "https://youtube.com/…" })}
              {text("social", "x", "X (Twitter)", { type: "url", placeholder: "https://x.com/…" })}
            </div>
          </Section>
          <Section title="Search engines & sharing" description="Used for the browser title, Google results and link previews.">
            {text("seo", "title", "SEO title", { max: 70, hint: `Leave empty to use the site name (“${state.general.siteName}”).` })}
            {text("seo", "description", "SEO description", { textarea: true, rows: 3, max: 170, hint: "Aim for 120–160 characters." })}
            {image("seo", "ogImageUrl", "Social sharing image", "Shown when the site is shared on WhatsApp, Facebook etc. 1200×630 works best.")}
          </Section>
        </TabsContent>

        {/* ------------------------------ Catalogue ------------------------------ */}
        <TabsContent value="catalog" className="flex flex-col gap-6">
          <div className="flex gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground">
            <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Slugs are used in shop URLs and stored on each watch. A category or movement that is still used by a watch cannot be
              removed — reassign those watches first. Changing a slug of an option in use is treated like removing it.
            </p>
          </div>
          <Section title="Categories" description="Shop sections, e.g. Chronograph, Diver. At least one is required.">
            <div data-field="catalog.categories" data-invalid={errors["catalog.categories"] ? "true" : undefined} className="flex flex-col gap-3">
              {errors["catalog.categories"] && (
                <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors["catalog.categories"]}
                </p>
              )}
              {state.catalog.categories.map((c, i) => {
                const base = `catalog.categories.${c.key}`;
                return (
                  <div
                    key={c.key}
                    className={cn("flex flex-col gap-3 rounded-md border bg-background/40 p-3", errors[base] ? "border-destructive" : "border-border")}
                    data-field={base}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{c.label || `Category ${i + 1}`}</p>
                      <RowControls
                        index={i}
                        count={state.catalog.categories.length}
                        noun="category"
                        onMove={(d) => setState((s) => ({ ...s, catalog: { ...s.catalog, categories: moveIn(s.catalog.categories, i, d) } }))}
                        onRemove={() => {
                          setState((s) => ({ ...s, catalog: { ...s.catalog, categories: s.catalog.categories.filter((x) => x.key !== c.key) } }));
                          clearServerError("catalog.categories");
                        }}
                      />
                    </div>
                    <FieldError message={errors[base]} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field path={`${base}.label`} label="Label" required error={errors[`${base}.label`]}>
                        <Input
                          {...a11yProps(`${base}.label`, errors[`${base}.label`])}
                          value={c.label}
                          maxLength={40}
                          onChange={(e) => {
                            const label = e.target.value;
                            updateCategory(c.key, c.autoSlug ? { label, slug: slugify(label) } : { label });
                            clearServerError(base);
                          }}
                        />
                      </Field>
                      <Field path={`${base}.slug`} label="Slug" required error={errors[`${base}.slug`]}>
                        <Input
                          {...a11yProps(`${base}.slug`, errors[`${base}.slug`])}
                          value={c.slug}
                          maxLength={120}
                          className="font-mono"
                          spellCheck={false}
                          autoCapitalize="none"
                          onChange={(e) => {
                            updateCategory(c.key, { slug: e.target.value.toLowerCase().replace(/\s+/g, "-"), autoSlug: false });
                            clearServerError(base);
                          }}
                        />
                      </Field>
                    </div>
                    <Field
                      path={`${base}.description`}
                      label="Description"
                      error={errors[`${base}.description`]}
                      aside={<CharCount value={c.description} max={300} />}
                    >
                      <Textarea
                        {...a11yProps(`${base}.description`, errors[`${base}.description`])}
                        rows={2}
                        value={c.description}
                        onChange={(e) => {
                          updateCategory(c.key, { description: e.target.value });
                          clearServerError(`${base}.description`);
                        }}
                      />
                    </Field>
                    <ImageUrlField
                      path={`${base}.imageUrl`}
                      label="Image"
                      value={c.imageUrl}
                      savedValue={saved.catalog.categories.find((x) => x.slug === c.slug)?.imageUrl}
                      onChange={(imageUrl) => {
                        updateCategory(c.key, { imageUrl });
                        clearServerError(`${base}.imageUrl`);
                      }}
                      error={errors[`${base}.imageUrl`]}
                      folder="site/categories"
                      onUploadingChange={onUploadingChange}
                    />
                  </div>
                );
              })}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={state.catalog.categories.length >= 30}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      catalog: {
                        ...s.catalog,
                        categories: [...s.catalog.categories, { key: newKey("c"), slug: "", label: "", description: "", imageUrl: "", autoSlug: true }],
                      },
                    }))
                  }
                >
                  <PlusIcon aria-hidden /> Add category
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Movements" description="Movement types used as a shop filter, e.g. Automatic, Quartz.">
            <div data-field="catalog.movements" data-invalid={errors["catalog.movements"] ? "true" : undefined} className="flex flex-col gap-3">
              {errors["catalog.movements"] && (
                <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors["catalog.movements"]}
                </p>
              )}
              {state.catalog.movements.map((m, i) => {
                const base = `catalog.movements.${m.key}`;
                return (
                  <div key={m.key} className="flex flex-col gap-1" data-field={base}>
                    <div className="flex items-end gap-2">
                      <div className="grid flex-1 gap-2 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <label htmlFor={fieldId(`${base}.label`)} className="text-xs font-medium text-muted-foreground">
                            Label {i + 1}
                          </label>
                          <Input
                            {...a11yProps(`${base}.label`, errors[`${base}.label`])}
                            value={m.label}
                            maxLength={40}
                            onChange={(e) => {
                              const label = e.target.value;
                              updateMovement(m.key, m.autoSlug ? { label, slug: slugify(label) } : { label });
                              clearServerError(base);
                            }}
                          />
                          <FieldError id={`${fieldId(`${base}.label`)}-error`} message={errors[`${base}.label`]} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor={fieldId(`${base}.slug`)} className="text-xs font-medium text-muted-foreground">
                            Slug {i + 1}
                          </label>
                          <Input
                            {...a11yProps(`${base}.slug`, errors[`${base}.slug`])}
                            value={m.slug}
                            maxLength={120}
                            className="font-mono"
                            spellCheck={false}
                            autoCapitalize="none"
                            onChange={(e) => {
                              updateMovement(m.key, { slug: e.target.value.toLowerCase().replace(/\s+/g, "-"), autoSlug: false });
                              clearServerError(base);
                            }}
                          />
                          <FieldError id={`${fieldId(`${base}.slug`)}-error`} message={errors[`${base}.slug`]} />
                        </div>
                      </div>
                      <RowControls
                        index={i}
                        count={state.catalog.movements.length}
                        noun="movement"
                        onMove={(d) => setState((s) => ({ ...s, catalog: { ...s.catalog, movements: moveIn(s.catalog.movements, i, d) } }))}
                        onRemove={() => {
                          setState((s) => ({ ...s, catalog: { ...s.catalog, movements: s.catalog.movements.filter((x) => x.key !== m.key) } }));
                          clearServerError("catalog.movements");
                        }}
                      />
                    </div>
                    <FieldError message={errors[base]} />
                  </div>
                );
              })}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={state.catalog.movements.length >= 20}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      catalog: { ...s.catalog, movements: [...s.catalog.movements, { key: newKey("m"), slug: "", label: "", autoSlug: true }] },
                    }))
                  }
                >
                  <PlusIcon aria-hidden /> Add movement
                </Button>
              </div>
            </div>
          </Section>
        </TabsContent>
      </Tabs>

      {/* ------------------------------ Save bar ------------------------------ */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn("text-xs", errorCount && submitted ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
            {uploads > 0
              ? "Waiting for uploads to finish…"
              : errorCount && (submitted || Object.keys(serverErrors).length)
                ? `${errorCount} field${errorCount === 1 ? " needs" : "s need"} attention`
                : dirty
                  ? "You have unsaved changes"
                  : "All changes saved"}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={!dirty || saving}
              onClick={() => {
                setState(toState(saved));
                setServerErrors({});
                setSubmitted(false);
              }}
            >
              Discard changes
            </Button>
            <Button type="submit" size="lg" disabled={saving || uploads > 0 || !dirty}>
              {saving && <Loader2Icon className="animate-spin" aria-hidden />}
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
