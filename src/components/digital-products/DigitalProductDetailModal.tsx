"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  FileText,
  DollarSign,
  Tag,
  CheckCircle,
  ShieldCheck,
  Eye,
  Calendar,
  User,
  Sparkles,
} from "lucide-react";
import { DigitalProductCheckoutModal } from "./DigitalProductCheckoutModal";

interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  cover_image_url: string;
  file_url: string;
  file_name?: string | null;
  file_size_bytes?: number | null;
  category?: string;
  tags?: string[];
  created_at?: string;
  author_id?: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
    specialty?: string;
    academy_name?: string;
  };
}

interface DigitalProductDetailModalProps {
  product: DigitalProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy?: (product: DigitalProduct) => void;
}

export function DigitalProductDetailModal({
  product,
  isOpen,
  onClose,
  onBuy,
}: DigitalProductDetailModalProps) {
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isOpen || !product) return null;

  const price = Number(product.price);

  const handleOpenCheckout = () => {
    if (onBuy) {
      onBuy(product);
    } else {
      setShowCheckout(true);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="relative h-48 sm:h-56 w-full bg-zinc-900 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.cover_image_url || "/placeholder-course.jpg"}
              alt={product.title}
              className="w-full h-full object-cover blur-sm opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/75 text-zinc-300 hover:text-white transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-5 left-6 right-6 flex items-end gap-5">
              <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden bg-zinc-800 shadow-2xl border-2 border-white/20 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.cover_image_url || "/placeholder-course.jpg"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-white pb-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500 text-zinc-950 uppercase">
                    PDF / Ebook
                  </span>
                  <span className="text-xs text-teal-300 font-semibold truncate">
                    {product.category || "Guide Professionnel"}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight line-clamp-2">
                  {product.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
            {/* Author bar */}
            {product.profiles && (
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {product.profiles.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.profiles.avatar_url}
                      alt={product.profiles.full_name || ""}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (product.profiles.full_name || "A").slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    {product.profiles.full_name || "Créateur certifié"}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {product.profiles.specialty || product.profiles.academy_name || "Formateur & Auteur"}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                À propos de cette ressource
              </h4>
              <p className="text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Mots-clés & Thématiques
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium border border-zinc-200 dark:border-zinc-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-200 dark:border-teal-900/40 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Format PDF / eBook</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Téléchargement immédiat</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Accès à vie</span>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0">
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold uppercase">Tarif officiel</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                  ${price.toFixed(2)}
                </span>
                <span className="text-xs text-zinc-400">USD</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Max 25$
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={handleOpenCheckout}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold rounded-2xl shadow-xl shadow-teal-500/25 text-xs transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" /> Acheter & Télécharger
              </button>
            </div>
          </div>
        </div>
      </div>

      <DigitalProductCheckoutModal
        product={product}
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
      />
    </>
  );
}
