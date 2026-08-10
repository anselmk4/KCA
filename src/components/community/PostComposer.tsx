"use client";

import React, { useState } from "react";
import {
  Send,
  Image as ImageIcon,
  Link2,
  X,
  Sparkles,
  Loader2,
  Lightbulb,
  BarChart2,
  BookOpen,
  Megaphone,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";

export type PostCategory = "REFLECTIONS" | "ANALYSIS" | "RESOURCES" | "ANNOUNCEMENTS";

interface PostComposerProps {
  onSubmit: (postData: {
    title: string;
    content: string;
    category: PostCategory;
    resourceUrl?: string;
    mediaUrls?: string[];
  }) => Promise<void>;
  currentUserProfile?: any;
}

const CATEGORY_OPTIONS: { id: PostCategory; label: string; icon: any; color: string }[] = [
  { id: "REFLECTIONS", label: "💡 Réflexion & Débat", icon: Lightbulb, color: "text-amber-500" },
  { id: "ANALYSIS", label: "📈 Analyse & Stratégie", icon: BarChart2, color: "text-indigo-500" },
  { id: "RESOURCES", label: "📚 Ressource & Tuto", icon: BookOpen, color: "text-emerald-500" },
  { id: "ANNOUNCEMENTS", label: "📢 Annonce", icon: Megaphone, color: "text-purple-500" },
];

const SUGGESTED_HASHTAGS = ["#crypto", "#blockchain", "#ia", "#trading", "#web3", "#defi", "#ansella"];

export function PostComposer({ onSubmit, currentUserProfile }: PostComposerProps) {
  const [category, setCategory] = useState<PostCategory>("REFLECTIONS");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaUrls.length + files.length > 4) {
      setErrorMsg("Vous pouvez ajouter jusqu'à 4 images maximum par publication.");
      return;
    }

    setUploading(true);
    setErrorMsg("");

    const newUrls: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`L'image ${file.name} dépasse la taille maximale autorisée de 5 Mo.`);
        setUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newUrls.push(event.target.result as string);
        }
        processed++;
        if (processed === files.length) {
          setMediaUrls((prev) => [...prev, ...newUrls]);
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const addHashtag = (tag: string) => {
    if (!content.includes(tag)) {
      setContent((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg("Veuillez rédiger le contenu de votre publication.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        category,
        resourceUrl: resourceUrl.trim() || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });

      // Reset form
      setTitle("");
      setContent("");
      setResourceUrl("");
      setMediaUrls([]);
      setShowLinkInput(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la publication.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setCategory(opt.id)}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              category === opt.id
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md scale-[1.02]"
                : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
            }`}
          >
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Optional Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de votre publication (Optionnel)..."
          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-zinc-900 dark:text-white"
        />

        {/* Content Textarea */}
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partagez une analyse, une question ou une ressource avec la communauté..."
          className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-zinc-900 dark:text-white resize-none"
        />

        {/* Image Previews */}
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {mediaUrls.map((url, idx) => (
              <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <img src={url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* External Link Input if toggled */}
        {showLinkInput && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <div className="relative flex-1">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://votre-lien-externe.com..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowLinkInput(false)}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Suggested Hashtags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hashtags :</span>
          {SUGGESTED_HASHTAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addHashtag(tag)}
              className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Toolbar & Action Footer */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* File Upload Button */}
            <label className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-extrabold">
              <ImageIcon className="w-4 h-4 text-teal-500" />
              <span className="hidden sm:inline">Ajouter des images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading || mediaUrls.length >= 4}
                className="hidden"
              />
            </label>

            {/* Link Toggle Button */}
            <button
              type="button"
              onClick={() => setShowLinkInput(!showLinkInput)}
              className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-extrabold"
            >
              <Link2 className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Lien externe</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-black text-xs sm:text-sm shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Publier</span>
          </button>
        </div>
      </form>
    </div>
  );
}
