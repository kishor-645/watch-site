"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "./api-client";

export function LogoutButton({
  variant = "ghost",
  className,
}: {
  variant?: "ghost" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function logout() {
    setPending(true);
    const res = await api.post<{ loggedOut: true }>("/api/auth/logout", {}, { handleAuth: false });
    // 401 means the session was already gone — the outcome is the same.
    if (!res.ok && res.error.code !== "UNAUTHORIZED") {
      setPending(false);
      toast.error(res.error.message || "Could not sign out. Please try again.");
      return;
    }
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <Button type="button" variant={variant} className={className} onClick={logout} disabled={pending}>
      <LogOutIcon aria-hidden />
      {pending ? "Signing out…" : "Log out"}
    </Button>
  );
}
