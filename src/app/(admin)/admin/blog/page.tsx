"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Newspaper,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Search,
  CheckCircle2,
  Clock,
  Tag,
  BookOpen,
  Calendar,
  Sparkles,
  Save,
  X,
  Loader2,
  ExternalLink,
  Code,
  Sliders,
  Check,
  AlertCircle,
} from "lucide-react";
import { RichEditor } from "@/components/editor/RichEditor";
import { BlogPostSeo } from "@/data/blog-posts";

const CATEGORIES = [
  "Business & Monétisation",
  "Paiements & Fintech",
  "Intelligence Artificielle & EdTech",
  "Certifications & Sécurité",
  "Tutoriels & Guides",
  "Actualités Plateforme",
];

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostSeo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modal / Composer State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [composerTab, setComposerTab] = useState<"visual" | "preview" | "seo">("visual");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [authorName, setAuthorName] = useState("Équipe ANSELLA");
  const [authorRole, setAuthorRole] = useState("Experts LMS & Éducation");
  const [tagsInput, setTagsInput] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [readTimeMinutes, setReadTimeMinutes] = useState(5);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/blog");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Error loading blog posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const openNewComposer = () => {
    setEditingSlug(null);
    setTitle("");
    setSlug("");
    setMetaTitle("");
    setMetaDesc("");
    setExcerpt("");
    setCategory(CATEGORIES[0]);
    setAuthorName("Équipe ANSELLA");
    setAuthorRole("Experts LMS & Éducation");
    setTagsInput("E-learning, Afrique, Tutoriel");
    setContentHtml(`
      <h2>Introduction</h2>
      <p>Rédigez ici le contenu de votre article avec des sous-titres clairs, des paragraphes percutants et des exemples concrets pour captiver vos lecteurs.</p>
      <h2>Points Clés</h2>
      <ul>
        <li>Premier enseignement pratique</li>
        <li>Deuxième avantage pour les formateurs et apprenants</li>
      </ul>
      <h2>Conclusion</h2>
      <p>Terminez par un appel à l'action invitant les lecteurs à découvrir vos formations ou à lancer leur académie sur ANSELLA.</p>
    `);
    setReadTimeMinutes(5);
    setComposerTab("visual");
    setIsComposerOpen(true);
  };

  const openEditComposer = (post: BlogPostSeo) => {
    setEditingSlug(post.slug);
    setTitle(post.title);
    setSlug(post.slug);
    setMetaTitle(post.metaTitle || post.title);
    setMetaDesc(post.metaDesc || post.excerpt || "");
    setExcerpt(post.excerpt || "");
    setCategory(post.category || CATEGORIES[0]);
    setAuthorName(post.author?.name || "Équipe ANSELLA");
    setAuthorRole(post.author?.role || "Rédaction");
    setTagsInput((post.tags || []).join(", "));
    setContentHtml(post.contentHtml || "");
    setReadTimeMinutes(post.readTimeMinutes || 5);
    setComposerTab("visual");
    setIsComposerOpen(true);
  };

  // Auto-generate slug when title changes in new mode
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!editingSlug) {
      const generatedSlug = newTitle
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSavePost = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !contentHtml.trim()) {
      alert("Le titre et le contenu de l'article sont obligatoires.");
      return;
    }

    setSaving(true);
    try {
      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const calculatedReadTime = Math.max(
        1,
        Math.ceil(contentHtml.replace(/<[^>]*>/g, "").split(/\s+/).length / 180)
      );

      const payload = {
        originalSlug: editingSlug,
        title,
        slug: slug.trim(),
        metaTitle: metaTitle.trim() || `${title} | ANSELLA`,
        metaDesc: metaDesc.trim() || excerpt.trim() || title,
        excerpt: excerpt.trim(),
        category,
        authorName: authorName.trim(),
        authorRole: authorRole.trim(),
        contentHtml,
        tags: tagsArray,
        readTimeMinutes: calculatedReadTime,
      };

      const method = editingSlug ? "PUT" : "POST";
      const res = await fetch("/api/admin/blog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde.");
      }

      setSuccessMessage("Article enregistré et publié avec succès !");
      setTimeout(() => setSuccessMessage(""), 3500);
      await loadPosts();
      setIsComposerOpen(false);
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (postSlug: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet article de blog ? Cette action est irréversible.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/blog?slug=${postSlug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadPosts();
      } else {
        const data = await res.json();
        alert("Erreur : " + data.error);
      }
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (selectedCategory !== "ALL" && p.category !== selectedCategory) return false;
      return true;
    });
  }, [posts, searchQuery, selectedCategory]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
                Studio Blog & Rédaction
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Créez, éditez et publiez des articles optimisés SEO avec l'éditeur visuel WYSIWYG.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/blog"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>Voir le Blog Public</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </Link>

          <button
            onClick={openNewComposer}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Total Articles
          </span>
          <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">
            {posts.length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            Articles Indexés
          </span>
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {posts.length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Catégories
          </span>
          <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">
            {new Set(posts.map((p) => p.category)).size}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">
            Temps de lecture moyen
          </span>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {Math.round(posts.reduce((acc, p) => acc + p.readTimeMinutes, 0) / (posts.length || 1))} min
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, mot-clé, tag ou catégorie..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-teal-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            Toutes les catégories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-teal-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles List / Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-xs text-zinc-500">Chargement des articles de blog...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center text-zinc-500 bg-white dark:bg-zinc-900/10 space-y-3">
          <BookOpen className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Aucun article trouvé
          </h3>
          <p className="text-xs text-zinc-500">
            Créez votre premier article en cliquant sur « Nouvel Article ».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map((post) => (
            <div
              key={post.slug}
              className="bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:border-teal-500/30 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-5 shadow-xs"
            >
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    {post.category}
                  </span>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3" />
                    {post.publishedAt}
                  </span>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" />
                    {post.readTimeMinutes} min de lecture
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-snug">
                  {post.title}
                </h3>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    Tags :
                  </span>
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                  title="Voir sur le site"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => openEditComposer(post)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-950/50 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Éditer</span>
                </button>

                <button
                  onClick={() => handleDeletePost(post.slug)}
                  className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                  title="Supprimer l'article"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FULL-SCREEN COMPOSER MODAL / DRAWER
      ────────────────────────────────────────────────────────────── */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                    {editingSlug ? "Modifier l'article de blog" : "Rédiger un nouvel article"}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {slug ? `/blog/${slug}` : "L'URL sera générée automatiquement"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Composer Tabs */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setComposerTab("visual")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    composerTab === "visual"
                      ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  ✏️ Éditeur Visuel (WYSIWYG)
                </button>
                <button
                  onClick={() => setComposerTab("preview")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    composerTab === "preview"
                      ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  👁️ Aperçu en Direct
                </button>
                <button
                  onClick={() => setComposerTab("seo")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    composerTab === "seo"
                      ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  ⚙️ Métadonnées & SEO
                </button>
              </div>

              <div className="text-[11px] text-zinc-400 hidden sm:block">
                ~ {Math.max(1, Math.ceil(contentHtml.replace(/<[^>]*>/g, "").split(/\s+/).length / 180))} min de lecture
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title & Slug Header */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Titre Principal de l'Article *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ex: Comment créer et vendre une formation en ligne en Afrique..."
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Catégorie
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Slug URL (identifiant web)
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="comment-creer-formation-afrique"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-teal-600 dark:text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Extrait / Résumé Chapeau (1-2 phrases percutantes)
                  </label>
                  <textarea
                    rows={2}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Ce résumé s'affiche dans les résultats Google et les cartes d'aperçu du blog..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* TAB 1: VISUAL WYSIWYG */}
              {composerTab === "visual" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Corps de l'Article (Éditeur Riche & Structuré)
                    </label>
                    <span className="text-[10px] text-zinc-400">
                      Gras, Titres H2/H3, Listes, Citations, Code, Liens, Images
                    </span>
                  </div>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-zinc-950">
                    <RichEditor
                      value={contentHtml}
                      onChange={setContentHtml}
                      placeholder="Rédigez le contenu de votre article ici..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE PREVIEW */}
              {composerTab === "preview" && (
                <div className="space-y-6 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <div className="space-y-3 max-w-2xl mx-auto text-center pb-6 border-b border-zinc-200 dark:border-zinc-800">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {category}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white">
                      {title || "Titre de l'article"}
                    </h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
                      {excerpt || "Extrait de l'article..."}
                    </p>
                    <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-3">
                      <span>Par {authorName}</span>
                      <span>•</span>
                      <span>{new Date().toISOString().slice(0, 10)}</span>
                    </div>
                  </div>

                  <div
                    className="prose prose-zinc dark:prose-invert max-w-3xl mx-auto text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                </div>
              )}

              {/* TAB 3: SEO METADATA */}
              {composerTab === "seo" && (
                <div className="space-y-5 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Optimisation pour Google & Moteurs de Recherche</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Meta Titre SEO (affiché dans Google)
                      </label>
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="Titre optimisé avec mots-clés | ANSELLA"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Tags / Mots-clés (séparés par des virgules)
                      </label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="E-learning, Mobile Money, Formation, Afrique"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Meta Description SEO (150-160 caractères recommandés)
                    </label>
                    <textarea
                      rows={2}
                      value={metaDesc}
                      onChange={(e) => setMetaDesc(e.target.value)}
                      placeholder="Description concise incitant les internautes à cliquer sur le lien..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Nom de l'Auteur
                      </label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Rôle / Titre de l'Auteur
                      </label>
                      <input
                        type="text"
                        value={authorRole}
                        onChange={(e) => setAuthorRole(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSavePost()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingSlug ? "Mettre à jour l'article" : "Publier l'article"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
