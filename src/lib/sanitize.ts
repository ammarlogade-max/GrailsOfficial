import DOMPurify from "dompurify";

/**
 * Strips any HTML/script content from user- or admin-submitted text before
 * it's written to the database. Everything that ends up rendered back to
 * other users (product descriptions, review text, admin notes, ticket
 * replies, FAQ answers, etc.) should go through this first — sanitizing on
 * write means a stored-XSS payload never makes it into the database in the
 * first place, regardless of what later reads it or how it's rendered.
 *
 * Defaults to stripping ALL tags (plain text in, plain text out), since
 * none of this app's user-generated content needs rich HTML formatting.
 */
export function sanitizeText(input: string): string {
  if (!input) return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/** For the few fields that intentionally allow basic formatting (e.g. email template bodies with line breaks). */
export function sanitizeBasicHtml(input: string): string {
  if (!input) return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: ["b", "i", "em", "strong", "br", "p", "a"], ALLOWED_ATTR: ["href"] });
}

/** Sanitizes every string value in a flat object (shallow) — handy for form payloads with several free-text fields. */
export function sanitizeFields<T extends Record<string, unknown>>(obj: T, keys: (keyof T)[]): T {
  const copy = { ...obj };
  for (const key of keys) {
    if (typeof copy[key] === "string") {
      copy[key] = sanitizeText(copy[key] as string) as T[typeof key];
    }
  }
  return copy;
}
