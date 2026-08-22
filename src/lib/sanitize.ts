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
 * Robust HTML sanitizer for rich text content (course content, descriptions, markdown outputs).
 * Removes script tags, unsafe iframes, event handlers, and javascript: URIs while preserving
 * safe video/document embeds (YouTube, Vimeo, Dailymotion, Google Docs, PDF embeds).
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html || typeof html !== "string") return "";

  let clean = html;

  // 1. Remove script tags and contents
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Preserve safe iframes by temporary tokenization
  const safeIframeMatches: { token: string; tag: string }[] = [];
  let iframeTokenIdx = 0;

  clean = clean.replace(/<iframe\b([^>]*?)(\/?>[\s\S]*?<\/iframe>|\/?>)/gi, (match, attrs) => {
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    const src = srcMatch ? srcMatch[1] : "";
    const isSafeSrc =
      /^(https?:)?\/\/(www\.|m\.|music\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be|player\.vimeo\.com|vimeo\.com|dailymotion\.com|dai\.ly|docs\.google\.com|drive\.google\.com)\//i.test(src) ||
      src.startsWith("data:application/pdf") ||
      src.startsWith("blob:") ||
      src.includes("docs.google.com/viewer") ||
      src.endsWith(".pdf") ||
      src.includes(".pdf?");

    if (isSafeSrc) {
      const token = `__SAFE_IFRAME_${iframeTokenIdx++}__`;
      safeIframeMatches.push({ token, tag: match });
      return token;
    }
    return "";
  });

  // 3. Remove dangerous tags (allow safe markup and svg icons)
  const forbiddenTags = ["iframe", "object", "embed", "applet", "meta", "link", "base", "form"];
  for (const tag of forbiddenTags) {
    const reg = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, "gi");
    clean = clean.replace(reg, "");
    clean = clean.replace(new RegExp(`<${tag}[^>]*>`, "gi"), "");
  }

  // 4. Remove all inline event handlers (onerror, onload, onclick, onmouseover, etc.)
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 5. Remove dangerous javascript: or non-safe data: URIs in href or src (allow image/* and application/pdf)
  clean = clean.replace(/(href|src)\s*=\s*["']?\s*(?:javascript:|data:(?!(?:image\/|application\/pdf))):?[^"'>\s]*/gi, '$1="#"');

  // 6. Restore safe iframes
  for (const item of safeIframeMatches) {
    clean = clean.replace(item.token, item.tag);
  }

  return clean;
}
