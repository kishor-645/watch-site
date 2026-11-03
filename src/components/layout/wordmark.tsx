import Image from "next/image";
import { cn } from "@/lib/utils";

/** Bold display wordmark derived from the configured site name, with an aurora full stop. */
export function Wordmark({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display text-2xl font-bold uppercase leading-none tracking-[-0.04em] text-foreground",
        className,
      )}
    >
      {name}
      <span aria-hidden className="ml-[0.08em] inline-block size-[0.26em] rounded-full bg-aurora" />
    </span>
  );
}

/** Logo image when configured, otherwise the wordmark. */
export function Brand({
  siteName,
  logoUrl,
  className,
  imageClassName,
}: {
  siteName: string;
  logoUrl: string;
  className?: string;
  imageClassName?: string;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={siteName}
        width={180}
        height={48}
        sizes="180px"
        className={cn("h-8 w-auto max-w-[11rem] object-contain sm:h-9", imageClassName)}
      />
    );
  }
  return <Wordmark name={siteName} className={className} />;
}
