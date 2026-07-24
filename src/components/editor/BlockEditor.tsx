"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  FileText,
  Image as ImageIcon,
  Link2,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Sparkles,
  FileDown,
  Info,
  HelpCircle,
  FileCode,
  Layout,
  Maximize2,
  ChevronDown,
  Loader2,
  Heading1,
  Heading2,
  Heading3,
  ExternalLink,
  Code,
  Table as TableIcon,
  Columns as ColumnsIcon,
  Code2,
  Volume2,
  Share2,
  Shapes,
  Eye,
  Edit3
} from "lucide-react";
import RichEditor from "./RichEditor";

// ─── Block Types ──────────────────────────────────────────
export type BlockType =
  | "text"
  | "title"
  | "image"
  | "video"
  | "pdf"
  | "link"
  | "info"
  | "google_docs"
  | "separator"
  | "table"
  | "columns"
  | "vector"
  | "html_code"
  | "audio"
  | "code"
  | "tweet"
  | "markdown";

export interface Block {
  id: string;
  type: BlockType;
  value: any;
}

interface BlockEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// ─── Helpers & Utilities ───
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Transforms any raw Google Docs/Sheets/Slides/Forms/Drive URL into a working embed/preview URL.
 */
export function formatGoogleEmbedUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let url = rawUrl.trim();
  if (!url) return "";

  if (url.includes("docs.google.com/document/d/")) {
    if (url.includes("/pub")) {
      return url.includes("embedded=true") ? url : `${url}${url.includes("?") ? "&" : "?"}embedded=true`;
    }
    return url.replace(/\/(edit|view|pub)?(\?.*)?$/, "/preview");
  }

  if (url.includes("docs.google.com/spreadsheets/d/")) {
    if (url.includes("/pubhtml")) {
      return url.includes("widget=true") ? url : `${url}${url.includes("?") ? "&" : "?"}widget=true&headers=false`;
    }
    return url.replace(/\/(edit|view|pub)?(\?.*)?$/, "/preview");
  }

  if (url.includes("docs.google.com/presentation/d/")) {
    if (url.includes("/embed")) return url;
    return url.replace(/\/(edit|view|pub)?(\?.*)?$/, "/embed?start=false&loop=false&delayms=3000");
  }

  if (url.includes("docs.google.com/forms/")) {
    if (url.includes("embedded=true")) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}embedded=true`;
  }

  if (url.includes("drive.google.com/file/d/")) {
    if (url.includes("/preview")) return url;
    return url.replace(/\/(view|edit)?(\?.*)?$/, "/preview");
  }

  return url;
}

/**
 * Extracts Tweet ID from Twitter/X URL.
 */
export function extractTweetId(url: string): string {
  if (!url) return "";
  const match = url.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(?:\w+)\/status(?:es)?\/(\d+)/i);
  return match ? match[1] : "";
}

/**
 * Converts Markdown text into clean HTML.
 */
export function simpleMarkdownToHtml(md: string): string {
  if (!md) return "";
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold my-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-extrabold my-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-black my-3">$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-zinc-900 text-teal-400 p-3 rounded-xl font-mono text-xs my-2 overflow-x-auto"><code>$1</code></pre>');
  html = html.replace(/`(.*?)`/g, '<code class="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/\n/g, "<br />");

  return html;
}

// ─── HTML Parser ───
export function parseHtmlToBlocks(html: string): Block[] {
  if (typeof window === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || "", "text/html");
  const blocks: Block[] = [];

  const children = Array.from(doc.body.children);

  if (children.length === 0 && html.trim()) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "text",
      value: { html }
    });
    return blocks;
  }

  children.forEach((el) => {
    const blockType = (el.getAttribute("data-block-type") || "") as BlockType;
    const id = crypto.randomUUID();

    if (!blockType) {
      blocks.push({
        id,
        type: "text",
        value: { html: el.outerHTML }
      });
      return;
    }

    switch (blockType) {
      case "title": {
        const level = parseInt(el.getAttribute("data-level") || "2");
        blocks.push({ id, type: "title", value: { text: el.textContent || "", level } });
        break;
      }
      case "text": {
        blocks.push({ id, type: "text", value: { html: el.innerHTML } });
        break;
      }
      case "image": {
        const url = el.getAttribute("data-url") || "";
        const caption = el.getAttribute("data-caption") || "";
        blocks.push({ id, type: "image", value: { url, caption } });
        break;
      }
      case "video": {
        const videoType = el.getAttribute("data-video-type") || "youtube";
        const url = el.getAttribute("data-url") || "";
        blocks.push({ id, type: "video", value: { type: videoType, url } });
        break;
      }
      case "pdf": {
        const url = el.getAttribute("data-url") || "";
        const title = el.getAttribute("data-title") || "";
        blocks.push({ id, type: "pdf", value: { url, title } });
        break;
      }
      case "separator": {
        blocks.push({ id, type: "separator", value: {} });
        break;
      }
      case "link": {
        const url = el.getAttribute("data-url") || "";
        const label = el.getAttribute("data-label") || "";
        blocks.push({ id, type: "link", value: { url, label } });
        break;
      }
      case "info": {
        const style = el.getAttribute("data-style") || "info";
        blocks.push({ id, type: "info", value: { text: el.innerHTML, style } });
        break;
      }
      case "google_docs": {
        const docType = el.getAttribute("data-doc-type") || "doc";
        const url = el.getAttribute("data-url") || "";
        blocks.push({ id, type: "google_docs", value: { type: docType, url } });
        break;
      }
      case "table": {
        try {
          const headers = JSON.parse(decodeURIComponent(el.getAttribute("data-headers") || "[]"));
          const rows = JSON.parse(decodeURIComponent(el.getAttribute("data-rows") || "[]"));
          blocks.push({ id, type: "table", value: { headers, rows } });
        } catch {
          blocks.push({ id, type: "table", value: { headers: ["Colonne 1", "Colonne 2"], rows: [["Donnée 1", "Donnée 2"]] } });
        }
        break;
      }
      case "columns": {
        const count = parseInt(el.getAttribute("data-count") || "2");
        const col1 = decodeURIComponent(el.getAttribute("data-col1") || "");
        const col2 = decodeURIComponent(el.getAttribute("data-col2") || "");
        const col3 = decodeURIComponent(el.getAttribute("data-col3") || "");
        blocks.push({ id, type: "columns", value: { count, col1, col2, col3 } });
        break;
      }
      case "vector": {
        const svg = decodeURIComponent(el.getAttribute("data-svg") || "");
        const caption = el.getAttribute("data-caption") || "";
        blocks.push({ id, type: "vector", value: { svg, caption } });
        break;
      }
      case "html_code": {
        const htmlCode = decodeURIComponent(el.getAttribute("data-code") || "");
        blocks.push({ id, type: "html_code", value: { html: htmlCode } });
        break;
      }
      case "audio": {
        const url = el.getAttribute("data-url") || "";
        const title = el.getAttribute("data-title") || "";
        blocks.push({ id, type: "audio", value: { url, title } });
        break;
      }
      case "code": {
        const lang = el.getAttribute("data-lang") || "javascript";
        const code = decodeURIComponent(el.getAttribute("data-code") || "");
        blocks.push({ id, type: "code", value: { lang, code } });
        break;
      }
      case "tweet": {
        const url = el.getAttribute("data-url") || "";
        blocks.push({ id, type: "tweet", value: { url } });
        break;
      }
      case "markdown": {
        const content = decodeURIComponent(el.getAttribute("data-content") || "");
        blocks.push({ id, type: "markdown", value: { content } });
        break;
      }
      default: {
        blocks.push({ id, type: "text", value: { html: el.outerHTML } });
      }
    }
  });

  return blocks;
}

// ─── HTML Serializer ───
export function serializeBlocksToHtml(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "title": {
          const level = block.value.level || 2;
          return `<h${level} data-block-type="title" data-level="${level}" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">${block.value.text || ""}</h${level}>`;
        }
        case "text": {
          return `<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-150 my-3">${block.value.html || ""}</div>`;
        }
        case "image": {
          return `<div data-block-type="image" data-url="${block.value.url || ""}" data-caption="${block.value.caption || ""}" class="my-6">
            <img src="${block.value.url || ""}" alt="${block.value.caption || ""}" class="rounded-2xl max-w-full h-auto mx-auto border border-zinc-200 dark:border-zinc-800 shadow-sm" />
            ${block.value.caption ? `<p class="text-center text-xs text-zinc-400 mt-2">${block.value.caption}</p>` : ""}
          </div>`;
        }
        case "video": {
          const vType = block.value.type || "youtube";
          const url = block.value.url || "";
          let embedSrc = url;

          if (vType === "youtube") {
            const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            const match = url.match(ytReg);
            if (match && match[1]) {
              embedSrc = `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0`;
            }
          } else if (vType === "dailymotion") {
            const dmReg = /dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/i;
            const match = url.match(dmReg);
            if (match && match[1]) {
              embedSrc = `https://www.dailymotion.com/embed/video/${match[1]}?ui-logo=0&ui-start-screen-info=0`;
            }
          }

          if (vType === "uploaded") {
            return `<div data-block-type="video" data-video-type="uploaded" data-url="${url}" class="my-6 aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black">
              <video src="${url}" controls class="w-full h-full"></video>
            </div>`;
          }

          return `<div data-block-type="video" data-video-type="${vType}" data-url="${url}" class="my-6 aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <iframe src="${embedSrc}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
          </div>`;
        }
        case "pdf": {
          const pdfTitle = block.value.title || "Document PDF";
          const pdfUrl = block.value.url || "";
          return `<div data-block-type="pdf" data-url="${pdfUrl}" data-title="${pdfTitle}" class="my-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-sm space-y-3">
            <div class="p-4 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2.5 bg-red-500/10 text-red-500 rounded-xl font-bold">📄</div>
                <div>
                  <p class="font-bold text-sm text-zinc-900 dark:text-white">${pdfTitle}</p>
                  <p class="text-[10px] text-zinc-400">Document PDF</p>
                </div>
              </div>
              ${pdfUrl ? `<a href="${pdfUrl}" download class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all">Télécharger</a>` : ""}
            </div>
            ${pdfUrl ? `<div class="w-full h-[550px]"><iframe src="${pdfUrl}" class="w-full h-full" frameborder="0"></iframe></div>` : `<div class="p-8 text-center text-xs text-zinc-400">Aucun PDF sélectionné.</div>`}
          </div>`;
        }
        case "separator": {
          return `<hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />`;
        }
        case "link": {
          const lbl = block.value.label || block.value.url || "Visiter le lien";
          return `<div data-block-type="link" data-url="${block.value.url || ""}" data-label="${block.value.label || ""}" class="my-4">
            <a href="${block.value.url || "#"}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold rounded-xl text-sm border border-blue-200/50 dark:border-blue-900/50">
              <span>${lbl}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          </div>`;
        }
        case "info": {
          const style = block.value.style || "info";
          const styleClasses =
            style === "warning" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 text-amber-800 dark:text-amber-400"
            : style === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 text-emerald-800 dark:text-emerald-400"
            : style === "danger" ? "bg-red-50 dark:bg-red-950/20 border-red-250 text-red-800 dark:text-red-400"
            : "bg-blue-50 dark:bg-blue-950/20 border-blue-250 text-blue-800 dark:text-blue-400";
          return `<div data-block-type="info" data-style="${style}" class="my-4 p-4 rounded-2xl border text-sm ${styleClasses}">${block.value.text || ""}</div>`;
        }
        case "google_docs": {
          const docType = block.value.type || "doc";
          const rawUrl = block.value.url || "";
          const embedUrl = formatGoogleEmbedUrl(rawUrl);

          return `<div data-block-type="google_docs" data-doc-type="${docType}" data-url="${rawUrl}" class="my-6 w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-md bg-white dark:bg-zinc-950">
            <div class="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span class="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <span>📄</span> Document Google (${docType.toUpperCase()})
              </span>
              ${rawUrl ? `<a href="${rawUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 font-bold hover:underline">Ouvrir dans Google Docs ↗</a>` : ""}
            </div>
            ${embedUrl ? `<div class="w-full h-[600px]"><iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div>` : `<div class="p-8 text-center text-xs text-zinc-400 font-bold">Veuillez renseigner le lien du document Google.</div>`}
          </div>`;
        }
        case "table": {
          const headers: string[] = block.value.headers || ["Colonne 1", "Colonne 2"];
          const rows: string[][] = block.value.rows || [["Donnée 1", "Donnée 2"]];
          const encHeaders = encodeURIComponent(JSON.stringify(headers));
          const encRows = encodeURIComponent(JSON.stringify(rows));

          return `<div data-block-type="table" data-headers="${encHeaders}" data-rows="${encRows}" class="my-6 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <table class="w-full text-left text-sm text-zinc-800 dark:text-zinc-200 border-collapse">
              <thead class="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <tr>${headers.map((h) => `<th class="p-3.5 font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800">${h}</th>`).join("")}</tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                ${rows.map((r) => `<tr>${r.map((c) => `<td class="p-3.5 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800">${c}</td>`).join("")}</tr>`).join("")}
              </tbody>
            </table>
          </div>`;
        }
        case "columns": {
          const count = block.value.count || 2;
          const col1 = block.value.col1 || "";
          const col2 = block.value.col2 || "";
          const col3 = block.value.col3 || "";
          const gridCols = count === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

          return `<div data-block-type="columns" data-count="${count}" data-col1="${encodeURIComponent(col1)}" data-col2="${encodeURIComponent(col2)}" data-col3="${encodeURIComponent(col3)}" class="my-6 grid grid-cols-1 ${gridCols} gap-4">
            <div class="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 text-sm">${col1}</div>
            <div class="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 text-sm">${col2}</div>
            ${count === 3 ? `<div class="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 text-sm">${col3}</div>` : ""}
          </div>`;
        }
        case "vector": {
          const svg = block.value.svg || "";
          const caption = block.value.caption || "";

          return `<div data-block-type="vector" data-svg="${encodeURIComponent(svg)}" data-caption="${caption}" class="my-6 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center shadow-sm">
            <div class="w-full max-w-2xl overflow-x-auto flex justify-center">${svg}</div>
            ${caption ? `<p class="text-center text-xs text-zinc-400 mt-3 font-semibold">${caption}</p>` : ""}
          </div>`;
        }
        case "html_code": {
          const htmlCode = block.value.html || "";
          return `<div data-block-type="html_code" data-code="${encodeURIComponent(htmlCode)}" class="my-6">${htmlCode}</div>`;
        }
        case "audio": {
          const url = block.value.url || "";
          const title = block.value.title || "Fichier Audio";
          return `<div data-block-type="audio" data-url="${url}" data-title="${title}" class="my-6 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 text-white shadow-md">
            <div class="flex items-center gap-3 mb-3">
              <div class="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold">🎵</div>
              <div>
                <p class="font-extrabold text-sm text-white">${title}</p>
                <p class="text-[10px] text-zinc-400">Écouter l'enregistrement audio</p>
              </div>
            </div>
            <audio src="${url}" controls class="w-full rounded-xl"></audio>
          </div>`;
        }
        case "code": {
          const lang = block.value.lang || "javascript";
          const codeText = block.value.code || "";
          return `<div data-block-type="code" data-lang="${lang}" data-code="${encodeURIComponent(codeText)}" class="my-6 rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 overflow-hidden shadow-md font-mono text-xs">
            <div class="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
              <span class="text-teal-400 font-extrabold">${lang}</span>
              <span>Code Source</span>
            </div>
            <pre class="p-4 overflow-x-auto text-emerald-400 leading-relaxed"><code>${codeText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
          </div>`;
        }
        case "tweet": {
          const url = block.value.url || "";
          const tweetId = extractTweetId(url);
          return `<div data-block-type="tweet" data-url="${url}" class="my-6 flex justify-center">
            <div class="w-full max-w-lg p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm text-center">
              <div class="flex items-center justify-between mb-3 text-xs">
                <span class="font-black text-blue-500 flex items-center gap-1.5">
                  <span>𝕏</span> Post Twitter / X
                </span>
                ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[10px] text-blue-400 underline font-bold">Voir sur 𝕏 ↗</a>` : ""}
              </div>
              ${tweetId ? `<iframe src="https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=dark" class="w-full h-[320px] rounded-xl" frameborder="0"></iframe>` : `<p class="text-xs text-zinc-400">Veuillez entrer une URL valide de post 𝕏/Twitter.</p>`}
            </div>
          </div>`;
        }
        case "markdown": {
          const mdContent = block.value.content || "";
          return `<div data-block-type="markdown" data-content="${encodeURIComponent(mdContent)}" class="my-6 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">${simpleMarkdownToHtml(mdContent)}</div>`;
        }
        default:
          return "";
      }
    })
    .join("\n");
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ value, onChange }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [fileUploadingBlockId, setFileUploadingBlockId] = useState<string | null>(null);

  const lastEmittedRef = useRef<string>("");

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    const parsed = parseHtmlToBlocks(value);
    setBlocks(parsed);
  }, [value]);

  const handleBlocksChange = (newBlocks: Block[]) => {
    const html = serializeBlocksToHtml(newBlocks);
    lastEmittedRef.current = html;
    setBlocks(newBlocks);
    onChange(html);
  };

  const addBlock = (type: BlockType) => {
    const id = crypto.randomUUID();
    let initialValue: any = {};

    switch (type) {
      case "title":
        initialValue = { text: "", level: 2 };
        break;
      case "text":
        initialValue = { html: "" };
        break;
      case "video":
        initialValue = { type: "youtube", url: "" };
        break;
      case "image":
        initialValue = { url: "", caption: "" };
        break;
      case "link":
        initialValue = { url: "", label: "" };
        break;
      case "pdf":
        initialValue = { url: "", title: "" };
        break;
      case "info":
        initialValue = { text: "", style: "info" };
        break;
      case "google_docs":
        initialValue = { type: "doc", url: "" };
        break;
      case "table":
        initialValue = { headers: ["Colonne 1", "Colonne 2", "Colonne 3"], rows: [["Donnée A1", "Donnée B1", "Donnée C1"], ["Donnée A2", "Donnée B2", "Donnée C2"]] };
        break;
      case "columns":
        initialValue = { count: 2, col1: "Contenu Colonne 1", col2: "Contenu Colonne 2", col3: "Contenu Colonne 3" };
        break;
      case "vector":
        initialValue = { svg: `<svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`, caption: "Schéma d'illustration" };
        break;
      case "html_code":
        initialValue = { html: `<div style="padding:16px; background:#09090b; color:#10b981; border-radius:12px;"><strong>Code HTML Libre</strong></div>` };
        break;
      case "audio":
        initialValue = { url: "", title: "Enregistrement Audio" };
        break;
      case "code":
        initialValue = { lang: "javascript", code: `// Écrivez votre code ici\nconsole.log("Hello Kuettu Academy!");` };
        break;
      case "tweet":
        initialValue = { url: "" };
        break;
      case "markdown":
        initialValue = { content: `# Titre Markdown\n- Point 1\n- Point 2\n**Texte en gras**` };
        break;
      case "separator":
        initialValue = {};
        break;
    }

    const updated = [...blocks, { id, type, value: initialValue }];
    handleBlocksChange(updated);
    setShowPlusMenu(false);
  };

  const updateBlockValue = (id: string, valueUpdates: any) => {
    const updated = blocks.map((b) =>
      b.id === id ? { ...b, value: { ...b.value, ...valueUpdates } } : b
    );
    handleBlocksChange(updated);
  };

  const deleteBlock = (id: string) => {
    const updated = blocks.filter((b) => b.id !== id);
    handleBlocksChange(updated);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    handleBlocksChange(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string, type: "image" | "pdf" | "video" | "audio") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (max 25 Mo).");
      return;
    }

    setFileUploadingBlockId(id);
    try {
      const base64 = await fileToBase64(file);
      if (type === "image") {
        updateBlockValue(id, { url: base64, caption: file.name.split(".")[0] });
      } else if (type === "pdf") {
        updateBlockValue(id, { url: base64, title: file.name.split(".")[0] });
      } else if (type === "video") {
        updateBlockValue(id, { url: base64, type: "uploaded" });
      } else if (type === "audio") {
        updateBlockValue(id, { url: base64, title: file.name.split(".")[0] });
      }
    } catch (err: any) {
      alert("Erreur de lecture du fichier : " + err.message);
    } finally {
      setFileUploadingBlockId(null);
    }
  };

  const handleGenerateAiContent = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/lesson-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() })
      });

      if (!res.ok) throw new Error("Erreur de génération.");
      const data = await res.json();

      const aiBlocks = parseHtmlToBlocks(data.html);
      const updated = [...blocks, ...aiBlocks];
      handleBlocksChange(updated);
      setShowAiModal(false);
      setAiPrompt("");
    } catch (err: any) {
      alert("Erreur de génération IA : " + err.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Blocks List */}
      <div className="space-y-4">
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            {/* Block sorting / deletion toolbar */}
            <div className="absolute right-2 top-2 sm:right-4 sm:top-4 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-900 shadow-sm border border-zinc-150 dark:border-zinc-800 rounded-xl p-1 z-10">
              <button
                type="button"
                onClick={() => moveBlock(idx, "up")}
                disabled={idx === 0}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 rounded-lg disabled:opacity-25"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveBlock(idx, "down")}
                disabled={idx === blocks.length - 1}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 rounded-lg disabled:opacity-25"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => deleteBlock(block.id)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Block content editing area */}
            <div className="pr-20">
              {/* Type Badge */}
              <div className="flex items-center gap-1.5 mb-2.5 text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                {block.type === "title" && <Heading2 className="w-3.5 h-3.5" />}
                {block.type === "text" && <FileText className="w-3.5 h-3.5" />}
                {block.type === "image" && <ImageIcon className="w-3.5 h-3.5" />}
                {block.type === "video" && <Video className="w-3.5 h-3.5" />}
                {block.type === "pdf" && <FileDown className="w-3.5 h-3.5" />}
                {block.type === "link" && <Link2 className="w-3.5 h-3.5" />}
                {block.type === "info" && <Info className="w-3.5 h-3.5" />}
                {block.type === "google_docs" && <Layout className="w-3.5 h-3.5 text-yellow-500" />}
                {block.type === "table" && <TableIcon className="w-3.5 h-3.5 text-blue-500" />}
                {block.type === "columns" && <ColumnsIcon className="w-3.5 h-3.5 text-indigo-500" />}
                {block.type === "vector" && <Shapes className="w-3.5 h-3.5 text-emerald-500" />}
                {block.type === "html_code" && <Code2 className="w-3.5 h-3.5 text-purple-500" />}
                {block.type === "audio" && <Volume2 className="w-3.5 h-3.5 text-teal-500" />}
                {block.type === "code" && <FileCode className="w-3.5 h-3.5 text-cyan-500" />}
                {block.type === "tweet" && <Share2 className="w-3.5 h-3.5 text-sky-500" />}
                {block.type === "markdown" && <Edit3 className="w-3.5 h-3.5 text-orange-500" />}
                {block.type === "separator" && <HelpCircle className="w-3.5 h-3.5" />}
                <span>{block.type}</span>
              </div>

              {/* Title Block Editor */}
              {block.type === "title" && (
                <div className="flex items-center gap-3">
                  <select
                    value={block.value.level || 2}
                    onChange={(e) => updateBlockValue(block.id, { level: Number(e.target.value) })}
                    className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    <option value={1}>Titre 1 (H1)</option>
                    <option value={2}>Titre 2 (H2)</option>
                    <option value={3}>Titre 3 (H3)</option>
                  </select>
                  <input
                    type="text"
                    value={block.value.text || ""}
                    onChange={(e) => updateBlockValue(block.id, { text: e.target.value })}
                    placeholder="Écrire le titre..."
                    className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-900 dark:text-white"
                  />
                </div>
              )}

              {/* Text Block Editor */}
              {block.type === "text" && (
                <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/20">
                  <RichEditor
                    value={block.value.html || ""}
                    onChange={(html) => updateBlockValue(block.id, { html })}
                    placeholder="Commencer à rédiger le paragraphe..."
                  />
                </div>
              )}

              {/* Image Block Editor */}
              {block.type === "image" && (
                <div className="space-y-3">
                  {block.value.url && (
                    <div className="relative w-44 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <img src={block.value.url} alt="Aperçu" className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => updateBlockValue(block.id, { url: "" })}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {!block.value.url ? (
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Entrer l'URL de l'image</label>
                        <input
                          type="text"
                          value={block.value.url || ""}
                          onChange={(e) => updateBlockValue(block.id, { url: e.target.value })}
                          placeholder="https://exemple.com/image.png"
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                        />
                      </div>
                      <div className="shrink-0 flex items-end">
                        <input
                          type="file"
                          id={`img-up-${block.id}`}
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, block.id, "image")}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={fileUploadingBlockId === block.id}
                          onClick={() => document.getElementById(`img-up-${block.id}`)?.click()}
                          className="w-full md:w-auto px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-zinc-200 dark:border-zinc-700"
                        >
                          {fileUploadingBlockId === block.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Uploader un fichier
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Légende de l'image</label>
                      <input
                        type="text"
                        value={block.value.caption || ""}
                        onChange={(e) => updateBlockValue(block.id, { caption: e.target.value })}
                        placeholder="Ajouter une légende descriptive..."
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Video Block Editor */}
              {block.type === "video" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {["youtube", "dailymotion", "uploaded"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateBlockValue(block.id, { type })}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                          block.value.type === type
                            ? "bg-teal-50 dark:bg-teal-950/20 text-teal-600 border-teal-200 dark:border-teal-900/50"
                            : "bg-white dark:bg-zinc-900 text-zinc-450 border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        {type === "youtube" ? "YouTube" : type === "dailymotion" ? "Dailymotion" : "Fichier MP4"}
                      </button>
                    ))}
                  </div>

                  {block.value.type === "uploaded" ? (
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL de la vidéo locale ou MP4</label>
                        <input
                          type="text"
                          value={block.value.url || ""}
                          onChange={(e) => updateBlockValue(block.id, { url: e.target.value })}
                          placeholder="https://exemple.com/cours.mp4"
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                        />
                      </div>
                      <div className="shrink-0 flex items-end">
                        <input
                          type="file"
                          id={`vid-up-${block.id}`}
                          accept="video/mp4,video/x-m4v,video/*"
                          onChange={(e) => handleFileUpload(e, block.id, "video")}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={fileUploadingBlockId === block.id}
                          onClick={() => document.getElementById(`vid-up-${block.id}`)?.click()}
                          className="w-full md:w-auto px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-zinc-200 dark:border-zinc-700"
                        >
                          {fileUploadingBlockId === block.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Uploader MP4
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Lien de la vidéo ({block.value.type})</label>
                      <input
                        type="text"
                        value={block.value.url || ""}
                        onChange={(e) => updateBlockValue(block.id, { url: e.target.value })}
                        placeholder={block.value.type === "youtube" ? "https://www.youtube.com/watch?v=..." : "https://www.dailymotion.com/video/..."}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* PDF Block Editor */}
              {block.type === "pdf" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nom du Document</label>
                      <input
                        type="text"
                        value={block.value.title || ""}
                        onChange={(e) => updateBlockValue(block.id, { title: e.target.value })}
                        placeholder="Ex: Guide PDF - Chapitre 1"
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Lien direct vers le PDF</label>
                      <input
                        type="text"
                        value={block.value.url || ""}
                        onChange={(e) => updateBlockValue(block.id, { url: e.target.value })}
                        placeholder="https://exemple.com/cours.pdf"
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id={`pdf-up-${block.id}`}
                      accept="application/pdf"
                      onChange={(e) => handleFileUpload(e, block.id, "pdf")}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={fileUploadingBlockId === block.id}
                      onClick={() => document.getElementById(`pdf-up-${block.id}`)?.click()}
                      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-zinc-200 dark:border-zinc-700"
                    >
                      {fileUploadingBlockId === block.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Uploader un fichier PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Google Docs Block Editor */}
              {block.type === "google_docs" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Type de Document Google</label>
                      <select
                        value={block.value.type || "doc"}
                        onChange={(e) => updateBlockValue(block.id, { type: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold"
                      >
                        <option value="doc">Google Docs (Document)</option>
                        <option value="sheet">Google Sheets (Feuille de calcul)</option>
                        <option value="slide">Google Slides (Présentation)</option>
                        <option value="form">Google Forms (Formulaire)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Lien du Document Google</label>
                      <input
                        type="text"
                        value={block.value.url || ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const formatted = formatGoogleEmbedUrl(raw);
                          updateBlockValue(block.id, { url: formatted });
                        }}
                        placeholder="Collez le lien Google Docs (ex: https://docs.google.com/document/d/.../edit)"
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                      />
                    </div>
                  </div>
                  {block.value.url && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        ✓ Lien formaté automatiquement pour l'intégration responsive
                      </span>
                      <a href={block.value.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold">
                        Aperçu externe ↗
                      </a>
                    </div>
                  )}

                  {/* Help notice explaining Google permissions */}
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                      <span>💡</span> Comment débloquer l'affichage si Google indique "Contenu bloqué" ?
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Si l'iframe indique que le document est bloqué par le propriétaire, assurez-vous d'avoir ouvert l'accès dans Google Docs :
                    </p>
                    <ol className="list-decimal pl-4 text-[11px] space-y-1 font-semibold">
                      <li>Dans votre fichier Google Docs / Sheets / Slides : Cliquez sur le bouton bleu <strong>Partager</strong>.</li>
                      <li>Sous <em>"Accès général"</em>, sélectionnez <strong>« Tous les utilisateurs disposant du lien »</strong>.</li>
                      <li><em>(Ou méthode directe)</em> : Allez dans <strong>Fichier &gt; Partager &gt; Publier sur le web</strong> et copiez le lien généré.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Table Block Editor */}
              {block.type === "table" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase">Éditeur de Tableau</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newHeaders = [...(block.value.headers || []), `Col ${(block.value.headers?.length || 0) + 1}`];
                          const newRows = (block.value.rows || []).map((r: string[]) => [...r, ""]);
                          updateBlockValue(block.id, { headers: newHeaders, rows: newRows });
                        }}
                        className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold rounded-lg hover:bg-zinc-200"
                      >
                        + Ajouter Colonne
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const colCount = block.value.headers?.length || 2;
                          const newRows = [...(block.value.rows || []), Array(colCount).fill("")];
                          updateBlockValue(block.id, { rows: newRows });
                        }}
                        className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold rounded-lg hover:bg-zinc-200"
                      >
                        + Ajouter Ligne
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-100 dark:bg-zinc-800">
                        <tr>
                          {(block.value.headers || []).map((h: string, hIdx: number) => (
                            <th key={hIdx} className="p-2 border-r border-zinc-200 dark:border-zinc-700">
                              <input
                                type="text"
                                value={h}
                                onChange={(e) => {
                                  const updatedHeaders = [...(block.value.headers || [])];
                                  updatedHeaders[hIdx] = e.target.value;
                                  updateBlockValue(block.id, { headers: updatedHeaders });
                                }}
                                className="w-full bg-transparent font-bold text-zinc-900 dark:text-white outline-none"
                              />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(block.value.rows || []).map((row: string[], rIdx: number) => (
                          <tr key={rIdx} className="border-t border-zinc-200 dark:border-zinc-800">
                            {row.map((cell: string, cIdx: number) => (
                              <td key={cIdx} className="p-2 border-r border-zinc-200 dark:border-zinc-700">
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={(e) => {
                                    const updatedRows = [...(block.value.rows || [])];
                                    updatedRows[rIdx][cIdx] = e.target.value;
                                    updateBlockValue(block.id, { rows: updatedRows });
                                  }}
                                  className="w-full bg-transparent text-zinc-800 dark:text-zinc-200 outline-none"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Columns Block Editor */}
              {block.type === "columns" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Nombre de colonnes :</label>
                    {[2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => updateBlockValue(block.id, { count: num })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${block.value.count === num ? "bg-indigo-600 text-white border-indigo-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"}`}
                      >
                        {num} Colonnes
                      </button>
                    ))}
                  </div>

                  <div className={`grid grid-cols-1 ${block.value.count === 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-3`}>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Colonne 1</label>
                      <textarea
                        rows={3}
                        value={block.value.col1 || ""}
                        onChange={(e) => updateBlockValue(block.id, { col1: e.target.value })}
                        className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none"
                        placeholder="Contenu colonne 1..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Colonne 2</label>
                      <textarea
                        rows={3}
                        value={block.value.col2 || ""}
                        onChange={(e) => updateBlockValue(block.id, { col2: e.target.value })}
                        className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none"
                        placeholder="Contenu colonne 2..."
                      />
                    </div>
                    {block.value.count === 3 && (
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Colonne 3</label>
                        <textarea
                          rows={3}
                          value={block.value.col3 || ""}
                          onChange={(e) => updateBlockValue(block.id, { col3: e.target.value })}
                          className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none"
                          placeholder="Contenu colonne 3..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vector / SVG Block Editor */}
              {block.type === "vector" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Code SVG / Schéma Vectoriel</label>
                    <textarea
                      rows={4}
                      value={block.value.svg || ""}
                      onChange={(e) => updateBlockValue(block.id, { svg: e.target.value })}
                      placeholder='<svg viewBox="0 0 100 100">...</svg>'
                      className="w-full p-2.5 bg-zinc-950 text-emerald-400 font-mono text-xs border border-zinc-800 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Légende du schéma</label>
                    <input
                      type="text"
                      value={block.value.caption || ""}
                      onChange={(e) => updateBlockValue(block.id, { caption: e.target.value })}
                      placeholder="Ex: Diagramme d'architecture Web3"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* HTML Code Block Editor */}
              {block.type === "html_code" && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Code HTML Brut & Widget</label>
                  <textarea
                    rows={4}
                    value={block.value.html || ""}
                    onChange={(e) => updateBlockValue(block.id, { html: e.target.value })}
                    placeholder="<div>Intégrer du contenu HTML personnalisé...</div>"
                    className="w-full p-2.5 bg-zinc-950 text-purple-300 font-mono text-xs border border-zinc-800 rounded-xl outline-none"
                  />
                </div>
              )}

              {/* Audio Block Editor */}
              {block.type === "audio" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Titre du fichier Audio</label>
                      <input
                        type="text"
                        value={block.value.title || ""}
                        onChange={(e) => updateBlockValue(block.id, { title: e.target.value })}
                        placeholder="Ex: Épisode 1 - Introduction Vocale"
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL Directe MP3/WAV</label>
                      <input
                        type="text"
                        value={block.value.url || ""}
                        onChange={(e) => updateBlockValue(block.id, { url: e.target.value })}
                        placeholder="https://exemple.com/audio.mp3"
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id={`aud-up-${block.id}`}
                      accept="audio/*"
                      onChange={(e) => handleFileUpload(e, block.id, "audio")}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={fileUploadingBlockId === block.id}
                      onClick={() => document.getElementById(`aud-up-${block.id}`)?.click()}
                      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-zinc-200 dark:border-zinc-700"
                    >
                      {fileUploadingBlockId === block.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Uploader un fichier Audio MP3
                    </button>
                  </div>
                </div>
              )}

              {/* Syntax Code Block Editor */}
              {block.type === "code" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase">Bloc de Code Source</label>
                    <select
                      value={block.value.lang || "javascript"}
                      onChange={(e) => updateBlockValue(block.id, { lang: e.target.value })}
                      className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="solidity">Solidity (Smart Contract)</option>
                      <option value="rust">Rust</option>
                      <option value="sql">SQL</option>
                      <option value="bash">Bash / Terminal</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                  <textarea
                    rows={5}
                    value={block.value.code || ""}
                    onChange={(e) => updateBlockValue(block.id, { code: e.target.value })}
                    placeholder="Écrivez ou collez votre code ici..."
                    className="w-full p-3 bg-zinc-950 text-emerald-400 font-mono text-xs border border-zinc-800 rounded-xl outline-none"
                  />
                </div>
              )}

              {/* Tweet / X Embed Block Editor */}
              {block.type === "tweet" && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Lien du Post 𝕏 (Twitter)</label>
                  <input
                    type="text"
                    value={block.value.url || ""}
                    onChange={(e) => updateBlockValue(block.id, { url: e.target.value })}
                    placeholder="https://x.com/username/status/123456789"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                  />
                </div>
              )}

              {/* Markdown Block Editor */}
              {block.type === "markdown" && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Éditeur Markdown Brut</label>
                  <textarea
                    rows={4}
                    value={block.value.content || ""}
                    onChange={(e) => updateBlockValue(block.id, { content: e.target.value })}
                    placeholder="# Titre Markdown&#10;- Liste&#10;**Texte en gras**"
                    className="w-full p-3 bg-zinc-900 text-zinc-200 font-mono text-xs border border-zinc-800 rounded-xl outline-none"
                  />
                </div>
              )}

              {/* Link Block Editor */}
              {block.type === "link" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Texte du Bouton / Lien</label>
                    <input
                      type="text"
                      value={block.value.label || ""}
                      onChange={(e) => updateBlockValue(block.id, { label: e.target.value })}
                      placeholder="Ex: Visiter le site officiel"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL de destination</label>
                    <input
                      type="text"
                      value={block.value.url || ""}
                      onChange={(e) => updateBlockValue(block.id, { url: e.target.value })}
                      placeholder="https://google.com"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                    />
                  </div>
                </div>
              )}

              {/* Info Block (Callout) Editor */}
              {block.type === "info" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {["info", "success", "warning", "danger"].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => updateBlockValue(block.id, { style })}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                          block.value.style === style
                            ? style === "warning" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-250"
                              : style === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250"
                              : style === "danger" ? "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-250"
                              : "bg-blue-50 dark:bg-blue-950/20 text-blue-600 border-blue-250"
                            : "bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-205 dark:border-zinc-800"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={block.value.text || ""}
                    onChange={(e) => updateBlockValue(block.id, { text: e.target.value })}
                    rows={2}
                    placeholder="Entrer le message informatif..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                  />
                </div>
              )}

              {/* Separator Block */}
              {block.type === "separator" && (
                <div className="py-2.5">
                  <div className="w-full border-t border-dashed border-zinc-300 dark:border-zinc-700" />
                  <span className="text-[10px] text-zinc-400 font-bold block mt-1">Ligne de Séparateur Visuel</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Grid of Addable Blocks */}
      <div className="bg-zinc-50/60 dark:bg-zinc-900/30 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-6 text-center space-y-6">
        <p className="text-zinc-600 dark:text-zinc-350 text-xs font-semibold leading-relaxed">
          Sélectionnez un bloc pour enrichir le contenu de cette leçon avec des éléments multimédias et interactifs.
        </p>

        {/* Primary Block Buttons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => addBlock("video")}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-teal-350 dark:hover:border-teal-850 hover:-translate-y-0.5 transition-all text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <Video className="w-6 h-6 text-zinc-900 dark:text-white" />
            <span className="text-xs font-bold">Vidéo</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("text")}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-teal-350 dark:hover:border-teal-850 hover:-translate-y-0.5 transition-all text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <span className="text-xl font-serif text-zinc-900 dark:text-white">¶</span>
            <span className="text-xs font-bold">Texte</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("image")}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-teal-350 dark:hover:border-teal-850 hover:-translate-y-0.5 transition-all text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <ImageIcon className="w-6 h-6 text-zinc-900 dark:text-white" />
            <span className="text-xs font-bold">Image</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("google_docs")}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-teal-350 dark:hover:border-teal-850 hover:-translate-y-0.5 transition-all text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <Layout className="w-6 h-6 text-yellow-500" />
            <span className="text-xs font-bold">Google Docs</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-teal-350 dark:hover:border-teal-850 hover:-translate-y-0.5 transition-all text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <Plus className="w-6 h-6 text-zinc-900 dark:text-white" />
            <span className="text-xs font-bold">Plus de blocs</span>
          </button>
        </div>

        {/* Plus block options menu */}
        {showPlusMenu && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold animate-in slide-in-from-top-1 duration-200 shadow-xl">
            <button
              type="button"
              onClick={() => addBlock("title")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <Heading2 className="w-4 h-4 text-teal-600" /> Titre (H1-H3)
            </button>
            <button
              type="button"
              onClick={() => addBlock("table")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <TableIcon className="w-4 h-4 text-blue-500" /> Tableau
            </button>
            <button
              type="button"
              onClick={() => addBlock("columns")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <ColumnsIcon className="w-4 h-4 text-indigo-500" /> Colonnes
            </button>
            <button
              type="button"
              onClick={() => addBlock("vector")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <Shapes className="w-4 h-4 text-emerald-500" /> Vecteur / SVG
            </button>
            <button
              type="button"
              onClick={() => addBlock("html_code")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <Code2 className="w-4 h-4 text-purple-500" /> Code HTML
            </button>
            <button
              type="button"
              onClick={() => addBlock("pdf")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <FileDown className="w-4 h-4 text-red-500" /> Visionneuse PDF
            </button>
            <button
              type="button"
              onClick={() => addBlock("audio")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <Volume2 className="w-4 h-4 text-teal-500" /> Fichier Audio
            </button>
            <button
              type="button"
              onClick={() => addBlock("code")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <FileCode className="w-4 h-4 text-cyan-500" /> Bloc de Code
            </button>
            <button
              type="button"
              onClick={() => addBlock("tweet")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <Share2 className="w-4 h-4 text-sky-500" /> Post 𝕏 / Tweet
            </button>
            <button
              type="button"
              onClick={() => addBlock("markdown")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <Edit3 className="w-4 h-4 text-orange-500" /> Markdown
            </button>
            <button
              type="button"
              onClick={() => addBlock("info")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <Info className="w-4 h-4 text-blue-500" /> Message Alerte
            </button>
            <button
              type="button"
              onClick={() => addBlock("link")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <Link2 className="w-4 h-4 text-zinc-500" /> Bouton / Lien
            </button>
            <button
              type="button"
              onClick={() => addBlock("separator")}
              className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-purple-500" /> Séparateur
            </button>
          </div>
        )}

        <div className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold">Ou</div>

        {/* AI Assisted Generation Trigger Button */}
        <div>
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-150 text-teal-650 font-bold rounded-2xl hover:bg-teal-200 transition-all text-sm shadow-sm cursor-pointer border border-teal-200/50"
          >
            <Sparkles className="w-4 h-4" />
            Génération assistée par IA
          </button>
        </div>
      </div>

      {/* AI Prompt Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-teal-650 font-bold text-lg">
              <Sparkles className="w-5 h-5" />
              <h3>Génération de Contenu par IA</h3>
            </div>
            <p className="text-zinc-500 text-xs">
              Saisissez le sujet ou les instructions. L'intelligence artificielle rédigera et structurera automatiquement un contenu sous forme de blocs dans votre leçon.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={4}
              placeholder="Ex: Explique la gestion du State local en React avec un exemple simple de compteur et donne 3 conseils de bonnes pratiques."
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs placeholder-zinc-400 focus:ring-1 focus:ring-teal-500 outline-none"
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => { setShowAiModal(false); setAiPrompt(""); }}
                className="px-4 py-2 text-zinc-500 hover:text-zinc-700 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleGenerateAiContent}
                disabled={generatingAi || !aiPrompt.trim()}
                className="px-5 py-2.5 bg-teal-650 hover:bg-teal-750 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {generatingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Générer le contenu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
