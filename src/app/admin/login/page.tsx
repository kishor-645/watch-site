import type { Metadata } from "next";
import { redirect } from "next/navigation";
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-serif text-3xl tracking-tight text-foreground">{general.siteName}</p>
          <p className="mt-1 text-sm text-muted-foreground">Admin console</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="mb-5 font-sans text-lg font-semibold tracking-normal">Sign in</h1>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
