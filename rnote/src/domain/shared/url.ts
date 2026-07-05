/**
 * URL sanitization — the app's defense against stored XSS. Note content can
 * arrive from imported backups, pasted HTML, or (later) synced sources, so any
 * href/src that reaches the DOM is normalized here first. Pure and testable.
 *
 * Blocks `javascript:`, `data:` (for links), `vbscript:`, and control-character
 * obfuscation (e.g. `java\tscript:`); allows only http(s)/mailto/tel and
 * relative links.
 */
const SAFE_LINK_SCHEME = /^(https?:|mailto:|tel:)/i;
const RELATIVE_LINK = /^(#|\/(?!\/)|\.{1,2}\/)/; // #hash, /path (not //), ./ or ../
const SAFE_IMAGE_DATA = /^data:image\/(png|jpe?g|gif|webp|svg\+xml|avif|bmp|x-icon);/i;

function strip(value: string): string {
  // Remove control characters (incl. tabs/newlines) used to obfuscate schemes.
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code > 0x1f && code !== 0x7f) out += ch;
  }
  return out.trim();
}

/** Returns a safe href, or null if the URL is unsafe / unusable as a link. */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  if (input.trim() === '') return null;
  const cleaned = strip(input);
  if (cleaned === '') return null;
  if (RELATIVE_LINK.test(cleaned)) return cleaned;
  if (SAFE_LINK_SCHEME.test(cleaned)) return cleaned;
  return null;
}

/** Returns a safe image src (http(s), blob:, or data:image/*), or null. */
export function sanitizeImageSrc(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const cleaned = strip(input);
  if (cleaned === '') return null;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (/^blob:/i.test(cleaned)) return cleaned;
  if (SAFE_IMAGE_DATA.test(cleaned)) return cleaned;
  return null;
}
