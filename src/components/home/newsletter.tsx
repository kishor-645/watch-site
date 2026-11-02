"use client";

import { useId, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { container } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Newsletter() {
  const id = useId();
  const inputId = `${id}-email`;
  const errorId = `${id}-error`;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setError("Please enter your email address.");
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setEmail("");
    toast.success("Welcome to the Inner Circle", {
      description: "Watch your inbox for private previews and journal stories.",
    });
  }

  return (
    <section aria-labelledby="newsletter-heading" className="pt-24 lg:pt-32">
      <div className={container}>
        <div className="relative overflow-hidden rounded-sm border border-gold/20 bg-charcoal px-6 py-16 text-center sm:px-12 lg:py-20">
          <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
          <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

          <p className="relative text-[0.7rem] font-medium uppercase tracking-[0.3em] text-gold">The Inner Circle</p>
          <h2 id="newsletter-heading" className="relative mx-auto mt-5 max-w-2xl text-4xl font-medium leading-tight sm:text-5xl">
            First access to <span className="italic text-gold-gradient">rare arrivals</span>
          </h2>
          <p className="relative mx-auto mt-5 max-w-lg text-muted-foreground">
            Private previews, limited editions and stories from the bench. No noise, once a month.
          </p>

          <form onSubmit={onSubmit} noValidate className="relative mx-auto mt-10 max-w-lg">
            <label htmlFor={inputId} className="sr-only">
              Email address
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-0">
              <input
                id={inputId}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                  "h-12 w-full min-w-0 border border-foreground/20 bg-background/60 px-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 sm:border-r-0",
                  error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
                )}
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-gold px-7 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary-foreground outline-none transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal disabled:opacity-70"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Subscribe
                {!submitting && <ArrowRight className="size-4" aria-hidden />}
              </button>
            </div>
            <p id={errorId} role="alert" className="mt-3 min-h-5 text-left text-sm text-destructive">
              {error}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">We respect your privacy. Unsubscribe anytime.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
