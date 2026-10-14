"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Mail,
  FileText,
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
  const [copiedProduct, setCopiedProduct] = useState(false);
  const [copiedStore, setCopiedStore] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!isOpen || !product) return null;

  const shareUrl = `${origin}/store?product=${product.id}`;
  const storeUrl = product.author_id ? `${origin}/store/${product.author_id}` : "";
  const shareText = `Découvrez « ${product.title} » sur KCA Digital Store : ${shareUrl}`;

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
        `Bonjour,\n\nJe te recommande ce produit digital sur KCA :\n${product.title}\n\nAccéder au lien : ${shareUrl}`
      )}`,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Partager ce produit digital
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Copiez le lien direct ou partagez-le en un clic sur vos réseaux.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-left">
          {/* Product Mini Preview */}
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

          {/* Direct Copy Link Product */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Lien direct vers ce produit
            </label>
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

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-150 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
