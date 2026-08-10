"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import {
  Globe, Share2, Link as LinkIcon, Video as VideoIcon, ExternalLink, BookOpen,
  Users, Award, MapPin, Send, Loader2, MessageCircle,
  Trash2, ChevronDown, ChevronUp, User, GraduationCap,
  Star, TrendingUp, Clock, CheckCircle2, Edit3, LayoutDashboard,
  ArrowRight, Sparkles, Shield
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
  level?: string | null;
  short_description?: string | null;
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ value, label, icon: Icon, color }: {
  value: string | number;
  label: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={`flex flex-col items-center p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/15 text-white text-center min-w-[80px]`}>
      <Icon className={`w-4 h-4 mb-1 ${color}`} />
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-7 h-7 rounded-lg bg-teal-500/10 dark:bg-teal-500/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="font-bold text-sm text-zinc-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [paidCourses, setPaidCourses] = useState<Course[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isOwn, setIsOwn] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userId) loadAll();
  }, [userId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setIsOwn(user?.id === userId);

      const s = getSimulatedSession();
      if (s) setCurrentUserRole(s.role);

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!profileData) { setLoading(false); return; }
      setProfile(profileData as any);

      // Detect role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", userId);

      const roleNames = (roles || []).map((r: any) => r.roles?.name).filter(Boolean);
      const instructor = roleNames.includes("INSTRUCTOR") || roleNames.includes("SUPER_ADMIN") || roleNames.includes("ADMIN");
      setIsInstructor(instructor);

      if (instructor) {
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title, price, status, thumbnail_url, level, short_description")
          .eq("instructor_id", userId)
          .eq("status", "PUBLISHED");

        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map((c) => c.id);
          const { data: enrollData } = await supabase
            .from("enrollments")
            .select("course_id")
            .in("course_id", courseIds);

          const countMap: Record<string, number> = {};
          enrollData?.forEach((e) => {
            countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
          });

          setCourses(coursesData.map((c) => ({ ...c, enrollmentCount: countMap[c.id] || 0 })));
        }
      } else {
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

    if (postsError) { setPosts([]); return; }
    if (!postsData || postsData.length === 0) { setPosts([]); return; }

    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", userId)
      .single();

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
      commenters?.forEach((p) => { commenterMap[p.id] = p.full_name; });
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
      const { error } = await db.from("community_posts").insert({ user_id: currentUser.id, content: newPost.trim() });
      if (!error) {
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
    const { error } = await db.from("community_comments").insert({ post_id: postId, user_id: currentUser.id, content });
    if (!error) {
      setNewComments((prev) => ({ ...prev, [postId]: "" }));
      await loadPosts(currentUser?.id);
    }
  };

  const toggleComments = (postId: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = (name?: string | null) =>
    (name || "AN").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  const totalEnrolled = courses.reduce((s, c) => s + c.enrollmentCount, 0);

  const dashboardHref =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN" || currentUserRole === "FINANCE_ADMIN" ||
    currentUserRole === "ACADEMIC_ADMIN" || currentUserRole === "SUPPORT_AGENT"
      ? "/admin"
      : currentUserRole === "INSTRUCTOR" || currentUserRole === "TEACHING_ASSISTANT"
      ? "/instructor"
      : "/dashboard";

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm text-zinc-400 font-medium">Chargement du profil...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Not found ──────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <User className="w-10 h-10 text-zinc-400" />
          </div>
          <p className="text-zinc-500 font-medium">Profil introuvable.</p>
          <Link href="/" className="text-sm text-teal-600 hover:underline">Retour à l&apos;accueil</Link>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-teal-900 to-slate-900">
          {/* Background texture */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_#0d9488,_transparent_60%)]" />
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjA1IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiLz48L2c+PC9zdmc+')]" />

          <div className="relative max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16">
            {/* Top bar: back link + share */}
            <div className="flex items-center justify-between mb-10">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/90 transition-colors font-medium"
              >
                ← Accueil
              </Link>
              <div className="flex items-center gap-2">
                {currentUser && (
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-all"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {copied ? "Copié !" : "Partager"}
                </button>
              </div>
            </div>

            {/* Profile core info */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="shrink-0">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white/15 shadow-2xl"
                    />
                  ) : (
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 border-4 border-white/15 flex items-center justify-center text-white font-black text-4xl shadow-2xl">
                      {initials(profile.full_name)}
                    </div>
                  )}
                  {isInstructor && (
                    <div className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-teal-500 rounded-full border-2 border-slate-900 shadow">
                      <Shield className="w-2.5 h-2.5 text-white" />
                      <span className="text-[9px] font-black text-white uppercase tracking-wide">Certifié</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info block */}
              <div className="flex-1 text-white">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">{profile.full_name}</h1>
                  {isInstructor && (
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-teal-500/20 border border-teal-400/30 text-teal-300 uppercase tracking-wider">
                      Formateur
                    </span>
                  )}
                </div>

                {profile.specialty && (
                  <p className="text-teal-300 font-semibold text-sm mb-1">{profile.specialty}</p>
                )}
                {profile.academy_name && (
                  <div className="flex items-center gap-1.5 text-white/60 text-sm mb-1">
                    <GraduationCap className="w-4 h-4 text-teal-400/80" />
                    <span>{profile.academy_name}</span>
                    {profile.academy_tagline && (
                      <span className="text-white/35"> — {profile.academy_tagline}</span>
                    )}
                  </div>
                )}
                {profile.nationality && (
                  <div className="flex items-center gap-1.5 text-white/40 text-xs mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{profile.nationality}</span>
                  </div>
                )}

                {/* Social links */}
                <div className="flex flex-wrap gap-2 mt-5">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl text-xs text-white/70 hover:text-white transition-all"
                      title="Site web">
                      <Globe className="w-3.5 h-3.5" /> Site web
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={`https://twitter.com/${profile.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl text-white/70 hover:text-white transition-all" title="Twitter / X">
                      <Share2 className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl text-white/70 hover:text-white transition-all" title="LinkedIn">
                      <LinkIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {profile.youtube && (
                    <a href={profile.youtube} target="_blank" rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl text-white/70 hover:text-white transition-all" title="YouTube">
                      <VideoIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl text-white/70 hover:text-white transition-all" title="Instagram">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Instructor Stats */}
              {isInstructor && (
                <div className="flex md:flex-col gap-3 shrink-0">
                  <StatCard value={courses.length} label="Cours" icon={BookOpen} color="text-teal-400" />
                  <StatCard value={totalEnrolled} label="Inscrits" icon={Users} color="text-blue-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content grid ────────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left / Main column ───────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Bio */}
              {profile.bio && (
                <SectionCard title="À propos" icon={User}>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </p>
                </SectionCard>
              )}

              {/* Academic Background (Instructor) */}
              {isInstructor && profile.academic_background && (
                <SectionCard title="Formation académique" icon={GraduationCap}>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {profile.academic_background}
                  </p>
                </SectionCard>
              )}

              {/* Certifications (Instructor) */}
              {isInstructor && profile.certifications && (
                <SectionCard title="Certifications & Accréditations" icon={Award}>
                  <div className="flex flex-wrap gap-2">
                    {profile.certifications.split(/[,\n]+/).map((cert, i) => cert.trim() && (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {cert.trim()}
                      </span>
                    ))}
                    {/* fallback: show as text if no commas */}
                    {!profile.certifications.includes(",") && !profile.certifications.includes("\n") && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{profile.certifications}</p>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Instructor Courses */}
              {isInstructor && courses.length > 0 && (
                <SectionCard title={`Cours proposés (${courses.length})`} icon={BookOpen}>
                  <div className="space-y-3">
                    {courses.map((c) => (
                      <Link key={c.id} href={`/courses/${c.id}`}
                        className="group flex gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-teal-200 dark:hover:border-teal-800 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-all">
                        {/* Thumbnail or placeholder */}
                        <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                          {c.thumbnail_url ? (
                            <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-zinc-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-zinc-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors truncate">
                            {c.title}
                          </p>
                          {c.short_description && (
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{c.short_description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {c.enrollmentCount} inscrit{c.enrollmentCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end justify-center">
                          <p className="text-sm font-black text-teal-600 dark:text-teal-400">
                            {c.price > 0 ? `${c.price.toLocaleString()} $` : "Gratuit"}
                          </p>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-teal-500 transition-colors mt-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Student Paid Courses */}
              {!isInstructor && paidCourses.length > 0 && (
                <SectionCard title="Formations suivies" icon={BookOpen}>
                  <div className="space-y-3">
                    {paidCourses.map((c) => (
                      <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                          {c.thumbnail_url ? (
                            <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-zinc-400" />
                            </div>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-zinc-900 dark:text-white flex-1 truncate">{c.title}</p>
                        <span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 px-2.5 py-1 rounded-lg shrink-0">
                          Inscrit
                        </span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* ── Publications ──────────────────────────────────────────── */}
              <SectionCard title="Publications" icon={MessageCircle}>
                {/* New post form */}
                {isOwn && (
                  <form onSubmit={handleSubmitPost} className="mb-6">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
                        {initials(profile.full_name)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={newPost}
                          onChange={(e) => setNewPost(e.target.value)}
                          placeholder="Partagez une pensée, une ressource ou une mise à jour…"
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm resize-none transition-all placeholder:text-zinc-400"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={!newPost.trim() || submittingPost}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all"
                          >
                            {submittingPost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Publier
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {posts.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageCircle className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400">Aucune publication pour l&apos;instant.</p>
                    {isOwn && <p className="text-xs text-zinc-500 mt-1">Commencez à partager avec la communauté.</p>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {post.author_avatar ? (
                              <img src={post.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
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
                              className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>

                        <button onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-teal-600 font-medium transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {post.comments?.length || 0} commentaire{(post.comments?.length || 0) !== 1 ? "s" : ""}
                          {post.showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {post.showComments && (
                          <div className="pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-3 animate-in fade-in duration-150">
                            {post.comments?.map((c) => (
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
                                  onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                  onKeyDown={(e) => e.key === "Enter" && handleSubmitComment(post.id)}
                                  placeholder="Ajouter un commentaire…"
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
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* ── Right sidebar ──────────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Quick actions (own profile) */}
              {isOwn && (
                <div className="space-y-2">
                  <Link
                    href={isInstructor ? "/instructor/settings" : "/dashboard/settings"}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition-all shadow-lg shadow-teal-600/20 hover:shadow-teal-500/30"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifier mon profil
                  </Link>
                  <Link
                    href={dashboardHref}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-900 dark:text-white font-semibold text-sm transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Tableau de bord
                  </Link>
                </div>
              )}

              {/* Info Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-5">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-4">Informations</h3>
                <div className="space-y-3">
                  {profile.nationality && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-400 text-sm">{profile.nationality}</span>
                    </div>
                  )}
                  {profile.specialty && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <Award className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-400 text-sm">{profile.specialty}</span>
                    </div>
                  )}
                  {isInstructor && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-teal-600 dark:text-teal-400 text-sm font-semibold">Formateur agréé</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer"
                        className="text-teal-600 dark:text-teal-400 hover:underline truncate text-sm">
                        {profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructor Stats Sidebar */}
              {isInstructor && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-5">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-4">Statistiques</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Cours publiés", value: courses.length, icon: BookOpen, color: "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400" },
                      { label: "Apprenants", value: totalEnrolled, icon: Users, color: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className={`rounded-xl p-3.5 ${color.split(" ").slice(0, 2).join(" ")} border border-zinc-100 dark:border-zinc-800`}>
                        <Icon className={`w-4 h-4 mb-2 ${color.split(" ").slice(2).join(" ")}`} />
                        <p className="text-xl font-black text-zinc-900 dark:text-white">{value}</p>
                        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Academy info box */}
              {isInstructor && profile.academy_name && (
                <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg shadow-teal-600/20">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-teal-200" />
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-200">Académie</span>
                  </div>
                  <p className="font-black text-base">{profile.academy_name}</p>
                  {profile.academy_tagline && (
                    <p className="text-teal-200 text-xs mt-1 leading-relaxed">{profile.academy_tagline}</p>
                  )}
                </div>
              )}

              {/* Share card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-5">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-3">Partager ce profil</h3>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {copied ? "Lien copié !" : "Copier le lien du profil"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
