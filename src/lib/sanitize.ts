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

  // 2. Transform any legacy PDF block into the sleek Gmail-style attachment card without blocked iframes
  clean = clean.replace(/<div[^>]*data-block-type=["']pdf["'][^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, (pdfBlockMatch) => {
    const urlMatch = pdfBlockMatch.match(/data-url=["']([^"']*)["']/i) || pdfBlockMatch.match(/href=["']([^"']*)["']/i);
    const titleMatch = pdfBlockMatch.match(/data-title=["']([^"']*)["']/i) || pdfBlockMatch.match(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/i) || pdfBlockMatch.match(/<p[^>]*font-bold[^>]*>([^<]*)<\/p>/i);
    const pdfUrl = urlMatch ? urlMatch[1] : "";
    const rawTitle = titleMatch ? titleMatch[1].trim() : "Document PDF";
    const pdfTitleSafe = (rawTitle || "Document PDF")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return `<div data-block-type="pdf" data-url="${pdfUrl}" data-title="${pdfTitleSafe}" class="my-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md">
      <div class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/90 dark:bg-zinc-900/90">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-12 h-14 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center justify-between p-1.5 shrink-0 shadow-xs">
            <span class="text-[9px] font-black tracking-widest text-red-600 dark:text-red-400 uppercase bg-red-100 dark:bg-red-950/60 px-1 py-0.5 rounded">PDF</span>
            <div class="w-full space-y-0.5 px-0.5">
              <div class="h-0.5 w-full bg-red-400/40 rounded-full"></div>
              <div class="h-0.5 w-3/4 bg-red-400/30 rounded-full"></div>
              <div class="h-0.5 w-1/2 bg-red-400/30 rounded-full"></div>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate" title="${pdfTitleSafe}">${pdfTitleSafe}</h4>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>Document PDF attaché</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
          ${pdfUrl ? `
            <button type="button" data-action="view-pdf" data-pdf-url="${pdfUrl}" data-pdf-title="${pdfTitleSafe}" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-xs cursor-pointer" title="Visionner le document PDF">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              <span>Visionner</span>
            </button>
          ` : `<span class="text-xs text-zinc-400">Aucun PDF sélectionné</span>`}
        </div>
      </div>
    </div>`;
  });

  // 3. Transform any legacy Google Docs block into sleek attachment card
  clean = clean.replace(/<div[^>]*data-block-type=["']google_docs["'][^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, (docBlockMatch) => {
    const urlMatch = docBlockMatch.match(/data-url=["']([^"']*)["']/i) || docBlockMatch.match(/href=["']([^"']*)["']/i);
    const typeMatch = docBlockMatch.match(/data-doc-type=["']([^"']*)["']/i);
    const rawUrl = urlMatch ? urlMatch[1] : "";
    const docType = typeMatch ? typeMatch[1] : "doc";

    const docTypeName =
      docType === "sheet"
        ? "Feuille de calcul Google Sheets"
        : docType === "slide"
        ? "Présentation Google Slides"
        : docType === "form"
        ? "Formulaire Google Forms"
        : "Document Google Docs";

    const badgeConfig = {
      doc: { label: "DOCS", bg: "bg-blue-500/10 text-blue-600 border-blue-500/20", line1: "bg-blue-400/40", line2: "bg-blue-400/30", dot: "bg-blue-500", btn: "bg-blue-600 hover:bg-blue-500" },
      sheet: { label: "SHEET", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", line1: "bg-emerald-400/40", line2: "bg-emerald-400/30", dot: "bg-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-500" },
      slide: { label: "SLIDE", bg: "bg-amber-500/10 text-amber-600 border-amber-500/20", line1: "bg-amber-400/40", line2: "bg-amber-400/30", dot: "bg-amber-500", btn: "bg-amber-600 hover:bg-amber-500" },
      form: { label: "FORM", bg: "bg-purple-500/10 text-purple-600 border-purple-500/20", line1: "bg-purple-400/40", line2: "bg-purple-400/30", dot: "bg-purple-500", btn: "bg-purple-600 hover:bg-purple-500" },
    }[docType as "doc" | "sheet" | "slide" | "form"] || { label: "DOCS", bg: "bg-blue-500/10 text-blue-600 border-blue-500/20", line1: "bg-blue-400/40", line2: "bg-blue-400/30", dot: "bg-blue-500", btn: "bg-blue-600 hover:bg-blue-500" };

    return `<div data-block-type="google_docs" data-doc-type="${docType}" data-url="${rawUrl}" class="my-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md">
      <div class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/90 dark:bg-zinc-900/90">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-12 h-14 ${badgeConfig.bg} border rounded-xl flex flex-col items-center justify-between p-1.5 shrink-0 shadow-xs">
            <span class="text-[8px] font-black tracking-widest uppercase bg-white/80 dark:bg-zinc-950/60 px-1 py-0.5 rounded">${badgeConfig.label}</span>
            <div class="w-full space-y-0.5 px-0.5">
              <div class="h-0.5 w-full ${badgeConfig.line1} rounded-full"></div>
              <div class="h-0.5 w-3/4 ${badgeConfig.line2} rounded-full"></div>
              <div class="h-0.5 w-1/2 ${badgeConfig.line2} rounded-full"></div>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate" title="${docTypeName}">${docTypeName}</h4>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full ${badgeConfig.dot}"></span>
              <span>Document interactif Google attaché</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
          ${rawUrl ? `
            <button type="button" data-action="view-doc" data-doc-url="${rawUrl}" data-raw-url="${rawUrl}" data-doc-title="${docTypeName}" data-doc-type="${docType}" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ${badgeConfig.btn} text-white font-bold text-xs transition-all shadow-xs cursor-pointer" title="Visionner le document Google">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              <span>Visionner</span>
            </button>
          ` : `<span class="text-xs text-zinc-400">Lien Google Docs non renseigné</span>`}
        </div>
      </div>
    </div>`;
  });

  // 3. Preserve safe iframes (videos, etc.) by temporary tokenization
  const safeIframeMatches: { token: string; tag: string }[] = [];
  let iframeTokenIdx = 0;

  clean = clean.replace(/<iframe\b([^>]*?)(\/?>[\s\S]*?<\/iframe>|\/?>)/gi, (match, attrs) => {
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    const src = srcMatch ? srcMatch[1] : "";
    const isSafeSrc =
      /^(https?:)?\/\/(www\.|m\.|music\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be|player\.vimeo\.com|vimeo\.com|dailymotion\.com|dai\.ly|docs\.google\.com|drive\.google\.com)\//i.test(src);

    if (isSafeSrc) {
      const token = `__SAFE_IFRAME_${iframeTokenIdx++}__`;
      safeIframeMatches.push({ token, tag: match });
      return token;
    }
    return "";
  });

  // 4. Remove dangerous tags (allow safe markup and svg icons)
  const forbiddenTags = ["iframe", "object", "embed", "applet", "meta", "link", "base", "form"];
  for (const tag of forbiddenTags) {
    const reg = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, "gi");
    clean = clean.replace(reg, "");
    clean = clean.replace(new RegExp(`<${tag}[^>]*>`, "gi"), "");
  }

  // 5. Remove all inline event handlers (onerror, onload, onclick, onmouseover, etc.)
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 6. Remove dangerous javascript: or non-safe data: URIs in href or src (allow image/* and application/pdf)
  clean = clean.replace(/(href|src)\s*=\s*["']?\s*(?:javascript:|data:(?!(?:image\/|application\/pdf))):?[^"'>\s]*/gi, '$1="#"');

  // 7. Restore safe iframes
  for (const item of safeIframeMatches) {
    clean = clean.replace(item.token, item.tag);
  }

  return clean;
}
