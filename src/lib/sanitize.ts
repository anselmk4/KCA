/**
 * HTML Sanitization and Escaping Utilities
 * Protects against Stored XSS and Reflected XSS vulnerabilities across the platform.
 */

/**
 * Escapes raw strings for safe insertion into HTML strings (e.g. invoices, email templates).
 */
export function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Robust HTML sanitizer for rich text content (Tiptap course content, descriptions, markdown outputs).
 * Removes script tags, iframes (except allowed safe video embeds), event handlers, and javascript: URIs.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html || typeof html !== "string") return "";

  let clean = html;

  // 1. Remove script tags and contents
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Remove dangerous tags
  const forbiddenTags = ["iframe", "object", "embed", "applet", "meta", "link", "base", "form", "svg"];
  for (const tag of forbiddenTags) {
    const reg = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, "gi");
    clean = clean.replace(reg, "");
    clean = clean.replace(new RegExp(`<${tag}[^>]*>`, "gi"), "");
  }

  // 3. Remove all inline event handlers (onerror, onload, onclick, onmouseover, etc.)
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 4. Remove javascript: or data: URIs in href or src
  clean = clean.replace(/(href|src)\s*=\s*["']?\s*(?:javascript:|data:(?!image\/)):?[^"'>\s]*/gi, '$1="#"');

  return clean;
}
