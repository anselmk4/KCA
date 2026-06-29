"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import {
  MessageCircle, Send, Loader2, Trash2, ChevronDown, ChevronUp,
  Users, Video, ArrowRight
} from "lucide-react";

interface Post {
  id: string;
  user_id: string;
  content: string;
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
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newComments, setNewComments] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCommunity();
  }, []);

  const loadCommunity = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Load all posts
      const { data: postsData } = await db
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get author profiles
      const authorIds = [...new Set(postsData.map((p: any) => p.user_id))] as string[];
      const { data: authorProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", authorIds);
      const authorMap: Record<string, { name: string; avatar: string | null }> = {};
      authorProfiles?.forEach(p => { authorMap[p.id] = { name: p.full_name, avatar: p.avatar_url }; });

      // Get roles for authors
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, roles(name)")
        .in("user_id", authorIds);
      const roleMap: Record<string, string> = {};
      (userRoles || []).forEach((ur: any) => {
        if (!roleMap[ur.user_id]) roleMap[ur.user_id] = ur.roles?.name || "STUDENT";
      });

      // Load comments
      const postIds = postsData.map((p: any) => p.id);
      const { data: commentsData } = await db
        .from("community_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      const commenterIds = [...new Set((commentsData || []).map((c: any) => c.user_id))] as string[];
      let commenterMap: Record<string, string> = {};
      if (commenterIds.length > 0) {
        const { data: commenters } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", commenterIds);
        commenters?.forEach(p => { commenterMap[p.id] = p.full_name; });
      }

      const enriched: Post[] = postsData.map((p: any) => ({
        ...p,
        author_name: authorMap[p.user_id]?.name || "Membre",
        author_avatar: authorMap[p.user_id]?.avatar || null,
        author_role: roleMap[p.user_id] || "STUDENT",
        showComments: false,
        comments: (commentsData || [])
          .filter((c: any) => c.post_id === p.id)
          .map((c: any) => ({ ...c, author_name: commenterMap[c.user_id] || "Membre" })),
      }));

      setPosts(enriched);
    } catch (err) {
      console.error("Community load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !currentUser) return;
    setSubmitting(true);
    try {
      const { error } = await db
        .from("community_posts")
        .insert({ user_id: currentUser.id, content: newPost.trim() });
      if (!error) {
        setNewPost("");
        await loadCommunity();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Supprimer cette publication ?")) return;
    await db.from("community_posts").delete().eq("id", postId);
    await loadCommunity();
  };

  const handleSubmitComment = async (postId: string) => {
    const content = newComments[postId]?.trim();
    if (!content || !currentUser) return;
    await db
      .from("community_comments")
      .insert({ post_id: postId, user_id: currentUser.id, content });
    setNewComments(prev => ({ ...prev, [postId]: "" }));
    await loadCommunity();
  };

  const toggleComments = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const initials = (name?: string) =>
    (name || "ME").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const roleBadge = (role: string) => {
    if (role === "INSTRUCTOR") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">Formateur</span>;
    if (role === "ADMIN" || role === "SUPER_ADMIN") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Admin</span>;
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">Apprenant</span>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Communauté Ansella</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Partagez, discutez et interagissez avec tous les membres de la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Main Feed ─── */}
        <div className="lg:col-span-2 space-y-4">

          {/* New Post Composer */}
          {currentUser && (
            <form onSubmit={handleSubmitPost} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 font-bold text-sm shrink-0 mt-1">
                  {initials()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    placeholder="Partagez vos réflexions, analyses, ressources avec la communauté…"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm resize-none transition-all"
                  />
                  <div className="flex justify-end mt-2">
                    <button type="submit" disabled={!newPost.trim() || submitting}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all">
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Publier
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Feed */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-12 text-center">
              <MessageCircle className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">Aucune publication encore. Soyez le premier à partager !</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-3">
                {/* Post header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
                        {initials(post.author_name)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <a href={`/dashboard/profile/${post.user_id}`}
                          className="text-sm font-bold text-zinc-900 dark:text-white hover:text-teal-600 transition-colors">
                          {post.author_name}
                        </a>
                        {roleBadge(post.author_role || "STUDENT")}
                      </div>
                      <p className="text-[10px] text-zinc-400">{formatDate(post.created_at)}</p>
                    </div>
                  </div>
                  {currentUser?.id === post.user_id && (
                    <button onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Post content */}
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{post.content}</p>

                {/* Toggle comments */}
                <button onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-teal-600 font-medium transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {post.comments?.length || 0} commentaire{(post.comments?.length || 0) !== 1 ? "s" : ""}
                  {post.showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {/* Comments */}
                {post.showComments && (
                  <div className="pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-2 animate-in fade-in duration-150">
                    {post.comments?.map(c => (
                      <div key={c.id} className="text-xs">
                        <span className="font-bold text-zinc-800 dark:text-white">{c.author_name} </span>
                        <span className="text-zinc-400 mr-1">· {formatDate(c.created_at)}</span>
                        <span className="text-zinc-600 dark:text-zinc-400">{c.content}</span>
                      </div>
                    ))}

                    {currentUser && (
                      <div className="flex items-center gap-2 mt-2">
                        <input type="text"
                          value={newComments[post.id] || ""}
                          onChange={e => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && handleSubmitComment(post.id)}
                          placeholder="Commenter… (Entrée pour envoyer)"
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 outline-none text-zinc-900 dark:text-white"
                        />
                        <button onClick={() => handleSubmitComment(post.id)}
                          className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors">
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ─── Right sidebar ─── */}
        <div className="space-y-4">
          {/* Discord */}
          <div className="bg-[#5865F2] rounded-2xl p-5 text-white shadow-lg shadow-[#5865F2]/20 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-base font-bold mb-1">Serveur Discord</h2>
              <p className="text-white/70 text-xs mb-4">Rejoignez le salon VIP réservé aux membres.</p>
              <button className="px-4 py-2 bg-white text-[#5865F2] font-bold rounded-xl flex items-center gap-1.5 text-xs hover:scale-105 transition-transform">
                Rejoindre <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <Users className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
          </div>

          {/* Telegram */}
          <div className="bg-[#0088cc] rounded-2xl p-5 text-white shadow-lg shadow-[#0088cc]/20">
            <h2 className="text-base font-bold mb-1">Canal Telegram</h2>
            <p className="text-white/70 text-xs mb-4">Analyses de marché et signaux en temps réel.</p>
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 font-bold rounded-xl text-xs transition-colors">
              Accéder
            </button>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-3">Communauté</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Publications</span>
                <span className="font-bold text-zinc-900 dark:text-white">{posts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Commentaires</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {posts.reduce((s, p) => s + (p.comments?.length || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
