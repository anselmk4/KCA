"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileDown, ExternalLink, X, Loader2 } from "lucide-react";

interface PdfData {
  url: string;
  title: string;
}

export function PdfModalViewerGlobal() {
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Convert base64 to blob URL for smooth in-browser rendering
  const processPdfUrl = useCallback((rawUrl: string): string => {
    if (!rawUrl) return "";
    if (rawUrl.startsWith("data:application/pdf;base64,")) {
      try {
        const parts = rawUrl.split(";base64,");
        const byteCharacters = atob(parts[1]);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }
        const blob = new Blob(byteArrays, { type: "application/pdf" });
        return URL.createObjectURL(blob);
      } catch (err) {
        console.error("Error converting base64 PDF to blob:", err);
        return rawUrl;
      }
    }
    return rawUrl;
  }, []);

  useEffect(() => {
    if (!pdfData) {
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
      setBlobUrl(null);
      return;
    }

    setLoading(true);
    const converted = processPdfUrl(pdfData.url);
    setBlobUrl(converted);
    setLoading(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPdfData(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pdfData, processPdfUrl]);

  // Global click listener for [data-action="view-pdf"]
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-action="view-pdf"]');
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        const url = target.getAttribute("data-pdf-url") || target.getAttribute("href") || "";
        const title = target.getAttribute("data-pdf-title") || "Document PDF";
        if (url && url !== "#") {
          setPdfData({ url, title });
        }
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, []);

  if (!pdfData) return null;

  const displayUrl = blobUrl || pdfData.url;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setPdfData(null)}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-5xl h-[92vh] max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:px-6 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-600 shrink-0 font-black text-xs">
              PDF
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                {pdfData.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Visionneuse intégrée</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Nouvel onglet</span>
            </a>
            <a
              href={displayUrl}
              download={`${pdfData.title.replace(/[^\w\s-]/gi, "") || "document"}.pdf`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Télécharger</span>
            </a>
            <button
              type="button"
              onClick={() => setPdfData(null)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 w-full bg-zinc-950/10 relative overflow-hidden flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              <p className="text-xs font-semibold">Chargement du document...</p>
            </div>
          ) : displayUrl ? (
            <object
              data={`${displayUrl}#toolbar=1&navpanes=1`}
              type="application/pdf"
              className="w-full h-full border-0"
            >
              <iframe
                src={`${displayUrl}#toolbar=1`}
                className="w-full h-full border-0"
                title={pdfData.title}
              />
            </object>
          ) : (
            <div className="p-8 text-center text-zinc-400 text-xs">
              Aucun document valide à afficher.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
