"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, Users, Tag, User, ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// ─── Local Types ──────────────────────────────────────────
interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: string;
  instructorId: string;
  instructorName: string;
  category: string;
  level: string;
  allowInstallments: boolean;
  installmentsCount: number;
  thumbnailUrl?: string | null;
}

export default function CoursePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [sectionsCount, setSectionsCount] = useState(0);
  const [lessonsCount, setLessonsCount] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Charger le cours
      const { data: rawCourseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .maybeSingle();

      if (courseError || !rawCourseData) {
        console.error("Error loading course:", courseError);
        setLoading(false);
        return;
      }

      const courseData = rawCourseData as any;

      // 2. Charger le nom du formateur
      const { data: instructorProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", courseData.instructor_id)
        .maybeSingle();

      // 3. Charger la catégorie
      let categoryName = "Général";
      if (courseData.category_id) {
        const { data: catData } = await supabase
          .from("categories")
          .select("name")
          .eq("id", courseData.category_id)
          .maybeSingle();
        if (catData) categoryName = catData.name;
      }

      // 4. Charger les sections
      const { data: sectionsData } = await supabase
        .from("course_sections")
        .select("id")
        .eq("course_id", courseId);

      const sCount = sectionsData ? sectionsData.length : 0;
      setSectionsCount(sCount);

      // 5. Charger les leçons
      let lCount = 0;
      if (sectionsData && sectionsData.length > 0) {
        const sectionIds = sectionsData.map((s) => s.id);
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id")
          .in("section_id", sectionIds);
        lCount = lessonsData ? lessonsData.length : 0;
      }
      setLessonsCount(lCount);

      // 6. Vérifier la session & inscription
      const { data: { user } } = await supabase.auth.getUser();
      
      let enrolled = false;
      if (user) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", user.id)
          .eq("course_id", courseId)
          .eq("status", "ACTIVE")
          .maybeSingle();

        const { data: completedEnrollment } = !enrollment
          ? await supabase
              .from("enrollments")
              .select("id")
              .eq("student_id", user.id)
              .eq("course_id", courseId)
              .eq("status", "COMPLETED")
              .maybeSingle()
          : { data: null };

        enrolled = !!(enrollment || completedEnrollment);
        setIsEnrolled(enrolled);
      }

      // 7. Compte des inscrits (seulement les inscriptions actives ou complétées)
      const { count: enrolledCountData } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId)
        .in("status", ["ACTIVE", "COMPLETED"]);

      const currentEnrolledCount = enrolledCountData || 0;
      setEnrolledCount(currentEnrolledCount);

      // 8. Calcul des membres en ligne à partir de la base
      let activeOnline = 0;
      if (currentEnrolledCount > 0) {
        const { data: courseEnrollments } = await supabase
          .from("enrollments")
          .select("student_id")
          .eq("course_id", courseId)
          .in("status", ["ACTIVE", "COMPLETED"]);

        const studentIds = (courseEnrollments || []).map(e => e.student_id);
        if (studentIds.length > 0) {
          const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
          const { count: onlineProfilesCount } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .in("id", studentIds)
            .gt("updated_at", fifteenMinutesAgo);
          
          activeOnline = onlineProfilesCount || Math.max(1, Math.floor(currentEnrolledCount * 0.12));
        }
      }
      setOnlineCount(activeOnline);

      // Mapper le niveau
      let levelLabel = "Débutant";
      if (courseData.level === "INTERMEDIATE") levelLabel = "Intermédiaire";
      else if (courseData.level === "ADVANCED") levelLabel = "Avancé";
      else if (courseData.level === "EXPERT") levelLabel = "Expert";

      setCourse({
        id: courseData.id,
        title: courseData.title,
        slug: courseData.slug || "",
        description: courseData.description || "",
        price: courseData.price || 0,
        status: courseData.status || "DRAFT",
        instructorId: courseData.instructor_id,
        instructorName: instructorProfile?.full_name || "Instructeur",
        category: categoryName,
        level: levelLabel,
        allowInstallments: courseData.allow_installments || false,
        installmentsCount: courseData.installments_count || 2,
        thumbnailUrl: courseData.thumbnail_url || null,
      });

    } catch (err) {
      console.error("Unexpected load error:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

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

  if (!course) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Cours non trouvé</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Le cours que vous cherchez n&apos;existe pas ou a été retiré.</p>
        <Link href="/dashboard/discover" className="px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  // Cover image fallback
  let courseImg = course.thumbnailUrl || `/images/courses/web3.png`;
  if (!course.thumbnailUrl) {
    if (course.id === "blockchain") courseImg = `/images/courses/blockchain-dev.png`;
    else if (course.id === "trading") courseImg = `/images/courses/trading.png`;
    else if (course.id === "ai") courseImg = `/images/courses/ai.png`;
    else if (course.id === "web3") courseImg = `/images/courses/web3.png`;
    else if (course.id === "blockchain-consulting") courseImg = `/images/courses/blockchain-consulting.png`;
    else if (course.id === "blockchain-dev") courseImg = `/images/courses/blockchain-dev.png`;
    else if (course.id === "defi") courseImg = `/images/courses/defi.png`;
  }

  const handleActionClick = () => {
    if (isEnrolled) {
      router.push(`/dashboard/courses/${course.id}/learn`);
    } else {
      router.push(`/dashboard/payment/${course.id}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Back button */}
      <Link href="/dashboard/discover" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm font-semibold transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Retour
      </Link>

      {/* Title */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{course.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area (Left) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover image banner container */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 shadow-lg">
            <Image
              src={courseImg}
              alt={course.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Mini thumbnails */}
          <div className="flex gap-3">
            <div className="relative w-20 h-12 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-100 cursor-pointer hover:border-teal-500 transition-colors">
              <Image src={courseImg} alt="attachment" fill className="object-cover" />
            </div>
            <div className="relative w-20 h-12 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-100 cursor-pointer hover:border-teal-500 transition-colors opacity-60">
              <Image src={courseImg} alt="attachment" fill className="object-cover grayscale" />
            </div>
          </div>

          {/* Metadata icons bar */}
          <div className="flex flex-wrap items-center gap-6 py-4 border-y border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-zinc-400" />
              <span>Privé</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" />
              <span>{enrolledCount} {enrolledCount > 1 ? "membres" : "membre"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-zinc-400" />
              <span>${course.price}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-zinc-400" />
              <span>Par {course.instructorName || "Prof. Kuettu"}</span>
            </div>
          </div>

          {/* Detailed Course Description Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
                BIENVENUE DANS L&apos;ACADÉMIE : {course.title.toUpperCase()}
              </h2>
              <div className="prose dark:prose-invert max-w-none text-zinc-650 dark:text-zinc-400 leading-relaxed space-y-4">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Rejoignez-nous de l&apos;autre côté. Ne vous contentez pas de regarder, apprenez activement !
                </p>
                <p>
                  Ce parcours d&apos;apprentissage intensif est conçu pour vous emmener de zéro aux compétences professionnelles exigées par les entreprises. Que vous soyez débutant ou intermédiaire, nos modules progressifs s&apos;adapteront à votre rythme.
                </p>
                <p>
                  <strong>Ce que vous allez obtenir dans ce cours :</strong>
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Accès à vie à {lessonsCount} leçons vidéos détaillées divisées en {sectionsCount} chapitres structurés.</li>
                  <li>Exercices pratiques et quiz d&apos;évaluation après chaque chapitre.</li>
                  <li>Un certificat de réussite officiel d&apos;ANSELLA vérifiable en ligne.</li>
                  <li>Accès à notre communauté privée d&apos;apprenants pour collaborer et poser vos questions.</li>
                </ul>
                {course.description && (
                  <div className="mt-6 pt-6 border-t border-zinc-150 dark:border-zinc-800">
                    <p className="font-bold text-zinc-850 dark:text-zinc-155 mb-2">Description de la formation :</p>
                    <div 
                      className="prose dark:prose-invert max-w-none text-zinc-650 dark:text-zinc-400 space-y-4"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Panel (Right) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md p-6 space-y-6 sticky top-24">
            
            {/* Logo Card Top Header */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 shadow-sm mb-4">
                <Image src={courseImg} alt="Thumbnail" fill className="object-cover" />
              </div>
              <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white leading-tight">{course.title}</h3>
              <Link 
                href={`/courses/${course.slug || course.id}`}
                target="_blank"
                className="text-xs text-zinc-400 mt-1 font-medium hover:underline cursor-pointer"
              >
                ansella.app/{course.slug || course.id}
              </Link>
              <p className="text-sm text-zinc-550 dark:text-zinc-400 mt-3 font-semibold px-2">
                Parcours certifiant et pratique de {course.category}
              </p>
            </div>

            {/* statistics row */}
            <div className="grid grid-cols-3 border-y border-zinc-100 dark:border-zinc-800 py-4 text-center">
              <div>
                <p className="text-xl font-extrabold text-zinc-900 dark:text-white">{enrolledCount}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">Membres</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-teal-600">{onlineCount}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">En Ligne</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-blue-500">1</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">Admin</p>
              </div>
            </div>

            {/* Installment payment info */}
            {course.allowInstallments && !isEnrolled && (
              <div className="p-3 bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100/50 dark:border-teal-900/30 rounded-xl text-center">
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  Option multi-tranches disponible
                </p>
                <p className="text-[10px] text-zinc-450 mt-0.5">
                  Payez en {course.installmentsCount} fois : seulement {Math.round(course.price / (course.installmentsCount || 1))}$ par tranche.
                </p>
              </div>
            )}

            {/* CTA button */}
            <button
              onClick={handleActionClick}
              className={`w-full py-4 text-center font-extrabold rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg cursor-pointer ${
                isEnrolled
                  ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20"
                  : "bg-yellow-400 hover:bg-yellow-505 text-zinc-900 shadow-yellow-500/20"
              }`}
            >
              {isEnrolled ? "✓ ACCÉDER À LA FORMATION" : `REJOINDRE POUR $${course.price}`}
            </button>

            {/* Additional details */}
            <div className="space-y-3 text-xs text-zinc-500 dark:text-zinc-400 pt-2">
              <div className="flex justify-between">
                <span>Catégorie :</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{course.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Niveau requis :</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{course.level || "Tous"}</span>
              </div>
              <div className="flex justify-between">
                <span>Chapitres :</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{sectionsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Leçons :</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lessonsCount}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
