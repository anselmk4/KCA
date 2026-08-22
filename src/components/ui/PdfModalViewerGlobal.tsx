"use client";

import React, { useState, useEffect } from "react";
import {
  FileDown,
  ExternalLink,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface DocData {
  url: string;
  rawUrl?: string;
  title: string;
  type: "pdf" | "doc" | "sheet" | "slide" | "form";
}

export function PdfModalViewerGlobal() {
  const [docData, setDocData] = useState<DocData | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docData) {
      setStreamUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const initViewer = async () => {
      try {
        if (docData.type === "pdf") {
          if (docData.url.startsWith("data:")) {
            // Stream base64 PDF through same-origin endpoint
            const res = await fetch("/api/pdf/stream", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ data: docData.url, title: docData.title }),
            });

            if (!res.ok) {
              throw new Error("Erreur lors de la préparation du document.");
            }

            const data = await res.json();
            if (isMounted && data.streamUrl) {
              setStreamUrl(data.streamUrl);
            }
          } else if (
            docData.url.startsWith("http://") ||
            docData.url.startsWith("https://")
          ) {
            setStreamUrl(`/api/pdf/stream?url=${encodeURIComponent(docData.url)}`);
          } else {
            setStreamUrl(docData.url);
          }
        } else {
          // Google Docs / Sheets / Slides / Forms
          setStreamUrl(docData.url);
        }
      } catch (err: any) {
        console.error("Document stream initialization error:", err);
        if (isMounted) {
          setError(
            err.message ||
              "Impossible de charger la visionneuse. Vous pouvez ouvrir le document directement."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initViewer();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDocData(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [docData]);

  // Global click listener for [data-action="view-pdf"] and [data-action="view-doc"]
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const pdfTarget = (e.target as HTMLElement).closest('[data-action="view-pdf"]');
      if (pdfTarget) {
        e.preventDefault();
        e.stopPropagation();
        const url = pdfTarget.getAttribute("data-pdf-url") || pdfTarget.getAttribute("href") || "";
        const title = pdfTarget.getAttribute("data-pdf-title") || "Document PDF";
        if (url && url !== "#") {
          setDocData({ url, title, type: "pdf" });
        }
        return;
      }

      const docTarget = (e.target as HTMLElement).closest('[data-action="view-doc"]');
      if (docTarget) {
        e.preventDefault();
        e.stopPropagation();
        const url = docTarget.getAttribute("data-doc-url") || docTarget.getAttribute("href") || "";
        const rawUrl = docTarget.getAttribute("data-raw-url") || url;
        const title = docTarget.getAttribute("data-doc-title") || "Document Google";
        const docType = (docTarget.getAttribute("data-doc-type") || "doc") as DocData["type"];
        if (url && url !== "#") {
          setDocData({ url, rawUrl, title, type: docType });
        }
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, []);

  const handleDownload = () => {
    if (!docData) return;
    const cleanFilename = (docData.title || "document").replace(/[^\w\s-]/gi, "") + ".pdf";
    const downloadTarget = streamUrl || docData.url;
    const a = document.createElement("a");
    a.href = downloadTarget;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    if (!docData) return;
    const target = docData.rawUrl || streamUrl || docData.url;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  if (!docData) return null;

  const isGoogleDoc = docData.type !== "pdf";

  // Google badge styling
  const badgeConfig = {
    pdf: { label: "PDF", bg: "bg-red-500/10 text-red-600 border-red-500/20" },
    doc: { label: "DOCS", bg: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    sheet: { label: "SHEET", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    slide: { label: "SLIDE", bg: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    form: { label: "FORM", bg: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  }[docData.type] || { label: "DOCS", bg: "bg-blue-500/10 text-blue-600 border-blue-500/20" };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setDocData(null)}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-5xl h-[92vh] max-h-[96vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0 shadow-xs">
          {/* Document Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 border rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${badgeConfig.bg}`}
            >
              {badgeConfig.label}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {docData.title}
              </h3>
              <p className="text-[10px] text-zinc-400">
                {isGoogleDoc ? "Visionneuse Google Document" : "Visionneuse de document"}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Open in new tab / Google Docs */}
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              title={isGoogleDoc ? "Ouvrir dans Google Docs" : "Ouvrir dans un nouvel onglet"}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isGoogleDoc ? "Ouvrir sur Google" : "Nouvel onglet"}</span>
            </button>

            {/* Download (PDF only) */}
            {!isGoogleDoc && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                title="Télécharger le fichier PDF"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Télécharger</span>
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={() => setDocData(null)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content Area */}
        <div className="flex-1 w-full h-full bg-zinc-950/5 relative overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500 dark:text-zinc-400">
              <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
              <p className="text-sm font-bold">Chargement du document...</p>
            </div>
          )}

          {error && !loading && (
            <div className="my-auto max-w-md p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-md text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Aperçu indisponible</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir dans Google Docs</span>
              </button>
            </div>
          )}

          {streamUrl && !loading && (
            <iframe
              src={streamUrl}
              className="w-full h-full border-0 bg-white dark:bg-zinc-950"
              title={docData.title}
              allow="fullscreen"
            />
          )}
        </div>
      </div>
    </div>
  );
}
