"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Users,
  Sparkles,
  Search,
  Trophy,
  Flame,
  TrendingUp,
  BookOpen,
  UserCheck,
  Megaphone,
  Lightbulb,
  BarChart2,
  RefreshCw,
  Award,
  Crown,
  X,
} from "lucide-react";
import { PostComposer, PostCategory as ComposerCategory } from "@/components/community/PostComposer";
import { PostCard, PostItem, CommentItem } from "@/components/community/PostCard";
import { CommunitySkeleton } from "@/components/community/CommunitySkeleton";
import { ReactionType } from "@/components/community/ReactionPicker";

export type PostCategoryFilter = "ALL" | "REFLECTIONS" | "ANALYSIS" | "RESOURCES" | "ANNOUNCEMENTS";

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

const CATEGORY_CONFIG: Record<PostCategoryFilter, { label: string; icon: any; color: string }> = {
  ALL: { label: "Toutes les publications", icon: Sparkles, color: "text-zinc-600 dark:text-zinc-300" },
  REFLECTIONS: { label: "💡 Réflexions & Débats", icon: Lightbulb, color: "text-amber-500" },
  ANALYSIS: { label: "📈 Analyses & Stratégies", icon: BarChart2, color: "text-indigo-500" },
  RESOURCES: { label: "📚 Ressources & Guides", icon: BookOpen, color: "text-emerald-500" },
  ANNOUNCEMENTS: { label: "📢 Annonces Officieuses", icon: Megaphone, color: "text-purple-500" },
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PostCategoryFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardTab, setLeaderboardTab] = useState<"INSTRUCTORS" | "AFFILIATES">("AFFILIATES");
  const [showFullLeaderboardModal, setShowFullLeaderboardModal] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  // ─── Fetch Community Feed ──────────────────────────────────
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

      // Fetch leaderboard
      loadLeaderboardData();

      // Fetch posts from API or database
      let fetchedPosts: PostItem[] = [];
      try {
        const res = await fetch("/api/community/posts");
        if (res.ok) {
          const data = await res.json();
          if (data.posts && data.posts.length > 0) {
            fetchedPosts = data.posts;
          }
        }
      } catch (err) {
        console.warn("[Community] API fetch fallback to Supabase query:", err);
      }

      if (fetchedPosts.length === 0) {
        const { data: dbPosts } = await (supabase as any)
          .from("community_posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (dbPosts && dbPosts.length > 0) {
          fetchedPosts = dbPosts;
        }
      }

      // Fallback sample posts if database empty
      if (fetchedPosts.length === 0) {
        fetchedPosts = [
          {
            id: "sample-1",
            user_id: "sample-inst-1",
            category: "ANALYSIS",
            title: "📈 Analyse Bitcoin Q3 2026 & Impact de l'IA sur le Trading Algorithmique",
            content: "Bonjour à tous les membres ! Voici mon analyse complète sur la structure actuelle du marché Crypto. Avec l'intégration des modèles LLM dans les bots d'arbitrage, nous observons une compression importante de la volatilité sur l'Ether et le Bitcoin. Quels sont vos niveaux clés pour ce mois-ci ?",
            resource_url: "https://kuettu.com/analysis/btc-2026",
            media_urls: [
              "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1000&q=80",
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
            ],
            likes_count: 24,
            reactions_count: { LIKE: 14, BRAVO: 5, INTERESTING: 3, GENIUS: 2, LOVE: 0 },
            user_reaction: "LIKE",
            created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            author_name: "Prof. Alexandre Vane",
            author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            author_role: "INSTRUCTOR",
            comments: [
              {
                id: "c1",
                post_id: "sample-1",
                user_id: "sample-user-2",
                content: "Excellente analyse ! Merci pour ces précisions sur la compression de volatilité.",
                created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
                author_name: "Jean-Marc M.",
                author_role: "STUDENT",
              },
            ],
          },
          {
            id: "sample-2",
            user_id: "sample-inst-2",
            category: "RESOURCES",
            title: "🛠️ Guide Ultime : Déployer un Smart Contract Solidity sécurisé avec Hardhat",
            content: "J'ai préparé une checklist complète sur la sécurité des Smart Contracts (Reentrancy, Overflow, Oracles attacks). N'hésitez pas à la télécharger et à poser vos questions dans les commentaires !",
            resource_url: "https://github.com/kuettu/smart-contract-security-guide",
            media_urls: [
              "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80",
            ],
            likes_count: 18,
            reactions_count: { LIKE: 10, BRAVO: 6, INTERESTING: 2, GENIUS: 0, LOVE: 0 },
            user_reaction: null,
            created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
            author_name: "Sarah Lin",
            author_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
            author_role: "INSTRUCTOR",
            comments: [],
          },
        ];
      }

      setPosts(fetchedPosts);
    } catch (err) {
      console.error("Error loading community data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeaderboardData = async () => {
    try {
      const res = await fetch("/api/community/leaderboard");
      if (res.ok) {
        const data = await res.json();
        if (data.users) setLeaderboard(data.users);
      }
    } catch (err) {
      console.error("Leaderboard error:", err);
    }
  };

  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  // ─── Post Creation ─────────────────────────────────────────
  const handleCreatePost = async (postData: {
    title: string;
    content: string;
    category: ComposerCategory;
    resourceUrl?: string;
    mediaUrls?: string[];
  }) => {
    const newPostItem: PostItem = {
      id: crypto.randomUUID(),
      user_id: currentUser?.id || "anon",
      category: postData.category,
      title: postData.title || null,
      content: postData.content,
      resource_url: postData.resourceUrl || null,
      media_urls: postData.mediaUrls || null,
      likes_count: 0,
      reactions_count: { LIKE: 0, BRAVO: 0, INTERESTING: 0, GENIUS: 0, LOVE: 0 },
      user_reaction: null,
      created_at: new Date().toISOString(),
      author_name: currentUserProfile?.full_name || currentUser?.email?.split("@")[0] || "Membre Ansella",
      author_avatar: currentUserProfile?.avatar_url || null,
      author_role: currentUserProfile?.role || "STUDENT",
      comments: [],
    };

    // Optimistic UI update
    setPosts((prev) => [newPostItem, ...prev]);

    // Persist via API
    try {
      await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
    } catch (err) {
      console.warn("Post created in memory state:", err);
    }
  };

  // ─── Reactions (Optimistic Update) ─────────────────────────
  const handleReact = (postId: string, reactionType: ReactionType) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const currentReaction = p.user_reaction;
        const currentCounts = { ...(p.reactions_count || { LIKE: p.likes_count, BRAVO: 0, INTERESTING: 0, GENIUS: 0, LOVE: 0 }) };

        let nextUserReaction: ReactionType | null = reactionType;

        if (currentReaction === reactionType) {
          // Toggle off
          nextUserReaction = null;
          currentCounts[reactionType] = Math.max((currentCounts[reactionType] || 1) - 1, 0);
        } else {
          // Change reaction
          if (currentReaction) {
            currentCounts[currentReaction] = Math.max((currentCounts[currentReaction] || 1) - 1, 0);
          }
          currentCounts[reactionType] = (currentCounts[reactionType] || 0) + 1;
        }

        const totalLikes = Object.values(currentCounts).reduce((a, b) => a + b, 0);

        return {
          ...p,
          user_reaction: nextUserReaction,
          reactions_count: currentCounts,
          likes_count: totalLikes,
        };
      })
    );
  };

  // ─── Add Comment / Reply ───────────────────────────────────
  const handleAddComment = async (postId: string, content: string, parentId?: string) => {
    const newComment: CommentItem = {
      id: crypto.randomUUID(),
      post_id: postId,
      user_id: currentUser?.id || "anon",
      content,
      parent_id: parentId || null,
      created_at: new Date().toISOString(),
      author_name: currentUserProfile?.full_name || currentUser?.email?.split("@")[0] || "Membre",
      author_avatar: currentUserProfile?.avatar_url || null,
      author_role: currentUserProfile?.role || "STUDENT",
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const existingComments = p.comments || [];
        if (parentId) {
          // Attach to parent comment
          const updatedComments = existingComments.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newComment],
              };
            }
            return c;
          });
          return { ...p, comments: updatedComments };
        } else {
          return { ...p, comments: [...existingComments, newComment] };
        }
      })
    );

    // Persist to API
    try {
      await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, parentId }),
      });
    } catch (err) {
      console.warn("Comment saved in memory:", err);
    }
  };

  // ─── Delete Post ───────────────────────────────────────────
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette publication ?")) return;

    setPosts((prev) => prev.filter((p) => p.id !== postId));

    try {
      await fetch(`/api/community/posts?id=${postId}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Post deleted in memory:", err);
    }
  };

  // ─── Delete Comment ────────────────────────────────────────
  const handleDeleteComment = async (commentId: string) => {
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        comments: (p.comments || []).filter((c) => c.id !== commentId),
      }))
    );

    try {
      await fetch(`/api/community/comments?id=${commentId}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Comment deleted in memory:", err);
    }
  };

  // ─── Filtered Posts ────────────────────────────────────────
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
      const normalizedQuery = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        p.content.toLowerCase().includes(normalizedQuery) ||
        (p.title && p.title.toLowerCase().includes(normalizedQuery)) ||
        (p.author_name && p.author_name.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const filteredLeaderboard = useMemo(() => {
    if (leaderboardTab === "INSTRUCTORS") {
      return leaderboard.filter((u) => u.role === "INSTRUCTOR");
    }
    return leaderboard;
  }, [leaderboard, leaderboardTab]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-teal-950 to-zinc-900 p-6 sm:p-8 rounded-3xl text-white border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
            <Users className="w-3.5 h-3.5" />
            <span>Réseau Social & Échanges Professionnels</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Communauté Ansella
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Partagez vos analyses, échangez sur les stratégies Crypto & IA, et collaborez directement avec les formateurs et les membres certifiés.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            onClick={loadCommunityData}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer border border-white/10"
            title="Rafraîchir le fil"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Feed (Left 8 cols) & Sidebar (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Feed Section (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Post Composer */}
          <PostComposer onSubmit={handleCreatePost} currentUserProfile={currentUserProfile} />

          {/* Search & Category Filter Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par mot-clé, hashtag (#crypto) ou membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(Object.keys(CATEGORY_CONFIG) as PostCategoryFilter[]).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-teal-500 text-white shadow-sm scale-105"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Posts Feed or Skeleton */}
          {loading && posts.length === 0 ? (
            <CommunitySkeleton />
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
              <h3 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-300">
                Aucune publication trouvée
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Soyez le premier à lancer la discussion dans cette catégorie !
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                  onReact={handleReact}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onDeletePost={handleDeletePost}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Leaderboard (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5 sticky top-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                  Classement Membres & Formateurs
                </h3>
              </div>
            </div>

            {/* Leaderboard Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setLeaderboardTab("AFFILIATES")}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  leaderboardTab === "AFFILIATES"
                    ? "bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm"
                    : "text-zinc-500"
                }`}
              >
                🏆 Top Contributeurs
              </button>
              <button
                onClick={() => setLeaderboardTab("INSTRUCTORS")}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  leaderboardTab === "INSTRUCTORS"
                    ? "bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm"
                    : "text-zinc-500"
                }`}
              >
                🎓 Formateurs
              </button>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredLeaderboard.slice(0, 5).map((user, idx) => (
                <div
                  key={user.id || idx}
                  className="p-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3 hover:border-teal-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                        : idx === 1
                        ? "bg-zinc-300 text-zinc-900 font-bold"
                        : idx === 2
                        ? "bg-amber-700 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                    }`}>
                      {idx + 1}
                    </span>

                    <div className="relative">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white leading-tight">
                        {user.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-semibold">{user.plan || "Standard"}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-xs text-teal-600 dark:text-teal-400">
                      {user.points || (100 - idx * 15)} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
