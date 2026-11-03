import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/server/auth/session";
import { getSiteSettings } from "@/server/queries/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  // Pages call requireAdminPage() themselves (layouts and pages render in parallel);
  // the layout allows a pending password change so the account page does not loop.
  const admin = await requireAdminPage({ allowPendingPasswordChange: true });
  const { general } = await getSiteSettings();
  return (
    <AdminShell siteName={general.siteName} username={admin.username} mustChangePassword={admin.mustChangePassword}>
      {children}
    </AdminShell>
  );
}
