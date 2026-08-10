"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import {
  Globe, Share2, Link as LinkIcon, Video as VideoIcon, ExternalLink, BookOpen,
  Users, Award, MapPin, Send, Loader2, MessageCircle,
  Trash2, ChevronDown, ChevronUp, User, GraduationCap
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  bio: string | null;
  nationality: string | null;
  avatar_url: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  youtube: string | null;
  instagram: string | null;
  specialty: string | null;
  academy_name: string | null;
  academy_tagline: string | null;
  academic_background: string | null;
  certifications: string | null;
  role?: string;
}

interface Course {
  id: string;
  title: string;
  price: number;
  status: string;
  enrollmentCount: number;
  thumbnail_url?: string | null;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
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

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [paidCourses, setPaidCourses] = useState<Course[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwn, setIsOwn] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [newComments, setNewComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userId) loadAll();
  }, [userId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setIsOwn(user?.id === userId);

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!profileData) { setLoading(false); return; }
      setProfile(profileData as any);

      // Detect role via user_roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", userId);

      const roleNames = (roles || []).map((r: any) => r.roles?.name).filter(Boolean);
      const instructor = roleNames.includes("INSTRUCTOR") || roleNames.includes("SUPER_ADMIN") || roleNames.includes("ADMIN");
      setIsInstructor(instructor);

      if (instructor) {
        // Load instructor courses with enrollment count
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title, price, status, thumbnail_url")
          .eq("instructor_id", userId)
          .eq("status", "PUBLISHED");

        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map(c => c.id);
          const { data: enrollData } = await supabase
            .from("enrollments")
            .select("course_id")
            .in("course_id", courseIds);

          const countMap: Record<string, number> = {};
          enrollData?.forEach(e => {
            countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
          });

          setCourses(coursesData.map(c => ({
            ...c,
            enrollmentCount: countMap[c.id] || 0,
          })));
        }
      } else {
        // Load student paid courses
        const { data: enrollData } = await supabase
          .from("enrollments")
          .select("course_id, courses(id, title, price, thumbnail_url)")
          .eq("student_id", userId);

        const paid: Course[] = (enrollData || []).map((e: any) => ({
          id: e.courses?.id || e.course_id,
          title: e.courses?.title || "Formation",
          price: e.courses?.price || 0,
          status: "PUBLISHED",
          thumbnail_url: e.courses?.thumbnail_url,
          enrollmentCount: 0,
        }));
        setPaidCourses(paid);
      }

      // Load community posts by this user
      await loadPosts(user?.id);
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (viewerId?: string) => {
    const { data: postsData, error: postsError } = await db
      .from("community_posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Error loading profile posts:", postsError);
      setPosts([]);
      return;
    }

    if (!postsData || postsData.length === 0) { setPosts([]); return; }

    // Get author profile
    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", userId)
      .single();

    // Load comments for each post
    const postIds = postsData.map((p: any) => p.id);
    const { data: commentsData } = await db
      .from("community_comments")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    // Get commenter profiles
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
      author_name: authorProfile?.full_name || "Utilisateur",
      author_avatar: authorProfile?.avatar_url || null,
      showComments: false,
      comments: (commentsData || [])
        .filter((c: any) => c.post_id === p.id)
        .map((c: any) => ({ ...c, author_name: commenterMap[c.user_id] || "Utilisateur" })),
    }));

    setPosts(enriched);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !currentUser) return;
    setSubmittingPost(true);
    try {
      const { error } = await db
        .from("community_posts")
        .insert({ user_id: currentUser.id, content: newPost.trim() });
      if (error) {
        alert("Erreur lors de la publication : " + error.message + "\nAssurez-vous d'avoir exécuté la migration SQL prisma/add-profile-columns.sql.");
      } else {
        setNewPost("");
        await loadPosts(currentUser.id);
      }
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Supprimer cette publication ?")) return;
    await db.from("community_posts").delete().eq("id", postId);
    await loadPosts(currentUser?.id);
  };

  const handleSubmitComment = async (postId: string) => {
    const content = newComments[postId]?.trim();
    if (!content || !currentUser) return;
    const { error } = await db
      .from("community_comments")
      .insert({ post_id: postId, user_id: currentUser.id, content });
    if (error) {
      alert("Erreur lors du commentaire : " + error.message);
    } else {
      setNewComments(prev => ({ ...prev, [postId]: "" }));
      await loadPosts(currentUser?.id);
    }
  };

  const toggleComments = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const initials = (name?: string | null) =>
    (name || "AN").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  const totalEnrolled = courses.reduce((s, c) => s + c.enrollmentCount, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-zinc-500">Chargement du profil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <User className="w-12 h-12 text-zinc-300" />
        <p className="text-zinc-500">Profil introuvable.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">

      {/* ─── Hero Banner ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar */}
          <div className="shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-white/10 backdrop-blur border-4 border-white/20 flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                {initials(profile.full_name)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold">{profile.full_name}</h1>
              {isInstructor && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-white/20 backdrop-blur">
                  Formateur
                </span>
              )}
            </div>

            {profile.specialty && (
              <p className="text-teal-100 font-medium text-sm mb-1">{profile.specialty}</p>
            )}
            {profile.academy_name && (
              <p className="text-white/70 text-sm flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                {profile.academy_name}
                {profile.academy_tagline && ` — ${profile.academy_tagline}`}
              </p>
            )}
            {profile.nationality && (
              <p className="text-white/60 text-xs flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {profile.nationality}
              </p>
            )}

            {/* Social links */}
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all" title="Site web">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {profile.twitter && (
                <a href={`https://twitter.com/${profile.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all" title="Twitter / X">
                  <Share2 className="w-4 h-4" />
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all" title="LinkedIn">
                  <LinkIcon className="w-4 h-4" />
                </a>
              )}
              {profile.youtube && (
                <a href={profile.youtube} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all" title="YouTube">
                  <VideoIcon className="w-4 h-4" />
                </a>
              )}
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all" title="Instagram">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Stats (Instructor only) */}
          {isInstructor && (
            <div className="flex gap-6 shrink-0">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{courses.length}</p>
                <p className="text-xs text-white/60 mt-1">Cours</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{totalEnrolled}</p>
                <p className="text-xs text-white/60 mt-1">Inscrits</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left column ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bio */}
          {profile.bio && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <h2 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" /> À propos
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{profile.bio}</p>
            </div>
          )}

          {/* Academic Background (Instructor) */}
          {isInstructor && profile.academic_background && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <h2 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-600" /> Formation académique
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{profile.academic_background}</p>
            </div>
          )}

          {/* Certifications (Instructor) */}
          {isInstructor && profile.certifications && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <h2 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600" /> Certifications
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{profile.certifications}</p>
            </div>
          )}

          {/* Instructor Courses */}
          {isInstructor && courses.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <h2 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" /> Cours proposés
              </h2>
              <div className="space-y-3">
                {courses.map(c => (
                  <Link key={c.id} href={`/courses/${c.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-teal-200 dark:hover:border-teal-800 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-all group">
                    <div>
                      <p className="font-semibold text-sm text-zinc-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">{c.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {c.enrollmentCount} inscrits
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-teal-600">{c.price > 0 ? `${c.price.toLocaleString()}$` : "Gratuit"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Student Paid Courses */}
          {!isInstructor && paidCourses.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <h2 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" /> Formations suivies
              </h2>
              <div className="space-y-3">
                {paidCourses.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <p className="font-semibold text-sm text-zinc-900 dark:text-white">{c.title}</p>
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">Payé</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Blog / Publications ─── */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-teal-600" /> Publications
            </h2>

            {/* New post form - only for own profile */}
            {isOwn && (
              <form onSubmit={handleSubmitPost} className="mb-6">
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Partagez une pensée, une ressource ou une mise à jour..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm resize-none transition-all"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newPost.trim() || submittingPost}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    {submittingPost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Publier
                  </button>
                </div>
              </form>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-10 h-10 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">Aucune publication pour l'instant.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                    {/* Post header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {post.author_avatar ? (
                          <img src={post.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
                            {initials(post.author_name)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{post.author_name}</p>
                          <p className="text-[10px] text-zinc-400">{formatDate(post.created_at)}</p>
                        </div>
                      </div>
                      {isOwn && (
                        <button onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Post content */}
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{post.content}</p>

                    {/* Toggle comments */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-teal-600 font-medium transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {post.comments?.length || 0} commentaire{(post.comments?.length || 0) !== 1 ? "s" : ""}
                      {post.showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {/* Comments section */}
                    {post.showComments && (
                      <div className="pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-3 animate-in fade-in duration-150">
                        {post.comments?.map(c => (
                          <div key={c.id} className="text-xs">
                            <span className="font-bold text-zinc-800 dark:text-white">{c.author_name} </span>
                            <span className="text-zinc-400 mr-1">· {formatDate(c.created_at)}</span>
                            <span className="text-zinc-600 dark:text-zinc-400">{c.content}</span>
                          </div>
                        ))}

                        {currentUser && (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={newComments[post.id] || ""}
                              onChange={e => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={e => e.key === "Enter" && handleSubmitComment(post.id)}
                              placeholder="Ajouter un commentaire…"
                              className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 outline-none text-zinc-900 dark:text-white"
                            />
                            <button
                              onClick={() => handleSubmitComment(post.id)}
                              className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right sidebar ─── */}
        <div className="space-y-5">
          {/* Quick Info Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Informations</h3>
            {profile.nationality && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-600 dark:text-zinc-400">{profile.nationality}</span>
              </div>
            )}
            {profile.specialty && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-600 dark:text-zinc-400">{profile.specialty}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="text-teal-600 hover:underline truncate">{profile.website.replace(/^https?:\/\//, "")}</a>
              </div>
            )}
          </div>

          {/* Edit profile shortcut (own profile) */}
          {isOwn && (
            <Link
              href={isInstructor ? "/instructor/settings" : "/dashboard/settings"}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-md hover:shadow-teal-600/20"
            >
              Modifier mon profil
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
