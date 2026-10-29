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
  UploadCloud,
  ExternalLink,
  Archive,
  FileCheck,
  File,
  Link2,
  CheckCircle2,
  Info,
  Globe,
  Sparkles,
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
  file_url?: string | null;
  file_size_bytes?: number | null;
  preview_url?: string | null;
}

interface DigitalProductEditModalProps {
  product: DigitalProductToEdit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: any) => void;
}

function formatFileSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const k = 1024;
  const sizes = ["Octets", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getResourceFileInfo(name?: string | null, url?: string | null) {
  const lowerName = (name || "").toLowerCase();
  const lowerUrl = (url || "").toLowerCase();

  const isExternalCloud =
    lowerUrl.includes("drive.google.com") ||
    lowerUrl.includes("docs.google.com") ||
    lowerUrl.includes("mega.nz") ||
    lowerUrl.includes("dropbox.com") ||
    lowerUrl.includes("onedrive") ||
    lowerUrl.includes("1drv.ms") ||
    lowerUrl.includes("notion.so") ||
    lowerUrl.includes("notion.site") ||
    lowerUrl.includes("mediafire.com") ||
    lowerUrl.includes("wetransfer.com");

  if (isExternalCloud) {
    let providerName = "Lien Cloud Externe";
    if (lowerUrl.includes("google.com")) providerName = "Google Drive";
    else if (lowerUrl.includes("mega.nz")) providerName = "Mega.nz";
    else if (lowerUrl.includes("dropbox.com")) providerName = "Dropbox";
    else if (lowerUrl.includes("onedrive") || lowerUrl.includes("1drv.ms")) providerName = "OneDrive";
    else if (lowerUrl.includes("notion")) providerName = "Espace Notion";

    return {
      kind: "cloud",
      label: providerName,
      badgeColor: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50",
    };
  }

  if (lowerName.endsWith(".pdf") || lowerUrl.endsWith(".pdf")) {
    return {
      kind: "pdf",
      label: "Document PDF / E-book",
      badgeColor: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
    };
  }

  if (
    lowerName.endsWith(".zip") ||
    lowerName.endsWith(".rar") ||
    lowerName.endsWith(".7z") ||
    lowerName.endsWith(".tar.gz")
  ) {
    return {
      kind: "archive",
      label: "Archive Compressée (ZIP/RAR)",
      badgeColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
    };
  }

  if (lowerName.endsWith(".epub") || lowerName.endsWith(".mobi")) {
    return {
      kind: "epub",
      label: "Livre Numérique (ePub/Mobi)",
      badgeColor: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50",
    };
  }

  return {
    kind: "file",
    label: "Fichier Numérique",
    badgeColor: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900/50",
  };
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

  // Resource File States
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSizeBytes, setFileSizeBytes] = useState<number | null>(null);
  const [showFileReplacement, setShowFileReplacement] = useState(false);
  const [fileTab, setFileTab] = useState<"upload" | "link">("upload");
  const [customLinkUrl, setCustomLinkUrl] = useState("");
  const [customLinkName, setCustomLinkName] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [showCoverUrlInput, setShowCoverUrlInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successFileNotice, setSuccessFileNotice] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const resourceInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (product) {
      setTitle(product.title || "");
      setDescription(product.description || "");
      setPrice(product.price ?? 0);
      setCategory(product.category || "E-books & Guides PDF");
      setCoverImageUrl(product.cover_image_url || "");
      setStatus(product.status === "draft" ? "draft" : "published");
      setTagsStr(Array.isArray(product.tags) ? product.tags.join(", ") : "");

      // File setup
      const initialFileUrl = product.file_url || "";
      const initialFileName = product.file_name || "";
      setFileUrl(initialFileUrl);
      setFileName(initialFileName);
      setFileSizeBytes(product.file_size_bytes ?? null);

      const isExternal =
        initialFileUrl.includes("drive.google.com") ||
        initialFileUrl.includes("mega.nz") ||
        initialFileUrl.includes("dropbox.com") ||
        initialFileUrl.includes("onedrive") ||
        initialFileUrl.includes("1drv.ms") ||
        initialFileUrl.includes("notion.so");

      setFileTab(isExternal ? "link" : "upload");
      setCustomLinkUrl(isExternal ? initialFileUrl : "");
      setCustomLinkName(isExternal ? initialFileName : "");
      setShowFileReplacement(!initialFileUrl);

      setErrorMsg(null);
      setSuccessFileNotice(null);
      setCoverError(false);
      setUploadingCover(false);
      setUploadingResource(false);
      setShowCoverUrlInput(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const isEbookCategory =
    category === "E-books & Guides PDF" ||
    (fileName && fileName.toLowerCase().endsWith(".pdf")) ||
    (product.file_name && product.file_name.toLowerCase().endsWith(".pdf"));

  // Handle Cover Upload
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
      console.warn("[DigitalProductEdit] Upload cover error, falling back to base64 preview:", err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCoverImageUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  // Handle Resource File Upload (PDF, ZIP, DOCX, etc.)
  const handleResourceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 80 * 1024 * 1024) {
      setErrorMsg("Le fichier numérique dépasse la limite de 80 Mo. Pour les fichiers plus lourds, utilisez l'onglet 'Lien Cloud Externe (Google Drive, Mega)'.");
      return;
    }

    setUploadingResource(true);
    setErrorMsg(null);
    setSuccessFileNotice(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "document");

      const res = await fetch("/api/upload/file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec du téléversement du fichier.");
      }

      if (data.url) {
        setFileUrl(data.url);
        setFileName(data.filename || file.name);
        setFileSizeBytes(file.size);
        setShowFileReplacement(false);
        setSuccessFileNotice(`Nouveau fichier « ${file.name} » sélectionné avec succès !`);
      } else {
        throw new Error("Aucune URL renvoyée par le serveur pour ce fichier.");
      }
    } catch (err: any) {
      console.error("[DigitalProductEdit] Error uploading resource file:", err);
      setErrorMsg(err.message || "Erreur lors du téléversement du fichier.");
    } finally {
      setUploadingResource(false);
      if (resourceInputRef.current) {
        resourceInputRef.current.value = "";
      }
    }
  };

  // Handle Setting External Link (Google Drive, Mega, Dropbox, OneDrive, etc.)
  const handleApplyCustomLink = () => {
    setErrorMsg(null);
    setSuccessFileNotice(null);

    if (!customLinkUrl.trim()) {
      setErrorMsg("Veuillez saisir l'URL de votre fichier ou dossier externe (Google Drive, Mega, etc.).");
      return;
    }

    if (!customLinkUrl.trim().startsWith("http://") && !customLinkUrl.trim().startsWith("https://")) {
      setErrorMsg("Le lien externe doit débuter par https:// ou http://");
      return;
    }

    const trimmedUrl = customLinkUrl.trim();
    let computedName = customLinkName.trim();

    if (!computedName) {
      if (trimmedUrl.includes("drive.google.com")) computedName = "Google Drive Resource";
      else if (trimmedUrl.includes("mega.nz")) computedName = "Mega.nz Package";
      else if (trimmedUrl.includes("dropbox.com")) computedName = "Dropbox Resource";
      else if (trimmedUrl.includes("onedrive") || trimmedUrl.includes("1drv.ms")) computedName = "OneDrive Resource";
      else computedName = "Ressource Téléchargeable";
    }

    setFileUrl(trimmedUrl);
    setFileName(computedName);
    setFileSizeBytes(null);
    setShowFileReplacement(false);
    setSuccessFileNotice(`Lien Cloud externe configuré : « ${computedName} »`);
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
    const check = validateDigitalProductPrice(numPrice, category, fileName || product.file_name || undefined);
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

    if (!fileUrl.trim()) {
      setErrorMsg("Veuillez configurer un fichier numérique ou un lien externe pour ce produit.");
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
          file_url: fileUrl.trim(),
          file_name: fileName.trim() || null,
          file_size_bytes: fileSizeBytes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'enregistrer les modifications.");
      }

      onSuccess(
        data.product || {
          ...product,
          title,
          description,
          price: numPrice,
          category,
          cover_image_url: coverImageUrl,
          status,
          tags: parsedTags,
          file_url: fileUrl.trim(),
          file_name: fileName.trim() || null,
          file_size_bytes: fileSizeBytes,
        }
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const fileInfo = getResourceFileInfo(fileName, fileUrl);
  const formattedSize = formatFileSize(fileSizeBytes);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Modifier le Produit Digital
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Mettez à jour le fichier PDF/ZIP, lien Cloud, tarif, couverture et informations.
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-left">
          {errorMsg && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successFileNotice && (
            <div className="flex items-start gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successFileNotice}</span>
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
              placeholder="Ex : De l'idée au marché : le guide complet pour entreprendre en RDC"
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

          {/* Prix avec Règle Plafond 25$ pour E-books/PDF */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Prix de vente (USD $) <span className="text-red-500">*</span>
              </label>
              {isEbookCategory ? (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                  Plafond max : 25 $ (E-book / PDF)
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                  Tarif Libre (Logiciel, Script, Template)
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

          {/* SECTION : FICHIER DE LA RESSOURCE (REMPLACER LE FICHIER PDF / EXTERNAL LINK) */}
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Fichier ou Lien de la Ressource <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Le contenu numérique qui sera délivré automatiquement à l&apos;apprenant après achat.
                </p>
              </div>

              {fileUrl && (
                <button
                  type="button"
                  onClick={() => setShowFileReplacement(!showFileReplacement)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {showFileReplacement ? "Conserver le fichier actuel" : "Remplacer le fichier"}
                </button>
              )}
            </div>

            {/* Current Active File Banner */}
            {fileUrl && !showFileReplacement && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shrink-0">
                    {fileInfo.kind === "pdf" ? (
                      <FileText className="w-5 h-5 text-rose-500" />
                    ) : fileInfo.kind === "archive" ? (
                      <Archive className="w-5 h-5 text-amber-500" />
                    ) : fileInfo.kind === "cloud" ? (
                      <ExternalLink className="w-5 h-5 text-blue-500" />
                    ) : (
                      <FileCheck className="w-5 h-5 text-teal-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-xs sm:max-w-md">
                        {fileName || "Fichier de ressource numérique"}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${fileInfo.badgeColor}`}>
                        {fileInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5">
                      {formattedSize ? <span>{formattedSize}</span> : null}
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="w-3 h-3" /> Fichier actif et disponible au téléchargement
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFileReplacement(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors shrink-0 cursor-pointer ml-2"
                >
                  Changer
                </button>
              </div>
            )}

            {/* Replacement or Initial Selection Interface */}
            {(showFileReplacement || !fileUrl) && (
              <div className="pt-2 space-y-3 animate-in fade-in duration-200">
                {/* Tabs: Upload Local vs External Cloud Link */}
                <div className="flex items-center p-1 bg-zinc-200/70 dark:bg-zinc-800 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setFileTab("upload")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      fileTab === "upload"
                        ? "bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Téléverser un nouveau fichier (PC / Appareil)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileTab("link")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      fileTab === "link"
                        ? "bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Lien Cloud Externe (Google Drive, Mega, etc.)
                  </button>
                </div>

                {/* TAB 1: File Upload */}
                {fileTab === "upload" && (
                  <div className="border-2 border-dashed border-teal-500/40 hover:border-teal-500 rounded-2xl p-6 text-center bg-teal-50/20 dark:bg-teal-950/10 transition-colors">
                    <input
                      type="file"
                      ref={resourceInputRef}
                      onChange={handleResourceFileUpload}
                      accept=".pdf,.epub,.mobi,.zip,.rar,.7z,.tar.gz,.doc,.docx,.xlsx,.fig,.json,.ipynb,.psd"
                      className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
                        {uploadingResource ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <UploadCloud className="w-6 h-6" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">
                          {uploadingResource
                            ? "Téléversement et sécurisation du fichier..."
                            : "Sélectionnez votre nouveau fichier pour remplacer le document actuel"}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          PDF, ZIP, RAR, EPUB, DOCX, XLSX, Modèles Notion/Figma (jusqu&apos;à 80 Mo)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => resourceInputRef.current?.click()}
                        disabled={uploadingResource}
                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {uploadingResource ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" /> Choisir un fichier depuis mon ordinateur
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: External Link */}
                {fileTab === "link" && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-900/40">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                      <p className="leading-relaxed">
                        Idéal pour les gros fichiers hébergés sur <strong>Google Drive</strong>, <strong>Mega.nz</strong>, <strong>Dropbox</strong>, <strong>OneDrive</strong> ou <strong>Notion</strong>. Dès l&apos;achat confirmé, l&apos;acheteur aura accès directement à ce lien sécurisé.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        URL de partage du fichier ou dossier <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Link2 className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={customLinkUrl}
                          onChange={(e) => setCustomLinkUrl(e.target.value)}
                          placeholder="Ex: https://drive.google.com/file/d/1a2B3c.../view ou https://mega.nz/file/..."
                          className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Nom ou titre du fichier affiché pour l&apos;acheteur
                      </label>
                      <input
                        type="text"
                        value={customLinkName}
                        onChange={(e) => setCustomLinkName(e.target.value)}
                        placeholder="Ex: Guide_Complet_Entreprendre_RDC_2026.pdf ou Pack_Logiciel_V2.zip"
                        className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleApplyCustomLink}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Appliquer ce lien Cloud
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image de Couverture */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Image de Couverture
              </label>
              <button
                type="button"
                onClick={() => setShowCoverUrlInput(!showCoverUrlInput)}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                {showCoverUrlInput ? "Masquer le champ URL" : "Coller une URL web"}
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={coverInputRef}
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
                      onClick={() => coverInputRef.current?.click()}
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
                    onClick={() => coverInputRef.current?.click()}
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
            {showCoverUrlInput && (
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
              disabled={loading || uploadingResource || uploadingCover}
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
