"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileDown,
  ExternalLink,
  X,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  AlertTriangle,
} from "lucide-react";

interface PdfData {
  url: string;
  title: string;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export function PdfModalViewerGlobal() {
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Load PDF.js dynamically
  const loadPdfJs = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }
      const existing = document.getElementById("pdfjs-script");
      if (existing) {
        existing.addEventListener("load", () => resolve(window.pdfjsLib));
        existing.addEventListener("error", () => reject(new Error("Erreur de chargement de PDF.js")));
        return;
      }
      const script = document.createElement("script");
      script.id = "pdfjs-script";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve(window.pdfjsLib);
        } else {
          reject(new Error("Bibliothèque PDF.js introuvable"));
        }
      };
      script.onerror = () => reject(new Error("Impossible de charger PDF.js"));
      document.head.appendChild(script);
    });
  }, []);

  // Render all pages to canvas
  const renderAllPages = useCallback(
    async (pdfDoc: any, currentScale: number, currentRotation: number) => {
      if (!containerRef.current || !pdfDoc) return;
      const container = containerRef.current;
      container.innerHTML = "";

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: currentScale, rotation: currentRotation });

          const pageWrapper = document.createElement("div");
          pageWrapper.className =
            "my-4 shadow-xl rounded-lg overflow-hidden bg-white border border-zinc-200/80 dark:border-zinc-700/80 transition-transform flex flex-col items-center";

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) continue;

          // HiDPI support for ultra-crisp text
          const outputScale = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = Math.floor(viewport.width) + "px";
          canvas.style.height = Math.floor(viewport.height) + "px";

          const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

          const renderContext = {
            canvasContext: context,
            transform: transform,
            viewport: viewport,
          };

          await page.render(renderContext).promise;

          const pageNumberBadge = document.createElement("div");
          pageNumberBadge.className =
            "py-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800 w-full text-center border-t border-zinc-150 dark:border-zinc-700/50";
          pageNumberBadge.innerText = `Page ${pageNum} sur ${pdfDoc.numPages}`;

          pageWrapper.appendChild(canvas);
          pageWrapper.appendChild(pageNumberBadge);
          container.appendChild(pageWrapper);
        } catch (pageErr) {
          console.error(`Error rendering page ${pageNum}:`, pageErr);
        }
      }
    },
    []
  );

  // Load document when pdfData changes
  useEffect(() => {
    if (!pdfData) {
      pdfDocRef.current = null;
      setNumPages(0);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadAndRender = async () => {
      try {
        const pdfjs = await loadPdfJs();
        let loadingTask: any;

        if (pdfData.url.startsWith("data:application/pdf;base64,")) {
          const base64Clean = pdfData.url.split(";base64,")[1];
          const binaryString = atob(base64Clean);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          loadingTask = pdfjs.getDocument({ data: bytes });
        } else {
          loadingTask = pdfjs.getDocument({ url: pdfData.url, withCredentials: false });
        }

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        await renderAllPages(doc, scale, rotation);
      } catch (err: any) {
        console.error("PDF.js render error:", err);
        if (isMounted) {
          setError(
            err.message ||
              "Impossible de charger le document PDF. Vous pouvez toujours le télécharger directement."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAndRender();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPdfData(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pdfData, loadPdfJs]);

  // Re-render when scale or rotation changes
  useEffect(() => {
    if (pdfDocRef.current && !loading) {
      renderAllPages(pdfDocRef.current, scale, rotation);
    }
  }, [scale, rotation, renderAllPages, loading]);

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

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 2.6));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.6));
  const handleResetZoom = () => setScale(1.2);
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handlePrint = () => {
    if (!containerRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${pdfData?.title || "Impression Document"}</title>
          <style>
            body { margin: 0; padding: 0; background: white; text-align: center; }
            canvas { max-width: 100%; height: auto; margin-bottom: 20px; page-break-after: always; }
          </style>
        </head>
        <body>
          ${containerRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleDownload = () => {
    if (!pdfData) return;
    const cleanFilename = (pdfData.title || "document").replace(/[^\w\s-]/gi, "") + ".pdf";
    const a = document.createElement("a");
    a.href = pdfData.url;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!pdfData) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setPdfData(null)}
    >
      <div
        className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-2xl w-full max-w-5xl h-[92vh] max-h-[96vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
          {/* Document Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-600 shrink-0 font-black text-xs">
              PDF
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {pdfData.title}
              </h3>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                <span>Visionneuse Canvas native</span>
                {numPages > 0 && <span>• {numPages} page{numPages > 1 ? "s" : ""}</span>}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={loading || scale <= 0.6}
                className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                disabled={loading}
                className="px-2 py-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                title="Réinitialiser le zoom"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={loading || scale >= 2.6}
                className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Rotate */}
            <button
              type="button"
              onClick={handleRotate}
              disabled={loading}
              className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer hidden md:flex"
              title="Pivoter"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading}
              className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer hidden sm:flex"
              title="Imprimer"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              title="Télécharger le fichier PDF"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden xs:inline">Télécharger</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => setPdfData(null)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content Area */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-auto bg-zinc-200/70 dark:bg-zinc-950 p-4 flex flex-col items-center relative">
          {loading && (
            <div className="my-auto flex flex-col items-center justify-center gap-3 py-16 text-zinc-500 dark:text-zinc-400">
              <Loader2 className="w-10 h-10 animate-spin text-red-500" />
              <p className="text-sm font-bold">Rendu haute fidélité du PDF en cours...</p>
              <p className="text-xs text-zinc-400">Préparation des pages via Canvas</p>
            </div>
          )}

          {error && !loading && (
            <div className="my-auto max-w-md p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-md text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Aperçu direct indisponible</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                <FileDown className="w-4 h-4" />
                <span>Télécharger le PDF</span>
              </button>
            </div>
          )}

          {/* Canvas Pages Container */}
          <div
            ref={containerRef}
            className={`w-full flex flex-col items-center transition-opacity duration-200 ${
              loading ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
