"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "cn";
import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, LinkIcon, Loader2Icon, Trash2Icon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAllowedImageUrl, MAX_IMAGES } from "@/lib/schemas/watch";
import { a11yProps, FieldError, type FieldErrors, fieldId } from "./form-field";
import { newKey, type ImageItem } from "./form-model";
import {
  ALLOWED_URL_HINT,
  deleteUnsavedUpload,
  IMAGE_ACCEPT,
  STORAGE_NOT_CONFIGURED,
  UploadError,
  uploadImage,
  validateImageFile,
} from "./uploads";

interface UploadJob {
  key: string;
  name: string;
  progress: number;
  error?: string;
}

export function ImageManager({
  images,
  onChange,
  folder,
  defaultAlt,
  errors,
  onUploadingChange,
}: {
  images: ImageItem[];
  onChange: (updater: (prev: ImageItem[]) => ImageItem[]) => void;
  /** Blob folder, e.g. "watches/my-slug". */
  folder: string;
  defaultAlt: string;
  /** Errors keyed "images", "images.<key>.url", "images.<key>.alt". */
  errors: FieldErrors;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [jobs, setJobs] = React.useState<UploadJob[]>([]);
  const [storageUnavailable, setStorageUnavailable] = React.useState(false);
  const [urlDraft, setUrlDraft] = React.useState("");
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const activeJobs = jobs.filter((j) => !j.error).length;
  const remaining = MAX_IMAGES - images.length - activeJobs;

  React.useEffect(() => {
    onUploadingChange(activeJobs > 0);
  }, [activeJobs, onUploadingChange]);

  function updateJob(key: string, patch: Partial<UploadJob>) {
    setJobs((js) => js.map((j) => (j.key === key ? { ...j, ...patch } : j)));
  }

  async function startUploads(files: File[]) {
    if (!files.length) return;
    if (remaining <= 0) {
      toast.error(`A watch can have at most ${MAX_IMAGES} images.`);
      return;
    }
    const accepted = files.slice(0, remaining);
    if (files.length > accepted.length) {
      toast.warning(`Only ${accepted.length} more image${accepted.length === 1 ? "" : "s"} can be added (max ${MAX_IMAGES}).`);
    }
    const newJobs: UploadJob[] = accepted.map((f) => ({
      key: newKey("u"),
      name: f.name,
      progress: 0,
      error: validateImageFile(f) ?? undefined,
    }));
    setJobs((js) => [...js, ...newJobs]);

    await Promise.all(
      accepted.map(async (file, i) => {
        const job = newJobs[i];
        if (job.error) return;
        try {
          const uploaded = await uploadImage(file, folder, (p) => updateJob(job.key, { progress: p }));
          onChange((prev) => [
            ...prev,
            { key: newKey("i"), url: uploaded.url, pathname: uploaded.pathname, alt: defaultAlt, unsaved: true },
          ]);
          setJobs((js) => js.filter((j) => j.key !== job.key));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed.";
          if (error instanceof UploadError && error.notConfigured) setStorageUnavailable(true);
          updateJob(job.key, { error: message });
        }
      }),
    );
  }

  function move(index: number, delta: -1 | 1) {
    onChange((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(item: ImageItem) {
    onChange((prev) => prev.filter((i) => i.key !== item.key));
    if (item.unsaved) void deleteUnsavedUpload(item.url);
  }

  function addByUrl() {
    const url = urlDraft.trim();
    if (!url) {
      setUrlError("Enter an image URL.");
      return;
    }
    if (!isAllowedImageUrl(url)) {
      setUrlError(ALLOWED_URL_HINT);
      return;
    }
    if (images.some((i) => i.url === url)) {
      setUrlError("This image is already in the list.");
      return;
    }
    if (remaining <= 0) {
      setUrlError(`A watch can have at most ${MAX_IMAGES} images.`);
      return;
    }
    onChange((prev) => [...prev, { key: newKey("i"), url, alt: defaultAlt }]);
    setUrlDraft("");
    setUrlError(null);
  }

  const listError = errors.images;

  return (
    <div className="flex flex-col gap-4" data-field="images" data-invalid={listError ? "true" : undefined}>
      {storageUnavailable && (
        <div role="alert" className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {STORAGE_NOT_CONFIGURED} You can still add images by URL below.
        </div>
      )}

      {images.length > 0 && (
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Images (the first one is the primary image)">
          {images.map((img, index) => {
            const urlErr = errors[`images.${img.key}.url`] ?? errors[`images.${img.key}`];
            const altErr = errors[`images.${img.key}.alt`];
            const altPath = `images.${img.key}.alt`;
            return (
              <li
                key={img.key}
                data-field={`images.${img.key}`}
                className={cn(
                  "flex flex-col overflow-hidden rounded-lg border bg-background",
                  urlErr ? "border-destructive" : "border-border",
                )}
              >
                <div className="relative aspect-square bg-muted">
                  <Image src={img.url} alt={img.alt || `Image ${index + 1}`} fill sizes="(min-width: 1024px) 240px, 50vw" className="object-cover" />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                      Primary
                    </span>
                  )}
                  {img.unsaved && (
                    <span className="absolute top-2 right-2 rounded-full bg-background/85 px-2 py-0.5 text-[11px] text-muted-foreground">
                      Not saved yet
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 p-2.5">
                  <FieldError message={urlErr} />
                  <label htmlFor={fieldId(altPath)} className="text-xs font-medium text-muted-foreground">
                    Alt text (image {index + 1})
                  </label>
                  <Input
                    {...a11yProps(altPath, altErr)}
                    value={img.alt}
                    maxLength={160}
                    placeholder="Describe the image"
                    onChange={(e) => {
                      const alt = e.target.value;
                      onChange((prev) => prev.map((i) => (i.key === img.key ? { ...i, alt } : i)));
                    }}
                  />
                  <FieldError id={`${fieldId(altPath)}-error`} message={altErr} />
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move image ${index + 1} earlier`}
                        title="Move earlier"
                      >
                        <ArrowLeftIcon aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => move(index, 1)}
                        disabled={index === images.length - 1}
                        aria-label={`Move image ${index + 1} later`}
                        title="Move later"
                      >
                        <ArrowRightIcon aria-hidden />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => remove(img)}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <Trash2Icon aria-hidden /> Remove
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {jobs.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Uploads">
          {jobs.map((job) => (
            <li key={job.key} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">{job.name}</span>
                {job.error ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setJobs((js) => js.filter((j) => j.key !== job.key))}
                    aria-label={`Dismiss error for ${job.name}`}
                  >
                    <XIcon aria-hidden />
                  </Button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                    {Math.round(job.progress)}%
                  </span>
                )}
              </div>
              {job.error ? (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  {job.error}
                </p>
              ) : (
                <div
                  className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={`Uploading ${job.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(job.progress)}
                >
                  <div className="h-full bg-primary transition-[width]" style={{ width: `${job.progress}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void startUploads(Array.from(e.dataTransfer.files));
          }}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center",
            dragOver ? "border-primary bg-primary/5" : listError ? "border-destructive" : "border-input",
          )}
        >
          <ImagePlusIcon className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Drop images here or{" "}
            <Button type="button" variant="link" className="h-auto p-0" onClick={() => fileInput.current?.click()}>
              choose files
            </Button>
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP or AVIF · up to 5 MB each · {remaining} of {MAX_IMAGES} remaining
          </p>
          <input
            ref={fileInput}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden

            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              void startUploads(files);
            }}
          />
          <Button
            type="button"
            variant="outline"
            id={fieldId("images")}
            aria-describedby={listError ? `${fieldId("images")}-error` : undefined}
            onClick={() => fileInput.current?.click()}
          >
            <UploadIcon aria-hidden /> Upload images
          </Button>
        </div>
      )}
      <FieldError id={`${fieldId("images")}-error`} message={listError} />

      {remaining > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="image-url" className="text-sm font-medium">
            Add image by URL <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <div className="flex gap-2">
            <Input
              id="image-url"
              type="url"
              inputMode="url"
              placeholder="https://images.unsplash.com/…"
              value={urlDraft}
              aria-invalid={urlError ? true : undefined}
              aria-describedby="image-url-hint"
              onChange={(e) => {
                setUrlDraft(e.target.value);
                setUrlError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addByUrl();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addByUrl}>
              <LinkIcon aria-hidden /> Add
            </Button>
          </div>
          <p id="image-url-hint" className={cn("text-xs", urlError ? "text-destructive" : "text-muted-foreground")} role={urlError ? "alert" : undefined}>
            {urlError ?? ALLOWED_URL_HINT}
          </p>
        </div>
      )}
    </div>
  );
}
