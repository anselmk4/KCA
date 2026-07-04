"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Award, Lock, Download, CheckCircle2, Share2,
  Sparkles, BookOpen, Compass, Loader2, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────
type CertRow = {
  id: string;
  course_id: string;
  code: string;
  issued_at: string;
  courseTitle?: string;
  instructorName?: string;
  academyName?: string;
};

type EnrollmentRow = {
  id: string;
  course_id: string;
  progress_percent: number;
  courseTitle?: string;
};

// ─── Canvas-based PDF export (zero dependency) ──────────
async function downloadCertificatePDF(cert: CertRow, studentName: string) {
  const canvas = document.createElement("canvas");
  // A4 landscape at 150dpi
  canvas.width = 1587;
  canvas.height = 1123;
  const ctx = canvas.getContext("2d")!;

  // Light premium ivory/cream background
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#FCFBF9");
  grad.addColorStop(1, "#F3EFEA");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Muted gold borders
  ctx.strokeStyle = "#C5A85C";
  ctx.lineWidth = 12;
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
  ctx.strokeStyle = "#C5A85C4D";
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);

  // Corner ornaments
  const corners = [
    [76, 76],
    [canvas.width - 76, 76],
    [76, canvas.height - 76],
    [canvas.width - 76, canvas.height - 76]
  ];
  ctx.fillStyle = "#C5A85C";
  corners.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  // Load and render Ansella Logo in top left
  const logo = new window.Image();
  logo.src = "/logo.png";
  await new Promise((resolve) => {
    logo.onload = resolve;
    logo.onerror = resolve;
  });
  if (logo.complete && logo.naturalWidth > 0) {
    ctx.drawImage(logo, 100, 90, 160, 48);
  }

  // Dynamic Academy header based on enrollment/instructor
  ctx.fillStyle = "#1e293b"; // Slate-800
  ctx.font = "bold 40px Georgia, serif";
  ctx.textAlign = "center";
  const academyHeader = (cert.academyName || "ANSELLA ACADEMY").toUpperCase();
  ctx.fillText(academyHeader, canvas.width / 2, 170);

  // Divider
  ctx.strokeStyle = "#C5A85C";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 300, 195);
  ctx.lineTo(canvas.width / 2 + 300, 195);
  ctx.stroke();

  // Certificate of Completion
  ctx.fillStyle = "#475569"; // Slate-600
  ctx.font = "italic 28px Georgia, serif";
  ctx.fillText("Certificat d'Accomplissement", canvas.width / 2, 250);

  // "Décerné à"
  ctx.fillStyle = "#64748b"; // Slate-500
  ctx.font = "22px Arial, sans-serif";
  ctx.fillText("Décerné à", canvas.width / 2, 320);

  // Student name in Charcoal
  ctx.fillStyle = "#0f172a"; // Deep Charcoal
  ctx.font = "bold 72px Georgia, serif";
  ctx.fillText(studentName, canvas.width / 2, 420);

  // Underline
  const nameWidth = ctx.measureText(studentName).width;
  ctx.strokeStyle = "#C5A85C";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - nameWidth / 2, 440);
  ctx.lineTo(canvas.width / 2 + nameWidth / 2, 440);
  ctx.stroke();

  // "pour avoir complété avec succès"
  ctx.fillStyle = "#475569";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText("pour avoir complété avec succès la formation", canvas.width / 2, 510);

  // Course title in elegant Deep Teal/Charcoal
  ctx.fillStyle = "#0f766e"; // Deep Teal
  ctx.font = "bold 48px Georgia, serif";
  const title = cert.courseTitle || "Formation ANSELLA";
  // Word-wrap long titles
  const maxWidth = canvas.width - 240;
  const words = title.split(" ");
  let line = "";
  let y = 590;
  for (const word of words) {
    const test = line + (line ? " " : "") + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, canvas.width / 2, y);
      line = word;
      y += 60;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, canvas.width / 2, y);

  // Instructor
  if (cert.instructorName) {
    ctx.fillStyle = "#475569";
    ctx.font = "20px Arial, sans-serif";
    ctx.fillText(`Instructeur : ${cert.instructorName}`, canvas.width / 2, y + 70);
  }

  // Date + Code
  const issuedDate = new Date(cert.issued_at).toLocaleDateString("fr-FR", {
    year: "numeric", month: "long", day: "numeric",
  });
  ctx.fillStyle = "#475569";
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText(`Date d'émission : ${issuedDate}`, canvas.width / 2, canvas.height - 200);

  ctx.fillStyle = "#334155";
  ctx.font = "bold 18px monospace";
  ctx.fillText(`Code de vérification : ${cert.code}`, canvas.width / 2, canvas.height - 160);

  ctx.fillStyle = "#2563eb"; // Royal Blue link
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText(`Vérifiez ce certificat sur : ${window.location.origin}/verify/${cert.code}`, canvas.width / 2, canvas.height - 120);

  // Footer seal
  ctx.fillStyle = "#C5A85C";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height - 60, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px Arial";
  ctx.fillText("✓", canvas.width / 2, canvas.height - 54);

  // Export
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificat-${cert.code}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

// ─── Component ────────────────────────────────────────────
const CERT_COLORS = [
  { border: "border-blue-200/60", bg: "bg-gradient-to-br from-blue-50 to-indigo-100/50" },
  { border: "border-emerald-200/60", bg: "bg-gradient-to-br from-emerald-50 to-teal-100/50" },
  { border: "border-purple-200/60", bg: "bg-gradient-to-br from-purple-50 to-violet-100/50" },
  { border: "border-orange-200/60", bg: "bg-gradient-to-br from-orange-50 to-red-100/50" },
];

export default function CertificatesPage() {
  const [userName, setUserName] = useState("Apprenant");
  const [userId, setUserId] = useState<string | null>(null);
  const [earnedCerts, setEarnedCerts] = useState<CertRow[]>([]);
  const [inProgress, setInProgress] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerateCertificate = async (courseId: string) => {
    setGeneratingId(courseId);
    setGenError(null);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de générer le certificat.");
      }
      await loadData();
    } catch (err: any) {
      setGenError(err.message);
      alert(err.message);
    } finally {
      setGeneratingId(null);
    }
  };

  // ── Charger depuis Supabase ─────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    // Profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    setUserName(profile?.full_name || "Apprenant");

    // Certificats
    const { data: certsRaw } = await supabase
      .from("certificates")
      .select("id, course_id, code, issued_at")
      .eq("student_id", user.id)
      .order("issued_at", { ascending: false });

    if (certsRaw && certsRaw.length > 0) {
      const courseIds = certsRaw.map(c => c.course_id);
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, instructor_id, profiles!instructor_id(full_name, academy_name)")
        .in("id", courseIds);

      const courseMap = new Map((courses || []).map(c => [c.id, c]));
      setEarnedCerts(
        certsRaw.map(c => {
          const course = courseMap.get(c.course_id);
          return {
            ...c,
            courseTitle: course?.title || "Formation",
            instructorName: (course as any)?.profiles?.full_name || "Instructeur",
            academyName: (course as any)?.profiles?.academy_name || "ANSELLA ACADEMY",
          };
        })
      );
    } else {
      setEarnedCerts([]);
    }

    // Enrollments en cours (non certifiés)
    const certCourseIds = new Set((certsRaw || []).map(c => c.course_id));
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id, course_id, progress_percent")
      .eq("student_id", user.id)
      .eq("status", "ACTIVE");

    const inProgressEnroll = (enrollments || []).filter(e => !certCourseIds.has(e.course_id));

    if (inProgressEnroll.length > 0) {
      const ipCourseIds = inProgressEnroll.map(e => e.course_id);
      const { data: ipCourses } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", ipCourseIds);
      const ipCourseMap = new Map((ipCourses || []).map(c => [c.id, c]));
      setInProgress(
        inProgressEnroll.map(e => ({
          ...e,
          progress_percent: e.progress_percent ?? 0,
          courseTitle: ipCourseMap.get(e.course_id)?.title || "Formation",
        }))
      );
    } else {
      setInProgress([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Copier lien vérification ────────────────────────────
  const handleShare = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    });
  };

  // ── Télécharger PDF ────────────────────────────────────
  const handleDownload = async (cert: CertRow) => {
    setDownloading(cert.id);
    try {
      await downloadCertificatePDF(cert, userName);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Mes Certificats</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Vos accomplissements et diplômes obtenus sur ANSELLA.</p>
        </div>
      </div>

      {/* ── Certificate Template Showcase ───────────────── */}
      <div className="bg-zinc-900 text-white rounded-3xl p-6 md:p-8 border border-zinc-800 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Modèle Officiel
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
              Aperçu du Modèle de Certificat ANSELLA
            </h2>
            <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
              Voici à quoi ressemblera votre certificat officiel une fois vos formations complétées à 100%. 
              Chaque certificat est unique, infalsifiable, et comprend un code de vérification unique ainsi qu'un lien de partage.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-400 pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500" /> Signature de l'Instructeur
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500" /> Code de vérification unique
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500" /> Export PNG Haute Résolution
              </div>
            </div>
          </div>

          <div className="md:col-span-5 flex justify-center">
            {/* Template Preview Visual */}
            <div className="w-full max-w-[340px] bg-gradient-to-br from-zinc-800 to-zinc-950 p-1.5 rounded-2xl border border-zinc-700 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-blue-500/10 opacity-60 pointer-events-none" />
              {/* Gold border */}
              <div className="border border-amber-500/30 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-zinc-950/90 relative">
                {/* Ornaments */}
                <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/60" />

                <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <p className="font-serif text-[8px] text-zinc-500 uppercase tracking-[0.2em] leading-none">Certificat d&apos;Accomplissement</p>
                
                <h4 className="font-bold text-white text-xs mt-1.5 line-clamp-1">Nom de la Formation</h4>
                
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="w-6 h-[0.5px] bg-amber-500/40" />
                  <p className="text-[9px] text-zinc-300 font-semibold truncate max-w-[100px]">{userName}</p>
                  <div className="w-6 h-[0.5px] bg-amber-500/40" />
                </div>
                
                <p className="text-[7px] text-zinc-650 mt-1 font-mono">CODE: CERT-XXXX-XXXXXX</p>
                <div className="mt-2 text-[7px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20 font-bold uppercase tracking-wider">
                  Modèle de Démonstration
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Certificats obtenus ──────────────────────────── */}
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
              const color = CERT_COLORS[index % CERT_COLORS.length];
              return (
                <div
                  key={cert.id}
                  className={`bg-white dark:bg-zinc-900 rounded-3xl border ${color.border} dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-shadow`}
                >
                  {/* Visuel certificat */}
                  <div className={`h-64 ${color.bg} relative flex items-center justify-center`}>
                    <div className="w-4/5 h-4/5 bg-white/95 dark:bg-zinc-900/95 shadow-2xl border border-white/50 rounded-lg p-6 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                        <Award className="w-7 h-7 text-amber-600" />
                      </div>
                      <p className="font-serif text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.25em] mb-1">{cert.academyName || "ANSELLA ACADEMY"}</p>
                      <p className="font-serif text-[9px] text-zinc-400 uppercase tracking-widest leading-none mb-2">Certificat d&apos;Accomplissement</p>
                      <p className="font-bold text-zinc-900 dark:text-white mt-1 text-sm leading-tight line-clamp-2">{cert.courseTitle}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-12 h-[1px] bg-amber-400" />
                        <p className="text-xs text-zinc-500 font-semibold truncate max-w-[120px]">{userName}</p>
                        <div className="w-12 h-[1px] bg-amber-400" />
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2 font-mono">{cert.code}</p>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600">Vérifié</span>
                    </div>
                  </div>

                  {/* Info + actions */}
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 line-clamp-1">{cert.courseTitle}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      Délivré le {new Date(cert.issued_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <div className="flex items-center gap-2 mb-5">
                      <p className="text-zinc-400 text-xs font-mono truncate">{cert.code}</p>
                      <Link
                        href={`/verify/${cert.code}`}
                        target="_blank"
                        className="text-blue-500 hover:text-blue-600 shrink-0"
                        title="Vérifier le certificat"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 mt-auto">
                      <button
                        onClick={() => handleDownload(cert)}
                        disabled={downloading === cert.id}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                      >
                        {downloading === cert.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</>
                        ) : (
                          <><Download className="w-4 h-4" /> Télécharger</>
                        )}
                      </button>
                      <button
                        onClick={() => handleShare(cert.code)}
                        className="py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {copiedCode === cert.code ? (
                          <><CheckCircle2 className="w-4 h-4 text-green-500" /> Copié !</>
                        ) : (
                          <><Share2 className="w-4 h-4" /> Partager</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Cours en cours ───────────────────────────────── */}
      {inProgress.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Certificats en cours d&apos;obtention
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {inProgress.map((enrollment) => (
              <div
                key={enrollment.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col group"
              >
                <div className="h-52 bg-zinc-100 dark:bg-zinc-800 relative flex items-center justify-center border-b border-zinc-200 dark:border-zinc-700">
                  <div className={`w-3/4 h-3/4 bg-white dark:bg-zinc-900 shadow-lg border-4 border-zinc-200 dark:border-zinc-700 p-4 flex flex-col items-center justify-center transition-all ${
                    enrollment.progress_percent >= 100 
                      ? "opacity-100 border-emerald-500/40" 
                      : "opacity-40 grayscale group-hover:opacity-60"
                  }`}>
                    <Award className={`w-10 h-10 mb-2 ${enrollment.progress_percent >= 100 ? "text-emerald-500" : "text-zinc-400"}`} />
                    <p className="font-serif text-xs text-zinc-400 uppercase tracking-widest text-center">Certificat d&apos;Accomplissement</p>
                    <p className="font-bold text-zinc-500 mt-1 text-center text-xs line-clamp-2">{enrollment.courseTitle}</p>
                  </div>
                  {enrollment.progress_percent < 100 ? (
                    <div className="absolute inset-0 bg-black/5 dark:bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="bg-white dark:bg-zinc-900 p-3 rounded-full shadow-xl">
                        <Lock className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-950/10 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="bg-emerald-500 text-white p-3 rounded-full shadow-xl animate-bounce">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1 line-clamp-1">{enrollment.courseTitle}</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-4">
                    {enrollment.progress_percent >= 100 
                      ? "Félicitations ! Votre progression est complète." 
                      : "Complétez 100% des leçons et validez tous les quiz ≥ 80% pour déverrouiller ce certificat."}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-500">Progression</span>
                      <span className="text-blue-600">{enrollment.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${enrollment.progress_percent}%` }}
                      />
                    </div>
                  </div>
                  
                  {enrollment.progress_percent >= 100 ? (
                    <div className="space-y-4 mt-auto">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                          Formation complétée à 100% ! Votre certificat est prêt.
                        </p>
                      </div>
                      <button
                        onClick={() => handleGenerateCertificate(enrollment.course_id)}
                        disabled={generatingId === enrollment.course_id}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        {generatingId === enrollment.course_id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Génération en cours...
                          </>
                        ) : (
                          <>
                            <Award className="w-4 h-4" />
                            Obtenir mon certificat
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={`/dashboard/courses/${enrollment.course_id}/learn`}
                      className="mt-auto w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors text-center block"
                    >
                      Continuer le cours →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── État vide ────────────────────────────────────── */}
      {earnedCerts.length === 0 && inProgress.length === 0 && (
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
              <Compass className="w-5 h-5" /> Découvrir le catalogue
            </Link>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-8 flex flex-col justify-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6">
              <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Pourquoi obtenir nos certificats ?</h3>
            <ul className="space-y-4 text-zinc-600 dark:text-zinc-400">
              {[
                "Démontrez votre expertise auprès des employeurs à l'échelle internationale.",
                "Lien de vérification unique pour votre profil LinkedIn.",
                "Accédez à des opportunités exclusives au sein du réseau ANSELLA.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Bannière pourquoi (si certs existent) ────────── */}
      {(earnedCerts.length > 0 || inProgress.length > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center">
              <Award className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Vos certificats ANSELLA</h3>
              <p className="text-xs text-zinc-500">Vérifiables, partageables et reconnus.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Expertise reconnue à l'échelle internationale", "Lien de vérification unique pour LinkedIn", "Opportunités exclusives réseau ANSELLA"].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white/50 dark:bg-zinc-900/30 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
