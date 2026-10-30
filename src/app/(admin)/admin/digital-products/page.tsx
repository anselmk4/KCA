"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  Eye,
  Loader2,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  User,
  Users,
  Layers,
  Sparkles,
  AlertTriangle,
  Share2,
  Edit3
} from "lucide-react";
import { DigitalProductEditModal } from "@/components/digital-products/DigitalProductEditModal";
import { DigitalProductShareModal } from "@/components/digital-products/DigitalProductShareModal";
import { DigitalProductBuyersModal } from "@/components/digital-products/DigitalProductBuyersModal";

interface AuthorInfo {
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface AdminDigitalProduct {
  id: string;
  author_id: string;
  author: AuthorInfo;
  title: string;
  description: string;
  price: number;
  cover_image_url: string;
  file_name: string;
  file_size_bytes: number | null;
  status: "published" | "draft";
  category: string;
  sales_count: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

interface StatsData {
  totalProducts: number;
  publishedCount: number;
  draftCount: number;
  totalSalesCount: number;
  totalPlatformRevenue: number;
}

export default function AdminDigitalProductsPage() {
  const [products, setProducts] = useState<AdminDigitalProduct[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminDigitalProduct | null>(null);
  const [sharingProduct, setSharingProduct] = useState<AdminDigitalProduct | null>(null);
  const [viewingBuyersProduct, setViewingBuyersProduct] = useState<AdminDigitalProduct | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/digital-products");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de charger les produits digitaux.");
      }
      setProducts(data.products || []);
      setStats(data.stats || null);
    } catch (err: any) {
      console.error("Error fetching admin digital products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleStatus = async (product: AdminDigitalProduct) => {
    const nextStatus = product.status === "published" ? "draft" : "published";
    setActionLoadingId(product.id);
    try {
      const res = await fetch("/api/admin/digital-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de la mise à jour du statut.");
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p))
      );
      if (stats) {
        setStats({
          ...stats,
          publishedCount:
            nextStatus === "published"
              ? stats.publishedCount + 1
              : Math.max(0, stats.publishedCount - 1),
          draftCount:
            nextStatus === "draft"
              ? stats.draftCount + 1
              : Math.max(0, stats.draftCount - 1),
        });
      }
    } catch (err: any) {
      alert(err.message || "Erreur lors du changement de statut.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer définitivement ce produit digital ? Cette action est irréversible."
      )
    ) {
      return;
    }

    setActionLoadingId(productId);
    try {
      const res = await fetch(`/api/admin/digital-products?id=${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de la suppression.");
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      if (stats) {
        setStats({
          ...stats,
          totalProducts: Math.max(0, stats.totalProducts - 1),
        });
      }
    } catch (err: any) {
      alert(err.message || "Erreur de suppression.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["ALL", ...list];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Tab filter
      if (activeTab === "PUBLISHED" && p.status !== "published") return false;
      if (activeTab === "DRAFT" && p.status !== "draft") return false;

      // Category filter
      if (selectedCategory !== "ALL" && p.category !== selectedCategory) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesCategory = p.category?.toLowerCase().includes(q);
        const matchesAuthor =
          p.author.full_name?.toLowerCase().includes(q) ||
          p.author.email?.toLowerCase().includes(q);
        return matchesTitle || matchesCategory || matchesAuthor;
      }

      return true;
    });
  }, [products, activeTab, selectedCategory, search]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${Math.round(bytes / 1024)} Ko`;
    }
    return `${mb.toFixed(1)} Mo`;
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            Produits Digitaux & E-books
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gérez, modérez et auditez l&apos;ensemble des e-books, guides PDF et ressources numériques proposés sur la plateforme.
          </p>
        </div>

        <Link
          href="/digital-store"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-700 transition shadow-sm self-start sm:self-auto"
        >
          <ExternalLink className="w-4 h-4 text-purple-400" />
          Voir la boutique publique
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">
              {stats?.totalProducts ?? products.length}
            </p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Produits</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.publishedCount ?? products.filter((p) => p.status === "published").length}
            </p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">En ligne (Publiés)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-700 dark:text-zinc-300">
              {stats?.draftCount ?? products.filter((p) => p.status === "draft").length}
            </p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Brouillons / Masqués</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {stats?.totalSalesCount ?? 0}
            </p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Ventes cumulées</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-teal-600 dark:text-teal-400">
              {(stats?.totalPlatformRevenue ?? 0).toLocaleString("fr-FR")} $
            </p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Volume Vendu (CA)</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl text-xs font-semibold self-start">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "ALL"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Tous ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("PUBLISHED")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "PUBLISHED"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Publiés ({products.filter((p) => p.status === "published").length})
          </button>
          <button
            onClick={() => setActiveTab("DRAFT")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "DRAFT"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Brouillons ({products.filter((p) => p.status === "draft").length})
          </button>
        </div>

        {/* Search & Category */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, auteur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-zinc-900 dark:text-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "Toutes catégories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-xs text-zinc-500 font-medium">Chargement des produits digitaux...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-700 dark:text-zinc-300 font-bold text-base">Aucun produit trouvé</p>
            <p className="text-zinc-400 text-xs mt-1">
              Modifiez vos critères de recherche ou vos filtres.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[850px]">
              <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Produit Digital</th>
                  <th className="px-6 py-4">Auteur / Formateur</th>
                  <th className="px-6 py-4 text-right">Prix</th>
                  <th className="px-6 py-4 text-center">Ventes & CA</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                {filteredProducts.map((p) => {
                  const isActionLoading = actionLoadingId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20 transition-colors"
                    >
                      {/* Product details */}
                      <td className="px-6 py-4">
                        <div
                          onClick={() => setViewingBuyersProduct(p)}
                          className="flex items-center gap-3.5 group cursor-pointer"
                          title="Cliquer pour afficher la liste des acheteurs et détails de paiement"
                        >
                          <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-xs group-hover:ring-2 group-hover:ring-purple-500/50 transition">
                            {p.cover_image_url ? (
                              <Image
                                src={p.cover_image_url}
                                alt={p.title}
                                fill
                                sizes="48px"
                                className="object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-zinc-900 dark:text-white text-sm truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                              {p.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                {p.category}
                              </span>
                              <span className="text-[11px] text-zinc-400">
                                {formatFileSize(p.file_size_bytes)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          {p.author.avatar_url ? (
                            <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                              <Image
                                src={p.author.avatar_url}
                                alt={p.author.full_name}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate">
                              {p.author.full_name}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                              {p.author.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-extrabold text-zinc-900 dark:text-white text-sm">
                          {p.price.toFixed(2)} $
                        </span>
                      </td>

                      {/* Sales & Revenue */}
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingBuyersProduct(p)}
                          className="group inline-flex flex-col items-center justify-center p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition cursor-pointer"
                          title="Cliquer pour afficher la liste des acheteurs et détails de paiement"
                        >
                          <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                            <Users className="w-3.5 h-3.5 text-purple-500" />
                            {p.sales_count} vente{p.sales_count > 1 ? "s" : ""}
                          </span>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">
                            {p.total_revenue.toLocaleString("fr-FR")} $ générés
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                            Voir les acheteurs →
                          </span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.status === "published"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {p.status === "published" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Publié
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-zinc-400" />
                              Brouillon
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Buyers inspection button */}
                          <button
                            onClick={() => setViewingBuyersProduct(p)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                            title="Voir la liste des acheteurs et détails de paiement"
                          >
                            <Users className="w-4 h-4" />
                          </button>

                          {/* Share button */}
                          <button
                            onClick={() => setSharingProduct(p)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                            title="Partager (Lien direct & Réseaux sociaux)"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-colors"
                            title="Modifier (Titre, prix, couverture, description)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Toggle publish button */}
                          <button
                            onClick={() => handleToggleStatus(p)}
                            disabled={isActionLoading}
                            className={`p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 ${
                              p.status === "published"
                                ? "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            }`}
                            title={
                              p.status === "published"
                                ? "Dépublier (rendre brouillon)"
                                : "Publier immédiatement sur la boutique"
                            }
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : p.status === "published" ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={isActionLoading}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer ce produit digital"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Digital Product Edit Modal */}
      <DigitalProductEditModal
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={(updated) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
          );
        }}
      />

      {/* Digital Product Share Modal */}
      <DigitalProductShareModal
        product={sharingProduct}
        isOpen={!!sharingProduct}
        onClose={() => setSharingProduct(null)}
      />

      {/* Digital Product Buyers Modal */}
      <DigitalProductBuyersModal
        productId={viewingBuyersProduct?.id || null}
        productTitle={viewingBuyersProduct?.title}
        productPrice={viewingBuyersProduct?.price}
        productCoverUrl={viewingBuyersProduct?.cover_image_url}
        isOpen={!!viewingBuyersProduct}
        onClose={() => setViewingBuyersProduct(null)}
      />
    </div>
  );
}
