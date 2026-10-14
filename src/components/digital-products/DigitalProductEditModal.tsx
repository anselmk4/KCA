"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  AlertCircle,
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  RefreshCw,
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setUploadingCover(false);
      setShowUrlInput(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const isEbookCategory =
    category === "E-books & Guides PDF" ||
    (product.file_name && product.file_name.toLowerCase().endsWith(".pdf"));

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP, GIF).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("L'image est trop volumineuse (taille maximale autorisée : 15 Mo).");
      return;
    }

    setUploadingCover(true);
    setErrorMsg(null);
    setCoverError(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      const res = await fetch("/api/upload/file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de l'upload de l'image de couverture.");
      }

      if (data.url) {
        setCoverImageUrl(data.url);
      } else {
        throw new Error("Aucune URL renvoyée par le serveur.");
      }
    } catch (err: any) {
      console.warn("[DigitalProductEdit] Upload error, falling back to base64 preview:", err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCoverImageUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingCover(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Image de Couverture
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                {showUrlInput ? "Masquer le champ URL" : "Coller une URL web"}
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCoverFileUpload}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
            />

            {/* Preview & Upload Zone */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-teal-500 transition-colors">
              {coverImageUrl && !coverError ? (
                <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-md shrink-0 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImageUrl}
                    alt="Aperçu couverture"
                    onError={() => setCoverError(true)}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="p-1.5 bg-white/90 text-zinc-900 rounded-lg hover:bg-white text-xs font-bold cursor-pointer"
                      title="Changer d'image"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl("")}
                      className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-bold cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-32 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 flex flex-col items-center justify-center text-zinc-400 border border-zinc-300 dark:border-zinc-700 shrink-0">
                  <ImageIcon className="w-8 h-8 mb-1 opacity-60" />
                  <span className="text-[10px] font-bold">Sans visuel</span>
                </div>
              )}

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                    {coverImageUrl ? "Changer l'image de couverture" : "Ajouter une image de couverture"}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    JPG, PNG, WebP (max 15 Mo). Choisissez un fichier depuis votre appareil pour remplacer la couverture actuelle.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {uploadingCover ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Téléversement en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" /> Téléverser une image
                      </>
                    )}
                  </button>

                  {coverImageUrl && (
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl("")}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Retirer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Direct URL Input */}
            {showUrlInput && (
              <div className="pt-2 animate-in fade-in duration-150">
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => {
                    setCoverImageUrl(e.target.value);
                    setCoverError(false);
                  }}
                  placeholder="https://... ou coller directement l'URL d'une image"
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}
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
