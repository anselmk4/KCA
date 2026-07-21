"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import {
  MessageCircle, Send, Loader2, Trash2, ChevronDown, ChevronUp,
  Users, Award, ThumbsUp, Bookmark, Share2, Sparkles, Filter,
  Search, ExternalLink, Trophy, Flame, TrendingUp, BookOpen, UserCheck,
  Megaphone, FileCode, Lightbulb, BarChart2
} from "lucide-react";

export type PostCategory = "ALL" | "REFLECTIONS" | "ANALYSIS" | "RESOURCES" | "ANNOUNCEMENTS";

interface Post {
  id: string;
  user_id: string;
  category: PostCategory;
  title?: string | null;
  content: string;
  resource_url?: string | null;
  likes_count: number;
  liked_by_user?: boolean;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
  author_role?: string;
  comments?: Comment[];
  showComments?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
  author_role?: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  plan: string;
  points: number;
  coursesCount: number;
  affiliatesCount: number;
  rank: number;
}

const CATEGORY_CONFIG: Record<PostCategory, { label: string; icon: any; color: string; bg: string }> = {
  ALL: { label: "Toutes les publications", icon: Sparkles, color: "text-zinc-600 dark:text-zinc-300", bg: "bg-zinc-100 dark:bg-zinc-800" },
  REFLECTIONS: { label: "Réflexions & Débats", icon: Lightbulb, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40" },
  ANALYSIS: { label: "Analyses & Stratégies", icon: BarChart2, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/40" },
  RESOURCES: { label: "Ressources & Guides", icon: BookOpen, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40" },
  ANNOUNCEMENTS: { label: "Annonces Officieuses", icon: Megaphone, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40" },
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardTab, setLeaderboardTab] = useState<"INSTRUCTORS" | "AFFILIATES">("AFFILIATES");
  const [showFullLeaderboardModal, setShowFullLeaderboardModal] = useState(false);

  // Post composer state
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postCategory, setPostCategory] = useState<PostCategory>("REFLECTIONS");
  const [postResourceUrl, setPostResourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // Comments state
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  // ─── Initialisation et Chargement des Données ─────────────
  const loadCommunityData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, plan, role")
          .eq("id", user.id)
          .maybeSingle();
        setCurrentUserProfile(prof);
      }

      // 1. Load Leaderboard first to get server-resolved user roles
      const lbUsers = await loadLeaderboardData();
      const lbRoleMap: Record<string, string> = {};
      (lbUsers || []).forEach((u) => {
        if (u.id && u.role) lbRoleMap[u.id] = u.role;
      });

      // 2. Fetch posts
      let rawPosts: any[] = [];
      try {
        const { data, error } = await db
          .from("community_posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data) rawPosts = data;
      } catch (err) {
        console.warn("[Community] fallback to empty posts on table missing:", err);
      }

      // If database table is empty or missing, provide sample Kajabi posts
      if (rawPosts.length === 0) {
        rawPosts = [
          {
            id: "sample-1",
            user_id: "sample-inst-1",
            category: "ANALYSIS",
            title: "📈 Analyse Bitcoin Q3 2026 & Impact de l'IA sur le Trading Algorithmique",
            content: "Bonjour à tous les membres ! Voici mon analyse complète sur la structure actuelle du marché Crypto. Avec l'intégration des modèles LLM dans les bots d'arbitrage, nous observons une compression importante de la volatilité sur l'Ether et le Bitcoin. Quels sont vos niveaux clés pour ce mois-ci ?",
            resource_url: "https://kuettu.com/analysis/btc-2026",
            likes_count: 24,
            created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            author_name: "Prof. Alexandre Vane",
            author_avatar: null,
            author_role: "INSTRUCTOR"
          },
          {
            id: "sample-2",
            user_id: "sample-inst-2",
            category: "RESOURCES",
            title: "🛠️ Guide Ultime : Déployer un Smart Contract Solidity sécurisé avec Hardhat",
            content: "J'ai préparé une checklist complète sur la sécurité des Smart Contracts (Reentrancy, Overflow, Oracles attacks). N'hésitez pas à la télécharger et à poser vos questions dans les commentaires !",
            resource_url: "https://github.com/kuettu/smart-contract-security-guide",
            likes_count: 18,
            created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
            author_name: "Sarah Lin",
            author_avatar: null,
            author_role: "INSTRUCTOR"
          },
          {
            id: "sample-3",
            user_id: "sample-student-1",
            category: "REFLECTIONS",
            title: "💡 Comment gardez-vous votre discipline dans le suivi des cours ?",
            content: "En tant qu'apprenant en Blockchain & IA, j'essaie d'accorder 2h chaque soir à la pratique. Avez-vous des stratégies de Time-Blocking ou de prise de notes à partager avec la communauté ?",
            resource_url: null,
            likes_count: 11,
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            author_name: "Marc K.",
            author_avatar: null,
            author_role: "STUDENT"
          }
        ];
      }

      // Fetch comments if table exists
      let rawComments: any[] = [];
      try {
        const postIds = rawPosts.map((p) => p.id);
        const { data: commentsData } = await db
          .from("community_comments")
          .select("*")
          .in("post_id", postIds)
          .order("created_at", { ascending: true });
        if (commentsData) rawComments = commentsData;
      } catch (e) {
        console.warn("[Community] comments table query fallback:", e);
      }

      const allUserIds = [...new Set([
        ...rawPosts.map((p) => p.user_id),
        ...rawComments.map((c) => c.user_id)
      ])];

      // Fetch profile details for all post and comment authors
      const { data: authorProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, plan, role")
        .in("id", allUserIds);

      const authorProfileMap: Record<string, { name: string; avatar: string | null; plan: string | null; role: string | null }> = {};
      authorProfiles?.forEach((p: any) => {
        authorProfileMap[p.id] = { name: p.full_name, avatar: p.avatar_url, plan: p.plan, role: p.role };
      });

      // Check courses to see who is an instructor
      const { data: instructorCourses } = await supabase
        .from("courses")
        .select("instructor_id")
        .in("instructor_id", allUserIds);

      const instructorSet = new Set((instructorCourses || []).map((c: any) => c.instructor_id));

      // Check user_roles table
      const { data: userRolesData } = await supabase
        .from("user_roles")
        .select("user_id, roles(name)")
        .in("user_id", allUserIds);

      const dbRoleMap: Record<string, string> = {};
      (userRolesData || []).forEach((ur: any) => {
        if (ur.user_id && !dbRoleMap[ur.user_id]) {
          dbRoleMap[ur.user_id] = ur.roles?.name || "STUDENT";
        }
      });

      // Helper to accurately resolve role
      const resolveRole = (userId: string, defaultRole?: string): string => {
        if (lbRoleMap[userId]) return lbRoleMap[userId];
        if (instructorSet.has(userId)) return "INSTRUCTOR";
        if (authorProfileMap[userId]?.role) return authorProfileMap[userId].role!;
        if (authorProfileMap[userId]?.plan && authorProfileMap[userId].plan !== "FREE") return "INSTRUCTOR";
        if (dbRoleMap[userId]) return dbRoleMap[userId];
        if (defaultRole && defaultRole !== "MEMBER") return defaultRole;
        return "STUDENT";
      };

      const enrichedPosts: Post[] = rawPosts.map((p) => {
        const resolvedAuthorRole = resolveRole(p.user_id, p.author_role);
        return {
          ...p,
          category: (p.category as PostCategory) || "REFLECTIONS",
          likes_count: p.likes_count || 0,
          author_name: p.author_name || authorProfileMap[p.user_id]?.name || "Membre Ansella",
          author_avatar: p.author_avatar || authorProfileMap[p.user_id]?.avatar || null,
          author_role: resolvedAuthorRole,
          showComments: false,
          comments: rawComments
            .filter((c) => c.post_id === p.id)
            .map((c) => ({
              ...c,
              author_name: authorProfileMap[c.user_id]?.name || "Membre",
              author_avatar: authorProfileMap[c.user_id]?.avatar || null,
              author_role: resolveRole(c.user_id, c.author_role)
            })),
        };
      });

      setPosts(enrichedPosts);

    } catch (err) {
      console.error("[Community] General load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Chargement du Leaderboard depuis la base de données ─────
  const loadLeaderboardData = async (): Promise<LeaderboardUser[]> => {
    try {
      const res = await fetch("/api/community/leaderboard");
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
          return data.leaderboard;
        }
      }

      // Fallback si l'API rencontre un souci d'accès direct
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, plan, created_at")
        .limit(20);

      const { data: courses } = await supabase
        .from("courses")
        .select("instructor_id");

      const coursesCountMap: Record<string, number> = {};
      courses?.forEach((c) => {
        coursesCountMap[c.instructor_id] = (coursesCountMap[c.instructor_id] || 0) + 1;
      });

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, roles(name)");

      const roleMap: Record<string, string> = {};
      userRoles?.forEach((ur: any) => {
        if (!roleMap[ur.user_id]) roleMap[ur.user_id] = ur.roles?.name || "STUDENT";
      });

      const dbList: LeaderboardUser[] = (profiles || []).map((p, idx) => {
        const cCount = coursesCountMap[p.id] || 0;
        return {
          id: p.id,
          name: p.full_name || `Membre #${idx + 1}`,
          avatar: p.avatar_url || null,
          role: roleMap[p.id] || "STUDENT",
          plan: p.plan || "FREE",
          points: cCount * 200,
          coursesCount: cCount,
          affiliatesCount: 0,
          rank: 0,
        };
      });

      setLeaderboard(dbList);
      return dbList;
    } catch (err) {
      console.error("[Leaderboard] Error loading leaderboard:", err);
      return [];
    }
  };

  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  // ─── Interactivité des Publications ─────────────────────
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !currentUser || submitting) return;
    setSubmitting(true);

    try {
      const payload = {
        user_id: currentUser.id,
        category: postCategory,
        title: postTitle.trim() || null,
        content: postContent.trim(),
        resource_url: postResourceUrl.trim() || null,
        likes_count: 0
      };

      const { data, error } = await db
        .from("community_posts")
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        console.warn("[CreatePost] DB insert warning, applying local optimistic state:", error);
      }

      const currentUserRole = currentUserProfile?.role || (currentUserProfile?.plan && currentUserProfile.plan !== "FREE" ? "INSTRUCTOR" : "STUDENT");

      const newPostObj: Post = {
        id: data?.id || `local-${Date.now()}`,
        user_id: currentUser.id,
        category: postCategory,
        title: postTitle.trim() || null,
        content: postContent.trim(),
        resource_url: postResourceUrl.trim() || null,
        likes_count: 0,
        created_at: new Date().toISOString(),
        author_name: currentUserProfile?.full_name || "Moi",
        author_avatar: currentUserProfile?.avatar_url || null,
        author_role: currentUserRole,
        comments: [],
        showComments: false
      };

      setPosts((prev) => [newPostObj, ...prev]);
      setPostTitle("");
      setPostContent("");
      setPostResourceUrl("");
      setPostCategory("REFLECTIONS");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentlyLiked = p.liked_by_user;
          const nextCount = currentlyLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1;
          
          // Try updating in DB
          db.from("community_posts")
            .update({ likes_count: nextCount })
            .eq("id", postId)
            .then(() => {})
            .catch(() => {});

          return {
            ...p,
            liked_by_user: !currentlyLiked,
            likes_count: nextCount
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = async (postId: string) => {
    const text = newComments[postId]?.trim();
    if (!text || !currentUser) return;

    const newCommentObj: Comment = {
      id: `comm-${Date.now()}`,
      post_id: postId,
      user_id: currentUser.id,
      content: text,
      created_at: new Date().toISOString(),
      author_name: currentUserProfile?.full_name || "Moi",
      author_avatar: currentUserProfile?.avatar_url || null
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            showComments: true,
            comments: [...(p.comments || []), newCommentObj]
          };
        }
        return p;
      })
    );

    setNewComments((prev) => ({ ...prev, [postId]: "" }));

    try {
      await db.from("community_comments").insert({
        post_id: postId,
        user_id: currentUser.id,
        content: text
      });
    } catch (e) {
      console.warn("[Comment] DB fallback handled:", e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Voulez-vous supprimer cette publication ?")) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await db.from("community_posts").delete().eq("id", postId);
    } catch (e) {
      console.warn("[DeletePost] DB fallback:", e);
    }
  };

  // Filtered posts based on category and search query
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchCat = selectedCategory === "ALL" || p.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.author_name && p.author_name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  // Sorted leaderboard
  const sortedLeaderboard = useMemo(() => {
    let list = [...leaderboard];
    if (leaderboardTab === "INSTRUCTORS") {
      list = list.filter(
        (item) => item.role === "INSTRUCTOR" || item.role === "TEACHING_ASSISTANT" || item.coursesCount > 0
      );
      list.sort((a, b) => b.coursesCount * 200 + b.points - (a.coursesCount * 200 + a.points));
    } else {
      list.sort((a, b) => b.affiliatesCount * 150 + b.points - (a.affiliatesCount * 150 + a.points));
    }
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [leaderboard, leaderboardTab]);

  const roleBadge = (role: string) => {
    const r = (role || "").toUpperCase();
    if (r === "INSTRUCTOR" || r === "TEACHING_ASSISTANT")
      return <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">Formateur</span>;
    if (r.includes("ADMIN") || r === "SUPPORT_AGENT")
      return <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Admin</span>;
    return <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">Apprenant</span>;
  };

  const initials = (name?: string) =>
    (name || "ME").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in">
      
      {/* Kajabi Community Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-teal-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 fill-current" /> Espace Communautaire Kajabi
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Échangez, Débattez & Accélérez votre Maîtrise
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Rejoignez le réseau des apprenants, chercheurs et formateurs Ansella. Partagez vos analyses de marché, vos ressources de code et vos retours d'expérience.
          </p>
        </div>
        <div className="absolute right-6 -bottom-8 opacity-10 pointer-events-none hidden md:block">
          <Users className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Main Grid: Feed + Kajabi Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ─── LEFT/CENTER: Feed & Filters ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Search & Topic Categories Filter */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une analyse, un sujet, une ressource ou un membre..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:border-teal-500 transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(Object.keys(CATEGORY_CONFIG) as PostCategory[]).map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const Icon = conf.icon;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kajabi Rich Post Composer */}
          <form onSubmit={handleCreatePost} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-500" />
                Créer une publication
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Sujet :</span>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value as PostCategory)}
                  className="bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 outline-none"
                >
                  <option value="REFLECTIONS">💡 Réflexions & Débats</option>
                  <option value="ANALYSIS">📊 Analyses Crypto & IA</option>
                  <option value="RESOURCES">📚 Ressources & Guides</option>
                  <option value="ANNOUNCEMENTS">📢 Annonces Officieuses</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Titre de votre publication (ex: Analyse de marché, Tutoriel Hardhat...)"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 outline-none text-xs font-bold"
              />

              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Développez votre idée, posez une question ou partagez une analyse détaillée avec la communauté..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 outline-none text-xs resize-none leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="relative w-full sm:w-2/3">
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={postResourceUrl}
                    onChange={(e) => setPostResourceUrl(e.target.value)}
                    placeholder="Lien ressource optionnel (GitHub, TradingView, Notion...)"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[11px] text-zinc-800 dark:text-zinc-200 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!postContent.trim() || submitting}
                  className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Publier sur le Feed
                </button>
              </div>
            </div>
          </form>

          {/* Posts Feed List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-xs text-zinc-400">Chargement du flux communautaire...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-3">
              <MessageCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Aucune publication trouvée</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Soyez le premier à publier dans la catégorie sélectionnée ou réinitialisez votre recherche.
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const catConf = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.REFLECTIONS;
              const CatIcon = catConf.icon;

              return (
                <div key={post.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                  
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      {post.author_avatar ? (
                        <img src={post.author_avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300 flex items-center justify-center font-black text-xs shrink-0 border border-teal-500/20">
                          {initials(post.author_name)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">{post.author_name}</span>
                          {roleBadge(post.author_role || "STUDENT")}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${catConf.bg} ${catConf.color}`}>
                            <CatIcon className="w-3 h-3" />
                            {catConf.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{formatDate(post.created_at)}</p>
                      </div>
                    </div>

                    {currentUser?.id === post.user_id && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    {post.title && (
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">{post.title}</h3>
                    )}
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{post.content}</p>

                    {/* External Link Card Attachment */}
                    {post.resource_url && (
                      <a
                        href={post.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/70 rounded-xl flex items-center justify-between text-xs hover:border-teal-500 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ExternalLink className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-teal-600 transition-colors">
                            {post.resource_url}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase shrink-0 ml-2">Ouvrir →</span>
                      </a>
                    )}
                  </div>

                  {/* Interaction Bar */}
                  <div className="flex items-center gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        post.liked_by_user
                          ? "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900/40"
                          : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${post.liked_by_user ? "fill-current" : ""}`} />
                      <span>{post.likes_count}</span>
                    </button>

                    <button
                      onClick={() => setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, showComments: !p.showComments } : p))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{post.comments?.length || 0} commentaire{(post.comments?.length || 0) > 1 ? "s" : ""}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {post.showComments && (
                    <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 animate-in fade-in duration-200">
                      {(post.comments || []).map((c) => (
                        <div key={c.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{c.author_name}</span>
                            <span className="text-zinc-400">{formatDate(c.created_at)}</span>
                          </div>
                          <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed">{c.content}</p>
                        </div>
                      ))}

                      {/* Add comment form */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newComments[post.id] || ""}
                          onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                          placeholder="Écrire un commentaire… (Entrée pour publier)"
                          className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none text-zinc-900 dark:text-white focus:border-teal-500"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ─── RIGHT SIDEBAR: Kajabi Leaderboard & Community Stats ─── */}
        <div className="space-y-6">

          {/* LEADERBOARD CARD (Formateurs & Affiliés Top Rank) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Trophy className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">Leaderboard</h3>
                  <p className="text-[10px] text-zinc-400">Classement des membres d'élite</p>
                </div>
              </div>
            </div>

            {/* Toggle: Top Formateurs / Top Affiliés */}
            <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl grid grid-cols-2 text-center text-xs font-bold">
              <button
                onClick={() => setLeaderboardTab("INSTRUCTORS")}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  leaderboardTab === "INSTRUCTORS"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                🏅 Top Formateurs
              </button>
              <button
                onClick={() => setLeaderboardTab("AFFILIATES")}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  leaderboardTab === "AFFILIATES"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                🚀 Top Affiliés
              </button>
            </div>

            {/* Leaderboard Ranks List (Top 10) */}
            <div className="space-y-3">
              {sortedLeaderboard.slice(0, 10).map((item) => {
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;

                let rankBadgeCls = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
                if (isTop1) rankBadgeCls = "bg-amber-400 text-zinc-950 font-black shadow-md shadow-amber-400/20";
                else if (isTop2) rankBadgeCls = "bg-slate-300 text-slate-900 font-bold";
                else if (isTop3) rankBadgeCls = "bg-amber-700 text-white font-bold";

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isTop1
                        ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30"
                        : "bg-zinc-50/50 dark:bg-zinc-800/20 border-zinc-100 dark:border-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${rankBadgeCls}`}>
                        #{item.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {leaderboardTab === "INSTRUCTORS"
                            ? `${item.coursesCount} cours rédigé${item.coursesCount > 1 ? "s" : ""}`
                            : `${item.affiliatesCount} filleul${item.affiliatesCount > 1 ? "s" : ""} parrainé${item.affiliatesCount > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {item.points.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Link to view full leaderboard */}
            {sortedLeaderboard.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFullLeaderboardModal(true)}
                className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-200/80 dark:border-zinc-700/50 mt-3"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Voir tout le classement ({sortedLeaderboard.length} membres)</span>
              </button>
            )}
          </div>

          {/* COMMUNITY METRICS */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Métriques de la Communauté</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-center">
                <p className="text-lg font-black text-teal-600 dark:text-teal-400">{posts.length}</p>
                <p className="text-[10px] text-zinc-500">Publications</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-center">
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {posts.reduce((s, p) => s + (p.comments?.length || 0), 0)}
                </p>
                <p className="text-[10px] text-zinc-500">Commentaires</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ─── MODAL VOIR TOUT LE CLASSEMENT ─── */}
      {showFullLeaderboardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-500">
                  <Trophy className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-zinc-900 dark:text-white">Classement Général de la Communauté</h2>
                  <p className="text-xs text-zinc-500">Basé sur les données réelles de parrainages et contributions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullLeaderboardModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tab Controls */}
            <div className="px-6 pt-4">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl grid grid-cols-2 text-center text-xs font-bold">
                <button
                  onClick={() => setLeaderboardTab("AFFILIATES")}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    leaderboardTab === "AFFILIATES"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  🚀 Top Affiliés (Filleuls)
                </button>
                <button
                  onClick={() => setLeaderboardTab("INSTRUCTORS")}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    leaderboardTab === "INSTRUCTORS"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  🏅 Top Formateurs (Cours)
                </button>
              </div>
            </div>

            {/* Modal Content / List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {sortedLeaderboard.map((item) => {
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;

                let rankBadgeCls = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
                if (isTop1) rankBadgeCls = "bg-amber-400 text-zinc-950 font-black shadow-md shadow-amber-400/20";
                else if (isTop2) rankBadgeCls = "bg-slate-300 text-slate-900 font-bold";
                else if (isTop3) rankBadgeCls = "bg-amber-700 text-white font-bold";

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      isTop1
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                        : "bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800/70"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${rankBadgeCls}`}>
                        #{item.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.name}</p>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 uppercase">
                            {item.role === "INSTRUCTOR" ? "Formateur" : item.role === "ADMIN" ? "Admin" : "Apprenant"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {item.affiliatesCount} filleul{item.affiliatesCount > 1 ? "s" : ""} • {item.coursesCount} cours
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {item.points.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 text-right">
              <button
                type="button"
                onClick={() => setShowFullLeaderboardModal(false)}
                className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
