import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyholeIcon } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { getCurrentAdmin } from "@/server/auth/session";
import { getSiteSettings } from "@/server/queries/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  let admin: Awaited<ReturnType<typeof getCurrentAdmin>> = null;
  try {
    admin = await getCurrentAdmin();
  } catch {
    // Database unreachable: show the form; the login API reports the outage (503).
    admin = null;
  }
  if (admin) redirect(admin.mustChangePassword ? "/admin/account?required=1" : "/admin");

  const { general } = await getSiteSettings();
  const line = general.tagline?.trim();

  return (
    <main data-admin="" className="grid min-h-screen bg-background font-sans text-foreground lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Brand panel (midnight + aurora glow) */}
      <section
        aria-label={`${general.siteName} admin console`}
        className="dark relative isolate flex flex-col justify-between gap-6 overflow-hidden bg-background px-6 py-6 sm:gap-10 sm:py-8 text-foreground sm:px-10 lg:min-h-screen lg:px-14 lg:py-12"
      >
        <div aria-hidden className="admin-glow absolute inset-0 -z-10 opacity-90 blur-2xl" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgb(255_255_255/0.6)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.6)_1px,transparent_1px)] [background-size:48px_48px]"
        />
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-aurora shadow-[0_8px_24px_-8px_rgb(77_107_255/0.8)]">
            <span className="size-3.5 rounded-full border-2 border-white/90" />
          </span>
          <span className="text-[0.6875rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">Admin console</span>
        </div>

        <div className="max-w-lg">
          <p className="admin-display text-4xl leading-[0.95] font-bold tracking-[0.04em] uppercase sm:text-5xl lg:text-6xl">
            <span className="text-aurora">{general.siteName}</span>
          </p>
          {line && <p className="mt-4 max-w-md text-base text-muted-foreground lg:text-lg">{line}</p>}
        </div>

        <p className="hidden text-xs text-muted-foreground lg:block">Manage watches, prices, availability and site settings.</p>
      </section>

      {/* Form */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_24px_60px_-30px_rgb(10_14_28/0.35)] sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <LockKeyholeIcon className="size-4.5" />
              </span>
              <div>
                <h1 className="text-xl leading-tight font-semibold">Sign in</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">Admin access only.</p>
              </div>
            </div>
            <LoginForm />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Sign-ins are recorded in the activity log.</p>
        </div>
      </div>
    </main>
  );
}
