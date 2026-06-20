"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, Users, Tag, User, Globe, ChevronLeft } from "lucide-react";
import { getDB, Course, Enrollment } from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";

export default function CoursePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [sectionsCount, setSectionsCount] = useState(0);
  const [lessonsCount, setLessonsCount] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDB();
    const currentCourse = db.courses.find(c => c.id === courseId);
    if (!currentCourse) {
      setLoading(false);
      return;
    }

    setCourse(currentCourse);

    // Count sections and lessons
    const courseSections = db.sections.filter(s => s.courseId === courseId);
    setSectionsCount(courseSections.length);
    const sectionIds = courseSections.map(s => s.id);
    const courseLessons = db.lessons.filter(l => sectionIds.includes(l.sectionId));
    setLessonsCount(courseLessons.length);

    // Check enrollment
    const session = getSimulatedSession();
    if (session) {
      const enrollment = db.enrollments.find(
        e => e.studentId === session.userId && e.courseId === courseId && e.status === "ACTIVE"
      );
      setIsEnrolled(!!enrollment);
    }

    // Real enrolled count
    const courseEnrollments = db.enrollments.filter(e => e.courseId === courseId);
    setEnrolledCount(courseEnrollments.length);

    setLoading(false);
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Cours non trouvé</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Le cours que vous cherchez n'existe pas ou a été retiré.</p>
        <Link href="/dashboard/discover" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  // Get image
  let courseImg = `/images/courses/web3.png`;
  if (course.id === "blockchain") courseImg = `/images/courses/blockchain-dev.png`;
  else if (course.id === "trading") courseImg = `/images/courses/trading.png`;
  else if (course.id === "ai") courseImg = `/images/courses/ai.png`;
  else if (course.id === "web3") courseImg = `/images/courses/web3.png`;
  else if (course.id === "blockchain-consulting") courseImg = `/images/courses/blockchain-consulting.png`;
  else if (course.id === "blockchain-dev") courseImg = `/images/courses/blockchain-dev.png`;
  else if (course.id === "defi") courseImg = `/images/courses/defi.png`;

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

          {/* Mini thumbnails (mocking multiple attachments) */}
          <div className="flex gap-3">
            <div className="relative w-20 h-12 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-100 cursor-pointer hover:border-blue-500 transition-colors">
              <Image src={courseImg} alt="attachment" fill className="object-cover" />
            </div>
            <div className="relative w-20 h-12 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-100 cursor-pointer hover:border-blue-500 transition-colors opacity-60">
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
                BIENVENUE DANS L'ACADÉMIE : {course.title.toUpperCase()}
              </h2>
              <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-4">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Rejoignez-nous de l'autre côté. Ne vous contentez pas de regarder, apprenez activement !
                </p>
                <p>
                  Ce parcours d'apprentissage intensif est conçu pour vous emmener de zéro aux compétences professionnelles exigées par les entreprises. Que vous soyez débutant ou intermédiaire, nos modules progressifs s'adapteront à votre rythme.
                </p>
                <p>
                  <strong>Ce que vous allez obtenir dans ce cours :</strong>
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Accès à vie à {lessonsCount} leçons vidéos détaillées divisées en {sectionsCount} chapitres structurés.</li>
                  <li>Exercices pratiques et quiz d'évaluation après chaque chapitre.</li>
                  <li>Un certificat de réussite officiel d'ANSELLA vérifiable en ligne.</li>
                  <li>Accès à notre communauté privée d'apprenants pour collaborer et poser vos questions.</li>
                </ul>
                <p className="mt-4">
                  Appuyez sur le bouton dans le panneau latéral pour débloquer votre accès dès maintenant et commencer votre transformation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Panel (Right) - Inspired by Skool UI layout */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md p-6 space-y-6 sticky top-24">
            
            {/* Logo Card Top Header */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 shadow-sm mb-4">
                <Image src={courseImg} alt="Thumbnail" fill className="object-cover" />
              </div>
              <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white leading-tight">{course.title}</h3>
              <span className="text-xs text-zinc-400 mt-1 font-medium hover:underline cursor-pointer">
                ansella.app/{course.slug}
              </span>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 font-semibold px-2">
                Parcours certifiant et pratique de {course.category}
              </p>
            </div>

            {/* Skool statistics row */}
            <div className="grid grid-cols-3 border-y border-zinc-100 dark:border-zinc-800 py-4 text-center">
              <div>
                <p className="text-xl font-extrabold text-zinc-900 dark:text-white">{enrolledCount}</p>
                <p className="text-xxs text-zinc-400 uppercase tracking-widest mt-0.5">Membres</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-green-500">{Math.max(1, Math.floor(enrolledCount / 5))}</p>
                <p className="text-xxs text-zinc-400 uppercase tracking-widest mt-0.5">En Ligne</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-blue-500">1</p>
                <p className="text-xxs text-zinc-400 uppercase tracking-widest mt-0.5">Admin</p>
              </div>
            </div>

            {/* Installment payment info if allowed */}
            {course.allowInstallments && !isEnrolled && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-center">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  Option multi-tranches disponible
                </p>
                <p className="text-xxs text-zinc-500 mt-0.5">
                  Payez en {course.installmentsCount} fois : seulement {Math.round(course.price / (course.installmentsCount || 1))}$ par mensualité.
                </p>
              </div>
            )}

            {/* Skool yellow/orange/gold CTA button */}
            <button
              onClick={handleActionClick}
              className={`w-full py-4 text-center font-extrabold rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg cursor-pointer ${
                isEnrolled
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20"
                  : "bg-yellow-400 hover:bg-yellow-500 text-zinc-900 shadow-yellow-500/20"
              }`}
            >
              {isEnrolled ? "✓ DÉJÀ PAYÉ — ACCÉDER" : `REJOINDRE POUR $${course.price}`}
            </button>

            {/* Additional details list */}
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
                <span>Leçons vidéos :</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lessonsCount}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
