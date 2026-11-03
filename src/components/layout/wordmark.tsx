import Image from "next/image";
import { cn } from "@/lib/utils";

/** Splits "MyWatch" -> ["My", "Watch"] or "Atelier Noir" -> ["Atelier ", "Noir"] for the gold accent. */
function splitName(name: string): [string, string] {
  const spaced = name.match(/^(.*\s)(\S+)$/);
  if (spaced) return [spaced[1], spaced[2]];
  const camel = name.match(/^(.+?)([A-Z][^A-Z]+)$/);
  if (camel) return [camel[1], camel[2]];
  return [name, ""];
}

/** Serif wordmark derived from the configured site name. */
export function Wordmark({ name, className }: { name: string; className?: string }) {
  const [lead, accent] = splitName(name);
  return (
    <span className={cn("font-serif text-2xl font-semibold uppercase tracking-[0.18em] text-foreground", className)}>
      {lead}
      {accent && <span className="text-gold">{accent}</span>}
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
