"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/schemas/auth";
import { api } from "./api-client";
import { a11yProps, Field, type FieldErrors, zodFieldErrors } from "./form-field";
import { PasswordInput } from "./password-input";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fields, setFields] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      setFields(zodFieldErrors(parsed.error));
      return;
    }
    setFields({});
    setPending(true);
    const res = await api.post<{ username: string; mustChangePassword: boolean }>("/api/auth/login", parsed.data, {
      handleAuth: false,
    });
    if (res.ok) {
      router.replace(res.data.mustChangePassword ? "/admin/account?required=1" : "/admin");
      router.refresh();
      return; // keep the button disabled while navigating
    }
    setPending(false);
    if (res.status === 429 || res.error.code === "RATE_LIMITED") {
      const mins = res.retryAfter ? Math.max(1, Math.ceil(res.retryAfter / 60)) : null;
      setFormError(
        mins
          ? `Too many attempts, try again in ${mins} minute${mins === 1 ? "" : "s"}.`
          : "Too many attempts, please try again later.",
      );
    } else if (res.status === 401 || res.error.code === "UNAUTHORIZED") {
      setFormError("Incorrect username or password.");
      setPassword("");
    } else if (res.status === 503 || res.error.code === "SERVICE_UNAVAILABLE") {
      setFormError(
        res.status === 0 ? res.error.message : "Sign-in is temporarily unavailable. Please try again in a moment.",
      );
    } else if (res.error.code === "VALIDATION_ERROR" && res.error.fields) {
      setFields(res.error.fields);
    } else {
      setFormError(res.error.message || "Could not sign in. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}
      <Field path="username" label="Username" error={fields.username}>
        <Input
          {...a11yProps("username", fields.username)}
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          className="h-10"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={pending}
        />
      </Field>
      <Field path="password" label="Password" error={fields.password}>
        <PasswordInput
          {...a11yProps("password", fields.password)}
          name="password"
          autoComplete="current-password"
          className="h-10"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />
      </Field>
      <Button type="submit" size="lg" className="mt-2 h-11 w-full rounded-xl text-sm font-semibold" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
