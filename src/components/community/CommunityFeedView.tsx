"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  Users,
  Sparkles,
  Search,
  Trophy,
  BookOpen,
  Megaphone,
  Lightbulb,
  BarChart2,
  RefreshCw,
} from "lucide-react";
import { PostComposer, PostCategory as ComposerCategory } from "@/components/community/PostComposer";
import { PostCard, PostItem, CommentItem } from "@/components/community/PostCard";
import { CommunitySkeleton } from "@/components/community/CommunitySkeleton";
import { ReactionType } from "@/components/community/ReactionPicker";

export type PostCategoryFilter = "ALL" | "FOLLOWING" | "REFLECTIONS" | "ANALYSIS" | "RESOURCES" | "ANNOUNCEMENTS";

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

interface SuggestedInstructor {
  id: string;
  name: string;
  avatar: string | null;
  specialty: string;
  isFollowing: boolean;
}

const CATEGORY_CONFIG: Record<PostCategoryFilter, { label: string; icon: any; color: string }> = {
  ALL: { label: "🔥 Fil d'actualité", icon: Sparkles, color: "text-zinc-600 dark:text-zinc-300" },
  FOLLOWING: { label: "⭐ Mes Abonnements", icon: Users, color: "text-teal-500" },
  REFLECTIONS: { label: "💡 Questions & Réflexions", icon: Lightbulb, color: "text-amber-500" },
  ANALYSIS: { label: "📈 Analyses & Projets", icon: BarChart2, color: "text-indigo-500" },
  RESOURCES: { label: "📚 Guides & Ressources", icon: BookOpen, color: "text-emerald-500" },
  ANNOUNCEMENTS: { label: "📢 Annonces Officielles", icon: Megaphone, color: "text-purple-500" },
};

export function CommunityFeedView() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PostCategoryFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardTab, setLeaderboardTab] = useState<"INSTRUCTORS" | "AFFILIATES">("AFFILIATES");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [suggestedInstructors, setSuggestedInstructors] = useState<SuggestedInstructor[]>([]);
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

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

      // Fetch follow data
      try {
        const followRes = await fetch("/api/community/follow");
        if (followRes.ok) {
          const followData = await followRes.json();
          setFollowingIds(followData.followingIds || []);
          setSuggestedInstructors(followData.suggestedInstructors || []);
        }
      } catch (fErr) {
        console.warn("[Community] Follow fetch note:", fErr);
      }

      // Fetch posts from API
      const res = await fetch("/api/community/posts");
      if (res.ok) {
        const data = await res.json();
        if (data.posts && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      }
    } catch (err) {
      console.error("Error loading community data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleFollow = async (targetUserId: string) => {
    if (!currentUser) {
      alert("Veuillez vous connecter pour vous abonner aux formateurs.");
      return;
    }

    const isCurrentlyFollowing = followingIds.includes(targetUserId);
    const nextFollowingIds = isCurrentlyFollowing
      ? followingIds.filter((id) => id !== targetUserId)
      : [...followingIds, targetUserId];

    setFollowingIds(nextFollowingIds);
    setSuggestedInstructors((prev) =>
      prev.map((inst) =>
        inst.id === targetUserId ? { ...inst, isFollowing: !isCurrentlyFollowing } : inst
      )
    );

    setFollowLoading((p) => ({ ...p, [targetUserId]: true }));
    try {
      await fetch("/api/community/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setFollowLoading((p) => ({ ...p, [targetUserId]: false }));
    }
  };

  const loadLeaderboardData = async () => {
    try {
      const res = await fetch("/api/community/leaderboard");
      if (res.ok) {
        const data = await res.json();
        const loadedList = data.leaderboard || data.users || [];
        if (loadedList.length > 0) {
          setLeaderboard(loadedList);
          return;
        }
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    }

    // Fallback sample leaderboard if database returns empty
    setLeaderboard([
      {
        id: "lb-1",
        name: "Prof. Alexandre Vane",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        role: "INSTRUCTOR",
        plan: "PRO (5%)",
        points: 1450,
        coursesCount: 5,
        affiliatesCount: 12,
        rank: 1,
      },
      {
        id: "lb-2",
        name: "Sarah Lin",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
        role: "INSTRUCTOR",
        plan: "PRO (5%)",
        points: 980,
        coursesCount: 3,
        affiliatesCount: 8,
        rank: 2,
      },
      {
        id: "lb-3",
        name: "Jean-Marc M.",
        avatar: null,
        role: "STUDENT",
        plan: "BASE",
        points: 750,
        coursesCount: 0,
        affiliatesCount: 6,
        rank: 3,
      },
    ]);
  };

  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  // ─── Post Creation with Full DB Persistence ─────────────────
  const handleCreatePost = async (postData: {
    title: string;
    content: string;
    category: ComposerCategory;
    resourceUrl?: string;
    mediaUrls?: string[];
  }) => {
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de création de publication.");

      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
      } else {
        loadCommunityData();
      }
    } catch (err: any) {
      alert("Erreur lors de la publication : " + err.message);
    }
  };

  // ─── Reactions with DB Persistence ─────────────────────────
  const handleReact = async (postId: string, reactionType: ReactionType) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const currentReaction = p.user_reaction;
        const currentCounts = { ...(p.reactions_count || { LIKE: p.likes_count || 0, BRAVO: 0, INTERESTING: 0, GENIUS: 0, LOVE: 0 }) };

        let nextUserReaction: ReactionType | null = reactionType;

        if (currentReaction === reactionType) {
          nextUserReaction = null;
          currentCounts[reactionType] = Math.max((currentCounts[reactionType] || 1) - 1, 0);
        } else {
          if (currentReaction) {
            currentCounts[currentReaction] = Math.max((currentCounts[currentReaction] || 1) - 1, 0);
          }
          currentCounts[reactionType] = (currentCounts[reactionType] || 0) + 1;
        }

        const totalLikes = Object.values(currentCounts).reduce((a, b) => Number(a) + Number(b), 0);

        return {
          ...p,
          user_reaction: nextUserReaction,
          reactions_count: currentCounts,
          likes_count: totalLikes,
        };
      })
    );

    // Persist reaction to PostgreSQL DB
    try {
      await fetch("/api/community/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reactionType }),
      });
    } catch (err) {
      console.error("Error saving reaction to DB:", err);
    }
  };

  // ─── Add Comment / Reply with DB Persistence ───────────────
  const handleAddComment = async (postId: string, content: string, parentId?: string) => {
    try {
      const res = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, parentId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'ajout de commentaire.");

      const newComment: CommentItem = data.comment || {
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
    } catch (err: any) {
      alert("Erreur lors de l'ajout du commentaire : " + err.message);
    }
  };

  // ─── Delete Post ───────────────────────────────────────────
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette publication ?")) return;

    setPosts((prev) => prev.filter((p) => p.id !== postId));

    try {
      await fetch(`/api/community/posts?id=${postId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Error deleting post from DB:", err);
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
      console.error("Error deleting comment from DB:", err);
    }
  };

  // ─── Filtered Posts ────────────────────────────────────────
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      let matchesCategory = true;
      if (selectedCategory === "FOLLOWING") {
        matchesCategory =
          followingIds.includes(p.user_id) ||
          Boolean(p.author_role && ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(p.author_role));
      } else if (selectedCategory !== "ALL") {
        matchesCategory = p.category === selectedCategory;
      }
      const normalizedQuery = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        p.content.toLowerCase().includes(normalizedQuery) ||
        (p.title && p.title.toLowerCase().includes(normalizedQuery)) ||
        (p.author_name && p.author_name.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery, followingIds]);

  const filteredLeaderboard = useMemo(() => {
    if (leaderboardTab === "INSTRUCTORS") {
      const insts = leaderboard.filter((u) => u.role?.toUpperCase() === "INSTRUCTOR" || (u.coursesCount && u.coursesCount > 0));
      return insts.length > 0 ? insts : leaderboard;
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
            <span>Réseau Social & Échanges Pédagogiques</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Communauté & Réseau Ansella
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Échangez avec les formateurs certifiés, suivez vos créateurs favoris, posez vos questions et partagez vos analyses Crypto & IA.
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
          <PostComposer
            currentUserAvatar={currentUserProfile?.avatar_url}
            currentUserName={currentUserProfile?.full_name || currentUser?.email?.split("@")[0] || "Membre"}
            currentUserRole={currentUserProfile?.role || "STUDENT"}
            onSubmit={handleCreatePost}
          />

          {/* Search & Category Filter Navigation */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par mot-clé, sujet ou auteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(Object.keys(CATEGORY_CONFIG) as PostCategoryFilter[]).map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const Icon = conf.icon;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-600 text-white shadow-xs"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{conf.label}</span>
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
                {selectedCategory === "FOLLOWING"
                  ? "Aucune publication de vos abonnements"
                  : "Aucune publication dans cette catégorie"}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {selectedCategory === "FOLLOWING"
                  ? "Abonnez-vous à des formateurs ci-contre pour voir leurs publications exclusives !"
                  : "Soyez le premier à publier un message ci-dessus !"}
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

        {/* Sidebar Widgets (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Suggested Instructors Widget */}
          {suggestedInstructors.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                    Formateurs à Suivre
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {followingIds.length} suivi{followingIds.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {suggestedInstructors.slice(0, 5).map((inst) => {
                  const isF = followingIds.includes(inst.id);
                  const isBusy = followLoading[inst.id];

                  return (
                    <div
                      key={inst.id}
                      className="p-3 bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3 hover:border-teal-500/30 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {inst.avatar ? (
                          <img src={inst.avatar} alt={inst.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {inst.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white leading-tight truncate">
                            {inst.name}
                          </h4>
                          <p className="text-[10px] text-zinc-400 truncate">{inst.specialty}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleFollow(inst.id)}
                        disabled={isBusy}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isF
                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                            : "bg-teal-600 hover:bg-teal-500 text-white shadow-xs"
                        }`}
                      >
                        {isBusy ? "..." : isF ? "Abonné" : "+ Suivre"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leaderboard Widget */}
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
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredLeaderboard.slice(0, 8).map((user, idx) => {
                const isF = followingIds.includes(user.id);
                const isBusy = followLoading[user.id];

                return (
                  <div
                    key={user.id || idx}
                    className="p-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-2.5 hover:border-teal-500/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
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

                      <Link href={`/profile/${user.id}`} className="relative shrink-0 group">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                            {user.name.charAt(0)}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0">
                        <Link href={`/profile/${user.id}`} className="font-extrabold text-xs text-zinc-900 dark:text-white leading-tight truncate block hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                          {user.name}
                        </Link>
                        <p className="text-[10px] text-zinc-400 font-semibold truncate">
                          {user.role === "INSTRUCTOR" ? "🎓 Formateur" : "⭐ Membre"} • {user.points || (100 - idx * 15)} pts
                        </p>
                      </div>
                    </div>

                    {user.id !== currentUser?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFollow(user.id);
                        }}
                        disabled={isBusy}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                          isF
                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/30"
                            : "bg-teal-600 hover:bg-teal-500 text-white shadow-xs"
                        }`}
                      >
                        {isBusy ? "..." : isF ? "Abonné" : "+ Suivre"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
