"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "./api-client";

/** Confirmation dialog → DELETE /api/admin/watches/:id. `trigger` must be a single focusable element. */
export function DeleteWatchDialog({
  watch,
  trigger,
  onDeleted,
}: {
  watch: { id: string; name: string };
  trigger: React.ReactElement;
  onDeleted: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function confirm() {
    setPending(true);
    const res = await api.delete<{ deleted: true }>(`/api/admin/watches/${encodeURIComponent(watch.id)}`);
    setPending(false);
    if (res.ok || res.error.code === "NOT_FOUND") {
      setOpen(false);
      toast.success(`Deleted “${watch.name}”`);
      onDeleted();
      return;
    }
    toast.error(res.error.message || "Could not delete the watch.");
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      {/* Portalled outside the console, so opt back into the admin (light) tokens explicitly. */}
      <AlertDialogContent data-admin="">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{watch.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The watch is removed from the catalogue and the website immediately, and its uploaded images are deleted.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          {/* Plain button (not AlertDialogAction) so the dialog stays open until the request finishes. */}
          <Button
            type="button"
            className="h-8 bg-destructive text-white hover:bg-destructive/85"
            onClick={confirm}
            disabled={pending}
          >
            {pending && <Loader2Icon className="animate-spin" aria-hidden />}
            {pending ? "Deleting…" : "Delete watch"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
