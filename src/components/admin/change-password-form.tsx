"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CheckIcon, CircleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changePasswordSchema, MIN_PASSWORD_LENGTH } from "@/lib/schemas/auth";
import { api } from "./api-client";
import { a11yProps, Field, type FieldErrors, zodFieldErrors } from "./form-field";
import { PasswordInput } from "./password-input";

const byteLength = (s: string) => new TextEncoder().encode(s).length;

export function ChangePasswordForm({ required }: { required: boolean }) {
  const router = useRouter();
  const [values, setValues] = React.useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [fields, setFields] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setFields((f) => {
      if (!f[key]) return f;
      const next = { ...f };
      delete next[key];
      return next;
    });
  };

  const p = values.newPassword;
  const rules = [
    { ok: p.length >= MIN_PASSWORD_LENGTH, label: `At least ${MIN_PASSWORD_LENGTH} characters` },
    { ok: /[a-zA-Z]/.test(p) && /[0-9]/.test(p), label: "Contains a letter and a number" },
    { ok: p.length > 0 && byteLength(p) <= 72, label: "No longer than 72 bytes" },
    { ok: p.length > 0 && p !== values.currentPassword, label: "Different from the current password" },
    { ok: p.length > 0 && p === values.confirmPassword, label: "Both new passwords match" },
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    const parsed = changePasswordSchema.safeParse(values);
    if (!parsed.success) {
      setFields(zodFieldErrors(parsed.error));
      return;
    }
    setFields({});
    setPending(true);
    const res = await api.post<{ changed: true }>("/api/admin/account/password", parsed.data);
    if (res.ok) {
      toast.success("Password changed. Other devices have been signed out.");
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      if (required) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      setPending(false);
      router.refresh();
      return;
    }
    setPending(false);
    if (res.error.fields && Object.keys(res.error.fields).length) {
      setFields(res.error.fields);
    } else if (res.status === 429 || res.error.code === "RATE_LIMITED") {
      const mins = res.retryAfter ? Math.max(1, Math.ceil(res.retryAfter / 60)) : null;
      setFormError(`Too many attempts, try again${mins ? ` in ${mins} minute${mins === 1 ? "" : "s"}` : " later"}.`);
    } else if (res.error.code !== "UNAUTHORIZED") {
      setFormError(res.error.message || "Could not change the password.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-md flex-col gap-4">
      {formError && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </div>
      )}
      <Field path="currentPassword" label="Current password" error={fields.currentPassword}>
        <PasswordInput
          {...a11yProps("currentPassword", fields.currentPassword)}
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={set("currentPassword")}
          disabled={pending}
        />
      </Field>
      <Field path="newPassword" label="New password" error={fields.newPassword} hint="Use a long passphrase you do not use anywhere else.">
        <PasswordInput
          {...a11yProps("newPassword", fields.newPassword, true)}
          autoComplete="new-password"
          value={values.newPassword}
          onChange={set("newPassword")}
          disabled={pending}
        />
      </Field>
      <Field path="confirmPassword" label="Confirm new password" error={fields.confirmPassword}>
        <PasswordInput
          {...a11yProps("confirmPassword", fields.confirmPassword)}
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={set("confirmPassword")}
          disabled={pending}
        />
      </Field>
      <ul className="flex flex-col gap-1 text-xs" aria-label="Password requirements">
        {rules.map((r) => (
          <li key={r.label} className={cn("flex items-center gap-1.5", r.ok ? "text-success" : "text-muted-foreground")}>
            {r.ok ? <CheckIcon className="size-3.5" aria-hidden /> : <CircleIcon className="size-3" aria-hidden />}
            {r.label}
            <span className="sr-only">{r.ok ? " — met" : " — not met yet"}</span>
          </li>
        ))}
      </ul>
      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" aria-hidden />}
          {pending ? "Changing…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
