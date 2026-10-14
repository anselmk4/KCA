"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  PlayCircle,
  BookOpen,
  Lock,
  Compass,
  Bitcoin,
  TrendingUp,
  BrainCircuit,
  Code2,
  CheckCircle2,
  Award,
  Clock,
  ChevronRight,
  Loader2,
  Download,
  FileText,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

interface CourseData {
  id: string;
  title: string;
  category_id?: string;
  categories?: { name: string } | null;
  level: string;
  price: number;
  status: string;
  instructor_id: string;
  thumbnail_url?: string | null;
}

interface EnrollmentData {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
  progress_percent: number;
  created_at: string;
  courses?: CourseData;
}

interface DigitalPurchaseItem {
  purchaseId: string;
  productId: string;
  title: string;
  description: string;
  coverImageUrl: string;
  fileName: string;
  fileSizeBytes: number;
  category: string;
  pricePaid: number;
  paymentMethod: string;
  purchasedAt: string;
  authorName: string;
  authorAvatar?: string | null;
  downloadUrl: string;
}

function getCourseStyles(category: string) {
  const c = (category || "").toLowerCase();
  if (c.includes("blockchain") || c.includes("web3") || c.includes("nft"))
    return {
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      barColor: "bg-blue-600",
      borderHover: "hover:border-blue-400",
    };
  if (c.includes("trading") || c.includes("defi") || c.includes("finance"))
    return {
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      barColor: "bg-emerald-600",
      borderHover: "hover:border-emerald-400",
    };
  if (c.includes("intelligence") || c.includes("ia") || c.includes("ai"))
    return {
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      barColor: "bg-purple-600",
      borderHover: "hover:border-purple-400",
    };
  return {
    color: "text-teal-600",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    barColor: "bg-teal-600",
    borderHover: "hover:border-teal-400",
  };
}

function CourseIcon({ category, className }: { category: string; className?: string }) {
  const c = (category || "").toLowerCase();
  if (c.includes("blockchain") || c.includes("web3") || c.includes("nft"))
    return <Bitcoin className={className} />;
  if (c.includes("trading") || c.includes("defi")) return <TrendingUp className={className} />;
  if (c.includes("intelligence") || c.includes("ia") || c.includes("ai"))
    return <BrainCircuit className={className} />;
  return <Code2 className={className} />;
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "Document PDF";
  const k = 1024;
  const sizes = ["Octets", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function MyCoursesAndPurchasesPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"courses" | "digital_products">("courses");
  const [activeEnrollments, setActiveEnrollments] = useState<EnrollmentData[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<EnrollmentData[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseData[]>([]);
  const [digitalPurchases, setDigitalPurchases] = useState<DigitalPurchaseItem[]>([]);
  const [userPlan, setUserPlan] = useState<string>("FREE");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Plan utilisateur
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.plan) {
        setUserPlan(profile.plan);
      }

      // 2. Inscriptions aux formations vidéo
      const { data: enrollData } = await supabase
        .from("enrollments")
        .select(
          "id, student_id, course_id, status, progress_percent, created_at, courses(id, title, category_id, level, price, status, thumbnail_url, categories(name))"
        )
        .eq("student_id", user.id);

      const all = (enrollData || []) as unknown as EnrollmentData[];
      const active = all.filter((e) => e.status === "ACTIVE" && e.progress_percent < 100);
      const completed = all.filter(
        (e) => e.progress_percent >= 100 || e.status === "COMPLETED"
      );

      setActiveEnrollments(active);
      setCompletedEnrollments(completed);

      // 3. Formations disponibles
      const enrolledIds = new Set(
        all
          .filter((e) => e.status === "ACTIVE" || e.status === "COMPLETED")
          .map((e) => e.course_id)
      );
      const { data: coursesData } = await supabase
        .from("courses")
        .select(
          "id, title, category_id, level, price, status, thumbnail_url, categories(name)"
        )
        .eq("status", "PUBLISHED");

      const available = ((coursesData || []) as unknown as CourseData[]).filter(
        (c) => !enrolledIds.has(c.id)
      );
      setAvailableCourses(available);

      // 4. Produits digitaux achetés
      try {
        const resPurchases = await fetch("/api/student/digital-purchases");
        if (resPurchases.ok) {
          const pData = await resPurchases.json();
          if (Array.isArray(pData.purchases)) {
            setDigitalPurchases(pData.purchases);
          }
        }
      } catch (purErr) {
        console.warn("Error fetching student digital purchases:", purErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  const isEn = language === "en";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            {t("student.courses.title", "Mes Formations & Achats")}
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              Espace Apprenant
            </span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t(
              "student.courses.subtitle",
              "Accédez à vos cours en ligne ainsi qu'à tous vos e-books et guides numériques acquis."
            )}
          </p>
        </div>

        {/* Boutons d'action rapides */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-teal-600" />
            {isEn ? "Digital Store" : "Boutique E-books"}
          </Link>
          <Link
            href="/dashboard/discover"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-sm"
          >
            <Compass className="w-4 h-4" />
            {isEn ? "Catalog" : "Catalogue Formations"}
          </Link>
        </div>
      </div>

      {/* Onglets UX / UI de navigation principale */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "courses"
              ? "bg-teal-600 text-white shadow-lg shadow-teal-600/25 scale-[1.01]"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{isEn ? "Video Courses" : "Formations Vidéo & Cours"}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === "courses"
                ? "bg-white/20 text-white"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {activeEnrollments.length + completedEnrollments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("digital_products")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "digital_products"
              ? "bg-teal-600 text-white shadow-lg shadow-teal-600/25 scale-[1.01]"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isEn ? "E-books & Guides" : "Produits Digitaux & E-books"}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === "digital_products"
                ? "bg-white/20 text-white"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {digitalPurchases.length}
          </span>
        </button>
      </div>

      {/* CONTENU ONGLET 1 : FORMATIONS VIDÉO & COURS */}
      {activeTab === "courses" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gauche : Cours en cours + Cours terminés */}
          <div className="lg:col-span-2 space-y-8">
            {/* Formations en cours */}
            <div>
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                {t("student.courses.inProgress", "En cours")} ({activeEnrollments.length})
              </h2>

              {activeEnrollments.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center py-16 space-y-5">
                  <BookOpen className="w-14 h-14 text-zinc-300 mx-auto" />
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                      {t("student.courses.noInProgress", "Aucune formation en cours")}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">
                      {t(
                        "student.courses.availableSubtitle",
                        "Visitez notre catalogue pour découvrir et acheter vos premières formations."
                      )}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/discover"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-teal-500/10"
                  >
                    <Compass className="w-5 h-5" />{" "}
                    {t("student.courses.browseCatalog", "Découvrir le catalogue")}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activeEnrollments.map((enr) => {
                    const course = enr.courses;
                    if (!course) return null;
                    const catName = course.categories?.name || "Général";
                    const styles = getCourseStyles(catName);
                    return (
                      <div
                        key={enr.id}
                        className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full hover:shadow-md transition-all ${styles.borderHover}`}
                      >
                        <div className="mb-5 flex justify-between items-start">
                          {course.thumbnail_url ? (
                            <div className="w-20 h-12 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-100 dark:bg-zinc-800 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={course.thumbnail_url}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className={`w-13 h-13 ${styles.bgColor} rounded-2xl flex items-center justify-center shrink-0`}
                            >
                              <CourseIcon category={catName} className={`w-7 h-7 ${styles.color}`} />
                            </div>
                          )}
                          <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                            {t("student.courses.inProgress", "En cours")}
                          </span>
                        </div>

                        <h2 className="text-base font-bold mb-1 text-zinc-900 dark:text-white line-clamp-2">
                          {course.title}
                        </h2>
                        <p className="text-xs text-zinc-400 mb-5">
                          {catName} · {course.level || "Tous niveaux"}
                        </p>

                        <div className="mt-auto space-y-3">
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {t("student.dashboard.progress", "Progression")}
                            </span>
                            <span className={styles.color}>{enr.progress_percent}%</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${styles.barColor} transition-all duration-700`}
                              style={{ width: `${enr.progress_percent}%` }}
                            />
                          </div>
                          <Link
                            href={`/dashboard/courses/${course.id}/learn`}
                            className="w-full flex items-center justify-center py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors text-sm"
                          >
                            <PlayCircle className="w-5 h-5 mr-2" />
                            {enr.progress_percent === 0
                              ? t("student.courses.start", "Commencer")
                              : t("student.courses.resume", "Reprendre")}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Formations terminées */}
            {completedEnrollments.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {t("student.courses.completed", "Terminées")} ({completedEnrollments.length})
                </h2>
                <div className="space-y-3">
                  {completedEnrollments.map((enr) => {
                    const course = enr.courses;
                    if (!course) return null;
                    const catName = course.categories?.name || "Général";
                    const styles = getCourseStyles(catName);
                    return (
                      <div
                        key={enr.id}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {course.thumbnail_url ? (
                            <div className="w-14 h-9 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 relative bg-zinc-100 dark:bg-zinc-800">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={course.thumbnail_url}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className={`w-11 h-11 ${styles.bgColor} rounded-xl flex items-center justify-center shrink-0`}
                            >
                              <CourseIcon category={catName} className={`w-5 h-5 ${styles.color}`} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                              {course.title}
                            </h3>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{catName} · 100%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/dashboard/courses/${course.id}/learn`}
                            className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          >
                            {t("student.courses.review", "Revoir")}
                          </Link>
                          <Link
                            href="/dashboard/certificates"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                          >
                            <Award className="w-3.5 h-3.5 inline mr-1" />
                            {t("student.courses.certificate", "Certificat")}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Droite : Recommandations de formations */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                {t("student.courses.available", "Formations Recommandées")}
              </h3>
              <div className="space-y-3">
                {availableCourses.slice(0, 3).map((course) => (
                  <div
                    key={course.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {course.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {course.categories?.name || "Blockchain"} · ${course.price}
                      </p>
                    </div>
                    <Link
                      href={`/courses/${course.id}`}
                      className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-[11px] font-bold hover:bg-teal-700 shrink-0"
                    >
                      Voir
                    </Link>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard/discover"
                className="block text-center text-xs font-bold text-teal-600 hover:underline pt-2"
              >
                Explorer tout le catalogue →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 2 : PRODUITS DIGITAUX & E-BOOKS ACHETÉS */}
      {activeTab === "digital_products" && (
        <div className="space-y-6">
          {digitalPurchases.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center py-16 space-y-5">
              <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                  {isEn ? "No digital products purchased yet" : "Aucun produit digital acquis pour le moment"}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
                  {isEn
                    ? "Explore our digital store to purchase practical PDF guides, exclusive e-books, and downloadable expert tools."
                    : "Découvrez notre boutique digitale pour acquérir des guides pratiques PDF, e-books exclusifs et modèles téléchargeables immédiatement."}
                </p>
              </div>
              <Link
                href="/store"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold rounded-2xl shadow-xl shadow-teal-500/20 text-sm transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                {isEn ? "Browse Digital Store" : "Explorer la Boutique Digitale"}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {digitalPurchases.map((item) => (
                <div
                  key={item.purchaseId}
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image de couverture avec badges */}
                    <div className="relative h-48 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-500 text-zinc-950 uppercase shadow-md">
                          PDF / E-book
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Acquis
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-[11px] text-teal-300 font-semibold truncate">
                          {item.category}
                        </p>
                        <h4 className="text-sm font-bold text-white line-clamp-1">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    {/* Informations produit */}
                    <div className="p-5 space-y-3">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.description || "Guide pratique et document complet."}
                      </p>

                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center justify-between">
                          <span>Auteur :</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                            {item.authorName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Taille :</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {formatBytes(item.fileSizeBytes)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Acheté le :</span>
                          <span className="font-medium">
                            {new Date(item.purchasedAt).toLocaleDateString(
                              language === "en" ? "en-US" : "fr-FR",
                              { day: "numeric", month: "short", year: "numeric" }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bouton de téléchargement direct sécurisé */}
                  <div className="p-5 pt-0">
                    <a
                      href={item.downloadUrl}
                      download
                      className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold rounded-2xl shadow-lg shadow-teal-500/20 text-xs transition-all hover:scale-[1.01]"
                    >
                      <Download className="w-4 h-4" /> Télécharger mon Fichier
                    </a>
                    <div className="text-[10px] text-zinc-400 text-center flex items-center justify-center gap-1.5 mt-2">
                      <ShieldCheck className="w-3 h-3 text-teal-600" /> Accès sécurisé à vie garanti
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
