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
  Code
} from "lucide-react";
import RichEditor from "./RichEditor";

// ─── Block Types ──────────────────────────────────────────
export type BlockType =
  | "text"
  | "video"
  | "image"
  | "link"
  | "separator"
  | "pdf"
  | "info"
  | "google_docs"
  | "title";

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

// Helper to convert local files to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

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
    const blockType = el.getAttribute("data-block-type");
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
        blocks.push({
          id,
          type: "title",
          value: { text: el.textContent || "", level }
        });
        break;
      }
      case "text": {
        blocks.push({
          id,
          type: "text",
          value: { html: el.innerHTML }
        });
        break;
      }
      case "image": {
        const url = el.getAttribute("data-url") || "";
        const caption = el.getAttribute("data-caption") || "";
        blocks.push({
          id,
          type: "image",
          value: { url, caption }
        });
        break;
      }
      case "video": {
        const videoType = el.getAttribute("data-video-type") || "youtube";
        const url = el.getAttribute("data-url") || "";
        blocks.push({
          id,
          type: "video",
          value: { type: videoType, url }
        });
        break;
      }
      case "pdf": {
        const url = el.getAttribute("data-url") || "";
        const title = el.getAttribute("data-title") || "";
        blocks.push({
          id,
          type: "pdf",
          value: { url, title }
        });
        break;
      }
      case "separator": {
        blocks.push({
          id,
          type: "separator",
          value: {}
        });
        break;
      }
      case "link": {
        const url = el.getAttribute("data-url") || "";
        const label = el.getAttribute("data-label") || "";
        blocks.push({
          id,
          type: "link",
          value: { url, label }
        });
        break;
      }
      case "info": {
        const style = el.getAttribute("data-style") || "info";
        blocks.push({
          id,
          type: "info",
          value: { text: el.innerHTML, style }
        });
        break;
      }
      case "google_docs": {
        const docType = el.getAttribute("data-doc-type") || "doc";
        const url = el.getAttribute("data-url") || "";
        blocks.push({
          id,
          type: "google_docs",
          value: { type: docType, url }
        });
        break;
      }
      default: {
        blocks.push({
          id,
          type: "text",
          value: { html: el.outerHTML }
        });
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
            <img src="${block.value.url || ""}" alt="${block.value.caption || ""}" class="rounded-2xl max-w-full h-auto mx-auto border border-zinc-200 dark:border-zinc-800" />
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
          return `<div data-block-type="pdf" data-url="${block.value.url || ""}" data-title="${pdfTitle}" class="my-6 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-red-100 dark:bg-red-950/30 text-red-650 rounded-xl">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <div>
                <p class="font-bold text-sm text-zinc-900 dark:text-white">${pdfTitle}</p>
                <a href="${block.value.url || "#"}" target="_blank" class="text-xs text-blue-600 dark:text-blue-400 font-semibold underline">Visualiser le PDF</a>
              </div>
            </div>
            <a href="${block.value.url || "#"}" download class="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl text-xs">Télécharger</a>
          </div>`;
        }
        case "separator": {
          return `<hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />`;
        }
        case "link": {
          const lbl = block.value.label || block.value.url || "Visiter le lien";
          return `<div data-block-type="link" data-url="${block.value.url || ""}" data-label="${block.value.label || ""}" class="my-4">
            <a href="${block.value.url || "#"}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold rounded-xl text-sm border border-blue-200/50 dark:border-blue-900/50">
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
          return `<div data-block-type="google_docs" data-doc-type="${block.value.type || "doc"}" data-url="${block.value.url || ""}" class="my-6 w-full h-[600px] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <iframe src="${block.value.url || ""}" class="w-full h-full" frameborder="0"></iframe>
          </div>`;
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

  // Track the last HTML we serialized internally so we can skip re-parsing
  // when the parent echoes the same value back (avoids focus/scroll resets)
  const lastEmittedRef = useRef<string>("");

  // Load blocks from HTML value only when the value is externally driven
  // (e.g. initial load or lesson switch) — not when we just emitted it ourselves
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    const parsed = parseHtmlToBlocks(value);
    setBlocks(parsed);
  }, [value]);

  // Sync back to parent when blocks change
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string, type: "image" | "pdf" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit checks
    if (file.size > 20 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (max 20 Mo).");
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
      }
    } catch (err: any) {
      alert("Erreur de lecture du fichier : " + err.message);
    } finally {
      setFileUploadingBlockId(null);
    }
  };

  // AI Generation triggers
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
                {block.type === "google_docs" && <Layout className="w-3.5 h-3.5" />}
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
                          {fileUploadingBlockId === block.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
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
                          {fileUploadingBlockId === block.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
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
                        placeholder={
                          block.value.type === "youtube"
                            ? "https://www.youtube.com/watch?v=..."
                            : "https://www.dailymotion.com/video/..."
                        }
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                      />
                    </div>
                  )}

                  {block.value.url && (
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1 font-semibold">
                      <ExternalLink className="w-3 h-3 text-teal-650" />
                      Lien configuré avec succès.
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
                      {fileUploadingBlockId === block.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Uploader un fichier PDF
                    </button>
                    {block.value.url && (
                      <span className="text-[10px] text-teal-650 font-bold">✓ PDF chargé et rattaché</span>
                    )}
                  </div>
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

              {/* Google Docs Block Editor */}
              {block.type === "google_docs" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Type de Document Google</label>
                      <select
                        value={block.value.type || "doc"}
                        onChange={(e) => updateBlockValue(block.id, { type: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-750 dark:text-zinc-300 font-medium"
                      >
                        <option value="doc">Google Docs</option>
                        <option value="sheet">Google Sheets</option>
                        <option value="slide">Google Slides</option>
                        <option value="form">Google Forms</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Lien d'intégration (Embed URL)</label>
                      <input
                        type="text"
                        value={block.value.url || ""}
                        onChange={(e) => updateBlockValue(block.id, { url: e.target.value })}
                        placeholder="https://docs.google.com/.../pubhtml?widget=true"
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                      />
                    </div>
                  </div>
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

      {/* Grid of Addable Blocks as requested in the mockup image */}
      <div className="bg-zinc-50/60 dark:bg-zinc-900/30 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-6 text-center space-y-6">
        <p className="text-zinc-600 dark:text-zinc-350 text-xs font-semibold leading-relaxed">
          Cliquez sur un des blocs disponibles dans la liste
          <br />
          ci-dessous pour ajouter du contenu à cette leçon.
        </p>

        {/* Mockup Buttons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => addBlock("video")}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-teal-350 dark:hover:border-teal-850 hover:-translate-y-0.5 transition-all text-zinc-700 dark:text-zinc-300"
          >
            <Video className="w-6 h-6 text-zinc-900 dark:text-white" />
            <span className="text-xs font-bold">Vidéo</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("text")}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-teal-350 dark:hover:border-teal-850 hover:-translate-y-0.5 transition-all text-zinc-700 dark:text-zinc-300"
          >
            <span className="text-xl font-serif text-zinc-900 dark:text-white">¶</span>
            <span className="text-xs font-bold">Texte</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("image")}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-teal-350 dark:hover:border-teal-850 hover:-translate-y-0.5 transition-all text-zinc-700 dark:text-zinc-300"
          >
            <ImageIcon className="w-6 h-6 text-zinc-900 dark:text-white" />
            <span className="text-xs font-bold">Image</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("link")}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-teal-350 dark:hover:border-teal-850 hover:-translate-y-0.5 transition-all text-zinc-700 dark:text-zinc-300"
          >
            <Link2 className="w-6 h-6 text-zinc-900 dark:text-white" />
            <span className="text-xs font-bold">Lien</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-teal-350 dark:hover:border-teal-850 hover:-translate-y-0.5 transition-all text-zinc-700 dark:text-zinc-300"
          >
            <Plus className="w-6 h-6 text-zinc-900 dark:text-white" />
            <span className="text-xs font-bold">Plus</span>
          </button>
        </div>

        {/* Plus block options popover/menu */}
        {showPlusMenu && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold animate-in slide-in-from-top-1 duration-200 shadow-inner">
            <button
              type="button"
              onClick={() => addBlock("title")}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <Heading2 className="w-4 h-4 text-teal-650" /> Titre
            </button>
            <button
              type="button"
              onClick={() => addBlock("pdf")}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-red-500" /> Document PDF
            </button>
            <button
              type="button"
              onClick={() => addBlock("info")}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <Info className="w-4 h-4 text-blue-500" /> Bloc d'information
            </button>
            <button
              type="button"
              onClick={() => addBlock("google_docs")}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <Layout className="w-4 h-4 text-yellow-500" /> Google Docs
            </button>
            <button
              type="button"
              onClick={() => addBlock("separator")}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 cursor-pointer"
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
              Saisissez le sujet ou les instructions. L'intelligence artificielle rédigera et structurera automatiquement un contenu sous forme de blocs (titres, paragraphes, alertes de conseils) dans votre leçon.
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
