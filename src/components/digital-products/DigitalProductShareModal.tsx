"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Mail,
  FileText,
  QrCode,
  Download,
  ExternalLink,
  Sparkles,
  Loader2,
  Store,
  Smartphone,
} from "lucide-react";

export interface DigitalProductToShare {
  id: string;
  author_id?: string;
  title: string;
  description?: string;
  price?: number;
  cover_image_url?: string;
  category?: string;
}

interface DigitalProductShareModalProps {
  product: DigitalProductToShare | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DigitalProductShareModal({
  product,
  isOpen,
  onClose,
}: DigitalProductShareModalProps) {
  const [activeTab, setActiveTab] = useState<"links" | "qrcode">("links");
  const [qrTarget, setQrTarget] = useState<"product" | "store">("product");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [copiedProduct, setCopiedProduct] = useState(false);
  const [copiedStore, setCopiedStore] = useState(false);
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const shareUrl = product ? `${origin}/store?product=${product.id}` : "";
  const storeUrl = product?.author_id ? `${origin}/store/${product.author_id}` : "";
  const activeQrUrl = qrTarget === "product" ? shareUrl : storeUrl || shareUrl;
  const shareText = product
    ? `Découvrez « ${product.title} » sur KCA Digital Store : ${shareUrl}`
    : "";

  // Generate high-resolution QR code whenever activeQrUrl changes
  useEffect(() => {
    let isMounted = true;
    if (!activeQrUrl) return;

    setGeneratingQr(true);
    QRCode.toDataURL(activeQrUrl, {
      errorCorrectionLevel: "H",
      width: 500,
      margin: 2,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error("[DigitalProductShareModal] Failed to generate QR Code:", err);
        if (isMounted) setGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeQrUrl]);

  if (!isOpen || !product) return null;

  const handleCopyProduct = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("input");
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopiedProduct(true);
      setTimeout(() => setCopiedProduct(false), 2500);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleCopyStore = async () => {
    if (!storeUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(storeUrl);
      } else {
        const input = document.createElement("input");
        input.value = storeUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopiedStore(true);
      setTimeout(() => setCopiedStore(false), 2500);
    } catch (err) {
      console.error("Failed to copy Store URL:", err);
    }
  };

  const handleCopyQrLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(activeQrUrl);
      }
      setCopiedQrLink(true);
      setTimeout(() => setCopiedQrLink(false), 2500);
    } catch (err) {
      console.error("Failed to copy active QR URL:", err);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    const safeTitle = (product.title || "produit-digital")
      .toLowerCase()
      .replace(/[^\w\s-]/gi, "")
      .replace(/\s+/g, "_")
      .slice(0, 30);
    const filename =
      qrTarget === "product"
        ? `qrcode-achat-${safeTitle}.png`
        : `qrcode-boutique-${safeTitle}.png`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      bg: "bg-emerald-500 hover:bg-emerald-600",
      text: "WhatsApp",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "X (Twitter)",
      icon: Send,
      bg: "bg-black hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700",
      text: "X / Twitter",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Découvrez cette ressource : « ${product.title} »`
      )}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: Share2,
      bg: "bg-blue-600 hover:bg-blue-700",
      text: "LinkedIn",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: Send,
      bg: "bg-sky-500 hover:bg-sky-600",
      text: "Telegram",
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
        product.title
      )}`,
    },
    {
      name: "Facebook",
      icon: Share2,
      bg: "bg-indigo-600 hover:bg-indigo-700",
      text: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Email",
      icon: Mail,
      bg: "bg-zinc-700 hover:bg-zinc-800",
      text: "Email",
      url: `mailto:?subject=${encodeURIComponent(
        `Recommandation : ${product.title}`
      )}&body=${encodeURIComponent(
        `Bonjour,\n\nJe te recommande ce produit digital sur KCA :\n${product.title}\n\nAccéder au lien d'achat direct : ${shareUrl}`
      )}`,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Partager ce produit digital
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Copiez le lien direct, scannez le QR code ou partagez-le en un clic.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-4 pb-1 shrink-0">
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl gap-1 border border-zinc-200/60 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => setActiveTab("links")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "links"
                  ? "bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              Liens & Réseaux
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qrcode")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "qrcode"
                  ? "bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              QR Code d&apos;Achat Direct
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-left flex-1">
          {/* Product Mini Preview (Always shown) */}
          <div className="flex items-center gap-3.5 p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0">
              {product.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.cover_image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <FileText className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                {product.category || "Produit Digital"}
              </span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                {product.title}
              </h4>
              {product.price !== undefined && (
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ${Number(product.price).toFixed(2)} USD
                </p>
              )}
            </div>
          </div>

          {/* TAB 1: Links & Social Share */}
          {activeTab === "links" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Direct Copy Link Product */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Lien direct vers ce produit
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab("qrcode")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Voir le QR Code
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-hidden select-all"
                  />
                  <button
                    onClick={handleCopyProduct}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      copiedProduct
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
                    }`}
                  >
                    {copiedProduct ? (
                      <>
                        <Check className="w-4 h-4" /> Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copier
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Direct Copy Link Storefront if author_id is present */}
              {storeUrl && (
                <div>
                  <label className="block text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
                    Lien de votre vitrine / boutique créateur complète
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={storeUrl}
                      className="flex-1 px-3.5 py-2.5 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-mono text-teal-800 dark:text-teal-300 focus:outline-hidden select-all"
                    />
                    <button
                      onClick={handleCopyStore}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        copiedStore
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                      }`}
                    >
                      {copiedStore ? (
                        <>
                          <Check className="w-4 h-4" /> Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copier la boutique
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Social Share Grid */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                  Partager sur les réseaux sociaux
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {socialLinks.map((s) => {
                    const Icon = s.icon;
                    return (
                      <a
                        key={s.name}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${s.bg}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{s.text}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QR Code d'Achat Direct */}
          {activeTab === "qrcode" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Optional sub-target toggle (Product vs Storefront) */}
              {storeUrl && (
                <div className="flex items-center justify-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => setQrTarget("product")}
                    className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      qrTarget === "product"
                        ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-300 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    Ce Produit (${Number(product.price || 0).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTarget("store")}
                    className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      qrTarget === "store"
                        ? "bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-300 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    Boutique Complète
                  </button>
                </div>
              )}

              {/* Centered QR Card */}
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
                <div className="relative p-4 rounded-2xl bg-white shadow-md border-2 border-purple-200 dark:border-purple-900/60 w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center">
                  {generatingQr || !qrDataUrl ? (
                    <div className="flex flex-col items-center justify-center space-y-2 text-purple-600">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-bold">Génération du QR Code...</span>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="QR Code Achat Produit Digital"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1 max-w-sm">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    Scannez pour acheter directement ce produit
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Idéal pour vos stories, présentations en direct, webinaires, affiches et supports marketing.
                  </p>
                </div>

                {/* QR Code Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    disabled={!qrDataUrl}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Télécharger le QR Code (PNG)
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyQrLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedQrLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" /> Lien copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copier le lien
                      </>
                    )}
                  </button>

                  <a
                    href={activeQrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors"
                    title="Ouvrir la page d'achat"
                  >
                    <ExternalLink className="w-4 h-4" /> Tester
                  </a>
                </div>
              </div>

              {/* Help & Mobile Money Tip */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-[11px] text-purple-900 dark:text-purple-300 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                <span>
                  Vos clients peuvent scanner ce code avec l&apos;appareil photo de leur smartphone (iPhone ou Android) pour accéder directement au formulaire de règlement rapide par <strong>Mobile Money</strong> (M-Pesa, Orange, Airtel, MTN, Wave) ou <strong>Carte bancaire / PayPal</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-150 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
