import type { Metadata } from "next";
import { ShieldAlertIcon } from "lucide-react";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { Section } from "@/components/admin/form-field";
import { LogoutButton } from "@/components/admin/logout-button";
import { PageHeader } from "@/components/admin/page-parts";
import { formatDateTime } from "@/lib/format";
import { requireAdminPage } from "@/server/auth/session";
import { getAdminProfile } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  // The only page reachable while the initial password is pending (`?required=1` is added by
  // requireAdminPage redirects; the server-side flag is the source of truth, so a stale
  // `?required=1` after a successful change shows the normal page).
  const admin = await requireAdminPage({ allowPendingPasswordChange: true });
  const profile = await getAdminProfile(admin.id);
  const required = admin.mustChangePassword;
  const never = "—";

  return (
    <>
      <PageHeader title="Account" description="Your sign-in details and password." actions={<LogoutButton variant="outline" />} />

      {required && (
        <div role="alert" className="mb-6 flex gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm">
          <ShieldAlertIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-semibold text-foreground">Change the initial password to continue</p>
            <p className="mt-1 text-muted-foreground">
              This account was created with the initial password from the server configuration. For security, choose a new
              password now. The rest of the admin console is locked until you do.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Section title="Account details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted-foreground">Username</dt>
            <dd className="font-medium">{profile?.username ?? admin.username}</dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{profile ? formatDateTime(profile.createdAt) : never}</dd>
            <dt className="text-muted-foreground">Last sign-in</dt>
            <dd>{profile?.lastLoginAt ? formatDateTime(profile.lastLoginAt) : never}</dd>
            <dt className="text-muted-foreground">Password changed</dt>
            <dd>{profile?.passwordChangedAt ? formatDateTime(profile.passwordChangedAt) : "Never"}</dd>
          </dl>
        </Section>
        <Section
          title="Change password"
          description="Changing your password signs you out on all other devices."
        >
          <ChangePasswordForm required={required} />
        </Section>
      </div>
    </>
  );
}
