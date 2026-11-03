"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAllowedImageUrl } from "@/lib/schemas/watch";
import { a11yProps, Field } from "./form-field";
import { ALLOWED_URL_HINT, deleteUnsavedUpload, IMAGE_ACCEPT, UploadError, uploadImage } from "./uploads";

/**
 * Single optional image (settings): upload to Vercel Blob under `folder` or paste an allowed URL.
 * Uploads that are replaced/removed before saving are deleted again.
 */
export function ImageUrlField({
  path,
  label,
  value,
  onChange,
  error,
  folder,
  hint,
  onUploadingChange,
  savedValue,
  previewClassName = "aspect-video w-full max-w-xs",
}: {
  /** The currently persisted value — never deleted from storage when replaced. */
  savedValue?: string;
  path: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
  folder: string;
  hint?: string;
  onUploadingChange?: (uploading: boolean) => void;
  previewClassName?: string;
}) {
  const [progress, setProgress] = React.useState<number | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const unsavedUrl = React.useRef<string | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  function replace(next: string) {
    if (unsavedUrl.current === savedValue) unsavedUrl.current = null; // it was saved since
    if (unsavedUrl.current && unsavedUrl.current === value && next !== value) {
      void deleteUnsavedUpload(unsavedUrl.current);
      unsavedUrl.current = null;
    }
    onChange(next);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setProgress(0);
    onUploadingChange?.(true);
    try {
      const uploaded = await uploadImage(file, folder, setProgress);
      replace(uploaded.url);
      unsavedUrl.current = uploaded.url;
    } catch (e) {
      setUploadError(
        e instanceof UploadError && e.notConfigured
          ? `${e.message} Paste an image URL instead.`
          : e instanceof Error
            ? e.message
            : "Upload failed.",
      );
    } finally {
      setProgress(null);
      onUploadingChange?.(false);
    }
  }

  const showPreview = value && isAllowedImageUrl(value);
  const uploading = progress !== null;

  return (
    <Field path={path} label={label} error={error ?? uploadError ?? undefined} hint={hint ?? `Upload an image or paste a link. ${ALLOWED_URL_HINT}`}>
      <div className="flex flex-col gap-2">
        {showPreview && (
          <div className={`relative overflow-hidden rounded-md border border-border bg-muted ${previewClassName}`}>
            <Image src={value} alt={`${label} preview`} fill sizes="320px" className="object-contain" />
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            {...a11yProps(path, error ?? uploadError ?? undefined, true)}
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={value}
            onChange={(e) => replace(e.target.value)}
          />
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? <Loader2Icon className="animate-spin" aria-hidden /> : <UploadIcon aria-hidden />}
              {uploading ? `${Math.round(progress)}%` : "Upload"}
              <span className="sr-only"> {label}</span>
            </Button>
            {value && (
              <Button type="button" variant="ghost" onClick={() => replace("")} aria-label={`Remove ${label}`}>
                <Trash2Icon aria-hidden />
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void onFile(file);
          }}
        />
      </div>
    </Field>
  );
}
