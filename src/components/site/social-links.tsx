import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FacebookIcon, InstagramIcon, XIcon, YouTubeIcon } from "./icons";
import { externalLinkProps } from "./text";

const NETWORKS = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
  { key: "x", label: "X", Icon: XIcon },
] as const;

/** Renders an icon link for each configured social URL; nothing when none are set. */
export function SocialLinks({
  social,
  siteName,
  className,
}: {
  social: SiteSettings["social"];
  siteName: string;
  className?: string;
}) {
  const items = NETWORKS.filter((n) => social[n.key]);
  if (!items.length) return null;
  return (
    <ul className={cn("flex items-center gap-2", className)} aria-label="Social media">
      {items.map(({ key, label, Icon }) => (
        <li key={key}>
          <a
            href={social[key]}
            {...externalLinkProps}
            aria-label={`${siteName} on ${label}`}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold/50 hover:text-gold"
          >
            <Icon className="size-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
