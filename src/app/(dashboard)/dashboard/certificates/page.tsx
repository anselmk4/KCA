"use client";

import { useEffect, useState, useRef } from "react";
import { Award, Lock, Download, ExternalLink, CheckCircle2, Share2, Sparkles, BookOpen, Compass } from "lucide-react";
import Link from "next/link";
import { getDB, Certificate, Course, Enrollment, Database } from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";

type CertificateWithCourse = Certificate & { course?: Course };
type InProgressCourse = Enrollment & { course?: Course; totalLessons: number; completedLessons: number };

export default function CertificatesPage() {
  const [userName, setUserName] = useState("Apprenant");
  const [earnedCerts, setEarnedCerts] = useState<CertificateWithCourse[]>([]);
  const [inProgressCourses, setInProgressCourses] = useState<InProgressCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    const db = getDB();
    const session = getSimulatedSession();

    if (!session) {
      setLoading(false);
      return;
    }

    setUserName(session.name || localStorage.getItem("kuettu_user_name") || "Apprenant");

    // 1. Earned certificates
    const certs = (db.certificates || [])
      .filter(c => c.studentId === session.userId)
      .map(c => {
        const course = db.courses.find(co => co.id === c.courseId);
        return { ...c, course };
      });
    setEarnedCerts(certs);

    // 2. In-progress courses (enrolled but not 100%)
    const certCourseIds = new Set(certs.map(c => c.courseId));
    const inProgress = db.enrollments
      .filter(e => e.studentId === session.userId && e.status === "ACTIVE" && !certCourseIds.has(e.courseId))
      .map(e => {
        const course = db.courses.find(c => c.id === e.courseId);
        const sectionIds = db.sections.filter(s => s.courseId === e.courseId).map(s => s.id);
        const totalLessons = db.lessons.filter(l => sectionIds.includes(l.sectionId)).length;
        const completedLessons = db.lessonProgress.filter(
          p => p.enrollmentId === e.id && p.completed
        ).length;
        return { ...e, course, totalLessons, completedLessons };
      })
      .filter(e => !!e.course);
    setInProgressCourses(inProgress);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const getCertColor = (index: number) => {
    const colors = [
      { border: "border-blue-500/20", bg: "bg-gradient-to-br from-blue-600 to-indigo-700", accent: "text-blue-600", accentBg: "bg-blue-50 dark:bg-blue-900/20" },
      { border: "border-emerald-500/20", bg: "bg-gradient-to-br from-emerald-600 to-teal-700", accent: "text-emerald-600", accentBg: "bg-emerald-50 dark:bg-emerald-900/20" },
      { border: "border-purple-500/20", bg: "bg-gradient-to-br from-purple-600 to-violet-700", accent: "text-purple-600", accentBg: "bg-purple-50 dark:bg-purple-900/20" },
      { border: "border-orange-500/20", bg: "bg-gradient-to-br from-orange-600 to-red-700", accent: "text-orange-600", accentBg: "bg-orange-50 dark:bg-orange-900/20" },
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Mes Certificats</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Vos accomplissements et diplômes obtenus sur ANSELLA.</p>
      </div>

      {/* Earned Certificates */}
      {earnedCerts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Certificats obtenus ({earnedCerts.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {earnedCerts.map((cert, index) => {
              const color = getCertColor(index);
              return (
                <div key={cert.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
                  {/* Certificate visual */}
                  <div className={`h-64 ${color.bg} relative flex items-center justify-center`}>
                    <div className="w-4/5 h-4/5 bg-white/95 dark:bg-zinc-900/95 shadow-2xl border border-white/50 rounded-lg p-6 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                        <Award className="w-7 h-7 text-amber-600" />
                      </div>
                      <p className="font-serif text-xs text-zinc-400 uppercase tracking-[0.2em]">Certificat d&apos;Accomplissement</p>
                      <p className="font-bold text-zinc-900 dark:text-white mt-2 text-sm leading-tight">{cert.course?.title || "Formation"}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-16 h-[1px] bg-amber-400"></div>
                        <p className="text-xs text-zinc-500 font-semibold">{userName}</p>
                        <div className="w-16 h-[1px] bg-amber-400"></div>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2 font-mono">Code : {cert.code}</p>
                    </div>
                    {/* Verified badge */}
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600">Vérifié</span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{cert.course?.title || "Formation"}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      Délivré le {new Date(cert.issuedAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <p className="text-zinc-400 text-xs mb-5 font-mono">
                      Code de vérification : {cert.code}
                    </p>

                    <div className="flex items-center gap-3 mt-auto">
                      <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        Télécharger PDF
                      </button>
                      <button className="py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Partager
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* In-progress certificates */}
      {inProgressCourses.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Certificats en cours d&apos;obtention
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {inProgressCourses.map((enrollment) => (
              <div key={enrollment.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col group">
                <div className="h-52 bg-zinc-100 dark:bg-zinc-800 relative flex items-center justify-center border-b border-zinc-200 dark:border-zinc-700">
                  {/* Locked Diploma Preview */}
                  <div className="w-3/4 h-3/4 bg-white dark:bg-zinc-900 shadow-lg border-4 border-zinc-200 dark:border-zinc-700 p-4 flex flex-col items-center justify-center opacity-40 grayscale transition-all group-hover:opacity-60">
                    <Award className="w-10 h-10 text-zinc-400 mb-2" />
                    <p className="font-serif text-xs text-zinc-400 uppercase tracking-widest text-center">Certificat d&apos;Accomplissement</p>
                    <p className="font-bold text-zinc-500 mt-1 text-center text-xs">{enrollment.course?.title}</p>
                  </div>

                  {/* Lock Overlay */}
                  <div className="absolute inset-0 bg-black/5 dark:bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-full shadow-xl">
                      <Lock className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1">{enrollment.course?.title}</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-4 flex-1">
                    Suivez 100% des leçons et validez tous les quiz du cours avec un score ≥ 80% pour obtenir ce certificat.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-500">Progression</span>
                      <span className="text-blue-600">{enrollment.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${enrollment.progressPercent}%` }}></div>
                    </div>
                    <p className="text-xxs text-zinc-400">
                      {enrollment.completedLessons} / {enrollment.totalLessons} leçons complétées
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/courses/${enrollment.courseId}/learn`}
                    className="mt-4 w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors text-center block"
                  >
                    Continuer le cours →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no certificates AND no in-progress courses */}
      {earnedCerts.length === 0 && inProgressCourses.length === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 text-center space-y-5 flex flex-col items-center justify-center">
            <BookOpen className="w-16 h-16 text-zinc-300" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Aucun certificat pour le moment</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">
              Inscrivez-vous à une formation, complétez toutes les leçons et obtenez votre certificat.
            </p>
            <Link
              href="/dashboard/discover"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors gap-2"
            >
              <Compass className="w-5 h-5" />
              Découvrir le catalogue
            </Link>
          </div>

          {/* Why certificates */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-8 flex flex-col justify-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6">
              <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Pourquoi obtenir nos certificats ?</h3>
            <ul className="space-y-4 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm">Démontrez votre expertise auprès des employeurs et partenaires d&apos;affaires en Afrique et à l&apos;international.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm">Générez un lien unique de vérification pour votre profil LinkedIn.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm">Accédez à des opportunités exclusives au sein du réseau ANSELLA.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Why certificates (when user has some certs or in-progress) */}
      {(earnedCerts.length > 0 || inProgressCourses.length > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-8 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center">
              <Award className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Vos certificats ANSELLA</h3>
              <p className="text-xs text-zinc-500">Vérifiables, partageables, et reconnus.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-zinc-900/30 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Expertise reconnue en Afrique et à l&apos;international</span>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-zinc-900/30 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Lien de vérification unique pour LinkedIn</span>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-zinc-900/30 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Opportunités exclusives réseau ANSELLA</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
