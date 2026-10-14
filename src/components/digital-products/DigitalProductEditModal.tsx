"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  FileText,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  Save,
} from "lucide-react";
import { CATEGORIES_LIST, validateDigitalProductPrice } from "@/lib/digital-products-pricing";

export interface DigitalProductToEdit {
  id: string;
  title: string;
  description: string;
  price: number;
  cover_image_url: string;
  category: string;
  status: "published" | "draft" | string;
  tags?: string[];
  file_name?: string | null;
}

interface DigitalProductEditModalProps {
  product: DigitalProductToEdit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: any) => void;
}

export function DigitalProductEditModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: DigitalProductEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [category, setCategory] = useState("E-books & Guides PDF");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [tagsStr, setTagsStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);

  useEffect(() => {
    if (product) {
      setTitle(product.title || "");
      setDescription(product.description || "");
      setPrice(product.price ?? 0);
      setCategory(product.category || "E-books & Guides PDF");
      setCoverImageUrl(product.cover_image_url || "");
      setStatus(product.status === "draft" ? "draft" : "published");
      setTagsStr(Array.isArray(product.tags) ? product.tags.join(", ") : "");
      setErrorMsg(null);
      setCoverError(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const isEbookCategory =
    category === "E-books & Guides PDF" ||
    (product.file_name && product.file_name.toLowerCase().endsWith(".pdf"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numPrice = parseFloat(String(price));
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg("Veuillez saisir un tarif valide supérieur ou égal à 0 $.");
      return;
    }

    // Validation du plafond tarifaire
    const check = validateDigitalProductPrice(numPrice, category, product.file_name || undefined);
    if (!check.isValid) {
      setErrorMsg(check.error || "Tarif non autorisé pour ce type de ressource.");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Le titre du produit est obligatoire.");
      return;
    }

    if (!description.trim()) {
      setErrorMsg("La description du produit est obligatoire.");
      return;
    }

    setLoading(true);
    try {
      const parsedTags = tagsStr
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const res = await fetch(`/api/digital-products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: numPrice,
          category,
          cover_image_url: coverImageUrl.trim(),
          status,
          tags: parsedTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'enregistrer les modifications.");
      }

      onSuccess(data.product || { ...product, title, description, price: numPrice, category, cover_image_url: coverImageUrl, status, tags: parsedTags });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Modifier le Produit Digital
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Mettez à jour le titre, prix, couverture et description de votre ressource.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
          {errorMsg && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Titre de la ressource <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Guide Ultime du Smart Contract Security 2026"
              required
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Catégorie & Statut (grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Statut de visibilité
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="published">Publié (En ligne sur la boutique)</option>
                <option value="draft">Brouillon (Masqué au public)</option>
              </select>
            </div>
          </div>

          {/* Prix avec Règle Plafond 25$ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Prix de vente (USD $) <span className="text-red-500">*</span>
              </label>
              {isEbookCategory && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                  Plafond max : 25 $ (E-book / PDF)
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={isEbookCategory ? "25" : undefined}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={isEbookCategory ? "Ex : 9.99 (max 25.00)" : "Ex : 49.00"}
                required
                className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Les apprenants règlent via Mobile Money (Airtel, Orange, M-Pesa, MTN, Wave) ou Carte / PayPal.
            </p>
          </div>

          {/* Image de Couverture */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              URL de la Couverture (Image)
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => {
                  setCoverImageUrl(e.target.value);
                  setCoverError(false);
                }}
                placeholder="https://images.unsplash.com/... ou URL Cloudinary / Supabase"
                className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              {coverImageUrl && !coverError && (
                <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-300 dark:border-zinc-700 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImageUrl}
                    alt="Aperçu"
                    onError={() => setCoverError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Description détaillée <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez précisément ce que contient ce produit digital, ce que l'acheteur va apprendre ou les fichiers inclus..."
              required
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs leading-relaxed text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Mots-clés / Tags */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Mots-clés / Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="Ex : solidity, audit, smart-contracts, pdf, web3"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
