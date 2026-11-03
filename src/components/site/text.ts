/** Splits admin-entered long text into paragraphs (separated by blank lines). */
export function toParagraphs(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** `tel:` href from a human-formatted phone number. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Common attributes for every outbound WhatsApp / social link. */
export const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" } as const;
