"use client";

import { useId, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { EMAIL_RE } from "@/components/home/newsletter";
import { cn } from "@/lib/utils";

type Field = "name" | "email" | "phone" | "topic" | "message";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const INITIAL: Values = { name: "", email: "", phone: "", topic: "general", message: "" };

const TOPICS = [
  { value: "general", label: "General enquiry" },
  { value: "order", label: "An existing order" },
  { value: "appointment", label: "Book a boutique appointment" },
  { value: "service", label: "Service & warranty" },
];

function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!v.email.trim()) e.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "Please enter a valid email address.";
  if (v.phone.trim() && !/^\+?[\d\s-]{8,16}$/.test(v.phone.trim())) e.phone = "Please enter a valid phone number.";
  if (v.message.trim().length < 10) e.message = "Your message should be at least 10 characters.";
  return e;
}

const fieldClass =
  "w-full border border-foreground/15 bg-background/60 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/25 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25";
const labelClass = "mb-2 block text-[0.65rem] font-medium uppercase tracking-[0.25em] text-muted-foreground";

export function ContactForm() {
  const uid = useId();
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const ids = (f: Field) => ({ input: `${uid}-${f}`, error: `${uid}-${f}-error` });

  function update(f: Field, value: string) {
    setValues((v) => ({ ...v, [f]: value }));
    if (errors[f]) setErrors((e) => ({ ...e, [f]: undefined }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    const first = (Object.keys(found) as Field[])[0];
    if (first) {
      document.getElementById(ids(first).input)?.focus();
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setValues(INITIAL);
    toast.success(`Thank you, ${values.name.trim().split(" ")[0]}`, {
      description: "Our concierge will reply within one business day.",
    });
  }

  function errorFor(f: Field) {
    return errors[f] ? (
      <p id={ids(f).error} className="mt-2 text-xs text-destructive">
        {errors[f]}
      </p>
    ) : null;
  }

  function a11y(f: Field) {
    return {
      id: ids(f).input,
      "aria-invalid": errors[f] ? true : undefined,
      "aria-describedby": errors[f] ? ids(f).error : undefined,
    } as const;
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Contact MyWatch" className="grid gap-6 sm:grid-cols-2">
      <div>
        <label htmlFor={ids("name").input} className={labelClass}>
          Full name <span className="text-gold" aria-hidden>*</span>
        </label>
        <input
          {...a11y("name")}
          name="name"
          autoComplete="name"
          required
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          className={cn(fieldClass, "h-12")}
        />
        {errorFor("name")}
      </div>
      <div>
        <label htmlFor={ids("email").input} className={labelClass}>
          Email <span className="text-gold" aria-hidden>*</span>
        </label>
        <input
          {...a11y("email")}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          className={cn(fieldClass, "h-12")}
        />
        {errorFor("email")}
      </div>
      <div>
        <label htmlFor={ids("phone").input} className={labelClass}>
          Phone <span className="normal-case tracking-normal text-muted-foreground/70">(optional)</span>
        </label>
        <input
          {...a11y("phone")}
          type="tel"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          value={values.phone}
          onChange={(e) => update("phone", e.target.value)}
          className={cn(fieldClass, "h-12")}
        />
        {errorFor("phone")}
      </div>
      <div>
        <label htmlFor={ids("topic").input} className={labelClass}>
          Topic
        </label>
        <select
          id={ids("topic").input}
          name="topic"
          value={values.topic}
          onChange={(e) => update("topic", e.target.value)}
          className={cn(fieldClass, "h-12 appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10")}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9a45c' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value} className="bg-background">
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={ids("message").input} className={labelClass}>
          Message <span className="text-gold" aria-hidden>*</span>
        </label>
        <textarea
          {...a11y("message")}
          name="message"
          rows={6}
          required
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          className={cn(fieldClass, "resize-y py-3")}
        />
        {errorFor("message")}
      </div>
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="text-gold" aria-hidden>*</span> Required fields
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-3 bg-gold px-8 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary-foreground outline-none transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          {submitting ? "Sending" : "Send message"}
        </button>
      </div>
    </form>
  );
}
