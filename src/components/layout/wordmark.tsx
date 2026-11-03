import Image from "next/image";
import { cn } from "@/lib/utils";

/** Single-colour serif wordmark derived from the configured site name. */
export function Wordmark({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("font-serif text-2xl font-semibold uppercase tracking-[0.12em] text-foreground", className)}>
      {name}
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
