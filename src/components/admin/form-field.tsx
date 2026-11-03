"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldId } from "./form-model";

export { fieldId, zodFieldErrors, type FieldErrors } from "./form-model";

/** Props wiring an input to its label/hint/error for assistive technology. */
export function a11yProps(path: string, error?: string, hint?: boolean) {
  const id = fieldId(path);
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ");
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  } as const;
}

/**
 * Scrolls to and focuses the first invalid control (document order) inside `root`: an element with
 * `aria-invalid="true"`, or a list wrapper marked `data-invalid="true"` (its first control is focused).
 */
export function focusFirstInvalid(root: ParentNode | null | undefined) {
  const el = root?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
  if (!el) return;
  el.scrollIntoView({ block: "center" });
  const target = el.matches("input,textarea,select,button")
    ? el
    : el.querySelector<HTMLElement>("input,textarea,select,button");
  target?.focus({ preventScroll: true });
}

interface FieldProps {
  path: string;
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  /** Shown on the right of the label, e.g. a character counter. */
  aside?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + hint + error. The control must use `a11yProps(path, error, !!hint)`. */
export function Field({ path, label, error, hint, aside, required, className, children }: FieldProps) {
  const id = fieldId(path);
  return (
    <div className={cn("flex flex-col gap-1.5", className)} data-field={path}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          )}
        </label>
        {aside}
      </div>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-destructive" role="alert">
      {message}
    </p>
  );
}

export function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={cn("text-xs tabular-nums", over ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
      {value.length}/{max}
    </span>
  );
}

/** Native select styled like the Input primitive — reliable with labels, forms and mobile. */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-input/30 px-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/40 [&>option]:bg-popover",
        className,
      )}
      {...props}
    />
  );
}

export function Section({
  id,
  title,
  description,
  children,
  className,
  actions,
}: {
  id?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("rounded-lg border border-border bg-card", className)}>
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h2 id={headingId} className="font-sans text-base font-semibold tracking-normal">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="flex flex-col gap-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

/**
 * Warns before leaving the page with unsaved changes: `beforeunload` for reloads / closing the tab,
 * plus a confirm() for in-app link clicks (Next.js client navigation does not fire beforeunload).
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm("You have unsaved changes. Leave this page and discard them?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
